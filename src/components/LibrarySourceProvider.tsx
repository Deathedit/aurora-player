import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { usePlayer } from '@/contexts/player-context';
import { FsAccessProvider } from '@/components/FsAccessProvider';
import { LibrarySourceCtx } from '@/contexts/library-source-context';
import type { LibrarySourceMode } from '@/contexts/library-source-context';
import { checkHealth, fetchTracks } from '@/services/backend';

export function LibrarySourceProvider({ children }: { children: ReactNode }) {
  const { addTracks, clearLibrary } = usePlayer();
  const [mode, setMode] = useState<LibrarySourceMode | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const didInit = useRef(false);

  const loadBackend = useCallback(async () => {
    setRefreshing(true);
    try {
      const tracks = await fetchTracks();
      clearLibrary();
      addTracks(tracks);
    } finally {
      setRefreshing(false);
    }
  }, [addTracks, clearLibrary]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    checkHealth().then(async (ok) => {
      if (ok) {
        setMode('backend');
        await loadBackend();
      } else {
        setMode('local');
      }
    });
  }, [loadBackend]);

  const value = useMemo(
    () => (mode === 'backend' ? { mode, refresh: loadBackend, refreshing } : null),
    [mode, loadBackend, refreshing],
  );

  if (mode === null) return null;

  if (mode === 'backend') {
    return <LibrarySourceCtx.Provider value={value}>{children}</LibrarySourceCtx.Provider>;
  }

  return (
    <LibrarySourceCtx.Provider value={{ mode, refresh: async () => {}, refreshing: false }}>
      <FsAccessProvider>{children}</FsAccessProvider>
    </LibrarySourceCtx.Provider>
  );
}
