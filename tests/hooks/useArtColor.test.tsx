// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, cleanup, waitFor } from '@testing-library/react';
import { useArtColor } from '@/hooks/useArtColor';
import type { Track } from '@/types';

vi.mock('@/services/library', () => ({
  extractArtColor: vi.fn(),
  getArtColor: vi.fn(),
  setArtColor: vi.fn(),
  cacheColor: vi.fn(),
}));

import { extractArtColor, getArtColor, setArtColor, cacheColor } from '@/services/library';

const artVar = () => document.documentElement.style.getPropertyValue('--art');
const track = (over: Partial<Track> = {}): Track => ({
  id: '1',
  url: 'blob:1',
  title: 't',
  artist: 'a',
  album: 'b',
  durationSec: 1,
  artUrl: 'blob:art',
  artHash: 'hash1',
  ...over,
});

beforeEach(() => {
  vi.mocked(extractArtColor).mockResolvedValue('#112233');
  vi.mocked(getArtColor).mockReturnValue(undefined);
});

afterEach(() => {
  cleanup();
  document.documentElement.style.removeProperty('--art');
  vi.clearAllMocks();
});

describe('useArtColor', () => {
  it('clears --art when there is no track or no art', () => {
    document.documentElement.style.setProperty('--art', '#999999');
    renderHook(() => useArtColor(null));
    expect(artVar()).toBe('');

    document.documentElement.style.setProperty('--art', '#999999');
    renderHook(() => useArtColor(track({ artUrl: undefined })));
    expect(artVar()).toBe('');
  });

  it('uses a known color without extracting', () => {
    renderHook(() => useArtColor(track({ artColor: '#abcdef' })));
    expect(artVar()).toBe('#abcdef');
    expect(extractArtColor).not.toHaveBeenCalled();
  });

  it('uses a cached color looked up by hash', () => {
    vi.mocked(getArtColor).mockReturnValue('#fromcache');
    renderHook(() => useArtColor(track()));
    expect(artVar()).toBe('#fromcache');
    expect(extractArtColor).not.toHaveBeenCalled();
  });

  it('extracts, stores by hash, and persists to cache when a file is present', async () => {
    const file = new File([], 'a.mp3');
    renderHook(() => useArtColor(track({ file, folder: 'Album' })));

    await waitFor(() => expect(artVar()).toBe('#112233'));
    expect(setArtColor).toHaveBeenCalledWith('hash1', '#112233');
    expect(cacheColor).toHaveBeenCalledWith(file, 'Album', '#112233');
  });

  it('extracts without storing by hash when the track has no artHash', async () => {
    renderHook(() => useArtColor(track({ artHash: undefined })));
    await waitFor(() => expect(artVar()).toBe('#112233'));
    expect(getArtColor).not.toHaveBeenCalled();
    expect(setArtColor).not.toHaveBeenCalled();
  });

  it('does not persist to the file cache when there is no file', async () => {
    renderHook(() => useArtColor(track({ file: undefined })));
    await waitFor(() => expect(setArtColor).toHaveBeenCalled());
    expect(cacheColor).not.toHaveBeenCalled();
  });

  it('ignores a resolved extraction after unmount', async () => {
    let resolve!: (c: string) => void;
    vi.mocked(extractArtColor).mockReturnValue(new Promise((r) => (resolve = r)));
    const { unmount } = renderHook(() => useArtColor(track()));
    unmount();
    resolve('#late');
    await Promise.resolve();
    expect(setArtColor).not.toHaveBeenCalled();
  });
});
