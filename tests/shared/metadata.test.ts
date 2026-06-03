import { describe, it, expect } from 'vitest';
import { albumFallback } from '@shared/metadata';

describe('albumFallback', () => {
  it('uses the album tag when present and meaningful', () => {
    expect(albumFallback('Discovery', 'Daft Punk')).toBe('Discovery');
  });

  it('falls back to the folder when album is missing or "Unknown Album"', () => {
    expect(albumFallback(undefined, 'B-Sides')).toBe('B-Sides');
    expect(albumFallback('Unknown Album', 'B-Sides')).toBe('B-Sides');
  });

  it('uses "Unknown Album" when both album and folder are absent', () => {
    expect(albumFallback(undefined, undefined)).toBe('Unknown Album');
  });
});
