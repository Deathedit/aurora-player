// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { PlayerProvider } from '@/components/PlayerProvider';
import { usePlayer } from '@/contexts/player-context';
import type { Track } from '@/types';
import type { FileEntry } from '@/services/library';

vi.mock('@/services/library', () => ({
  parseFiles: vi.fn(),
  revokeTrack: vi.fn(),
  revokeAllArt: vi.fn(),
  extractArtColor: vi.fn().mockResolvedValue(undefined),
  getArtColor: vi.fn(),
  setArtColor: vi.fn(),
  cacheColor: vi.fn(),
}));

import { parseFiles, revokeTrack, revokeAllArt } from '@/services/library';

const track = (id: string): Track => ({ id, url: `blob:${id}`, title: id, artist: 'a', album: 'b', durationSec: 1 });

function Harness() {
  const { library, volume, addTracks, addFiles, clearLibrary, setVolume } = usePlayer();
  return (
    <div>
      <span data-testid="count">{library.length}</span>
      <span data-testid="ids">{library.map((t) => t.id).join(',')}</span>
      <span data-testid="volume">{volume}</span>
      <button onClick={() => addTracks([track('a'), track('b')])}>addTracks</button>
      <button onClick={() => void addFiles([{ file: new File([], 'x.mp3') } as FileEntry])}>addFiles</button>
      <button onClick={() => clearLibrary()}>clear</button>
      <button onClick={() => setVolume(0.3)}>setVolume</button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <PlayerProvider>
      <Harness />
    </PlayerProvider>,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('PlayerProvider', () => {
  it('addTracks appends tracks to the library', () => {
    renderProvider();
    expect(screen.getByTestId('count').textContent).toBe('0');

    fireEvent.click(screen.getByText('addTracks'));
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('ids').textContent).toBe('a,b');
  });

  it('addFiles streams parsed batches into the library via onBatch', async () => {
    vi.mocked(parseFiles).mockImplementation(async (_entries, onBatch) => {
      const tracks = [track('p1'), track('p2')];
      onBatch?.(tracks);
      return tracks;
    });

    renderProvider();
    await act(async () => {
      fireEvent.click(screen.getByText('addFiles'));
    });

    await waitFor(() => expect(screen.getByTestId('ids').textContent).toBe('p1,p2'));
    expect(parseFiles).toHaveBeenCalledTimes(1);
  });

  it('setVolume updates the exposed volume', () => {
    renderProvider();
    expect(screen.getByTestId('volume').textContent).toBe('0.8');

    fireEvent.click(screen.getByText('setVolume'));
    expect(screen.getByTestId('volume').textContent).toBe('0.3');
  });

  it('clearLibrary revokes every track plus all art and empties the library', () => {
    renderProvider();
    fireEvent.click(screen.getByText('addTracks'));
    expect(screen.getByTestId('count').textContent).toBe('2');

    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(revokeTrack).toHaveBeenCalledTimes(2);
    expect(revokeAllArt).toHaveBeenCalledTimes(1);
  });
});
