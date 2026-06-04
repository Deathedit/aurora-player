import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

const H = vi.hoisted(() => ({ scanLibrary: vi.fn() }));

vi.mock('@server/scan', () => ({ scanLibrary: (...a: unknown[]) => H.scanLibrary(...a) }));

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.resetModules();
  H.scanLibrary.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('scan-worker entry', () => {
  it('runs the scan on import (resolve path)', async () => {
    H.scanLibrary.mockResolvedValue(undefined);
    await import('@server/scan-worker');
    await flush();
    expect(H.scanLibrary).toHaveBeenCalledTimes(1);
  });

  it('swallows a scan failure (reject path)', async () => {
    H.scanLibrary.mockRejectedValue(new Error('scan blew up'));
    await expect(import('@server/scan-worker')).resolves.toBeDefined();
    await flush();
    expect(H.scanLibrary).toHaveBeenCalledTimes(1);
  });
});
