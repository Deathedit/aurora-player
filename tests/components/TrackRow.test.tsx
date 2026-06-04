// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { TrackRow } from '@/components/library/TrackRow';
import type { Track } from '@/types';

const track = (id: string, over: Partial<Track> = {}): Track => ({
  id,
  url: `blob:${id}`,
  title: `Title ${id}`,
  artist: `Artist ${id}`,
  album: 'al',
  durationSec: 65,
  ...over,
});

const noopPlayer = { play: vi.fn(), toggle: vi.fn() };

afterEach(cleanup);

describe('TrackRow', () => {
  it('renders as a focusable button showing title and artist', () => {
    renderWithPlayer(<TrackRow track={track('1')} index={0} />, {
      player: { currentId: null, isPlaying: false, ...noopPlayer },
    });
    const row = screen.getByRole('button');
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(screen.getByText('Title 1')).toBeTruthy();
    expect(screen.getByText('Artist 1')).toBeTruthy();
  });

  it('plays the track on click, Enter, and Space when it is not current', () => {
    const play = vi.fn();
    const toggle = vi.fn();
    renderWithPlayer(<TrackRow track={track('1')} index={0} />, {
      player: { currentId: null, isPlaying: false, play, toggle },
    });
    const row = screen.getByRole('button');

    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });

    expect(play).toHaveBeenCalledTimes(3);
    expect(play).toHaveBeenCalledWith('1');
    expect(toggle).not.toHaveBeenCalled();
  });

  it('toggles play/pause when it is the current track', () => {
    const play = vi.fn();
    const toggle = vi.fn();
    renderWithPlayer(<TrackRow track={track('1')} index={0} />, {
      player: { currentId: '1', isPlaying: true, play, toggle },
    });

    fireEvent.click(screen.getByRole('button'));
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(play).not.toHaveBeenCalled();
  });

  it('ignores keys other than Enter and Space', () => {
    const play = vi.fn();
    const toggle = vi.fn();
    renderWithPlayer(<TrackRow track={track('1')} index={0} />, {
      player: { currentId: null, isPlaying: false, play, toggle },
    });

    fireEvent.keyDown(screen.getByRole('button'), { key: 'a' });
    expect(play).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();
  });

  it('shows the pause icon when current but paused', () => {
    const { container } = renderWithPlayer(<TrackRow track={track('1')} index={0} />, {
      player: { currentId: '1', isPlaying: false, ...noopPlayer },
    });
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders cover art when the track has an artUrl', () => {
    renderWithPlayer(<TrackRow track={track('1', { artUrl: 'blob:art' })} index={0} />, {
      player: { currentId: null, isPlaying: false, ...noopPlayer },
    });
    const img = document.querySelector('img');
    expect(img?.getAttribute('src')).toBe('blob:art');
  });
});
