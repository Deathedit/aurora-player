import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { trackKey } from '@/services/library-cache';
import { buildQueue } from '@/services/queue';
import type { Track } from '@/types';

const LAST_PLAYED_KEY = 'aurora-lastplayed';

export function usePositionPersistence({
  audioRef,
  currentIdRef,
  libraryRef,
  shuffleRef,
  historyRef,
  setQueue,
  setCurrentId,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentIdRef: RefObject<string | null>;
  libraryRef: RefObject<Track[]>;
  shuffleRef: RefObject<boolean>;
  historyRef: RefObject<string[]>;
  setQueue: (q: Track[]) => void;
  setCurrentId: (id: string) => void;
}) {
  const restoredRef = useRef(false);
  const restoringRef = useRef(false);
  const lastSaveRef = useRef(0);

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
          key: trackKey(track),
          time: el.currentTime,
        }),
      );
    } catch {
      /* quota exceeded */
    }
  }, [audioRef, currentIdRef, libraryRef]);

  const restoreLastPlayed = useCallback(
    (tracks: Track[]) => {
      if (restoredRef.current) return;
      try {
        const raw = localStorage.getItem(LAST_PLAYED_KEY);
        if (!raw) return;
        const { key, time } = JSON.parse(raw) as { key: string; time: number };
        const match = tracks.find((t) => trackKey(t) === key);
        if (!match) return;

        restoredRef.current = true;
        restoringRef.current = true;

        setQueue(buildQueue(tracks, match.id, shuffleRef.current));
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
    [audioRef, shuffleRef, historyRef, setQueue, setCurrentId],
  );

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

  return { savePosition, restoreLastPlayed, restoringRef, restoredRef, lastSaveRef };
}
