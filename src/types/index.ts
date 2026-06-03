import type { TrackMeta } from '@shared/metadata';

export interface Track extends TrackMeta {
  file?: File;
  url: string;
  artUrl?: string;
  artColor?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';
