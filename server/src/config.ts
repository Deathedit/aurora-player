import path from 'node:path';

export const MUSIC_DIR = path.resolve(process.env.MUSIC_DIR ?? '/music');
export const DB_PATH = process.env.DB_PATH ?? '/data/aurora.db';
export const PORT = Number(process.env.PORT ?? 3000);
export const STATIC_DIR = process.env.STATIC_DIR ?? path.resolve(import.meta.dirname, '../public');

export { AUDIO_EXTS, isAudioFile } from '../../shared/audio.js';
export type { TrackMeta } from '../../shared/metadata.js';
