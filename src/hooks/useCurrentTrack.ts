import { useMemo } from 'react';
import { usePlayer } from '@/contexts/player-context';
import type { Track } from '@/types';

export function useCurrentTrack(): Track | null {
  const { library, currentId } = usePlayer();
  return useMemo(() => library.find((t) => t.id === currentId) ?? null, [library, currentId]);
}
