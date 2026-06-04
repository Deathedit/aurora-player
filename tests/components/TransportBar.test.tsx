// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { TransportBar } from '@/components/player/TransportBar';
import type { Track } from '@/types';
import type { PlayerContextType } from '@/contexts/player-context';

vi.mock('@/hooks/useIsDesktop', () => ({ useIsDesktop: vi.fn(() => true) }));
import { useIsDesktop } from '@/hooks/useIsDesktop';

const track = (over: Partial<Track> = {}): Track => ({
  id: '1',
  url: 'blob:1',
  title: 'Song One',
  artist: 'The Artist',
  album: 'al',
  durationSec: 100,
  ...over,
});

const playerWith = (current: Track | null, extra: Partial<PlayerContextType> = {}): Partial<PlayerContextType> => ({
  library: current ? [current] : [],
  currentId: current ? current.id : null,
  isPlaying: false,
  volume: 0.5,
  setVolume: vi.fn(),
  toggle: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
  seek: vi.fn(),
  ...extra,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TransportBar', () => {
  it('shows the current track art and wires the transport buttons (desktop)', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true);
    const toggle = vi.fn();
    const next = vi.fn();
    const prev = vi.fn();
    const onNowPlaying = vi.fn();
    renderWithPlayer(<TransportBar onNowPlaying={onNowPlaying} nowPlayingOpen={false} />, {
      player: playerWith(track({ artUrl: 'blob:art' }), { isPlaying: true, toggle, next, prev }),
      progress: { currentTime: 10, duration: 100 },
    });

    expect(screen.getByText('Song One')).toBeTruthy();
    expect(document.querySelector('img')?.getAttribute('src')).toBe('blob:art');

    fireEvent.click(screen.getByLabelText('Previous track'));
    fireEvent.click(screen.getByLabelText('Next track'));
    fireEvent.click(screen.getByLabelText('Pause'));
    fireEvent.click(screen.getAllByLabelText('Open now playing')[0]);

    expect(prev).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(onNowPlaying).toHaveBeenCalled();
  });

  it('shows placeholders when there is no current track', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true);
    renderWithPlayer(<TransportBar />, { player: playerWith(null), progress: { currentTime: 0, duration: 0 } });
    expect(screen.getByLabelText('Play')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(document.querySelector('img')).toBeNull();
  });

  it('hides the cover art on mobile while the now-playing overlay is open', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false);
    renderWithPlayer(<TransportBar onNowPlaying={vi.fn()} nowPlayingOpen />, {
      player: playerWith(track({ artUrl: 'blob:art' })),
      progress: { currentTime: 0, duration: 100 },
    });
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });
});
