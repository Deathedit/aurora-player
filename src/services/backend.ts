import type { Track } from '@/types';

interface TrackMeta {
  id: string;
  title: string;
  artist: string;
  album: string;
  folder?: string | null;
  durationSec: number;
  artHash?: string | null;
  artType?: string | null;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
}

function toTrack(meta: TrackMeta): Track {
  return {
    id: meta.id,
    url: `/api/stream/${encodeURIComponent(meta.id)}`,
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    folder: meta.folder ?? undefined,
    durationSec: meta.durationSec,
    artUrl: meta.artHash ? `/api/art/${meta.artHash}` : undefined,
    artHash: meta.artHash ?? undefined,
    artType: meta.artType ?? undefined,
  };
}

export async function fetchTracks(): Promise<Track[]> {
  const res = await fetch('/api/tracks');
  if (!res.ok) throw new Error(`fetch tracks failed: ${res.status}`);
  const data = (await res.json()) as TrackMeta[];
  return data.map(toTrack);
}

export async function rescan(): Promise<void> {
  await fetch('/api/rescan', { method: 'POST' });
}
