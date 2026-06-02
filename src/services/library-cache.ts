const DB_NAME = 'aurora-library';
const TRACKS_STORE = 'tracks';
const ART_STORE = 'art';
const DB_VERSION = 2;

export interface CachedTrack {
  title: string;
  artist: string;
  album: string;
  folder?: string;
  durationSec: number;
  artColor?: string;
  artHash?: string;
  artType?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (d.objectStoreNames.contains(TRACKS_STORE))
        d.deleteObjectStore(TRACKS_STORE);
      d.createObjectStore(TRACKS_STORE);
      if (!d.objectStoreNames.contains(ART_STORE))
        d.createObjectStore(ART_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function db(): Promise<IDBDatabase> {
  return (dbPromise ??= open());
}

export function cacheKey(file: File, folder?: string): string {
  return `${folder ?? ''}/${file.name}|${file.size}|${file.lastModified}`;
}

export async function getCached(key: string): Promise<CachedTrack | undefined> {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const req = d
        .transaction(TRACKS_STORE, 'readonly')
        .objectStore(TRACKS_STORE)
        .get(key);
      req.onsuccess = () => resolve(req.result as CachedTrack | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function putCached(
  key: string,
  value: CachedTrack,
): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(TRACKS_STORE, 'readwrite');
      tx.objectStore(TRACKS_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* cache write is best-effort */
  }
}

export async function setCachedColor(
  key: string,
  color: string,
): Promise<void> {
  const cached = await getCached(key);
  if (!cached) return;
  await putCached(key, { ...cached, artColor: color });
}

export async function getArt(hash: string): Promise<Blob | undefined> {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const req = d
        .transaction(ART_STORE, 'readonly')
        .objectStore(ART_STORE)
        .get(hash);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function putArt(hash: string, blob: Blob): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(ART_STORE, 'readwrite');
      tx.objectStore(ART_STORE).put(blob, hash);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* cache write is best-effort */
  }
}

export async function pruneCacheToScan(
  allScannedKeys: Set<string>,
): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction([TRACKS_STORE, ART_STORE], 'readwrite');
      const tracks = tx.objectStore(TRACKS_STORE);
      const art = tx.objectStore(ART_STORE);
      const liveHashes = new Set<string>();
      const cursorReq = tracks.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          if (!allScannedKeys.has(cursor.key as string)) {
            cursor.delete();
          } else {
            const hash = (cursor.value as CachedTrack).artHash;
            if (hash) liveHashes.add(hash);
          }
          cursor.continue();
          return;
        }
        const artKeysReq = art.getAllKeys();
        artKeysReq.onsuccess = () => {
          for (const h of artKeysReq.result) {
            if (!liveHashes.has(h as string)) art.delete(h);
          }
        };
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* prune is best-effort */
  }
}

export async function clearCache(): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction([TRACKS_STORE, ART_STORE], 'readwrite');
      tx.objectStore(TRACKS_STORE).clear();
      tx.objectStore(ART_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* clear is best-effort */
  }
}
