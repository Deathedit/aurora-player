import { afterEach, describe, it, expect, vi } from 'vitest';

type AnyObj = Record<string, unknown>;
const fire = (o: AnyObj, key: string) => (o[key] as (() => void) | undefined)?.();

function makeReq(fail: boolean) {
  const req: AnyObj = {};
  queueMicrotask(() => {
    if (fail) {
      req.error = new Error('request failed');
      fire(req, 'onerror');
    } else {
      req.result = undefined;
      fire(req, 'onsuccess');
    }
  });
  return req;
}

function openFailStub() {
  return {
    open: () => {
      const req: AnyObj = {};
      queueMicrotask(() => {
        req.error = new Error('open failed');
        fire(req, 'onerror');
      });
      return req;
    },
  };
}

function opFailStub() {
  const store = {
    get: () => makeReq(true),
    put: () => ({}),
    clear: () => ({}),
    delete: () => ({}),
    openCursor: () => makeReq(true),
    getAllKeys: () => makeReq(true),
  };
  const fakeDb = {
    objectStoreNames: { contains: () => false },
    createObjectStore: () => store,
    deleteObjectStore: () => {},
    transaction: () => {
      const tx: AnyObj = { objectStore: () => store };
      queueMicrotask(() => {
        tx.error = new Error('transaction failed');
        fire(tx, 'onerror');
      });
      return tx;
    },
  };
  return {
    open: () => {
      const req: AnyObj = {};
      queueMicrotask(() => {
        req.result = fakeDb;
        fire(req, 'onupgradeneeded');
        fire(req, 'onsuccess');
      });
      return req;
    },
  };
}

async function loadWith(stub: unknown) {
  vi.resetModules();
  vi.stubGlobal('indexedDB', stub);
  return import('@/services/library-cache');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('library-cache when the database fails to open', () => {
  it('swallows errors and returns empty results', async () => {
    const cache = await loadWith(openFailStub());

    expect(await cache.getCached('k')).toBeUndefined();
    expect(await cache.getArt('h')).toBeUndefined();
    await expect(
      cache.putCached('k', { title: 't', artist: 'a', album: 'al', durationSec: 1 }),
    ).resolves.toBeUndefined();
    await expect(cache.putArt('h', new Blob(['x']))).resolves.toBeUndefined();
    await expect(cache.pruneCacheToScan(new Set(['k']))).resolves.toBeUndefined();
    await expect(cache.clearCache()).resolves.toBeUndefined();
  });
});

describe('library-cache when requests/transactions error', () => {
  it('swallows read request errors and write/cursor transaction errors', async () => {
    const cache = await loadWith(opFailStub());

    expect(await cache.getCached('k')).toBeUndefined();
    expect(await cache.getArt('h')).toBeUndefined();
    await expect(
      cache.putCached('k', { title: 't', artist: 'a', album: 'al', durationSec: 1 }),
    ).resolves.toBeUndefined();
    await expect(cache.putArt('h', new Blob(['x']))).resolves.toBeUndefined();
    await expect(cache.pruneCacheToScan(new Set(['k']))).resolves.toBeUndefined();
    await expect(cache.clearCache()).resolves.toBeUndefined();
  });
});
