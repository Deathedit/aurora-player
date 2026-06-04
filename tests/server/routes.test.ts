import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createTmpEnv } from './helpers';

type App = Awaited<ReturnType<typeof import('@server/app').buildApp>>;

let app: App;
let cleanup: () => void;

const AUDIO_BYTES = 'ABCDEFGHIJ';
const ART_HASH = 'deadbeef';
const ART_BYTES = Buffer.from('fake-image-bytes');

beforeAll(async () => {
  const env = createTmpEnv('aurora-test-');
  const { musicDir } = env;
  cleanup = env.cleanup;
  fs.mkdirSync(path.join(musicDir, 'Album'), { recursive: true });

  const audioPath = path.join(musicDir, 'Album', 'a.mp3');
  fs.writeFileSync(audioPath, AUDIO_BYTES);

  const { upsertTrack, putArt } = await import('@server/db');

  upsertTrack({
    id: 'Album/a.mp3',
    path: audioPath,
    mtime: 1,
    size: AUDIO_BYTES.length,
    title: 'Alpha',
    artist: 'Artist',
    album: 'Album',
    folder: 'Album',
    durationSec: 1,
    artHash: ART_HASH,
    artType: 'image/jpeg',
  });
  upsertTrack({
    id: 'Album/b.mp3',
    path: path.join(musicDir, 'Album', 'b.mp3'),
    mtime: 1,
    size: 1,
    title: 'Beta',
    artist: 'Artist',
    album: 'Album',
    folder: 'Album',
    durationSec: 1,
  });
  const weirdPath = path.join(musicDir, 'Album', 'weird.xyz');
  fs.writeFileSync(weirdPath, AUDIO_BYTES);
  upsertTrack({
    id: 'Album/weird.xyz',
    path: weirdPath,
    mtime: 1,
    size: AUDIO_BYTES.length,
    title: 'Weird',
    artist: 'Artist',
    album: 'Album',
    folder: 'Album',
    durationSec: 1,
  });
  upsertTrack({
    id: 'evil',
    path: '/etc/passwd',
    mtime: 1,
    size: 1,
    title: 'Evil',
    artist: 'Z',
    album: 'Z',
    durationSec: 1,
  });
  putArt(ART_HASH, ART_BYTES, 'image/jpeg');

  const { buildApp } = await import('@server/app');
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  cleanup?.();
});

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});

describe('GET /api/tracks', () => {
  it('streams NDJSON, one track per line in artist/album/title order', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/tracks' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/x-ndjson');

    const lines = res.body.split('\n').filter((l) => l.trim().length > 0);
    const ids = lines.map((l) => JSON.parse(l).id);
    expect(ids).toEqual(['Album/a.mp3', 'Album/b.mp3', 'Album/weird.xyz', 'evil']);

    const first = JSON.parse(lines[0]);
    expect(first).toMatchObject({ title: 'Alpha', artist: 'Artist', album: 'Album', artHash: ART_HASH });
  });

  it('handles concurrent requests without a busy-statement error', async () => {
    const [a, b] = await Promise.all([
      app.inject({ method: 'GET', url: '/api/tracks' }),
      app.inject({ method: 'GET', url: '/api/tracks' }),
    ]);
    for (const res of [a, b]) {
      expect(res.statusCode).toBe(200);
      const ids = res.body
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((l) => JSON.parse(l).id);
      expect(ids).toEqual(['Album/a.mp3', 'Album/b.mp3', 'Album/weird.xyz', 'evil']);
    }
  });
});

describe('GET /api/stream/:id', () => {
  it('serves the full file with range headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stream/Album%2Fa.mp3' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['content-length']).toBe(String(AUDIO_BYTES.length));
    expect(res.headers['content-type']).toBe('audio/mpeg');
    expect(res.body).toBe(AUDIO_BYTES);
  });

  it('honors a byte range with 206', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stream/Album%2Fa.mp3',
      headers: { range: 'bytes=0-3' },
    });
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 0-3/${AUDIO_BYTES.length}`);
    expect(res.headers['content-length']).toBe('4');
    expect(res.body).toBe('ABCD');
  });

  it('honors a suffix range (last N bytes)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stream/Album%2Fa.mp3',
      headers: { range: 'bytes=-4' },
    });
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 6-9/${AUDIO_BYTES.length}`);
    expect(res.headers['content-length']).toBe('4');
    expect(res.body).toBe('GHIJ');
  });

  it('returns 416 for an unsatisfiable range', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stream/Album%2Fa.mp3',
      headers: { range: 'bytes=999-1000' },
    });
    expect(res.statusCode).toBe(416);
    expect(res.headers['content-range']).toBe(`bytes */${AUDIO_BYTES.length}`);
  });

  it('falls back to octet-stream for an unknown extension', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stream/Album%2Fweird.xyz' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/octet-stream');
  });

  it('serves the full file when the range header is malformed', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stream/Album%2Fa.mp3',
      headers: { range: 'pages=1-2' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-length']).toBe(String(AUDIO_BYTES.length));
  });

  it('honors an open-ended range (start to EOF)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stream/Album%2Fa.mp3',
      headers: { range: 'bytes=6-' },
    });
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 6-9/${AUDIO_BYTES.length}`);
    expect(res.body).toBe('GHIJ');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stream/nope.mp3' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 when the indexed file is missing on disk', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stream/Album%2Fb.mp3' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 403 for a path outside MUSIC_DIR (traversal guard)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stream/evil' });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/art/:hash', () => {
  it('serves stored art with immutable caching', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/art/${ART_HASH}` });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(res.headers['cache-control']).toContain('immutable');
    expect(res.rawPayload.equals(ART_BYTES)).toBe(true);
  });

  it('returns 404 for an unknown hash', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/art/unknown' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/scanning', () => {
  it('reports not scanning at rest', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/scanning' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ scanning: false });
  });
});

describe('POST /api/rescan', () => {
  it('kicks off a scan and acknowledges', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/rescan' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });

    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const s = await app.inject({ method: 'GET', url: '/api/scanning' });
      if (s.json().scanning === false) break;
      await new Promise((r) => setTimeout(r, 50));
    }
  });
});
