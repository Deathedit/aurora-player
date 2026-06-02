import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PlayerCtx, PlayerProgressCtx } from '@/contexts/player-context';
import { parseFiles, revokeTrack, revokeAllArt } from '@/services/library';
import type { FileEntry } from '@/services/library';
import { buildQueue } from '@/services/queue';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePositionPersistence } from '@/hooks/usePositionPersistence';
import { useArtColor } from '@/hooks/useArtColor';
import { useMediaSession } from '@/hooks/useMediaSession';
import type { Track, RepeatMode } from '@/types';
import type { ReactNode } from 'react';

function useSyncedRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [library, setLibrary] = useState<Track[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useLocalStorage<number>('volume', 0.8);
  const [repeat, setRepeat] = useLocalStorage<RepeatMode>('repeat', 'off');
  const [shuffle, setShuffle] = useLocalStorage<boolean>('shuffle', false);
  const [queue, setQueue] = useState<Track[]>([]);

  const libraryRef = useSyncedRef(library);
  const currentIdRef = useSyncedRef(currentId);
  const queueRef = useSyncedRef(queue);
  const repeatRef = useSyncedRef(repeat);
  const shuffleRef = useSyncedRef(shuffle);
  const historyRef = useRef<string[]>([]);

  const { savePosition, restoreLastPlayed, restoringRef, restoredRef, lastSaveRef } = usePositionPersistence({
    audioRef,
    currentIdRef,
    libraryRef,
    shuffleRef,
    historyRef,
    setQueue,
    setCurrentId,
  });

  const playId = useCallback(
    (id: string) => {
      restoringRef.current = false;
      savePosition();

      const lib = libraryRef.current;
      const track = lib.find((t) => t.id === id);
      if (!track) return;
      setCurrentId(id);
      historyRef.current.push(id);
      if (historyRef.current.length > 100) {
        historyRef.current = historyRef.current.slice(-100);
      }

      setQueue(buildQueue(lib, id, shuffleRef.current));

      const el = audioRef.current;
      if (el) {
        el.src = track.url;
        el.play();
      }
    },
    [libraryRef, shuffleRef, audioRef, restoringRef, savePosition],
  );

  const addFiles = useCallback(
    async (entries: FileEntry[]) => {
      const tracks = await parseFiles(entries, (batch) => {
        setLibrary((prev) => [...prev, ...batch]);
      });
      restoreLastPlayed(tracks);
    },
    [restoreLastPlayed],
  );

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      if (!el.src && libraryRef.current.length > 0) {
        playId(libraryRef.current[0].id);
      } else {
        el.play();
      }
    } else {
      el.pause();
    }
  }, [playId, libraryRef]);

  const next = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;
    const idx = q.findIndex((t) => t.id === currentIdRef.current);
    const nextIdx = idx + 1 < q.length ? idx + 1 : 0;
    playId(q[nextIdx].id);
  }, [playId, queueRef, currentIdRef]);

  const prev = useCallback(() => {
    const el = audioRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const prevId = historyRef.current[historyRef.current.length - 1];
      const track = libraryRef.current.find((t) => t.id === prevId);
      if (!track) return;
      savePosition();
      setCurrentId(prevId);
      if (el) {
        el.src = track.url;
        el.play();
      }
      return;
    }
    if (el) el.currentTime = 0;
  }, [libraryRef, audioRef, savePosition]);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (el) el.currentTime = seconds;
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
    setCurrentId(null);
    setQueue([]);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    historyRef.current = [];
    restoredRef.current = false;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = '';
    }
  }, [libraryRef, restoredRef]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      setCurrentTime(el.currentTime);
      const now = Date.now();
      if (now - lastSaveRef.current > 5000) {
        lastSaveRef.current = now;
        savePosition();
      }
    };
    const onDuration = () => setDuration(el.duration || 0);
    const onEnded = () => {
      if (repeatRef.current === 'one') {
        el.currentTime = 0;
        el.play();
        return;
      }
      const q = queueRef.current;
      const idx = q.findIndex((t) => t.id === currentIdRef.current);
      if (repeatRef.current === 'off' && idx === q.length - 1) {
        savePosition();
        return;
      }
      next();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      savePosition();
    };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDuration);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDuration);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [next, repeatRef, queueRef, currentIdRef, savePosition, lastSaveRef]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  const current = useMemo(() => library.find((t) => t.id === currentId) ?? null, [library, currentId]);

  useArtColor(current, setLibrary);
  useMediaSession(current, toggle, next, prev);

  const value = useMemo(
    () => ({
      library,
      currentId,
      isPlaying,
      volume,
      repeat,
      shuffle,
      queue,
      addFiles,
      play: playId,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      setRepeat,
      setShuffle,
      clearLibrary,
    }),
    [
      library,
      currentId,
      isPlaying,
      volume,
      repeat,
      shuffle,
      queue,
      addFiles,
      playId,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      setRepeat,
      setShuffle,
      clearLibrary,
    ],
  );

  const progress = useMemo(() => ({ currentTime, duration }), [currentTime, duration]);

  return (
    <PlayerCtx.Provider value={value}>
      <PlayerProgressCtx.Provider value={progress}>
        <audio ref={audioRef} />
        {children}
      </PlayerProgressCtx.Provider>
    </PlayerCtx.Provider>
  );
}
