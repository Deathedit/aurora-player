export interface FileEntry {
  file: File;
  folder?: string;
}

export const AUDIO_EXTS = /\.(mp3|flac|wav|ogg|m4a|aac|wma|opus|webm)$/i;

export function isAudioFile(name: string): boolean {
  return AUDIO_EXTS.test(name);
}
