import { createContext, useContext } from 'react';

export type LibrarySourceMode = 'backend' | 'local';

export interface LibrarySourceContextType {
  mode: LibrarySourceMode;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

export const LibrarySourceCtx = createContext<LibrarySourceContextType | null>(null);

export function useLibrarySource(): LibrarySourceContextType {
  const ctx = useContext(LibrarySourceCtx);
  if (!ctx) throw new Error('useLibrarySource must be used within LibrarySourceProvider');
  return ctx;
}
