import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFsAccess } from '@/hooks/useFsAccess';
import { usePlayer } from '@/player-context';
import { FsAccessCtx } from '@/fs-access-context';

export function FsAccessProvider({ children }: { children: ReactNode }) {
  const { addFiles, clearLibrary } = usePlayer();
  const fs = useFsAccess(addFiles, clearLibrary);
  const { initOnMount } = fs;

  useEffect(() => {
    initOnMount();
  }, [initOnMount]);

  return <FsAccessCtx.Provider value={fs}>{children}</FsAccessCtx.Provider>;
}
