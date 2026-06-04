import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import { createTmpEnv } from './helpers';

const H = vi.hoisted(() => ({
  iterateTracks: vi.fn(),
  getTrackPath: vi.fn(),
  getArt: vi.fn(),
}));

vi.mock('@server/db', () => ({
  iterateTracks: H.iterateTracks,
  getTrackPath: H.getTrackPath,
  getArt: H.getArt,
}));

vi.mock('@server/scanner', () => ({ startScan: vi.fn(), isScanning: () => false }));

type App = Awaited<ReturnType<typeof import('@server/app').buildApp>>;
let app: App;
let cleanup: () => void;

beforeAll(async () => {
  cleanup = createTmpEnv('aurora-stream-err-').cleanup;
  const { buildApp } = await import('@server/app');
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  cleanup?.();
});

describe('GET /api/tracks stream error', () => {
  it('destroys the stream when the track iterator throws mid-read', async () => {
    let n = 0;
    H.iterateTracks.mockReturnValue({
      next: () => {
        if (n++ === 0) return { value: { id: 'a' }, done: false };
        throw new Error('db gone');
      },
      return: vi.fn(),
    });

    await expect(app.inject({ method: 'GET', url: '/api/tracks' })).rejects.toThrow(/destroyed/);
  });

  it('handles stream backpressure across many large rows', async () => {
    const big = 'x'.repeat(2000);
    H.iterateTracks.mockReturnValue(
      (function* () {
        for (let n = 0; n < 300; n++) yield { id: `t${n}`, title: big };
      })(),
    );

    const res = await app.inject({ method: 'GET', url: '/api/tracks' });
    expect(res.statusCode).toBe(200);
    const lines = res.body.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(300);
  });
});
