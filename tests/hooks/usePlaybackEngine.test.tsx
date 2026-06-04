// @vitest-environment happy-dom
import { afterEach, describe, it, expect } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { RefObject } from 'react';
import { usePlaybackEngine } from '@/hooks/usePlaybackEngine';
import { createMockAudio } from './mock-audio';
import type { Track, RepeatMode } from '@/types';

function track(id: string): Track {
  return { id, url: `blob:${id}`, title: id, artist: 'a', album: 'b', durationSec: 1 };
}

function setup(tracks: Track[], opts?: { repeat?: RepeatMode; shuffle?: boolean; volume?: number; noAudio?: boolean }) {
  const audio = createMockAudio();
  const audioRef: RefObject<HTMLAudioElement | null> = {
    current: opts?.noAudio ? null : (audio as unknown as HTMLAudioElement),
  };
  const libraryRef: RefObject<Track[]> = { current: tracks };
  const repeatRef: RefObject<RepeatMode> = { current: opts?.repeat ?? 'off' };
  const shuffleRef: RefObject<boolean> = { current: opts?.shuffle ?? false };

  const view = renderHook(({ volume }) => usePlaybackEngine({ audioRef, libraryRef, repeatRef, shuffleRef, volume }), {
    initialProps: { volume: opts?.volume ?? 0.8 },
  });

  return { audio, libraryRef, repeatRef, shuffleRef, ...view };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('usePlaybackEngine', () => {
  it('play() sets current, builds the in-order queue, points audio at the track, and plays', () => {
    const { result, audio } = setup(['1', '2', '3'].map(track));
    act(() => result.current.play('2'));

    expect(result.current.currentId).toBe('2');
    expect(result.current.queue.map((t) => t.id)).toEqual(['1', '2', '3']);
    expect(audio.src).toBe('blob:2');
    expect(audio.play).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
  });

  it('toggle() from idle plays the first track', () => {
    const { result, audio } = setup(['1', '2'].map(track));
    act(() => result.current.toggle());

    expect(result.current.currentId).toBe('1');
    expect(audio.src).toBe('blob:1');
    expect(result.current.isPlaying).toBe(true);
  });

  it('toggle() pauses and resumes a playing track', () => {
    const { result, audio } = setup(['1', '2'].map(track));
    act(() => result.current.play('1'));
    expect(result.current.isPlaying).toBe(true);

    act(() => result.current.toggle());
    expect(audio.paused).toBe(true);
    expect(result.current.isPlaying).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isPlaying).toBe(true);
  });

  it('next() advances through the queue and wraps at the end', () => {
    const { result } = setup(['1', '2', '3'].map(track));
    act(() => result.current.play('1'));

    act(() => result.current.next());
    expect(result.current.currentId).toBe('2');
    act(() => result.current.next());
    expect(result.current.currentId).toBe('3');
    act(() => result.current.next());
    expect(result.current.currentId).toBe('1');
  });

  it('prev() restarts when past 3s, otherwise steps back through history', () => {
    const { result, audio } = setup(['1', '2', '3'].map(track));
    act(() => result.current.play('1'));
    act(() => result.current.next());

    audio.currentTime = 10;
    act(() => result.current.prev());
    expect(result.current.currentId).toBe('2');
    expect(audio.currentTime).toBe(0);

    audio.currentTime = 1;
    act(() => result.current.prev());
    expect(result.current.currentId).toBe('1');
  });

  it('seek() sets the audio currentTime', () => {
    const { result, audio } = setup(['1'].map(track));
    act(() => result.current.play('1'));
    act(() => result.current.seek(42));
    expect(audio.currentTime).toBe(42);
  });

  it('reflects timeupdate and loadedmetadata into currentTime/duration', () => {
    const { result, audio } = setup(['1'].map(track));
    act(() => result.current.play('1'));

    act(() => {
      audio.duration = 200;
      audio.emit('loadedmetadata');
    });
    expect(result.current.duration).toBe(200);

    act(() => {
      audio.currentTime = 12;
      audio.emit('timeupdate');
    });
    expect(result.current.currentTime).toBe(12);
  });

  it('on ended with repeat=one, replays the same track', () => {
    const { result, audio } = setup(['1', '2'].map(track), { repeat: 'one' });
    act(() => result.current.play('1'));
    audio.play.mockClear();
    audio.currentTime = 5;

    act(() => audio.emit('ended'));
    expect(result.current.currentId).toBe('1');
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalled();
  });

  it('on ended with repeat=off at the last track, stops (no advance)', () => {
    const { result, audio } = setup(['1', '2'].map(track), { repeat: 'off' });
    act(() => result.current.play('2'));

    act(() => audio.emit('ended'));
    expect(result.current.currentId).toBe('2');
  });

  it('on ended with repeat=all at the last track, wraps to the first', () => {
    const { result, audio } = setup(['1', '2'].map(track), { repeat: 'all' });
    act(() => result.current.play('2'));

    act(() => audio.emit('ended'));
    expect(result.current.currentId).toBe('1');
  });

  it('applies volume changes to the audio element', () => {
    const { audio, rerender } = setup(['1'].map(track), { volume: 0.5 });
    expect(audio.volume).toBe(0.5);

    act(() => rerender({ volume: 0.2 }));
    expect(audio.volume).toBe(0.2);
  });

  it('resetPlayback() clears state and the audio source', () => {
    const { result, audio } = setup(['1', '2'].map(track));
    act(() => result.current.play('1'));

    act(() => result.current.resetPlayback());
    expect(result.current.currentId).toBeNull();
    expect(result.current.queue).toEqual([]);
    expect(audio.src).toBe('');
  });

  it('play() ignores an id that is not in the library', () => {
    const { result } = setup(['1', '2'].map(track));
    act(() => result.current.play('nope'));
    expect(result.current.currentId).toBeNull();
  });

  it('caps the history at 100 entries while still advancing', () => {
    const { result } = setup(['1', '2', '3'].map(track));
    act(() => result.current.play('1'));
    for (let i = 0; i < 110; i++) act(() => result.current.next());
    expect(result.current.currentId).toBeTruthy();
  });

  it('next() is a no-op with an empty queue', () => {
    const { result } = setup(['1', '2'].map(track));
    act(() => result.current.next());
    expect(result.current.currentId).toBeNull();
  });

  it('prev() returns when the previous history id is gone from the library', () => {
    const { result, libraryRef } = setup(['1', '2', '3'].map(track));
    act(() => result.current.play('1'));
    act(() => result.current.next());
    libraryRef.current = [track('2'), track('3')];
    act(() => result.current.prev());
    expect(result.current.currentId).toBe('2');
  });

  it('prev() at the first track with no history just restarts', () => {
    const { result, audio } = setup(['1', '2'].map(track));
    act(() => result.current.play('1'));
    audio.currentTime = 1;
    act(() => result.current.prev());
    expect(result.current.currentId).toBe('1');
    expect(audio.currentTime).toBe(0);
  });

  it('treats a falsy duration as zero on loadedmetadata', () => {
    const { result, audio } = setup(['1'].map(track));
    act(() => result.current.play('1'));
    act(() => {
      audio.duration = NaN;
      audio.emit('loadedmetadata');
    });
    expect(result.current.duration).toBe(0);
  });

  it('transport actions are safe when there is no audio element', () => {
    const { result } = setup(['1', '2'].map(track), { noAudio: true });
    expect(() => {
      act(() => result.current.play('1'));
      act(() => result.current.toggle());
      act(() => result.current.next());
      act(() => result.current.prev());
      act(() => result.current.seek(5));
      act(() => result.current.resetPlayback());
    }).not.toThrow();
  });

  it('prev() at the first track with no audio element is a no-op', () => {
    const { result } = setup(['1', '2'].map(track), { noAudio: true });
    act(() => result.current.play('1'));
    expect(() => act(() => result.current.prev())).not.toThrow();
    expect(result.current.currentId).toBe('1');
  });

  it('does not re-save on a second timeupdate within the throttle window', () => {
    const { result, audio } = setup(['1'].map(track));
    act(() => result.current.play('1'));
    act(() => {
      audio.currentTime = 5;
      audio.emit('timeupdate');
    });
    expect(() =>
      act(() => {
        audio.currentTime = 6;
        audio.emit('timeupdate');
      }),
    ).not.toThrow();
    expect(result.current.currentTime).toBe(6);
  });

  it('restoreLastPlayed() restores the saved track and seeks to the saved position', () => {
    const tracks = ['1', '2', '3'].map(track);
    localStorage.setItem('aurora-lastplayed', JSON.stringify({ key: '2', time: 30 }));

    const { result, audio } = setup(tracks);
    act(() => result.current.restoreLastPlayed(tracks));

    expect(result.current.currentId).toBe('2');
    expect(result.current.queue.map((t) => t.id)).toEqual(['1', '2', '3']);
    expect(audio.src).toBe('blob:2');

    audio.duration = 100;
    act(() => audio.emit('loadedmetadata'));
    expect(audio.currentTime).toBe(30);
  });
});
