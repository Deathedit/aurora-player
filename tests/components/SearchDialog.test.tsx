// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import type { Track } from '@/types';
import type { PlayerContextType } from '@/contexts/player-context';

vi.mock('@chakra-ui/react', async (orig) => {
  const actual = await orig<typeof import('@chakra-ui/react')>();
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ...actual,
    Portal: Pass,
    Dialog: {
      Root: ({
        open,
        children,
        onOpenChange,
      }: {
        open: boolean;
        children?: ReactNode;
        onOpenChange: (e: { open: boolean }) => void;
      }) =>
        open ? (
          <div role="dialog">
            <button data-testid="dialog-dismiss" onClick={() => onOpenChange({ open: false })} />
            <button data-testid="dialog-noop" onClick={() => onOpenChange({ open: true })} />
            {children}
          </div>
        ) : null,
      Positioner: Pass,
      Content: Pass,
      Title: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
  };
});

import { SearchDialog } from '@/components/library/SearchDialog';

const track = (over: Partial<Track> = {}): Track => ({
  id: '1',
  url: 'blob:1',
  title: 'Title',
  artist: 'Artist',
  album: 'Album',
  durationSec: 60,
  ...over,
});

const player = (extra: Partial<PlayerContextType> = {}): Partial<PlayerContextType> => ({
  currentId: null,
  isPlaying: false,
  play: vi.fn(),
  toggle: vi.fn(),
  ...extra,
});

const lib = [track({ id: 'a', title: 'Bohemian Rhapsody' }), track({ id: 'b', title: 'Stairway to Heaven' })];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SearchDialog', () => {
  it('opens on Ctrl+K and filters by title', () => {
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player() });

    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByPlaceholderText(/search/i);
    expect(screen.queryByText('Bohemian Rhapsody')).toBeNull();

    fireEvent.change(input, { target: { value: 'bohem' } });
    expect(screen.getByText('Bohemian Rhapsody')).toBeTruthy();
    expect(screen.queryByText('Stairway to Heaven')).toBeNull();
  });

  it('also opens on Meta+K', () => {
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player() });
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();
  });

  it('shows a no-results message when nothing matches', () => {
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player() });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'zzz' } });
    expect(screen.getByText('No matching titles')).toBeTruthy();
  });

  it('plays a result on click and closes', () => {
    const play = vi.fn();
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player({ play }) });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'bohem' } });

    fireEvent.click(screen.getByText('Bohemian Rhapsody'));
    expect(play).toHaveBeenCalledWith('a');
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
  });

  it('closes and clears the query on Enter, ignoring other keys', () => {
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player() });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'bohem' } });

    const row = screen.getByText('Bohemian Rhapsody');
    fireEvent.keyDown(row, { key: 'a' });
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect((screen.getByPlaceholderText(/search/i) as HTMLInputElement).value).toBe('');
  });

  it('closes on Space activation', () => {
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player() });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'bohem' } });

    fireEvent.keyDown(screen.getByText('Bohemian Rhapsody'), { key: ' ' });
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
  });

  it('closes via the backdrop/Esc path and ignores spurious open events', () => {
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player() });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    fireEvent.click(screen.getByTestId('dialog-noop'));
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();

    fireEvent.click(screen.getByTestId('dialog-dismiss'));
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
  });

  it('ignores Ctrl+K while NowPlaying is fullscreen', () => {
    renderWithPlayer(<SearchDialog tracks={lib} nowPlayingOpen />, { player: player() });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
  });
});
