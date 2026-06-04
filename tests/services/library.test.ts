import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { parseBlob } from 'music-metadata';

vi.mock('music-metadata', () => ({ parseBlob: vi.fn() }));

vi.mock('@/services/library-cache', async () => {
  const actual = await vi.importActual<typeof import('@/services/library-cache')>('@/services/library-cache');
  return {
    cacheKey: actual.cacheKey,
    getCached: vi.fn(async () => undefined),
    putCached: vi.fn(async () => {}),
    getArt: vi.fn(async () => undefined),
    putArt: vi.fn(async () => {}),
    pruneCacheToScan: vi.fn(async () => {}),
    setCachedColor: vi.fn(async () => {}),
  };
});

vi.mock('fast-average-color', () => ({
  FastAverageColor: class {
    async getColorAsync(url: string) {
      if (url === 'bad') throw new Error('decode failed');
      return { hex: '#123456' };
    }
  },
}));

import {
  parseFiles,
  revokeTrack,
  revokeAllArt,
  extractArtColor,
  getArtColor,
  setArtColor,
  cacheColor,
  fileEntry,
} from '@/services/library';
import { getCached, getArt, putArt, pruneCacheToScan, setCachedColor } from '@/services/library-cache';
import type { Track } from '@/types';

function entry(name: string, opts?: { type?: string; folder?: string }) {
  return { file: new File(['data'], name, { type: opts?.type ?? '' }), folder: opts?.folder };
}

function meta(over?: { title?: string; artist?: string; album?: string; duration?: number; picture?: Uint8Array }) {
  return {
    common: {
      title: over?.title,
      artist: over?.artist,
      album: over?.album,
      picture: over?.picture ? [{ data: over.picture, format: 'image/jpeg' }] : undefined,
    },
    format: { duration: over?.duration },
  } as any;
}

let urlCount = 0;

beforeEach(() => {
  vi.clearAllMocks();
  urlCount = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:mock/${urlCount++}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.mocked(getCached).mockResolvedValue(undefined);
});

afterEach(() => {
  revokeAllArt();
  vi.restoreAllMocks();
});

