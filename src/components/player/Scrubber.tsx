import { usePlayer } from '@/player-context';

export function Scrubber() {
  const { currentTime, duration, seek } = usePlayer();
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="group relative flex h-5 cursor-pointer items-center"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        seek((x / rect.width) * duration);
      }}
    >
      <div className="h-1 w-full rounded-full bg-muted transition-all group-hover:h-1.5">
        <div
          className="h-full rounded-full accent-gradient"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
