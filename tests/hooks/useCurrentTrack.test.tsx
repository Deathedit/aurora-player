// @vitest-environment happy-dom
import { afterEach, describe, it, expect } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PlayerCtx } from '@/contexts/player-context';
import type { PlayerContextType } from '@/contexts/player-context';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import type { Track } from '@/types';

const track = (id: string): Track => ({ id, url: `blob:${id}`, title: id, artist: 'a', album: 'b', durationSec: 1 });

function wrapper(library: Track[], currentId: string | null) {
  const value = { library, currentId } as unknown as PlayerContextType;
  return ({ children }: { children: ReactNode }) => <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

afterEach(cleanup);

describe('useCurrentTrack', () => {
  it('returns the track matching currentId', () => {
    const lib = ['1', '2', '3'].map(track);
    const { result } = renderHook(() => useCurrentTrack(), { wrapper: wrapper(lib, '2') });
    expect(result.current?.id).toBe('2');
  });

  it('returns null when nothing is current or no match exists', () => {
    const lib = ['1'].map(track);
    expect(renderHook(() => useCurrentTrack(), { wrapper: wrapper(lib, null) }).result.current).toBeNull();
    expect(renderHook(() => useCurrentTrack(), { wrapper: wrapper(lib, 'missing') }).result.current).toBeNull();
  });
});
