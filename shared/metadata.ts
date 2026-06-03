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

export function albumFallback(album: string | undefined, folder: string | undefined): string {
  return album && album !== 'Unknown Album' ? album : (folder ?? 'Unknown Album');
}
