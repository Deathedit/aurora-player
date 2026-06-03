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

const BATCH_SIZE = 50;

export async function fetchTracks(onBatch: (tracks: Track[]) => void): Promise<void> {
  const res = await fetch('/api/tracks');
  if (!res.ok) throw new Error(`fetch tracks failed: ${res.status}`);

  if (!res.body) {
    const data = (await res.json()) as TrackMeta[];
    if (data.length) onBatch(data.map(toTrack));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let batch: Track[] = [];

  const flush = () => {
    if (batch.length) {
      onBatch(batch);
      batch = [];
    }
  };
  const pushLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    batch.push(toTrack(JSON.parse(trimmed) as TrackMeta));
    if (batch.length >= BATCH_SIZE) flush();
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      pushLine(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
    }
  }
  pushLine(buf);
  flush();
}

export async function rescan(): Promise<void> {
  await fetch('/api/rescan', { method: 'POST' });
}
