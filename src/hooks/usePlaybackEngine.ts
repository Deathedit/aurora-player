import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { buildQueue } from '@/services/queue';
import { usePositionPersistence } from '@/hooks/usePositionPersistence';
import { useSyncedRef } from '@/hooks/useSyncedRef';
import type { Track, RepeatMode } from '@/types';

interface PlaybackEngineOptions {
  audioRef: RefObject<HTMLAudioElement | null>;
  libraryRef: RefObject<Track[]>;
  repeatRef: RefObject<RepeatMode>;
  shuffleRef: RefObject<boolean>;
  volume: number;
}

export function usePlaybackEngine({ audioRef, libraryRef, repeatRef, shuffleRef, volume }: PlaybackEngineOptions) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);

  const currentIdRef = useSyncedRef(currentId);
  const queueRef = useSyncedRef(queue);
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
  }, [playId, libraryRef, audioRef]);

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

  const seek = useCallback(
    (seconds: number) => {
      const el = audioRef.current;
      if (el) el.currentTime = seconds;
    },
    [audioRef],
  );

  const resetPlayback = useCallback(() => {
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
  }, [restoredRef, audioRef]);

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
  }, [next, repeatRef, queueRef, currentIdRef, savePosition, lastSaveRef, audioRef]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume, audioRef]);

  return {
    currentId,
    isPlaying,
    currentTime,
    duration,
    queue,
    play: playId,
    toggle,
    next,
    prev,
    seek,
    restoreLastPlayed,
    resetPlayback,
  };
}
