import type { Track } from '@/types';

export interface AlbumGroup {
  key: string;
  displayName: string;
  artUrl?: string;
  tracks: Track[];
}
