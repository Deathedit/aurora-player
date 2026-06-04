import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import path from 'node:path';

const ENV_KEYS = ['MUSIC_DIR', 'DB_PATH', 'PORT', 'STATIC_DIR'] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  vi.resetModules();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('config defaults', () => {
  it('uses built-in defaults when no env is set', async () => {
    for (const k of ENV_KEYS) delete process.env[k];
    const config = await import('@server/config');

    expect(config.MUSIC_DIR).toBe(path.resolve('/music'));
    expect(config.DB_PATH).toBe('/data/aurora.db');
    expect(config.PORT).toBe(3000);
    expect(config.STATIC_DIR).toContain('public');
  });

  it('reads overrides from the environment', async () => {
    process.env.MUSIC_DIR = '/songs';
    process.env.DB_PATH = '/tmp/x.db';
    process.env.PORT = '8080';
    process.env.STATIC_DIR = '/srv/web';
    const config = await import('@server/config');

    expect(config.MUSIC_DIR).toBe(path.resolve('/songs'));
    expect(config.DB_PATH).toBe('/tmp/x.db');
    expect(config.PORT).toBe(8080);
    expect(config.STATIC_DIR).toBe('/srv/web');
  });
});
