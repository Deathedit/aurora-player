import { useState, useRef, useCallback, useMemo } from 'react';
import { PlayerCtx, PlayerProgressCtx } from '@/contexts/player-context';
import { parseFiles, revokeTrack, revokeAllArt } from '@/services/library';
import type { FileEntry } from '@/services/library';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSyncedRef } from '@/hooks/useSyncedRef';
import { usePlaybackEngine } from '@/hooks/usePlaybackEngine';
import { useArtColor } from '@/hooks/useArtColor';
import { useMediaSession } from '@/hooks/useMediaSession';
import type { Track, RepeatMode } from '@/types';
import type { ReactNode } from 'react';

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Track[]>([]);
  const [volume, setVolumeState] = useLocalStorage<number>('volume', 0.8);
  const [repeat, setRepeat] = useLocalStorage<RepeatMode>('repeat', 'off');
  const [shuffle, setShuffle] = useLocalStorage<boolean>('shuffle', false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const libraryRef = useSyncedRef(library);
  const repeatRef = useSyncedRef(repeat);
  const shuffleRef = useSyncedRef(shuffle);

  const engine = usePlaybackEngine({ audioRef, libraryRef, repeatRef, shuffleRef, volume });
  const { restoreLastPlayed, resetPlayback } = engine;

  const addFiles = useCallback(
    async (entries: FileEntry[]) => {
      const tracks = await parseFiles(entries, (batch) => {
        setLibrary((prev) => [...prev, ...batch]);
      });
      restoreLastPlayed(tracks);
    },
    [restoreLastPlayed],
  );

  const addTracks = useCallback((tracks: Track[]) => {
    setLibrary((prev) => [...prev, ...tracks]);
  }, []);

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
    },
    [setVolumeState],
  );

  const clearLibrary = useCallback(() => {
    libraryRef.current.forEach(revokeTrack);
    revokeAllArt();
    setLibrary([]);
    resetPlayback();
  }, [libraryRef, resetPlayback]);

  const current = useMemo(() => library.find((t) => t.id === engine.currentId) ?? null, [library, engine.currentId]);

  useArtColor(current);
  useMediaSession(current, engine.toggle, engine.next, engine.prev);

  const value = useMemo(
    () => ({
      library,
      currentId: engine.currentId,
      isPlaying: engine.isPlaying,
      volume,
      repeat,
      shuffle,
      queue: engine.queue,
      addFiles,
      addTracks,
      restorePlayback: restoreLastPlayed,
      play: engine.play,
      toggle: engine.toggle,
      next: engine.next,
      prev: engine.prev,
      seek: engine.seek,
      setVolume,
      setRepeat,
      setShuffle,
      clearLibrary,
    }),
    [
      library,
      engine.currentId,
      engine.isPlaying,
      engine.queue,
      engine.play,
      engine.toggle,
      engine.next,
      engine.prev,
      engine.seek,
      volume,
      repeat,
      shuffle,
      addFiles,
      addTracks,
      restoreLastPlayed,
      setVolume,
      setRepeat,
      setShuffle,
      clearLibrary,
    ],
  );

  const progress = useMemo(
    () => ({ currentTime: engine.currentTime, duration: engine.duration }),
    [engine.currentTime, engine.duration],
  );

  return (
    <PlayerCtx.Provider value={value}>
      <PlayerProgressCtx.Provider value={progress}>
        <audio ref={audioRef} />
        {children}
      </PlayerProgressCtx.Provider>
    </PlayerCtx.Provider>
  );
}
