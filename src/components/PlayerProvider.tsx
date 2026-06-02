import { useState, useRef, useCallback, useEffect } from 'react';
import { PlayerCtx } from '@/player-context';
import {
  parseFiles,
  revokeTrack,
  revokeAllArt,
  extractArtColor,
  getArtColor,
  setArtColor,
  cacheColor,
} from '@/services/library';
import type { FileEntry } from '@/services/library';
import { cacheKey } from '@/services/library-cache';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Track, RepeatMode } from '@/types';
import type { ReactNode } from 'react';

const LAST_PLAYED_KEY = 'aurora-lastplayed';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

  const restoredRef = useRef(false);
  const restoringRef = useRef(false);
  const lastSaveRef = useRef(0);
  const historyRef = useRef<string[]>([]);

  const savePosition = useCallback(() => {
    if (restoringRef.current) return;
    const el = audioRef.current;
    if (!el || !currentIdRef.current) return;
    const track = libraryRef.current.find((t) => t.id === currentIdRef.current);
    if (!track) return;
    try {
      localStorage.setItem(
        LAST_PLAYED_KEY,
        JSON.stringify({
          key: cacheKey(track.file, track.folder),
          time: el.currentTime,
        }),
      );
    } catch {
      /* quota exceeded */
    }
  }, [audioRef, currentIdRef, libraryRef, restoringRef]);

  const playId = useCallback(
    (id: string) => {
      restoringRef.current = false;
      const prevEl = audioRef.current;
      const prevId = currentIdRef.current;
      if (prevEl && prevId) {
        const prevTrack = libraryRef.current.find((t) => t.id === prevId);
        if (prevTrack) {
          try {
            localStorage.setItem(
              LAST_PLAYED_KEY,
              JSON.stringify({
                key: cacheKey(prevTrack.file, prevTrack.folder),
                time: prevEl.currentTime,
              }),
            );
          } catch {
            /* quota exceeded */
          }
        }
      }

      const lib = libraryRef.current;
      const track = lib.find((t) => t.id === id);
      if (!track) return;
      setCurrentId(id);
      historyRef.current.push(id);
      if (historyRef.current.length > 100) {
        historyRef.current = historyRef.current.slice(-100);
      }

      let newQueue: Track[];
      if (shuffleRef.current) {
        const rest = lib.filter((t) => t.id !== id);
        newQueue = [track, ...shuffleArray(rest)];
      } else {
        newQueue = [...lib];
      }
      setQueue(newQueue);

      const el = audioRef.current;
      if (el) {
        el.src = track.url;
        el.play();
      }
    },
    [libraryRef, shuffleRef, audioRef, currentIdRef, restoringRef],
  );

  const addFiles = useCallback(
    async (entries: FileEntry[]) => {
      const tracks = await parseFiles(entries, (batch) => {
        setLibrary((prev) => [...prev, ...batch]);
      });

      if (restoredRef.current) return;

      try {
        const raw = localStorage.getItem(LAST_PLAYED_KEY);
        if (!raw) return;
        const { key, time } = JSON.parse(raw) as { key: string; time: number };
        const match = tracks.find((t) => cacheKey(t.file, t.folder) === key);
        if (!match) return;

        restoredRef.current = true;
        restoringRef.current = true;

        let newQueue: Track[];
        if (shuffleRef.current) {
          const rest = tracks.filter((t) => t.id !== match.id);
          newQueue = [match, ...shuffleArray(rest)];
        } else {
          newQueue = [...tracks];
        }
        setQueue(newQueue);
        setCurrentId(match.id);
        historyRef.current.push(match.id);

        const el = audioRef.current;
        if (el) {
          el.src = match.url;
          const onLoaded = () => {
            if (time > 0 && time < el.duration) {
              el.currentTime = time;
            }
            restoringRef.current = false;
            el.removeEventListener('loadedmetadata', onLoaded);
          };
          el.addEventListener('loadedmetadata', onLoaded);
          setTimeout(() => {
            restoringRef.current = false;
            el.removeEventListener('loadedmetadata', onLoaded);
          }, 5000);
        } else {
          restoringRef.current = false;
        }
      } catch {
        /* restore is best-effort */
      }
    },
    [shuffleRef, audioRef],
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
      setCurrentId(prevId);
      if (el) {
        el.src = track.url;
        el.play();
      }
      return;
    }
    if (el) el.currentTime = 0;
  }, [libraryRef, audioRef]);

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
  }, [libraryRef]);

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
      } else {
        next();
      }
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
  }, [next, repeatRef, savePosition]);

  useEffect(() => {
    const onSave = () => savePosition();
    window.addEventListener('beforeunload', onSave);
    return () => window.removeEventListener('beforeunload', onSave);
  }, [savePosition]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') savePosition();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, [savePosition]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  const current = library.find((t) => t.id === currentId) ?? null;

  useEffect(() => {
    if (!current?.artUrl) return;
    const hash = current.artHash;
    const known = current.artColor ?? (hash ? getArtColor(hash) : undefined);
    if (known) {
      document.documentElement.style.setProperty('--art', known);
      return;
    }
    let cancelled = false;
    extractArtColor(current.artUrl).then((color) => {
      if (cancelled || !color) return;
      if (hash) setArtColor(hash, color);
      document.documentElement.style.setProperty('--art', color);
      setLibrary((prev) =>
        prev.map((t) =>
          t.id === current.id || (hash && t.artHash === hash)
            ? { ...t, artColor: color }
            : t,
        ),
      );
      cacheColor(current.file, current.folder, color);
    });
    return () => {
      cancelled = true;
    };
  }, [
    current?.id,
    current?.artUrl,
    current?.artHash,
    current?.artColor,
    current?.file,
    current?.folder,
  ]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = current
      ? new MediaMetadata({
          title: current.title,
          artist: current.artist,
          album: current.album,
          artwork: current.artUrl
            ? [{ src: current.artUrl, sizes: '512x512', type: 'image/jpeg' }]
            : [],
        })
      : null;
    navigator.mediaSession.setActionHandler('play', () => toggle());
    navigator.mediaSession.setActionHandler('pause', () => toggle());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('previoustrack', () => prev());
  }, [current, toggle, next, prev]);

  return (
    <PlayerCtx.Provider
      value={{
        library,
        currentId,
        isPlaying,
        currentTime,
        duration,
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
      }}
    >
      <audio ref={audioRef} />
      {children}
    </PlayerCtx.Provider>
  );
}
