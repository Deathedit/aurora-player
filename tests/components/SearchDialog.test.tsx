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
      Backdrop: Pass,
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

  it('moves the highlight with arrow keys and plays the selection on Enter', () => {
    const play = vi.fn();
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player({ play }) });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'a' } });

    const rowOf = (title: string) => screen.getByText(title).closest('[role="button"]')!;
    expect(rowOf('Bohemian Rhapsody').getAttribute('aria-selected')).toBe('true');
    expect(rowOf('Stairway to Heaven').getAttribute('aria-selected')).toBe('false');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(rowOf('Stairway to Heaven').getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(rowOf('Stairway to Heaven').getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(rowOf('Bohemian Rhapsody').getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(play).toHaveBeenCalledWith('a');
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
  });

  it('ignores Enter and other keys in the input when there are no matches', () => {
    const play = vi.fn();
    renderWithPlayer(<SearchDialog tracks={lib} />, { player: player({ play }) });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'zzz' } });

    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'x' });
    expect(play).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();
  });

  it('ignores Ctrl+K while NowPlaying is fullscreen', () => {
    renderWithPlayer(<SearchDialog tracks={lib} nowPlayingOpen />, { player: player() });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
  });
});
