// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
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
});
