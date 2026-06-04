// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { RefObject } from 'react';
import { usePositionPersistence } from '@/hooks/usePositionPersistence';
import { createMockAudio } from './mock-audio';
import type { Track } from '@/types';

const track = (id: string): Track => ({ id, url: `blob:${id}`, title: id, artist: 'a', album: 'b', durationSec: 1 });
const LAST_PLAYED_KEY = 'aurora-lastplayed';

function setup(opts?: { audio?: ReturnType<typeof createMockAudio> | null; current?: string | null }) {
  const audio = opts?.audio === undefined ? createMockAudio() : opts.audio;
  const refs = {
    audioRef: { current: audio as unknown as HTMLAudioElement | null } as RefObject<HTMLAudioElement | null>,
    currentIdRef: { current: opts?.current ?? null } as RefObject<string | null>,
    libraryRef: { current: ['1', '2', '3'].map(track) } as RefObject<Track[]>,
    shuffleRef: { current: false } as RefObject<boolean>,
    historyRef: { current: [] as string[] } as RefObject<string[]>,
    setQueue: vi.fn(),
    setCurrentId: vi.fn(),
  };
  const view = renderHook(() => usePositionPersistence(refs));
  return { audio, refs, ...view };
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

describe('savePosition', () => {
  it('persists the current track key and time, and saves on visibilitychange', () => {
    const { audio, result } = setup({ current: '2' });
    audio!.currentTime = 42;

    act(() => result.current.savePosition());
    expect(JSON.parse(localStorage.getItem(LAST_PLAYED_KEY)!).time).toBe(42);

    localStorage.clear();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(localStorage.getItem(LAST_PLAYED_KEY)).not.toBeNull();
  });

  it('does nothing without a current track', () => {
    const { result } = setup({ current: null });
    act(() => result.current.savePosition());
    expect(localStorage.getItem(LAST_PLAYED_KEY)).toBeNull();
  });

  it('does nothing while a restore is in progress', () => {
    const { result } = setup({ current: '2' });
    result.current.restoringRef.current = true;
    act(() => result.current.savePosition());
    expect(localStorage.getItem(LAST_PLAYED_KEY)).toBeNull();
  });

  it('does nothing without an audio element', () => {
    const { result } = setup({ audio: null, current: '2' });
    act(() => result.current.savePosition());
    expect(localStorage.getItem(LAST_PLAYED_KEY)).toBeNull();
  });

  it('does nothing when the current id is not in the library', () => {
    const { audio, result } = setup({ current: 'missing' });
    audio!.currentTime = 5;
    act(() => result.current.savePosition());
    expect(localStorage.getItem(LAST_PLAYED_KEY)).toBeNull();
  });

  it('saves on beforeunload', () => {
    const { audio } = setup({ current: '2' });
    audio!.currentTime = 7;
    act(() => window.dispatchEvent(new Event('beforeunload')));
    expect(JSON.parse(localStorage.getItem(LAST_PLAYED_KEY)!).time).toBe(7);
  });

  it('does not save when the page becomes visible (not hidden)', () => {
    const { audio } = setup({ current: '2' });
    audio!.currentTime = 9;
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(localStorage.getItem(LAST_PLAYED_KEY)).toBeNull();
  });
});

describe('restoreLastPlayed', () => {
  it('clears the restoring flag via timeout when metadata never loads', () => {
    vi.useFakeTimers();
    const tracks = ['1', '2', '3'].map(track);
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify({ key: '2', time: 10 }));
    const { result, refs } = setup({ current: null });

    act(() => result.current.restoreLastPlayed(tracks));
    expect(result.current.restoringRef.current).toBe(true);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.restoringRef.current).toBe(false);
    expect(refs.setCurrentId).toHaveBeenCalled();
  });

  it('returns early when already restored', () => {
    const tracks = ['1', '2', '3'].map(track);
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify({ key: '2', time: 10 }));
    const { result, refs } = setup({ current: null });

    act(() => result.current.restoreLastPlayed(tracks));
    refs.setCurrentId.mockClear();
    act(() => result.current.restoreLastPlayed(tracks));
    expect(refs.setCurrentId).not.toHaveBeenCalled();
  });

  it('does nothing when the saved key matches no track', () => {
    const tracks = ['1', '2', '3'].map(track);
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify({ key: 'gone', time: 10 }));
    const { result, refs } = setup({ current: null });

    act(() => result.current.restoreLastPlayed(tracks));
    expect(refs.setCurrentId).not.toHaveBeenCalled();
    expect(result.current.restoredRef.current).toBe(false);
  });

  it('does not seek when the saved time is out of range on loadedmetadata', () => {
    const tracks = ['1', '2', '3'].map(track);
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify({ key: '2', time: 0 }));
    const { audio, result } = setup({ current: null });

    act(() => result.current.restoreLastPlayed(tracks));
    act(() => {
      audio!.duration = 100;
      audio!.emit('loadedmetadata');
    });

    expect(audio!.currentTime).toBe(0);
    expect(result.current.restoringRef.current).toBe(false);
  });

  it('handles a missing audio element gracefully', () => {
    const tracks = ['1', '2', '3'].map(track);
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify({ key: '2', time: 10 }));
    const { result } = setup({ audio: null, current: null });

    act(() => result.current.restoreLastPlayed(tracks));
    expect(result.current.restoringRef.current).toBe(false);
    expect(result.current.restoredRef.current).toBe(true);
  });
});
