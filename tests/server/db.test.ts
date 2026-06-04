import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createTmpEnv } from './helpers';

type Db = typeof import('@server/db');
type TrackRow = import('@server/db').TrackRow;

let db: Db;
let cleanup: () => void;

const row = (over: Partial<TrackRow> & Pick<TrackRow, 'id'>): TrackRow => ({
  path: `/music/${over.id}`,
  mtime: 1,
  size: 1,
  title: 't',
  artist: 'a',
  album: 'al',
  durationSec: 1,
  ...over,
});

beforeAll(async () => {
  const env = createTmpEnv('aurora-db-test-');
  cleanup = env.cleanup;
  db = await import('@server/db');
});

beforeEach(() => {
  db.deleteTracks([...db.allTrackIds()]);
  db.pruneOrphanArt();
});

afterAll(() => {
  db.closeDb();
  cleanup();
});

describe('tracks', () => {
  it('upsertTrack inserts then updates on id conflict', () => {
    db.upsertTrack(row({ id: 'a', title: 'First', mtime: 1, size: 10 }));
    expect(db.getTrackStat('a')).toMatchObject({ mtime: 1, size: 10 });

    db.upsertTrack(row({ id: 'a', title: 'Second', mtime: 2, size: 20 }));
    expect(db.getTrackStat('a')).toMatchObject({ mtime: 2, size: 20 });
    expect([...db.allTrackIds()]).toEqual(['a']);
  });

  it('iterateTracks yields rows ordered by artist, album, title', () => {
    db.upsertTrack(row({ id: '1', artist: 'B', album: 'x', title: 'z' }));
    db.upsertTrack(row({ id: '2', artist: 'A', album: 'm', title: 'b' }));
    db.upsertTrack(row({ id: '3', artist: 'A', album: 'm', title: 'a' }));
    expect([...db.iterateTracks()].map((t) => t.id)).toEqual(['3', '2', '1']);
  });

  it('getTrackPath returns the stored path, undefined when unknown', () => {
    db.upsertTrack(row({ id: 'Album/a.mp3', path: '/music/Album/a.mp3' }));
    expect(db.getTrackPath('Album/a.mp3')).toBe('/music/Album/a.mp3');
    expect(db.getTrackPath('missing')).toBeUndefined();
  });

  it('deleteTracks removes the given ids', () => {
    db.upsertTrack(row({ id: 'a' }));
    db.upsertTrack(row({ id: 'b' }));
    db.deleteTracks(['a']);
    expect([...db.allTrackIds()]).toEqual(['b']);
  });
});

describe('art', () => {
  it('round-trips putArt/getArt and ignores duplicate inserts', () => {
    db.putArt('h1', Buffer.from([1, 2, 3]), 'image/jpeg');
    expect(db.hasArt('h1')).toBe(true);
    const got = db.getArt('h1');
    expect(got?.type).toBe('image/jpeg');
    expect([...got!.data]).toEqual([1, 2, 3]);

    db.putArt('h1', Buffer.from([9, 9]), 'image/png'); // INSERT OR IGNORE
    expect([...db.getArt('h1')!.data]).toEqual([1, 2, 3]);
  });

  it('pruneOrphanArt deletes art no track references, keeps referenced art', () => {
    db.upsertTrack(row({ id: 'a', artHash: 'kept' }));
    db.putArt('kept', Buffer.from([1]), 'image/jpeg');
    db.putArt('orphan', Buffer.from([2]), 'image/jpeg');

    db.pruneOrphanArt();
    expect(db.hasArt('kept')).toBe(true);
    expect(db.hasArt('orphan')).toBe(false);
  });
});
