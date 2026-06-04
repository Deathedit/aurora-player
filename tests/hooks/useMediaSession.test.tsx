// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useMediaSession } from '@/hooks/useMediaSession';
import type { Track } from '@/types';

const track = (over: Partial<Track> = {}): Track => ({
  id: '1',
  url: 'blob:1',
  title: 'Song',
  artist: 'Artist',
  album: 'Album',
  durationSec: 1,
  ...over,
});

class FakeMediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: unknown[];
  constructor(init: Record<string, unknown>) {
    Object.assign(this, init);
  }
}

let handlers: Record<string, (() => void) | null>;
let session: { metadata: unknown; setActionHandler: ReturnType<typeof vi.fn> };

beforeEach(() => {
  handlers = {};
  session = {
    metadata: undefined,
    setActionHandler: vi.fn((action: string, cb: (() => void) | null) => {
      handlers[action] = cb;
    }),
  };
  vi.stubGlobal('MediaMetadata', FakeMediaMetadata);
  Object.defineProperty(navigator, 'mediaSession', { value: session, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete (navigator as { mediaSession?: unknown }).mediaSession;
});

const render = (t: Track | null, fns?: { toggle?: () => void; next?: () => void; prev?: () => void }) =>
  renderHook(() => useMediaSession(t, fns?.toggle ?? vi.fn(), fns?.next ?? vi.fn(), fns?.prev ?? vi.fn()));

describe('useMediaSession', () => {
  it('sets metadata with artwork and wires action handlers', () => {
    const toggle = vi.fn();
    const next = vi.fn();
    const prev = vi.fn();
    render(track({ artUrl: 'blob:art', artType: 'image/png' }), { toggle, next, prev });

    const md = session.metadata as FakeMediaMetadata;
    expect(md.title).toBe('Song');
    expect(md.artwork).toEqual([{ src: 'blob:art', sizes: '512x512', type: 'image/png' }]);

    handlers.play?.();
    handlers.pause?.();
    handlers.nexttrack?.();
    handlers.previoustrack?.();
    expect(toggle).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(prev).toHaveBeenCalledTimes(1);
  });

  it('defaults the artwork type to image/jpeg when artType is absent', () => {
    render(track({ artUrl: 'blob:art' }));
    const md = session.metadata as FakeMediaMetadata;
    expect(md.artwork).toEqual([{ src: 'blob:art', sizes: '512x512', type: 'image/jpeg' }]);
  });

  it('uses an empty artwork list when the track has no art', () => {
    render(track());
    expect((session.metadata as FakeMediaMetadata).artwork).toEqual([]);
  });

  it('sets metadata to null when there is no current track', () => {
    render(null);
    expect(session.metadata).toBeNull();
  });

  it('is a no-op when mediaSession is unsupported', () => {
    delete (navigator as { mediaSession?: unknown }).mediaSession;
    expect(() => render(track())).not.toThrow();
  });
});
