import { createContext, useContext } from 'react';
import type { FsAccessState } from '@/hooks/useFsAccess';

export type FsAccessContextType = FsAccessState & {
  connect: () => Promise<void>;
  reconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export const FsAccessCtx = createContext<FsAccessContextType | null>(null);

export function useFsAccessCtx(): FsAccessContextType {
  const ctx = useContext(FsAccessCtx);
  if (!ctx)
    throw new Error('useFsAccessCtx must be used within FsAccessProvider');
  return ctx;
}
