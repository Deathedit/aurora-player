import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createTmpEnv } from './helpers';

// scan.ts (a server-package module) resolves music-metadata to server/node_modules — mock that copy.
vi.mock('../../server/node_modules/music-metadata', () => ({ parseFile: vi.fn() }));
import * as serverMusicMetadata from '../../server/node_modules/music-metadata';
const parseFile = vi.mocked(serverMusicMetadata.parseFile);

type Scan = typeof import('@server/scan');
type Db = typeof import('@server/db');

let scan: Scan;
let db: Db;
let musicDir: string;
let cleanup: () => void;

const meta = (over?: { title?: string; artist?: string; album?: string; duration?: number; picture?: Uint8Array }) =>
  ({
    common: {
      title: over?.title,
      artist: over?.artist,
      album: over?.album,
      picture: over?.picture ? [{ data: over.picture, format: 'image/jpeg' }] : undefined,
    },
    format: { duration: over?.duration },
  }) as any;

const hashOf = (bytes: number[]) => crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');

function writeAudio(rel: string, content = 'data') {
  const full = path.join(musicDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

beforeAll(async () => {
  const env = createTmpEnv('aurora-scan-test-');
  musicDir = env.musicDir;
  cleanup = env.cleanup;
  fs.mkdirSync(musicDir, { recursive: true });
  scan = await import('@server/scan');
  db = await import('@server/db');
});

beforeEach(() => {
  fs.rmSync(musicDir, { recursive: true, force: true });
  fs.mkdirSync(musicDir, { recursive: true });
  db.deleteTracks([...db.allTrackIds()]);
  db.pruneOrphanArt();
  vi.mocked(parseFile).mockReset();
  vi.mocked(parseFile).mockResolvedValue(meta());
});

afterAll(() => {
  db.closeDb();
  cleanup();
});

describe('scanLibrary', () => {
  it('indexes audio files into ordered rows with relative ids', async () => {
    writeAudio('Album/a.mp3');
    writeAudio('Album/b.mp3');
    await scan.scanLibrary();

    expect([...db.iterateTracks()].map((t) => t.id)).toEqual(['Album/a.mp3', 'Album/b.mp3']);
    expect(db.getTrackPath('Album/a.mp3')).toContain(path.join('Album', 'a.mp3'));
  });

  it('ignores non-audio files', async () => {
    writeAudio('Album/a.mp3');
    writeAudio('Album/notes.txt');
    await scan.scanLibrary();
    expect([...db.allTrackIds()]).toEqual(['Album/a.mp3']);
  });

  it('skips unchanged files on rescan (no re-parse)', async () => {
    writeAudio('Album/a.mp3');
    await scan.scanLibrary();
    expect(parseFile).toHaveBeenCalledTimes(1);

    await scan.scanLibrary();
    expect(parseFile).toHaveBeenCalledTimes(1);
  });

  it('re-parses a file whose size changed', async () => {
    writeAudio('Album/a.mp3', 'short');
    await scan.scanLibrary();
    writeAudio('Album/a.mp3', 'a much longer body than before');
    await scan.scanLibrary();
    expect(parseFile).toHaveBeenCalledTimes(2);
  });

  it('removes deleted tracks and prunes their now-orphaned art', async () => {
    vi.mocked(parseFile).mockImplementation(async (p) =>
      meta({
        artist: 'Ar',
        album: 'Al',
        duration: 1,
        picture: new Uint8Array(String(p).includes('a.mp3') ? [1, 1, 1] : [2, 2, 2]),
      }),
    );
    writeAudio('Album/a.mp3');
    writeAudio('Album/b.mp3');
    await scan.scanLibrary();
    expect(db.hasArt(hashOf([1, 1, 1]))).toBe(true);
    expect(db.hasArt(hashOf([2, 2, 2]))).toBe(true);

    fs.rmSync(path.join(musicDir, 'Album', 'a.mp3'));
    await scan.scanLibrary();

    expect([...db.allTrackIds()]).toEqual(['Album/b.mp3']);
    expect(db.hasArt(hashOf([1, 1, 1]))).toBe(false);
    expect(db.hasArt(hashOf([2, 2, 2]))).toBe(true);
  });

  it('dedupes identical art across files into one row', async () => {
    vi.mocked(parseFile).mockImplementation(async () =>
      meta({ artist: 'Ar', album: 'Al', duration: 1, picture: new Uint8Array([7, 7, 7]) }),
    );
    writeAudio('Album/a.mp3');
    writeAudio('Album/b.mp3');
    await scan.scanLibrary();

    expect(db.hasArt(hashOf([7, 7, 7]))).toBe(true);
    db.pruneOrphanArt();
    expect(db.hasArt(hashOf([7, 7, 7]))).toBe(true);
  });

  it('keeps a filename-based row when parsing throws', async () => {
    vi.mocked(parseFile).mockRejectedValue(new Error('bad tags'));
    writeAudio('Album/My Song.mp3');
    await scan.scanLibrary();

    const [t] = [...db.iterateTracks()];
    expect(t.title).toBe('My Song');
    expect(t.artist).toBe('Unknown Artist');
    expect(t.album).toBe('Album');
  });
});
