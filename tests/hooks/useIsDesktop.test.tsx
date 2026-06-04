// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useIsDesktop } from '@/hooks/useIsDesktop';

type Listener = () => void;

function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
  };
  window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList);
  return {
    set(v: boolean) {
      matches = v;
      listeners.forEach((cb) => cb());
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(cleanup);

describe('useIsDesktop', () => {
  it('reflects the initial match and updates on change events', () => {
    const mq = stubMatchMedia(true);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);

    act(() => mq.set(false));
    expect(result.current).toBe(false);
  });

  it('removes its listener on unmount', () => {
    const mq = stubMatchMedia(false);
    const { unmount } = renderHook(() => useIsDesktop());
    expect(mq.listenerCount()).toBe(1);
    unmount();
    expect(mq.listenerCount()).toBe(0);
  });
});
