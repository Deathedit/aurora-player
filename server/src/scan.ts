import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseFile } from 'music-metadata';
import { MUSIC_DIR, isAudioFile } from './config.js';
import { albumFallback } from '../../shared/metadata.js';
import type { TrackRow } from './db.js';
import { upsertTrack, getTrackStat, allTrackIds, deleteTracks, hasArt, putArt, pruneOrphanArt } from './db.js';

interface Found {
  id: string;
  path: string;
  folder?: string;
  mtime: number;
  size: number;
}

async function walk(dir: string, found: Found[]): Promise<void> {
  let entries: fs.Dirent[];
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, found);
    } else if (entry.isFile() && isAudioFile(entry.name)) {
      try {
        const stat = await fsp.stat(full);
        const rel = path.relative(MUSIC_DIR, full).split(path.sep).join('/');
        const folder = path.dirname(rel);
        found.push({
          id: rel,
          path: full,
          folder: folder === '.' ? undefined : folder,
          mtime: Math.floor(stat.mtimeMs),
          size: stat.size,
        });
      } catch {
        /* skip unreadable files */
      }
    }
  }
}

async function indexFile(file: Found): Promise<void> {
  const existing = getTrackStat(file.id);
  if (existing && existing.mtime === file.mtime && existing.size === file.size) return;

  const row: TrackRow = {
    id: file.id,
    path: file.path,
    mtime: file.mtime,
    size: file.size,
    title: path.basename(file.id).replace(/\.[^.]+$/, ''),
    artist: 'Unknown Artist',
    album: file.folder ?? 'Unknown Album',
    folder: file.folder,
    durationSec: 0,
  };

  try {
    const meta = await parseFile(file.path);
    row.title = meta.common.title || row.title;
    row.artist = meta.common.artist || row.artist;
    row.album = albumFallback(meta.common.album, file.folder);
    row.durationSec = meta.format.duration ?? 0;

    const picture = meta.common.picture?.[0];
    if (picture) {
      const bytes = Buffer.from(picture.data);
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      row.artHash = hash;
      row.artType = picture.format;
      if (!hasArt(hash)) putArt(hash, bytes, picture.format);
    }
  } catch {
    /* keep filename-based fallback row */
  }

  upsertTrack(row);
}

const CONCURRENCY = 5;
let scanning = false;

export function isScanning(): boolean {
  return scanning;
}

export async function scanLibrary(): Promise<void> {
  if (scanning) return;
  scanning = true;
  try {
    const found: Found[] = [];
    await walk(MUSIC_DIR, found);

    let i = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, found.length) }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= found.length) break;
        await indexFile(found[idx]);
      }
    });
    await Promise.all(workers);

    const present = new Set(found.map((f) => f.id));
    const removed = [...allTrackIds()].filter((id) => !present.has(id));
    if (removed.length > 0) deleteTracks(removed);
    pruneOrphanArt();
  } finally {
    scanning = false;
  }
}
