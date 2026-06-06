// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, screen, fireEvent } from '@testing-library/react';
import { renderWithPlayer } from '../components/render-with-player';
import type { Track } from '@/types';
import type { PlayerContextType } from '@/contexts/player-context';

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: { data: Track[]; itemContent: (i: number, item: Track) => React.ReactNode }) => (
    <div>{data.map((item, i) => itemContent(i, item))}</div>
  ),
}));

vi.mock('@/contexts/library-source-context', () => ({ useLibrarySource: vi.fn() }));

import { Library } from '@/pages/Library';
import { useLibrarySource } from '@/contexts/library-source-context';

type LibrarySource = ReturnType<typeof useLibrarySource>;

const track = (over: Partial<Track> = {}): Track => ({
  id: '1',
  url: 'blob:1',
  title: 'Title',
  artist: 'Artist',
  album: 'Album',
  durationSec: 60,
  ...over,
});

const scrollParent = () => document.createElement('div');

const player = (library: Track[]): Partial<PlayerContextType> => ({
  library,
  currentId: null,
  isPlaying: false,
  play: vi.fn(),
  toggle: vi.fn(),
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Library page', () => {
  it('shows the local empty-state message when the library is empty', () => {
    vi.mocked(useLibrarySource).mockReturnValue({ mode: 'local' } as LibrarySource);
    renderWithPlayer(<Library scrollParent={scrollParent()} />, { player: player([]) });

    expect(screen.getByText('Library')).toBeTruthy();
    expect(screen.getByText(/connect a folder/i)).toBeTruthy();
  });

  it('shows the server empty-state message in backend mode', () => {
    vi.mocked(useLibrarySource).mockReturnValue({ mode: 'backend' } as LibrarySource);
    renderWithPlayer(<Library scrollParent={scrollParent()} />, { player: player([]) });

    expect(screen.getByText('No music found on the server')).toBeTruthy();
  });

  it('sorts by artist, then album, then title and renders the rows', () => {
    vi.mocked(useLibrarySource).mockReturnValue({ mode: 'local' } as LibrarySource);
    const lib = [
      track({ id: 'a', artist: 'B', album: 'X', title: 'Song' }),
      track({ id: 'b', artist: 'A', album: 'M', title: 'Two' }),
      track({ id: 'c', artist: 'A', album: 'M', title: 'One' }),
      track({ id: 'd', artist: 'A', album: 'N', title: 'Three' }),
    ];
    renderWithPlayer(<Library scrollParent={scrollParent()} />, { player: player(lib) });

    expect(screen.getByText('4 tracks')).toBeTruthy();
    expect(screen.getByText('One')).toBeTruthy();
    expect(screen.getByText('Two')).toBeTruthy();
    expect(screen.getByText('Three')).toBeTruthy();
  });

  it('reveals the search box on Ctrl+K and filters by title, restoring on Escape', () => {
    vi.mocked(useLibrarySource).mockReturnValue({ mode: 'local' } as LibrarySource);
    const lib = [track({ id: 'a', title: 'Bohemian Rhapsody' }), track({ id: 'b', title: 'Stairway to Heaven' })];
    renderWithPlayer(<Library scrollParent={scrollParent()} />, { player: player(lib) });

    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByPlaceholderText(/search/i);

    fireEvent.keyDown(input, { key: 'a' });
    fireEvent.change(input, { target: { value: 'bohem' } });
    expect(screen.getByText('Bohemian Rhapsody')).toBeTruthy();
    expect(screen.queryByText('Stairway to Heaven')).toBeNull();
    expect(screen.getByText('1 tracks')).toBeTruthy();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
    expect(screen.getByText('Bohemian Rhapsody')).toBeTruthy();
    expect(screen.getByText('Stairway to Heaven')).toBeTruthy();
    expect(screen.getByText('2 tracks')).toBeTruthy();
  });

  it('also opens with Meta+K', () => {
    vi.mocked(useLibrarySource).mockReturnValue({ mode: 'local' } as LibrarySource);
    renderWithPlayer(<Library scrollParent={scrollParent()} />, { player: player([track()]) });

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();
  });
});
