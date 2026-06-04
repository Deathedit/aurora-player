// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { RefObject } from 'react';
import { useAudioGain } from '@/hooks/useAudioGain';
import { createMockAudio } from './mock-audio';

function stubAudioContext() {
  const gain = { gain: { value: 1, setTargetAtTime: vi.fn() } };
  const source = { connect: vi.fn(() => gain) };
  const ctx = {
    currentTime: 0,
    destination: {},
    createMediaElementSource: vi.fn(() => source),
    createGain: vi.fn(() => gain),
    resume: vi.fn(),
  };
  Object.assign(gain, { connect: vi.fn(() => ctx.destination) });
  const ctor = vi.fn(function () {
    return ctx;
  });
  (window as unknown as { AudioContext: unknown }).AudioContext = ctor;
  return { ctx, gain, source, ctor };
}

function setup(volume: number) {
  const audio = createMockAudio();
  const audioRef: RefObject<HTMLAudioElement | null> = { current: audio as unknown as HTMLAudioElement };
  const view = renderHook(({ v }) => useAudioGain(audioRef, v), { initialProps: { v: volume } });
  return { audio, ...view };
}

afterEach(() => {
  cleanup();
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
});

describe('useAudioGain', () => {
  it('falls back to el.volume before the graph exists', () => {
    const { audio, rerender } = setup(0.5);
    expect(audio.volume).toBe(0.5);
    act(() => rerender({ v: 0.2 }));
    expect(audio.volume).toBe(0.2);
  });

  it('builds the graph once on play, resumes the context, and controls gain', () => {
    const { ctx, gain, source } = stubAudioContext();
    const { audio, rerender } = setup(0.5);

    act(() => audio.emit('play'));
    expect(ctx.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(source.connect).toHaveBeenCalledWith(gain);
    expect(gain.gain.value).toBe(0.5);
    expect(audio.volume).toBe(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);

    act(() => audio.emit('play'));
    expect(ctx.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(ctx.resume).toHaveBeenCalledTimes(2);

    act(() => rerender({ v: 0.3 }));
    expect(gain.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.3, 0, 0.01);
  });
});
