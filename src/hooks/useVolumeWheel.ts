import { useCallback, useEffect, useRef } from 'react';
import { usePlayer } from '@/contexts/player-context';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export function useVolumeWheel(enabled = true) {
  const { volume, setVolume } = usePlayer();
  const isDesktop = useIsDesktop();
  const stateRef = useRef({ volume, isDesktop, enabled, setVolume });
  useEffect(() => {
    stateRef.current = { volume, isDesktop, enabled, setVolume };
  });

  return useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { volume, isDesktop, enabled, setVolume } = stateRef.current;
      if (!isDesktop || !enabled) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setVolume(Math.max(0, Math.min(1, Math.round((volume + delta) * 100) / 100)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
}
