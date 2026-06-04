import 'fake-indexeddb/auto';
import { afterEach, describe, it, expect } from 'vitest';
import {
  cacheKey,
  getCached,
  putCached,
  setCachedColor,
  getArt,
  putArt,
  pruneCacheToScan,
  clearCache,
} from '@/services/library-cache';
import type { CachedTrack } from '@/services/library-cache';

const file = (name: string, size = 10, lastModified = 1) => ({ name, size, lastModified }) as File;
const track = (over: Partial<CachedTrack> = {}): CachedTrack => ({
  title: 't',
  artist: 'a',
  album: 'al',
  durationSec: 1,
  ...over,
});

afterEach(async () => {
  await clearCache();
});

describe('cacheKey', () => {
  it('combines folder/name|size|lastModified', () => {
    expect(cacheKey(file('a.mp3', 100, 5), 'Album')).toBe('Album/a.mp3|100|5');
    expect(cacheKey(file('a.mp3', 100, 5))).toBe('/a.mp3|100|5');
  });
});

describe('tracks store', () => {
  it('round-trips putCached/getCached; a miss returns undefined', async () => {
    await putCached('k1', track({ title: 'Song' }));
    expect((await getCached('k1'))?.title).toBe('Song');
    expect(await getCached('nope')).toBeUndefined();
  });

  it('setCachedColor updates an existing row and no-ops on a missing key', async () => {
    await putCached('k1', track());
    await setCachedColor('k1', '#abcdef');
    expect((await getCached('k1'))?.artColor).toBe('#abcdef');

    await setCachedColor('missing', '#000000');
    expect(await getCached('missing')).toBeUndefined();
  });
});

describe('art store', () => {
  it('round-trips putArt/getArt', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
    await putArt('hashA', blob);

    const got = await getArt('hashA');
    expect(got).toBeInstanceOf(Blob);
    expect(new Uint8Array(await got!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(await getArt('absent')).toBeUndefined();
  });
});

describe('pruneCacheToScan', () => {
  it('drops tracks not in the scan and deletes orphaned art, keeping referenced art', async () => {
    await putCached('keep1', track({ artHash: 'shared' }));
    await putCached('keep2', track({ artHash: 'shared' }));
    await putCached('keepNoArt', track());
    await putCached('drop', track({ artHash: 'orphan' }));
    await putArt('shared', new Blob(['s']));
    await putArt('orphan', new Blob(['o']));

    await pruneCacheToScan(new Set(['keep1', 'keep2', 'keepNoArt']));

    expect(await getCached('keep1')).toBeDefined();
    expect(await getCached('keep2')).toBeDefined();
    expect(await getCached('keepNoArt')).toBeDefined();
    expect(await getCached('drop')).toBeUndefined();
    expect(await getArt('shared')).toBeInstanceOf(Blob);
    expect(await getArt('orphan')).toBeUndefined();
  });
});

describe('clearCache', () => {
  it('empties both stores', async () => {
    await putCached('k', track());
    await putArt('h', new Blob(['x']));
    await clearCache();
    expect(await getCached('k')).toBeUndefined();
    expect(await getArt('h')).toBeUndefined();
  });
});
