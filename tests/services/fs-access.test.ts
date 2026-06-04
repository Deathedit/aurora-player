// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  isSupported,
  pickDirectory,
  getStoredHandle,
  clearStoredHandle,
  queryPermission,
  requestPermission,
  readDirectory,
} from '@/services/fs-access';

type Entry = FileHandle | DirHandle;

class FileHandle {
  kind = 'file' as const;
  name: string;
  private failGetFile: boolean;
  constructor(name: string, failGetFile = false) {
    this.name = name;
    this.failGetFile = failGetFile;
  }
  async getFile(): Promise<File> {
    if (this.failGetFile) throw new Error('unreadable');
    return new File(['x'], this.name);
  }
}

class DirHandle {
  kind = 'directory' as const;
  name: string;
  private children: Entry[];
  queryPermission = vi.fn(async () => 'granted');
  requestPermission = vi.fn(async () => 'granted');
  constructor(name: string, children: Entry[] = []) {
    this.name = name;
    this.children = children;
  }
  async *values(): AsyncGenerator<Entry> {
    for (const c of this.children) yield c;
  }
}

afterEach(async () => {
  vi.unstubAllGlobals();
  try {
    await clearStoredHandle();
  } catch {
    /* ignore cleanup errors from a stubbed db */
  }
  vi.restoreAllMocks();
  delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker;
});

function makeReq(fail?: boolean) {
  const req: Record<string, unknown> = {};
  queueMicrotask(() => {
    if (fail) {
      req.error = new Error('op failed');
      (req.onerror as (() => void) | undefined)?.();
    } else {
      req.result = undefined;
      (req.onsuccess as (() => void) | undefined)?.();
    }
  });
  return req;
}

function stubIDB(opts: { openFails?: boolean; opFails?: boolean }) {
  const store = {
    get: () => makeReq(opts.opFails),
    put: () => makeReq(opts.opFails),
    delete: () => makeReq(opts.opFails),
  };
  const fakeDb = {
    createObjectStore: () => store,
    transaction: () => ({ objectStore: () => store }),
  };
  vi.stubGlobal('indexedDB', {
    open: () => {
      const req: Record<string, unknown> = {};
      queueMicrotask(() => {
        if (opts.openFails) {
          req.error = new Error('open failed');
          (req.onerror as (() => void) | undefined)?.();
        } else {
          req.result = fakeDb;
          (req.onupgradeneeded as (() => void) | undefined)?.();
          (req.onsuccess as (() => void) | undefined)?.();
        }
      });
      return req;
    },
  });
}

describe('isSupported', () => {
  it('tracks presence of showDirectoryPicker on window', () => {
    expect(isSupported()).toBe(false);
    (window as { showDirectoryPicker?: unknown }).showDirectoryPicker = () => {};
    expect(isSupported()).toBe(true);
  });
});

describe('pickDirectory', () => {
  it('stores the chosen handle and returns its name', async () => {
    const dir = { name: 'Music' };
    (window as { showDirectoryPicker?: unknown }).showDirectoryPicker = vi.fn(async () => dir);

    const result = await pickDirectory();
    expect(result?.name).toBe('Music');
    expect((await getStoredHandle())?.name).toBe('Music');
  });

  it('returns null when the user cancels (AbortError)', async () => {
    (window as { showDirectoryPicker?: unknown }).showDirectoryPicker = vi.fn(async () => {
      throw new DOMException('cancelled', 'AbortError');
    });
    expect(await pickDirectory()).toBeNull();
  });
});

describe('getStoredHandle / clearStoredHandle', () => {
  it('round-trips a stored handle and clears it', async () => {
    const dir = { name: 'Lib' };
    (window as { showDirectoryPicker?: unknown }).showDirectoryPicker = vi.fn(async () => dir);
    await pickDirectory();
    expect(await getStoredHandle()).toBeTruthy();

    await clearStoredHandle();
    expect(await getStoredHandle()).toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    expect(await getStoredHandle()).toBeNull();
  });
});

describe('permissions', () => {
  it('delegates query/request to the handle with read mode', async () => {
    const dir = new DirHandle('M');
    const cast = dir as unknown as FileSystemDirectoryHandle;

    expect(await queryPermission(cast)).toBe('granted');
    expect(dir.queryPermission).toHaveBeenCalledWith({ mode: 'read' });
    expect(await requestPermission(cast)).toBe('granted');
    expect(dir.requestPermission).toHaveBeenCalledWith({ mode: 'read' });
  });
});

describe('readDirectory', () => {
  it('walks nested directories into audio FileEntry rows with folder paths', async () => {
    const tree = new DirHandle('root', [
      new FileHandle('song.mp3'),
      new FileHandle('cover.jpg'),
      new DirHandle('Album', [new FileHandle('track.flac'), new FileHandle('notes.txt')]),
    ]);

    const entries = await readDirectory(tree as unknown as FileSystemDirectoryHandle);

    expect(entries.map((e) => `${e.folder}/${e.file.name}`)).toEqual(['/song.mp3', 'Album/track.flac']);
  });

  it('skips files that fail to read', async () => {
    const tree = new DirHandle('root', [new FileHandle('ok.mp3'), new FileHandle('bad.mp3', true)]);

    const entries = await readDirectory(tree as unknown as FileSystemDirectoryHandle);
    expect(entries.map((e) => e.file.name)).toEqual(['ok.mp3']);
  });

  it('recurses into deeply nested dirs and ignores non-file/dir entries', async () => {
    const tree = new DirHandle('root', [
      { kind: 'other' } as unknown as Entry,
      new DirHandle('Album', [new DirHandle('Disc1', [new FileHandle('track.flac')])]),
    ]);

    const entries = await readDirectory(tree as unknown as FileSystemDirectoryHandle);
    expect(entries.map((e) => `${e.folder}/${e.file.name}`)).toEqual(['Album/Disc1/track.flac']);
  });
});

describe('indexeddb failures', () => {
  it('getStoredHandle returns null when the database fails to open', async () => {
    stubIDB({ openFails: true });
    expect(await getStoredHandle()).toBeNull();
  });

  it('getStoredHandle returns null when the read request errors', async () => {
    stubIDB({ opFails: true });
    expect(await getStoredHandle()).toBeNull();
  });

  it('pickDirectory returns null when the write request errors', async () => {
    (window as { showDirectoryPicker?: unknown }).showDirectoryPicker = vi.fn(async () => ({ name: 'M' }));
    stubIDB({ opFails: true });
    expect(await pickDirectory()).toBeNull();
  });

  it('clearStoredHandle rejects when the delete request errors', async () => {
    stubIDB({ opFails: true });
    await expect(clearStoredHandle()).rejects.toThrow();
  });
});
