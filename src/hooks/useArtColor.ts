import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { extractArtColor, getArtColor, setArtColor, cacheColor } from '@/services/library';
import type { Track } from '@/types';

export function useArtColor(current: Track | null, setLibrary: Dispatch<SetStateAction<Track[]>>) {
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
        prev.map((t) => (t.id === current.id || (hash && t.artHash === hash) ? { ...t, artColor: color } : t)),
      );
      cacheColor(current.file, current.folder, color);
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id, current?.artUrl, current?.artHash, current?.artColor, current?.file, current?.folder, setLibrary]);
}
