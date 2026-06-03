import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH } from './config.js';
import type { TrackMeta } from './config.js';

export interface TrackRow extends TrackMeta {
  path: string;
  mtime: number;
  size: number;
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    mtime INTEGER NOT NULL,
    size INTEGER NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT NOT NULL,
    folder TEXT,
    durationSec REAL NOT NULL,
    artHash TEXT,
    artType TEXT
  );
  CREATE TABLE IF NOT EXISTS art (
    hash TEXT PRIMARY KEY,
    data BLOB NOT NULL,
    type TEXT NOT NULL
  );
`);

const upsertTrackStmt = db.prepare(`
  INSERT INTO tracks (id, path, mtime, size, title, artist, album, folder, durationSec, artHash, artType)
  VALUES (@id, @path, @mtime, @size, @title, @artist, @album, @folder, @durationSec, @artHash, @artType)
  ON CONFLICT(id) DO UPDATE SET
    path = excluded.path, mtime = excluded.mtime, size = excluded.size,
    title = excluded.title, artist = excluded.artist, album = excluded.album,
    folder = excluded.folder, durationSec = excluded.durationSec,
    artHash = excluded.artHash, artType = excluded.artType
`);

const getStmt = db.prepare('SELECT id, mtime, size FROM tracks WHERE id = ?');
const listStmt = db.prepare(
  'SELECT id, title, artist, album, folder, durationSec, artHash, artType FROM tracks ORDER BY artist, album, title',
);
const pathStmt = db.prepare('SELECT path FROM tracks WHERE id = ?');
const deleteStmt = db.prepare('DELETE FROM tracks WHERE id = ?');
const allIdsStmt = db.prepare('SELECT id FROM tracks');

const hasArtStmt = db.prepare('SELECT 1 FROM art WHERE hash = ?');
const putArtStmt = db.prepare('INSERT OR IGNORE INTO art (hash, data, type) VALUES (?, ?, ?)');
const getArtStmt = db.prepare('SELECT data, type FROM art WHERE hash = ?');
const pruneArtStmt = db.prepare('DELETE FROM art WHERE hash NOT IN (SELECT artHash FROM tracks WHERE artHash IS NOT NULL)');

export function upsertTrack(row: TrackRow): void {
  upsertTrackStmt.run({ folder: null, artHash: null, artType: null, ...row });
}

export function getTrackStat(id: string): { mtime: number; size: number } | undefined {
  return getStmt.get(id) as { mtime: number; size: number } | undefined;
}

export function listTracks(): TrackMeta[] {
  return listStmt.all() as TrackMeta[];
}

export function listTracksIterate(): IterableIterator<TrackMeta> {
  return listStmt.iterate() as IterableIterator<TrackMeta>;
}

export function getTrackPath(id: string): string | undefined {
  const row = pathStmt.get(id) as { path: string } | undefined;
  return row?.path;
}

export function allTrackIds(): Set<string> {
  return new Set((allIdsStmt.all() as { id: string }[]).map((r) => r.id));
}

export function deleteTracks(ids: Iterable<string>): void {
  const tx = db.transaction((list: Iterable<string>) => {
    for (const id of list) deleteStmt.run(id);
  });
  tx(ids);
}

export function hasArt(hash: string): boolean {
  return hasArtStmt.get(hash) !== undefined;
}

export function putArt(hash: string, data: Buffer, type: string): void {
  putArtStmt.run(hash, data, type);
}

export function getArt(hash: string): { data: Buffer; type: string } | undefined {
  return getArtStmt.get(hash) as { data: Buffer; type: string } | undefined;
}

export function pruneOrphanArt(): void {
  pruneArtStmt.run();
}
