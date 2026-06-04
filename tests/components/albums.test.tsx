// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { AlbumGridItem } from '@/components/albums/AlbumGridItem';
import { AlbumListRow } from '@/components/albums/AlbumListRow';
import { AlbumDetail } from '@/components/albums/AlbumDetail';
import type { AlbumGroup } from '@/components/albums/types';
import type { Track } from '@/types';

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: { data: Track[]; itemContent: (i: number, item: Track) => React.ReactNode }) => (
    <div>{data.map((item, i) => itemContent(i, item))}</div>
  ),
}));

const track = (id: string): Track => ({
  id,
  url: `blob:${id}`,
  title: `Title ${id}`,
  artist: 'a',
  album: 'al',
  durationSec: 60,
});

const album = (over: Partial<AlbumGroup> = {}): AlbumGroup => ({
  key: 'al',
  displayName: 'Greatest Hits',
  tracks: [track('1'), track('2')],
  ...over,
});

afterEach(cleanup);

describe('AlbumGridItem', () => {
  it('renders cover art and fires onSelect on click', () => {
    const onSelect = vi.fn();
    renderWithPlayer(<AlbumGridItem album={album({ artUrl: 'blob:art' })} onSelect={onSelect} />);
    expect(document.querySelector('img')?.getAttribute('src')).toBe('blob:art');
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('falls back to a placeholder when there is no art', () => {
    renderWithPlayer(<AlbumGridItem album={album()} onSelect={vi.fn()} />);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('Greatest Hits')).toBeTruthy();
  });
});

describe('AlbumListRow', () => {
  it('renders cover art, the track count, and fires onSelect', () => {
    const onSelect = vi.fn();
    renderWithPlayer(<AlbumListRow album={album({ artUrl: 'blob:art' })} onSelect={onSelect} />);
    expect(document.querySelector('img')?.getAttribute('src')).toBe('blob:art');
    expect(screen.getByText(/2 tracks/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('falls back to a placeholder when there is no art', () => {
    renderWithPlayer(<AlbumListRow album={album()} onSelect={vi.fn()} />);
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('AlbumDetail', () => {
  it('renders the album header, its tracks, and a working back button', () => {
    const onBack = vi.fn();
    const scrollParent = document.createElement('div');
    renderWithPlayer(<AlbumDetail album={album()} scrollParent={scrollParent} onBack={onBack} />, {
      player: { currentId: null, isPlaying: false, play: vi.fn(), toggle: vi.fn() },
    });

    expect(screen.getByText('Greatest Hits')).toBeTruthy();
    expect(screen.getByText('Title 1')).toBeTruthy();
    expect(screen.getByText('Title 2')).toBeTruthy();

    fireEvent.click(screen.getByText('← All Albums'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
