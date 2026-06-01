import { createContext, useContext } from 'react';
import type { Track, RepeatMode } from '@/types';
import type { FileEntry } from '@/services/library';

export interface PlayerState {
  library: Track[];
  currentId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
  queue: Track[];
}

export interface PlayerActions {
  addFiles: (entries: FileEntry[]) => Promise<void>;
  play: (id: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  setShuffle: (on: boolean) => void;
  clearLibrary: () => void;
}

export type PlayerContextType = PlayerState & PlayerActions;

export const PlayerCtx = createContext<PlayerContextType | null>(null);

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
