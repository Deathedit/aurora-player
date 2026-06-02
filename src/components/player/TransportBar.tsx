import { usePlayer, usePlayerProgress } from '@/player-context';
import { formatTime } from '@/text';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  ChevronUp,
  Maximize2,
} from 'lucide-react';
import { VolumeIcon } from '@/components/ui/volume-icon';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export function TransportBar({
  onNowPlaying,
  nowPlayingOpen,
}: {
  onNowPlaying?: () => void;
  nowPlayingOpen?: boolean;
}) {
  const {
    currentId,
    library,
    isPlaying,
    toggle,
    next,
    prev,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
    volume,
    setVolume,
    seek,
  } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const current = useMemo(
    () => library.find((t) => t.id === currentId) ?? null,
    [library, currentId],
  );
  const isDesktop = useIsDesktop();
  const showArt = isDesktop || !nowPlayingOpen;
  const footerRef = useRef<HTMLElement>(null);
  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; });

  useEffect(() => {
    if (!isDesktop) return;
    const el = footerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const v = volumeRef.current;
      setVolume(
        Math.max(0, Math.min(1, Math.round((v + delta) * 100) / 100)),
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setVolume, isDesktop]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer
      ref={footerRef}
      className="glass fixed inset-x-0 bottom-14 md:bottom-0 z-40 flex items-center border-t border-border px-3 h-20 md:h-16"
    >
      <button
        type="button"
        onClick={onNowPlaying}
        className="flex min-w-0 flex-1 items-center gap-3 md:cursor-default"
      >
        {showArt && current?.artUrl ? (
          <img
            src={current.artUrl}
            alt=""
            className="size-11 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="size-11 shrink-0 rounded-md bg-muted" />
        )}
        <div className="min-w-0 md:block">
          <p className="truncate text-sm font-medium">
            {current?.title ?? '—'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {current?.artist ?? '—'}
          </p>
        </div>
        <ChevronUp className="size-4 shrink-0 text-muted-foreground md:hidden" />
      </button>

      <div className="flex shrink-0 items-center gap-1 md:gap-1.5">
        <button
          type="button"
          onClick={() => setShuffle(!shuffle)}
          className={cn(
            'hidden md:inline-flex rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground',
            shuffle && 'text-primary',
          )}
        >
          <Shuffle className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={prev}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <SkipBack className="size-4" />
        </button>
        <button
          type="button"
          onClick={toggle}
          className="accent-gradient flex size-10 items-center justify-center rounded-full text-primary-foreground transition-transform active:scale-95 md:size-9"
        >
          {isPlaying ? (
            <Pause className="size-5 md:size-4" />
          ) : (
            <Play className="size-5 ml-0.5 md:size-4 md:ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <SkipForward className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const modes = ['off', 'all', 'one'] as const;
            const idx = modes.indexOf(repeat);
            setRepeat(modes[(idx + 1) % 3]);
          }}
          className={cn(
            'hidden md:inline-flex relative rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground',
            repeat !== 'off' && 'text-primary',
          )}
        >
          <Repeat className="size-3.5" />
          {repeat === 'one' && (
            <span className="absolute -top-0.5 right-0 text-[0.5rem] font-bold">
              1
            </span>
          )}
        </button>
      </div>

      <div className="hidden md:flex flex-1 min-w-0 items-center gap-3">
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatTime(currentTime)}
        </span>
        <div
          className="group relative flex h-5 flex-1 cursor-pointer items-center"
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
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatTime(duration)}
        </span>
        <button
          type="button"
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          className="flex size-5 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <VolumeIcon volume={volume} className="size-4" />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-20 accent-[var(--primary)]"
        />
        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {Math.round(volume * 100)}%
        </span>
        <button
          type="button"
          onClick={onNowPlaying}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </footer>
  );
}
