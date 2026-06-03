import { describe, it, expect } from 'vitest';
import { trackKey } from '@/services/library-cache';

describe('trackKey', () => {
  it('uses the track id when there is no backing File (server mode)', () => {
    expect(trackKey({ id: 'Album/song.mp3' })).toBe('Album/song.mp3');
  });

  it('derives a content key from the File when present (local mode)', () => {
    const file = { name: 'song.mp3', size: 123, lastModified: 456 } as File;
    expect(trackKey({ id: 'x', file, folder: 'Album' })).toBe('Album/song.mp3|123|456');
  });
});
