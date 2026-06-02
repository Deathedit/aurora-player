import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { usePlayer } from '@/contexts/player-context';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export function useVolumeWheel(ref: RefObject<HTMLElement | null>, enabled = true) {
  const { volume, setVolume } = usePlayer();
  const isDesktop = useIsDesktop();
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  });

  useEffect(() => {
    if (!isDesktop || !enabled) return;
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const v = volumeRef.current;
      setVolume(Math.max(0, Math.min(1, Math.round((v + delta) * 100) / 100)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [ref, setVolume, isDesktop, enabled]);
}
