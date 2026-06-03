import { describe, it, expect } from 'vitest';
import { isAudioFile } from './audio';

describe('isAudioFile', () => {
  it('accepts known audio extensions (case-insensitive)', () => {
    expect(isAudioFile('song.mp3')).toBe(true);
    expect(isAudioFile('track.FLAC')).toBe(true);
    expect(isAudioFile('a.b.opus')).toBe(true);
  });

  it('rejects non-audio files', () => {
    expect(isAudioFile('cover.jpg')).toBe(false);
    expect(isAudioFile('notes.txt')).toBe(false);
    expect(isAudioFile('mp3')).toBe(false);
  });
});
