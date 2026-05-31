const DB_NAME = 'aurora-library'
const STORE_NAME = 'tracks'

export interface CachedTrack {
  title: string
  artist: string
  album: string
  folder?: string
  durationSec: number
  artColor?: string
  art?: Blob
}

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function db(): Promise<IDBDatabase> {
  return (dbPromise ??= open())
}

export function cacheKey(file: File, folder?: string): string {
  return `${folder ?? ''}/${file.name}|${file.size}|${file.lastModified}`
}

export async function getCached(key: string): Promise<CachedTrack | undefined> {
  try {
    const d = await db()
    return await new Promise((resolve, reject) => {
      const req = d.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result as CachedTrack | undefined)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return undefined
  }
}

export async function putCached(key: string, value: CachedTrack): Promise<void> {
  try {
    const d = await db()
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* cache write is best-effort */ }
}

export async function setCachedColor(key: string, color: string): Promise<void> {
  const cached = await getCached(key)
  if (!cached) return
  await putCached(key, { ...cached, artColor: color })
}

export async function pruneCacheToScan(allScannedKeys: Set<string>): Promise<void> {
  try {
    const d = await db()
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAllKeys()
      req.onsuccess = () => {
        for (const k of req.result) {
          if (!allScannedKeys.has(k as string)) store.delete(k)
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* prune is best-effort */ }
}

export async function clearCache(): Promise<void> {
  try {
    const d = await db()
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* clear is best-effort */ }
}
