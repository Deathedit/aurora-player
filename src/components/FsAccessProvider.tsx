import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useFsAccess } from '@/hooks/useFsAccess';
import { usePlayer } from '@/contexts/player-context';
import { FsAccessCtx } from '@/contexts/fs-access-context';

export function FsAccessProvider({ children }: { children: ReactNode }) {
  const { addFiles, clearLibrary } = usePlayer();
  const fs = useFsAccess(addFiles, clearLibrary);
  const { initOnMount } = fs;

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    initOnMount();
  }, [initOnMount]);

  return <FsAccessCtx.Provider value={fs}>{children}</FsAccessCtx.Provider>;
}
