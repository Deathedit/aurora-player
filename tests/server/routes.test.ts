import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type App = Awaited<ReturnType<typeof import('@server/app').buildApp>>;

let app: App;
let tmpRoot: string;
let musicDir: string;

const AUDIO_BYTES = 'ABCDEFGHIJ';
const ART_HASH = 'deadbeef';
const ART_BYTES = Buffer.from('fake-image-bytes');

beforeAll(async () => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aurora-test-'));
  musicDir = path.join(tmpRoot, 'music');
  fs.mkdirSync(path.join(musicDir, 'Album'), { recursive: true });

  process.env.MUSIC_DIR = musicDir;
  process.env.DB_PATH = path.join(tmpRoot, 'aurora.db');

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
  if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true });
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
    expect(ids).toEqual(['Album/a.mp3', 'Album/b.mp3', 'evil']);

    const first = JSON.parse(lines[0]);
    expect(first).toMatchObject({ title: 'Alpha', artist: 'Artist', album: 'Album', artHash: ART_HASH });
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

  it('returns 416 for an unsatisfiable range', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stream/Album%2Fa.mp3',
      headers: { range: 'bytes=999-1000' },
    });
    expect(res.statusCode).toBe(416);
    expect(res.headers['content-range']).toBe(`bytes */${AUDIO_BYTES.length}`);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stream/nope.mp3' });
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
