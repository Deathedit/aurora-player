import { useEffect } from 'react';
import { extractArtColor, getArtColor, setArtColor, cacheColor } from '@/services/library';
import type { Track } from '@/types';

export function useArtColor(current: Track | null) {
  useEffect(() => {
    if (!current?.artUrl) {
      document.documentElement.style.removeProperty('--art');
      return;
    }
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
      if (current.file) cacheColor(current.file, current.folder, color);
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id, current?.artUrl, current?.artHash, current?.artColor, current?.file, current?.folder]);
}
