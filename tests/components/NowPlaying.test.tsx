// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { NowPlaying } from '@/components/player/NowPlaying';
import type { Track } from '@/types';
import type { PlayerContextType } from '@/contexts/player-context';

vi.mock('@/hooks/useIsDesktop', () => ({ useIsDesktop: vi.fn(() => true) }));

vi.mock('@chakra-ui/react', async (orig) => {
  const actual = await orig<typeof import('@chakra-ui/react')>();
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ...actual,
    Portal: Pass,
    Dialog: {
      Root: ({ children, onOpenChange }: { children?: ReactNode; onOpenChange: (e: { open: boolean }) => void }) => (
        <div role="dialog">
          <button data-testid="dialog-dismiss" onClick={() => onOpenChange({ open: false })} />
          {children}
        </div>
      ),
      Positioner: Pass,
      Content: Pass,
      CloseTrigger: Pass,
      Title: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
      Description: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
    },
  };
});

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

describe('NowPlaying', () => {
  it('renders nothing when there is no current track', () => {
    const { container } = renderWithPlayer(<NowPlaying open onClose={vi.fn()} />, {
      player: playerWith(null),
    });
    expect(container.textContent).toBe('');
    expect(screen.queryByText('Song One')).toBeNull();
  });

  it('shows the current track and wires the transport + close controls', () => {
    const toggle = vi.fn();
    const next = vi.fn();
    const prev = vi.fn();
    const onClose = vi.fn();
    renderWithPlayer(<NowPlaying open onClose={onClose} />, {
      player: playerWith(track({ artUrl: 'blob:art' }), { isPlaying: true, toggle, next, prev }),
      progress: { currentTime: 10, duration: 100 },
    });

    expect(screen.getByText('Song One')).toBeTruthy();
    expect(screen.getByText('The Artist')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Previous track'));
    fireEvent.click(screen.getByLabelText('Next track'));
    fireEvent.click(screen.getByLabelText('Pause'));
    fireEvent.click(screen.getByTestId('dialog-dismiss'));

    expect(prev).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a placeholder and Play affordance when paused without art', () => {
    renderWithPlayer(<NowPlaying open onClose={vi.fn()} />, {
      player: playerWith(track({ artUrl: undefined }), { isPlaying: false }),
      progress: { currentTime: 0, duration: 100 },
    });
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });
});
