import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

const H = vi.hoisted(() => {
  type Listener = (arg?: unknown) => void;
  const workers: MockWorker[] = [];
  const flags = { throwOnConstruct: false };
  class MockWorker {
    listeners: Record<string, Listener[]> = {};
    url: unknown;
    constructor(url: unknown) {
      if (flags.throwOnConstruct) throw new Error('spawn failed');
      this.url = url;
      workers.push(this);
    }
    on(event: string, cb: Listener) {
      (this.listeners[event] ??= []).push(cb);
      return this;
    }
    fire(event: string, arg?: unknown) {
      (this.listeners[event] ?? []).forEach((f) => f(arg));
    }
  }
  return { MockWorker, workers, flags, scanLibrary: vi.fn() };
});

vi.mock('node:worker_threads', async (orig) => ({
  ...(await orig<typeof import('node:worker_threads')>()),
  Worker: H.MockWorker,
}));

vi.mock('@server/scan', () => ({ scanLibrary: (...a: unknown[]) => H.scanLibrary(...a) }));

type Scanner = typeof import('@server/scanner');
type LogFn = (msg: string) => void;
let scanner: Scanner;
let log: { info: ReturnType<typeof vi.fn<LogFn>>; error: ReturnType<typeof vi.fn<LogFn>> };
const last = () => H.workers[H.workers.length - 1];
const text = (calls: unknown[][]) => calls.flat().join(' ');

beforeEach(async () => {
  vi.resetModules();
  H.workers.length = 0;
  H.flags.throwOnConstruct = false;
  H.scanLibrary.mockReset().mockResolvedValue(undefined);
  log = { info: vi.fn<LogFn>(), error: vi.fn<LogFn>() };
  scanner = await import('@server/scanner');
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('startScan', () => {
  it('spawns a worker, flips isScanning, and completes on a done message', () => {
    expect(scanner.isScanning()).toBe(false);
    scanner.startScan(log);

    expect(scanner.isScanning()).toBe(true);
    expect(H.workers).toHaveLength(1);
    expect(log.info).toHaveBeenCalledWith('scan started');

    last().fire('message', { type: 'done' });
    expect(scanner.isScanning()).toBe(false);
    expect(log.info).toHaveBeenCalledWith('scan complete');
  });

  it('does nothing while a scan is already running', () => {
    scanner.startScan(log);
    scanner.startScan(log);
    expect(H.workers).toHaveLength(1);
  });

  it('reports a worker error message and stops scanning', () => {
    scanner.startScan(log);
    last().fire('message', { type: 'error', message: 'boom' });

    expect(scanner.isScanning()).toBe(false);
    expect(log.error).toHaveBeenCalledWith('scan failed: boom');
  });

  it('treats an unexpected worker exit as a failure', () => {
    scanner.startScan(log);
    last().fire('exit');

    expect(scanner.isScanning()).toBe(false);
    expect(log.error).toHaveBeenCalledWith('scan worker exited unexpectedly');
  });

  it('only settles once (a later exit after done is ignored)', () => {
    scanner.startScan(log);
    last().fire('message', { type: 'done' });
    last().fire('exit');

    expect(log.info).toHaveBeenCalledWith('scan complete');
    expect(log.error).not.toHaveBeenCalled();
  });

  it('falls back inline on a worker error event', async () => {
    scanner.startScan(log);
    last().fire('error', new Error('crashed'));

    expect(text(log.error.mock.calls)).toContain('worker error, scanning inline');
    await vi.waitFor(() => expect(scanner.isScanning()).toBe(false));
    expect(H.scanLibrary).toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith('scan complete (inline)');
  });

  it('falls back to an inline scan when worker construction throws', async () => {
    H.flags.throwOnConstruct = true;
    scanner.startScan(log);

    expect(text(log.error.mock.calls)).toContain('worker spawn failed');
    await vi.waitFor(() => expect(scanner.isScanning()).toBe(false));
    expect(H.scanLibrary).toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith('scan complete (inline)');
  });

  it('reports an inline scan failure', async () => {
    H.flags.throwOnConstruct = true;
    H.scanLibrary.mockRejectedValue(new Error('disk full'));
    scanner.startScan(log);

    await vi.waitFor(() => expect(scanner.isScanning()).toBe(false));
    expect(text(log.error.mock.calls)).toContain('scan failed (inline)');
    expect(text(log.error.mock.calls)).toContain('disk full');
  });

  it('ignores an inline fallback once already settled', () => {
    scanner.startScan(log);
    last().fire('exit');
    log.error.mockClear();

    last().fire('error', new Error('late crash'));
    expect(log.error).not.toHaveBeenCalled();
    expect(H.scanLibrary).not.toHaveBeenCalled();
  });

  it('works without a logger', () => {
    expect(() => scanner.startScan()).not.toThrow();
    last().fire('message', { type: 'done' });
    expect(scanner.isScanning()).toBe(false);
  });
});
