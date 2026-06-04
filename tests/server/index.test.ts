import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const H = vi.hoisted(() => {
  const app = {
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    listen: vi.fn(),
    close: vi.fn(),
    setNotFoundHandler: vi.fn(),
    register: vi.fn(),
  };
  return {
    app,
    buildApp: vi.fn(() => app),
    registerStatic: vi.fn(async () => {}),
    startScan: vi.fn(),
    closeDb: vi.fn(),
  };
});

vi.mock('@server/app', () => ({ buildApp: H.buildApp }));
vi.mock('@server/static', () => ({ registerStatic: H.registerStatic }));
vi.mock('@server/scanner', () => ({ startScan: H.startScan }));
vi.mock('@server/db', () => ({ closeDb: H.closeDb }));

let existingDir: string;
let exitSpy: ReturnType<typeof vi.spyOn>;
const flush = () => new Promise((r) => setTimeout(r, 0));

const loadIndex = async () => {
  vi.resetModules();
  await import('@server/index');
};

beforeEach(() => {
  existingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aurora-static-'));
  process.env.MUSIC_DIR = path.join(existingDir, 'music');
  process.env.DB_PATH = path.join(existingDir, 'aurora.db');
  process.env.PORT = '0';
  H.app.log.info.mockReset();
  H.app.log.warn.mockReset();
  H.app.log.error.mockReset();
  H.app.listen.mockReset().mockResolvedValue(undefined);
  H.app.close.mockReset().mockResolvedValue(undefined);
  H.buildApp.mockClear();
  H.registerStatic.mockClear();
  H.startScan.mockReset().mockImplementation((logger?: { info: (m: string) => void; error: (m: string) => void }) => {
    logger?.info('scan started');
    logger?.error('scan note');
  });
  H.closeDb.mockClear();
  exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
});

afterEach(() => {
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
  exitSpy.mockRestore();
  fs.rmSync(existingDir, { recursive: true, force: true });
  delete process.env.STATIC_DIR;
});

describe('server bootstrap', () => {
  it('serves static assets, kicks off a scan, and listens', async () => {
    process.env.STATIC_DIR = existingDir;
    await loadIndex();

    expect(H.buildApp).toHaveBeenCalledWith({ logger: true });
    expect(H.registerStatic).toHaveBeenCalledWith(H.app, existingDir);
    expect(H.startScan).toHaveBeenCalledTimes(1);
    expect(H.app.listen).toHaveBeenCalledWith({ port: 0, host: '0.0.0.0' });
  });

  it('warns and serves API-only when the static dir is missing', async () => {
    process.env.STATIC_DIR = path.join(existingDir, 'does-not-exist');
    await loadIndex();

    expect(H.registerStatic).not.toHaveBeenCalled();
    expect(H.app.log.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('shuts down cleanly on SIGTERM and SIGINT', async () => {
    process.env.STATIC_DIR = existingDir;
    await loadIndex();

    process.emit('SIGTERM');
    await flush();
    expect(H.app.close).toHaveBeenCalledTimes(1);
    expect(H.closeDb).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);

    process.emit('SIGINT');
    await flush();
    expect(H.app.close).toHaveBeenCalledTimes(2);
  });

  it('logs and exits non-zero when listen fails', async () => {
    process.env.STATIC_DIR = existingDir;
    H.app.listen.mockRejectedValue(new Error('port in use'));
    await loadIndex();
    await flush();

    expect(H.app.log.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
