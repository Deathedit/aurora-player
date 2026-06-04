// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useFsAccess } from '@/hooks/useFsAccess';
import type { FileEntry } from '@/services/library';

vi.mock('@/services/fs-access', () => ({
  isSupported: vi.fn(() => true),
  pickDirectory: vi.fn(),
  getStoredHandle: vi.fn(),
  queryPermission: vi.fn(),
  requestPermission: vi.fn(),
  readDirectory: vi.fn(),
  clearStoredHandle: vi.fn(),
}));

vi.mock('@/services/library-cache', () => ({
  clearCache: vi.fn(),
}));

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

const handle = (name = 'Music') => ({ name }) as unknown as FileSystemDirectoryHandle;
const files: FileEntry[] = [{ file: new File([], 'a.mp3'), folder: '' }];

function setup() {
  const addFiles = vi.fn<(entries: FileEntry[]) => Promise<void>>(async () => {});
  const clearLibrary = vi.fn();
  const view = renderHook(() => useFsAccess(addFiles, clearLibrary));
  return { addFiles, clearLibrary, ...view };
}

beforeEach(() => {
  vi.mocked(isSupported).mockReturnValue(true);
  vi.mocked(readDirectory).mockResolvedValue(files);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useFsAccess', () => {
  it('reports supported state from the service', () => {
    vi.mocked(isSupported).mockReturnValue(false);
    const { result } = setup();
    expect(result.current.supported).toBe(false);
    expect(result.current.connected).toBe(false);
  });

  describe('connect', () => {
    it('is a no-op when the picker is cancelled', async () => {
      vi.mocked(pickDirectory).mockResolvedValue(null);
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connected).toBe(false);
      expect(addFiles).not.toHaveBeenCalled();
    });

    it('sets dirName/connected and scans on a successful pick', async () => {
      vi.mocked(pickDirectory).mockResolvedValue({ name: 'Music', handle: handle() });
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connected).toBe(true);
      expect(result.current.dirName).toBe('Music');
      expect(readDirectory).toHaveBeenCalled();
      expect(addFiles).toHaveBeenCalledWith(files);
      expect(result.current.scanning).toBe(false);
    });

    it('ignores a second connect while a scan is in flight', async () => {
      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      vi.mocked(readDirectory).mockImplementation(async () => {
        await gate;
        return files;
      });
      vi.mocked(pickDirectory).mockResolvedValue({ name: 'Music', handle: handle() });
      const { result } = setup();

      let first!: Promise<void>;
      act(() => {
        first = result.current.connect();
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      await act(async () => {
        await result.current.connect();
      });
      await act(async () => {
        release();
        await first;
      });

      expect(pickDirectory).toHaveBeenCalledTimes(1);
    });
  });

  describe('runScan re-entrancy', () => {
    it('ignores a concurrent scan while one is in flight', async () => {
      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      vi.mocked(readDirectory).mockImplementation(async () => {
        await gate;
        return files;
      });
      vi.mocked(pickDirectory).mockResolvedValue({ name: 'Music', handle: handle() });
      vi.mocked(getStoredHandle).mockResolvedValue(handle());
      const { result, addFiles } = setup();

      let first!: Promise<void>;
      act(() => {
        first = result.current.connect();
      });
      await act(async () => {
        await result.current.refresh();
      });
      await act(async () => {
        release();
        await first;
      });

      expect(addFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('reconnect', () => {
    it('does nothing without a stored handle', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(null);
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.reconnect();
      });

      expect(addFiles).not.toHaveBeenCalled();
    });

    it('does not scan when permission is not granted', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(handle());
      vi.mocked(requestPermission).mockResolvedValue('denied');
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.reconnect();
      });

      expect(addFiles).not.toHaveBeenCalled();
    });

    it('scans and clears reconnectNeeded when granted', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(handle());
      vi.mocked(requestPermission).mockResolvedValue('granted');
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.reconnect();
      });

      expect(addFiles).toHaveBeenCalled();
      expect(result.current.reconnectNeeded).toBe(false);
    });
  });

  describe('refresh', () => {
    it('clears the library before re-scanning', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(handle());
      const { result, addFiles, clearLibrary } = setup();

      await act(async () => {
        await result.current.refresh();
      });

      expect(clearLibrary).toHaveBeenCalled();
      expect(addFiles).toHaveBeenCalled();
      expect(clearLibrary.mock.invocationCallOrder[0]).toBeLessThan(addFiles.mock.invocationCallOrder[0]);
    });

    it('does nothing without a stored handle', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(null);
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.refresh();
      });

      expect(addFiles).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('clears the stored handle, cache, and library state', async () => {
      vi.mocked(pickDirectory).mockResolvedValue({ name: 'Music', handle: handle() });
      const { result, clearLibrary } = setup();
      await act(async () => {
        await result.current.connect();
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(clearStoredHandle).toHaveBeenCalled();
      expect(clearCache).toHaveBeenCalled();
      expect(clearLibrary).toHaveBeenCalled();
      expect(result.current.connected).toBe(false);
      expect(result.current.dirName).toBeNull();
    });
  });

  describe('initOnMount', () => {
    it('is a no-op when unsupported', async () => {
      vi.mocked(isSupported).mockReturnValue(false);
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.initOnMount();
      });

      expect(getStoredHandle).not.toHaveBeenCalled();
      expect(addFiles).not.toHaveBeenCalled();
    });

    it('scans when a stored handle still has permission', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(handle());
      vi.mocked(queryPermission).mockResolvedValue('granted');
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.initOnMount();
      });

      expect(result.current.dirName).toBe('Music');
      expect(addFiles).toHaveBeenCalled();
      expect(result.current.reconnectNeeded).toBe(false);
    });

    it('flags reconnect when permission is no longer granted', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(handle());
      vi.mocked(queryPermission).mockResolvedValue('prompt');
      const { result, addFiles } = setup();

      await act(async () => {
        await result.current.initOnMount();
      });

      expect(result.current.reconnectNeeded).toBe(true);
      expect(addFiles).not.toHaveBeenCalled();
    });

    it('does nothing when no handle is stored', async () => {
      vi.mocked(getStoredHandle).mockResolvedValue(null);
      const { result } = setup();

      await act(async () => {
        await result.current.initOnMount();
      });

      expect(result.current.dirName).toBeNull();
    });
  });
});
