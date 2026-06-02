import { useState, useCallback, useRef } from 'react';
import {
  isSupported,
  pickDirectory,
  getStoredHandle,
  queryPermission,
  requestPermission,
  readDirectory,
  clearStoredHandle,
} from '@/services/fs-access';
import { clearCache } from '@/services/library-cache';
import type { FileEntry } from '@/services/library';

export interface FsAccessState {
  connected: boolean;
  dirName: string | null;
  scanning: boolean;
  reconnectNeeded: boolean;
  supported: boolean;
}

export function useFsAccess(
  addFiles: (entries: FileEntry[]) => Promise<void>,
  clearLibrary: () => void,
) {
  const [dirName, setDirName] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [reconnectNeeded, setReconnectNeeded] = useState(false);
  const scanningRef = useRef(false);

  const supported = isSupported();

  const runScan = useCallback(
    async (handle: FileSystemDirectoryHandle, clearFirst = false) => {
      if (scanningRef.current) return;
      scanningRef.current = true;
      setScanning(true);
      try {
        const files = await readDirectory(handle);
        if (clearFirst) clearLibrary();
        await addFiles(files);
      } finally {
        scanningRef.current = false;
        setScanning(false);
      }
    },
    [addFiles, clearLibrary],
  );

  const connect = useCallback(async () => {
    if (scanningRef.current) return;
    const result = await pickDirectory();
    if (!result) return;
    setDirName(result.name);
    setReconnectNeeded(false);
    await runScan(result.handle);
  }, [runScan]);

  const reconnect = useCallback(async () => {
    const handle = await getStoredHandle();
    if (!handle) return;
    const perm = await requestPermission(handle);
    if (perm !== 'granted') return;
    setReconnectNeeded(false);
    await runScan(handle);
  }, [runScan]);

  const refresh = useCallback(async () => {
    const handle = await getStoredHandle();
    if (!handle) return;
    await runScan(handle, true);
  }, [runScan]);

  const disconnect = useCallback(async () => {
    await clearStoredHandle();
    await clearCache();
    setDirName(null);
    setReconnectNeeded(false);
    clearLibrary();
  }, [clearLibrary]);

  const initOnMount = useCallback(async () => {
    if (!supported) return;
    const handle = await getStoredHandle();
    if (!handle) return;
    setDirName(handle.name);
    const perm = await queryPermission(handle);
    if (perm === 'granted') {
      await runScan(handle);
    } else {
      setReconnectNeeded(true);
    }
  }, [supported, runScan]);

  return {
    connected: dirName !== null,
    dirName,
    scanning,
    reconnectNeeded,
    supported,
    connect,
    reconnect,
    refresh,
    disconnect,
    initOnMount,
  };
}
