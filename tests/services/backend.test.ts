import { afterEach, describe, it, expect, vi } from 'vitest';
import { checkHealth, fetchTracks, rescan } from '@/services/backend';
import type { Track } from '@/types';

afterEach(() => vi.unstubAllGlobals());

function mockFetch(impl: (...args: unknown[]) => unknown) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

function streamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return { ok: true, body };
}

const row = (over: Record<string, unknown> = {}) => ({
  id: 'x',
  title: 't',
  artist: 'a',
  album: 'al',
  durationSec: 1,
  ...over,
});

describe('checkHealth', () => {
  it('returns true when the server reports ok', async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    expect(await checkHealth()).toBe(true);
  });

  it('returns false for a non-ok response, a falsy ok field, or a thrown fetch', async () => {
    mockFetch(async () => ({ ok: false }));
    expect(await checkHealth()).toBe(false);

    mockFetch(async () => ({ ok: true, json: async () => ({ ok: false }) }));
    expect(await checkHealth()).toBe(false);

    mockFetch(() => {
      throw new Error('network');
    });
    expect(await checkHealth()).toBe(false);
  });
});

describe('fetchTracks (streaming)', () => {
  it('parses NDJSON split across chunk boundaries, in order, and maps fields', async () => {
    const rows = [
      row({ id: 'Album/a.mp3', artHash: 'h1', artType: 'image/png', folder: 'Album' }),
      row({ id: 'b', artHash: null, artType: null, folder: null }),
    ];
    const nd = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
    const mid = Math.floor(nd.length / 2);
    mockFetch(async () => streamResponse([nd.slice(0, mid), nd.slice(mid)]));

    const all: Track[] = [];
    await fetchTracks((b) => all.push(...b));

    expect(all.map((t) => t.id)).toEqual(['Album/a.mp3', 'b']);
    expect(all[0].url).toBe('/api/stream/Album%2Fa.mp3');
    expect(all[0].artUrl).toBe('/api/art/h1');
    expect(all[0].artType).toBe('image/png');
    expect(all[0].folder).toBe('Album');
    expect(all[1].artUrl).toBeUndefined();
    expect(all[1].artType).toBeUndefined();
    expect(all[1].folder).toBeUndefined();
  });

  it('flushes in batches of 50', async () => {
    const rows = Array.from({ length: 120 }, (_, i) => row({ id: String(i) }));
    const nd = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
    mockFetch(async () => streamResponse([nd]));

    const sizes: number[] = [];
    await fetchTracks((b) => sizes.push(b.length));
    expect(sizes).toEqual([50, 50, 20]);
  });

  it('emits a trailing line that has no newline', async () => {
    mockFetch(async () => streamResponse([JSON.stringify(row({ id: 'tail' }))]));
    const all: Track[] = [];
    await fetchTracks((b) => all.push(...b));
    expect(all.map((t) => t.id)).toEqual(['tail']);
  });

  it('does not emit an empty final batch when the stream ends on a batch boundary', async () => {
    const rows = Array.from({ length: 50 }, (_, i) => row({ id: String(i) }));
    const nd = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
    mockFetch(async () => streamResponse([nd]));

    const sizes: number[] = [];
    await fetchTracks((b) => sizes.push(b.length));
    expect(sizes).toEqual([50]);
  });

  it('throws when the response is not ok', async () => {
    mockFetch(async () => ({ ok: false, status: 500 }));
    await expect(fetchTracks(() => {})).rejects.toThrow();
  });
});

describe('fetchTracks (no-body fallback)', () => {
  it('uses res.json() when there is no stream body', async () => {
    mockFetch(async () => ({ ok: true, body: null, json: async () => [row({ id: 'j1' }), row({ id: 'j2' })] }));
    const all: Track[] = [];
    await fetchTracks((b) => all.push(...b));
    expect(all.map((t) => t.id)).toEqual(['j1', 'j2']);
  });

  it('does not call onBatch when the no-body json payload is empty', async () => {
    mockFetch(async () => ({ ok: true, body: null, json: async () => [] }));
    const onBatch = vi.fn();
    await fetchTracks(onBatch);
    expect(onBatch).not.toHaveBeenCalled();
  });
});

describe('rescan', () => {
  it('POSTs to /api/rescan', async () => {
    const fn = mockFetch(async () => ({ ok: true }));
    await rescan();
    expect(fn).toHaveBeenCalledWith('/api/rescan', { method: 'POST' });
  });
});
