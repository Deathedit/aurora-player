// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { LibrarySourceProvider } from '@/components/LibrarySourceProvider';
import { useLibrarySource } from '@/contexts/library-source-context';
import { checkHealth, fetchTracks } from '@/services/backend';
import type { Track } from '@/types';

vi.mock('@/services/backend', () => ({
  checkHealth: vi.fn(),
  fetchTracks: vi.fn(),
  rescan: vi.fn(),
}));

const track = (id: string): Track => ({
  id,
  url: `/api/stream/${id}`,
  title: id,
  artist: 'a',
  album: 'b',
  durationSec: 1,
});

function Probe() {
  const { mode, refreshing, refresh } = useLibrarySource();
  return (
    <div>
      <span>mode:{mode}</span>
      <span>{refreshing ? 'busy' : 'idle'}</span>
      <button onClick={() => refresh()}>refresh</button>
    </div>
  );
}

function mountWith(player: Record<string, unknown>) {
  return renderWithPlayer(
    <LibrarySourceProvider>
      <Probe />
    </LibrarySourceProvider>,
    { player: { addTracks: vi.fn(), restorePlayback: vi.fn(), clearLibrary: vi.fn(), addFiles: vi.fn(), ...player } },
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LibrarySourceProvider', () => {
  it('enters backend mode, streams tracks in, and restores playback', async () => {
    vi.mocked(checkHealth).mockResolvedValue(true);
    vi.mocked(fetchTracks).mockImplementation(async (onBatch) => onBatch([track('1'), track('2')]));
    const addTracks = vi.fn();
    const restorePlayback = vi.fn();

    mountWith({ addTracks, restorePlayback });

    expect(await screen.findByText('mode:backend')).toBeTruthy();
    expect(addTracks).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1' }),
      expect.objectContaining({ id: '2' }),
    ]);
    expect(restorePlayback).toHaveBeenCalledTimes(1);
  });

  it('falls back to local mode when the backend is unreachable', async () => {
    vi.mocked(checkHealth).mockResolvedValue(false);
    mountWith({});

    expect(await screen.findByText('mode:local')).toBeTruthy();
    expect(fetchTracks).not.toHaveBeenCalled();
  });

  it('re-fetches when refresh is invoked in backend mode', async () => {
    vi.mocked(checkHealth).mockResolvedValue(true);
    vi.mocked(fetchTracks).mockImplementation(async (onBatch) => onBatch([track('1')]));
    mountWith({});

    await screen.findByText('mode:backend');
    expect(fetchTracks).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('refresh'));
    await waitFor(() => expect(fetchTracks).toHaveBeenCalledTimes(2));
  });
});
