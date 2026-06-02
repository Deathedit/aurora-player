import { Volume2, Volume1, VolumeX } from 'lucide-react';

export function VolumeIcon({
  volume,
  className,
}: {
  volume: number;
  className?: string;
}) {
  if (volume === 0) return <VolumeX className={className} />;
  if (volume < 0.5) return <Volume1 className={className} />;
  return <Volume2 className={className} />;
}