describe('parseFiles', () => {
  it('parses metadata into track fields', async () => {
    vi.mocked(parseBlob).mockResolvedValue(meta({ title: 'Song', artist: 'Artist', album: 'Album', duration: 123 }));
    const tracks = await parseFiles([entry('a.mp3', { folder: 'F' })]);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ title: 'Song', artist: 'Artist', album: 'Album', durationSec: 123, folder: 'F' });
  });

  it('falls back to the folder name when the album tag is missing', async () => {
    vi.mocked(parseBlob).mockResolvedValue(meta({ title: 'S', artist: 'A' }));
    const [t] = await parseFiles([entry('a.mp3', { folder: 'MyFolder' })]);
    expect(t.album).toBe('MyFolder');
    expect(t.durationSec).toBe(0);
  });

  it('falls back to filename title and Unknown Artist when tags are blank', async () => {
    vi.mocked(parseBlob).mockResolvedValue(meta());
    const [t] = await parseFiles([entry('My Track.mp3', { folder: 'F' })]);
    expect(t.title).toBe('My Track');
    expect(t.artist).toBe('Unknown Artist');
  });

  it('uses Unknown Album in the parse-error fallback when there is no folder', async () => {
    vi.mocked(parseBlob).mockRejectedValue(new Error('bad tags'));
    const [t] = await parseFiles([entry('loose.mp3')]);
    expect(t.album).toBe('Unknown Album');
  });

  it('does not emit an empty final batch on an exact batch boundary', async () => {
    vi.mocked(parseBlob).mockResolvedValue(meta({ title: 'S', artist: 'A', album: 'Al', duration: 1 }));
    const entries = Array.from({ length: 20 }, (_, i) => entry(`s${i}.mp3`));
    const sizes: number[] = [];
    await parseFiles(entries, (b) => sizes.push(b.length));
    expect(sizes).toEqual([20]);
  });

  it('filters out non-audio entries', async () => {
    vi.mocked(parseBlob).mockResolvedValue(meta({ title: 'S', artist: 'A', album: 'Al', duration: 1 }));
    const tracks = await parseFiles([entry('a.mp3'), entry('notes.txt'), entry('b.flac')]);
    expect(tracks).toHaveLength(2);
    expect(parseBlob).toHaveBeenCalledTimes(2);
  });

  it('dedupes byte-identical cover art to one stored blob and a shared url', async () => {
    vi.mocked(parseBlob).mockResolvedValue(
      meta({ title: 'S', artist: 'A', album: 'Al', duration: 1, picture: new Uint8Array([9, 9, 9, 9]) }),
    );
    const tracks = await parseFiles([entry('a.mp3'), entry('b.mp3')]);
    expect(putArt).toHaveBeenCalledTimes(1);
    expect(tracks[0].artUrl).toBeDefined();
    expect(tracks[0].artUrl).toBe(tracks[1].artUrl);
  });

  it('keeps distinct cover art separate', async () => {
    let n = 0;
    vi.mocked(parseBlob).mockImplementation(async () =>
      meta({ title: 'S', artist: 'A', album: 'Al', duration: 1, picture: new Uint8Array([n, n, n, ++n]) }),
    );
    const tracks = await parseFiles([entry('a.mp3'), entry('b.mp3')]);
    expect(putArt).toHaveBeenCalledTimes(2);
    expect(tracks[0].artUrl).not.toBe(tracks[1].artUrl);
  });

  it('uses the cache and skips parseBlob on a hit', async () => {
    vi.mocked(getCached).mockResolvedValueOnce({ title: 'Cached', artist: 'A', album: 'Al', durationSec: 7 });
    const tracks = await parseFiles([entry('a.mp3', { folder: 'F' })]);
    expect(parseBlob).not.toHaveBeenCalled();
    expect(tracks[0]).toMatchObject({ title: 'Cached', durationSec: 7, folder: 'F' });
  });

  it('rehydrates a cached art url and color from the art store', async () => {
    vi.mocked(getCached).mockResolvedValue({
      title: 'Cached',
      artist: 'A',
      album: 'Al',
      durationSec: 1,
      artHash: 'h1',
      artColor: '#abcdef',
    });
    vi.mocked(getArt).mockResolvedValue(new Blob(['img']));

    const [a] = await parseFiles([entry('a.mp3')]);
    const [b] = await parseFiles([entry('b.mp3')]);
    expect(a.artUrl).toBeDefined();
    expect(a.artUrl).toBe(b.artUrl);
    expect(getArt).toHaveBeenCalledTimes(1);
    expect(getArtColor('h1')).toBe('#abcdef');
  });

  it('leaves artUrl undefined when the cached art blob is missing', async () => {
    vi.mocked(getCached).mockResolvedValue({
      title: 'Cached',
      artist: 'A',
      album: 'Al',
      durationSec: 1,
      artHash: 'gone',
    });
    vi.mocked(getArt).mockResolvedValue(undefined);

    const [t] = await parseFiles([entry('a.mp3')]);
    expect(t.artUrl).toBeUndefined();
  });

  it('emits onBatch in chunks of 20 with a final flush', async () => {
    vi.mocked(parseBlob).mockResolvedValue(meta({ title: 'S', artist: 'A', album: 'Al', duration: 1 }));
    const entries = Array.from({ length: 25 }, (_, i) => entry(`s${i}.mp3`));
    const sizes: number[] = [];
    const all = await parseFiles(entries, (b) => sizes.push(b.length));
    expect(all).toHaveLength(25);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(25);
    expect(sizes).toContain(20);
  });

  it('falls back to a filename-derived title when parsing throws', async () => {
    vi.mocked(parseBlob).mockRejectedValue(new Error('bad tags'));
    const [t] = await parseFiles([entry('My Song.mp3', { folder: 'F' })]);
    expect(t.title).toBe('My Song');
    expect(t.artist).toBe('Unknown Artist');
    expect(t.album).toBe('F');
  });

  it('prunes the cache to the scanned audio keys', async () => {
    vi.mocked(parseBlob).mockResolvedValue(meta({ title: 'S', artist: 'A', album: 'Al', duration: 1 }));
    await parseFiles([entry('a.mp3'), entry('notes.txt')]);
    expect(pruneCacheToScan).toHaveBeenCalledTimes(1);
    expect(vi.mocked(pruneCacheToScan).mock.calls[0][0].size).toBe(1);
  });
});

describe('revokeTrack', () => {
  it('revokes only blob: urls', () => {
    revokeTrack({ url: 'blob:abc' } as Track);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:abc');

    vi.mocked(URL.revokeObjectURL).mockClear();
    revokeTrack({ url: 'https://host/stream/1' } as Track);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});

describe('extractArtColor', () => {
  it('returns the dominant hex, or undefined on failure', async () => {
    expect(await extractArtColor('blob:art')).toBe('#123456');
    expect(await extractArtColor('bad')).toBeUndefined();
  });
});

describe('art color registry', () => {
  it('stores and reads colors by hash', () => {
    expect(getArtColor('missing')).toBeUndefined();
    setArtColor('hX', '#0f0f0f');
    expect(getArtColor('hX')).toBe('#0f0f0f');
  });
});

describe('cacheColor', () => {
  it('writes the color under the file cache key', async () => {
    const f = { name: 'song.mp3', size: 12, lastModified: 5 } as File;
    await cacheColor(f, 'Album', '#222222');
    expect(setCachedColor).toHaveBeenCalledWith('Album/song.mp3|12|5', '#222222');
  });
});

describe('fileEntry', () => {
  it('wraps a file and optional folder', () => {
    const f = new File(['x'], 'a.mp3');
    expect(fileEntry(f, 'F')).toEqual({ file: f, folder: 'F' });
    expect(fileEntry(f)).toEqual({ file: f, folder: undefined });
  });
});
