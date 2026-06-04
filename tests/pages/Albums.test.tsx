// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from '../components/render-with-player';
import type { Track } from '@/types';
import type { PlayerContextType } from '@/contexts/player-context';

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: { data: Track[]; itemContent: (i: number, item: Track) => React.ReactNode }) => (
    <div>{data.map((item, i) => itemContent(i, item))}</div>
  ),
}));

import { Albums } from '@/pages/Albums';

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
  localStorage.clear();
});

describe('Albums page', () => {
  it('shows the empty-state message when there are no albums', () => {
    renderWithPlayer(<Albums scrollParent={scrollParent()} />, { player: player([]) });
    expect(screen.getByText('Albums')).toBeTruthy();
    expect(screen.getByText(/add music first/i)).toBeTruthy();
  });

  it('groups tracks by folder or album and renders the grid by default', () => {
    const lib = [
      track({ id: '1', folder: 'Rock/Best Of', title: 'A' }),
      track({ id: '2', folder: 'Rock/Best Of', title: 'B' }),
      track({ id: '3', album: 'Loose Tracks', title: 'C' }),
    ];
    renderWithPlayer(<Albums scrollParent={scrollParent()} />, { player: player(lib) });

    expect(screen.getByText('Best Of')).toBeTruthy();
    expect(screen.getByText('Loose Tracks')).toBeTruthy();
  });

  it('toggles between grid and list views and persists the choice', () => {
    const lib = [track({ id: '1', folder: 'Rock/Best Of' })];
    renderWithPlayer(<Albums scrollParent={scrollParent()} />, { player: player(lib) });

    const [gridToggle, listToggle] = screen.getAllByRole('button');
    fireEvent.click(listToggle);
    expect(localStorage.getItem('aurora-albumView')).toBe(JSON.stringify('list'));

    fireEvent.click(gridToggle);
    expect(localStorage.getItem('aurora-albumView')).toBe(JSON.stringify('grid'));
  });

  it('opens an album detail from the list view', () => {
    const lib = [track({ id: '1', folder: 'Rock/Best Of', title: 'Deep Cut' })];
    renderWithPlayer(<Albums scrollParent={scrollParent()} />, { player: player(lib) });

    const [, listToggle] = screen.getAllByRole('button');
    fireEvent.click(listToggle);
    fireEvent.click(screen.getByText('Best Of'));
    expect(screen.getByText('← All Albums')).toBeTruthy();
  });

  it('opens an album detail and navigates back to the list', () => {
    const lib = [track({ id: '1', folder: 'Rock/Best Of', title: 'Deep Cut' })];
    renderWithPlayer(<Albums scrollParent={scrollParent()} />, {
      player: player(lib),
    });

    fireEvent.click(screen.getByText('Best Of'));
    expect(screen.getByText('Deep Cut')).toBeTruthy();

    fireEvent.click(screen.getByText('← All Albums'));
    expect(screen.getByText('Best Of')).toBeTruthy();
  });
});
