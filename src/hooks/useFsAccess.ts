import { useState, useCallback } from 'react'
import {
  isSupported,
  pickDirectory,
  getStoredHandle,
  queryPermission,
  requestPermission,
  readDirectory,
  clearStoredHandle,
} from '@/services/fs-access'
import { clearCache } from '@/services/library-cache'
import type { FileEntry } from '@/services/library'

export interface FsAccessState {
  connected: boolean
  dirName: string | null
  scanning: boolean
  reconnectNeeded: boolean
  supported: boolean
}

export function useFsAccess(addFiles: (entries: FileEntry[]) => Promise<void>, clearLibrary: () => void) {
  const [dirName, setDirName] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [reconnectNeeded, setReconnectNeeded] = useState(false)

  const supported = isSupported()

  const connect = useCallback(async () => {
    const result = await pickDirectory()
    if (!result) return
    setDirName(result.name)
    setReconnectNeeded(false)
    setScanning(true)
    try {
      const files = await readDirectory(result.handle)
      await addFiles(files)
    } finally {
      setScanning(false)
    }
  }, [addFiles])

  const reconnect = useCallback(async () => {
    const handle = await getStoredHandle()
    if (!handle) return
    const perm = await requestPermission(handle)
    if (perm !== 'granted') return
    setReconnectNeeded(false)
    setScanning(true)
    try {
      const files = await readDirectory(handle)
      await addFiles(files)
    } finally {
      setScanning(false)
    }
  }, [addFiles])

  const refresh = useCallback(async () => {
    const handle = await getStoredHandle()
    if (!handle) return
    setScanning(true)
    try {
      const files = await readDirectory(handle)
      clearLibrary()
      await addFiles(files)
    } finally {
      setScanning(false)
    }
  }, [addFiles, clearLibrary])

  const disconnect = useCallback(async () => {
    await clearStoredHandle()
    await clearCache()
    setDirName(null)
    setReconnectNeeded(false)
    clearLibrary()
  }, [clearLibrary])

  const initOnMount = useCallback(async () => {
    if (!supported) return
    const handle = await getStoredHandle()
    if (!handle) return
    setDirName(handle.name)
    const perm = await queryPermission(handle)
    if (perm === 'granted') {
      setScanning(true)
      try {
        const files = await readDirectory(handle)
        await addFiles(files)
      } finally {
        setScanning(false)
      }
    } else {
      setReconnectNeeded(true)
    }
  }, [supported, addFiles])

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
  }
}