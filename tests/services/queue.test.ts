import { describe, it, expect } from 'vitest';
import { buildQueue } from '@/services/queue';
import type { Track } from '@/types';

function track(id: string): Track {
  return { id, url: `/api/stream/${id}`, title: id, artist: 'a', album: 'b', durationSec: 1 };
}

const tracks = ['1', '2', '3', '4'].map(track);

describe('buildQueue', () => {
  it('returns tracks in order when not shuffling', () => {
    expect(buildQueue(tracks, '3', false).map((t) => t.id)).toEqual(['1', '2', '3', '4']);
  });

  it('puts the current track first and keeps the same set when shuffling', () => {
    const q = buildQueue(tracks, '3', true);
    expect(q[0].id).toBe('3');
    expect([...q.map((t) => t.id)].sort()).toEqual(['1', '2', '3', '4']);
  });
});
