import path from 'node:path';

export const MUSIC_DIR = path.resolve(process.env.MUSIC_DIR ?? '/music');
export const DB_PATH = process.env.DB_PATH ?? '/data/aurora.db';
export const PORT = Number(process.env.PORT ?? 3000);
export const STATIC_DIR = process.env.STATIC_DIR ?? path.resolve(import.meta.dirname, '../public');

export const AUDIO_EXTS = /\.(mp3|flac|wav|ogg|m4a|aac|wma|opus|webm)$/i;

export function isAudioFile(name: string): boolean {
  return AUDIO_EXTS.test(name);
}

export interface TrackMeta {
  id: string;
  title: string;
  artist: string;
  album: string;
  folder?: string;
  durationSec: number;
  artHash?: string;
  artType?: string;
}
