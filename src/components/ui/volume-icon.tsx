import { Volume2, Volume1, VolumeX } from 'lucide-react';
import type { CSSProperties } from 'react';

export function VolumeIcon({ volume, style }: { volume: number; style?: CSSProperties }) {
  if (volume === 0) return <VolumeX style={style} />;
  if (volume < 0.5) return <Volume1 style={style} />;
  return <Volume2 style={style} />;
}
