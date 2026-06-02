import type { Track } from '@/types';

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildQueue(tracks: Track[], currentId: string, shuffle: boolean): Track[] {
  if (!shuffle) return [...tracks];
  const current = tracks.find((t) => t.id === currentId);
  const rest = tracks.filter((t) => t.id !== currentId);
  const shuffled = shuffleArray(rest);
  return current ? [current, ...shuffled] : shuffled;
}
