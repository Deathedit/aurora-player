import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';

const DB_NAME = 'aurora-library';

function seedV1(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('tracks');
      d.createObjectStore('art');
      d.createObjectStore('legacy');
    };
    req.onsuccess = () => {
      req.result.close();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

describe('library-cache v1 -> v2 migration', () => {
  it('recreates the tracks store and preserves the existing art store on upgrade', async () => {
    await seedV1();

    const cache = await import('@/services/library-cache');
    expect(await cache.getCached('anything')).toBeUndefined();

    await cache.putArt('h', new Blob(['x']));
    expect(await cache.getArt('h')).toBeInstanceOf(Blob);
  });
});
