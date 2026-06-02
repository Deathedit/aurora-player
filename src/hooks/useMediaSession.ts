import { useEffect } from 'react';
import type { Track } from '@/types';

export function useMediaSession(current: Track | null, toggle: () => void, next: () => void, prev: () => void) {
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = current
      ? new MediaMetadata({
          title: current.title,
          artist: current.artist,
          album: current.album,
          artwork: current.artUrl
            ? [
                {
                  src: current.artUrl,
                  sizes: '512x512',
                  type: current.artType ?? 'image/jpeg',
                },
              ]
            : [],
        })
      : null;
    navigator.mediaSession.setActionHandler('play', () => toggle());
    navigator.mediaSession.setActionHandler('pause', () => toggle());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('previoustrack', () => prev());
  }, [current, toggle, next, prev]);
}
