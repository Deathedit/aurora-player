// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { createRef } from 'react';
import { useVolumeWheel } from '@/hooks/useVolumeWheel';

vi.mock('@/hooks/useIsDesktop', () => ({ useIsDesktop: vi.fn(() => true) }));
vi.mock('@/contexts/player-context', () => ({ usePlayer: vi.fn() }));

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePlayer } from '@/contexts/player-context';

let setVolume: ReturnType<typeof vi.fn>;

function mount(volume: number, enabled = true) {
  vi.mocked(usePlayer).mockReturnValue({ volume, setVolume } as unknown as ReturnType<typeof usePlayer>);
  const el = document.createElement('div');
  document.body.appendChild(el);
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement }).current = el;
  const view = renderHook(({ en }) => useVolumeWheel(ref, en), { initialProps: { en: enabled } });
  return { el, ...view };
}

const wheel = (deltaY: number) => new WheelEvent('wheel', { deltaY, cancelable: true });

beforeEach(() => {
  setVolume = vi.fn();
  vi.mocked(useIsDesktop).mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('useVolumeWheel', () => {
  it('raises volume by 0.05 on scroll up and lowers on scroll down', () => {
    const { el } = mount(0.5);
    el.dispatchEvent(wheel(-10));
    expect(setVolume).toHaveBeenCalledWith(0.55);

    el.dispatchEvent(wheel(10));
    expect(setVolume).toHaveBeenCalledWith(0.45);
  });

  it('clamps volume within [0, 1]', () => {
    const up = mount(0.98);
    up.el.dispatchEvent(wheel(-10));
    expect(setVolume).toHaveBeenCalledWith(1);
    cleanup();

    const down = mount(0.02);
    down.el.dispatchEvent(wheel(10));
    expect(setVolume).toHaveBeenCalledWith(0);
  });

  it('does nothing when not on desktop', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false);
    const { el } = mount(0.5);
    el.dispatchEvent(wheel(-10));
    expect(setVolume).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const { el } = mount(0.5, false);
    el.dispatchEvent(wheel(-10));
    expect(setVolume).not.toHaveBeenCalled();
  });

  it('does nothing when the ref has no element', () => {
    vi.mocked(usePlayer).mockReturnValue({ volume: 0.5, setVolume } as unknown as ReturnType<typeof usePlayer>);
    const ref = createRef<HTMLElement>();
    expect(() => renderHook(() => useVolumeWheel(ref, true))).not.toThrow();
    expect(setVolume).not.toHaveBeenCalled();
  });

  it('detaches the listener on unmount', () => {
    const { el, unmount } = mount(0.5);
    unmount();
    el.dispatchEvent(wheel(-10));
    expect(setVolume).not.toHaveBeenCalled();
  });
});
