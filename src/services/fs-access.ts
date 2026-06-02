import { isAudioFile } from '@/services/audio-files';
import type { FileEntry } from '@/services/audio-files';

const DB_NAME = 'aurora-fs';
const STORE_NAME = 'handles';
const KEY = 'music';

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function isSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

export async function pickDirectory(): Promise<{
  name: string;
  handle: FileSystemDirectoryHandle;
} | null> {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    await idbPut(KEY, handle);
    return { name: handle.name, handle };
  } catch {
    return null;
  }
}

export async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await idbGet<FileSystemDirectoryHandle>(KEY);
    return handle ?? null;
  } catch {
    return null;
  }
}

export type FsPermissionStatus = 'granted' | 'prompt' | 'denied';

export async function queryPermission(handle: FileSystemDirectoryHandle): Promise<FsPermissionStatus> {
  return handle.queryPermission({
    mode: 'read',
  }) as unknown as FsPermissionStatus;
}

export async function requestPermission(handle: FileSystemDirectoryHandle): Promise<FsPermissionStatus> {
  return handle.requestPermission({
    mode: 'read',
  }) as unknown as FsPermissionStatus;
}

export type { FileEntry };

async function walkDir(handle: FileSystemDirectoryHandle, path: string, entries: FileEntry[]): Promise<void> {
  for await (const entry of handle.values()) {
    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle;
      if (isAudioFile(fileHandle.name)) {
        try {
          const file = await fileHandle.getFile();
          entries.push({ file, folder: path });
        } catch {
          /* skip unreadable files */
        }
      }
    } else if (entry.kind === 'directory') {
      const dirHandle = entry as FileSystemDirectoryHandle;
      const subPath = path ? `${path}/${dirHandle.name}` : dirHandle.name;
      await walkDir(dirHandle, subPath, entries);
    }
  }
}

export async function readDirectory(handle: FileSystemDirectoryHandle): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  await walkDir(handle, '', entries);
  return entries;
}

export async function clearStoredHandle(): Promise<void> {
  await idbDelete(KEY);
}
