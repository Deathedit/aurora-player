import { usePlayer } from '@/player-context'
import { formatTime } from '@/text'
import { X, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NowPlaying({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { library, currentId, isPlaying, toggle, next, prev, seek, currentTime, duration, shuffle, setShuffle, repeat, setRepeat, volume, setVolume } = usePlayer()
  const current = library.find((t) => t.id === currentId) ?? null

  if (!open || !current) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="glass-elevated fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 md:hidden"
      style={{ '--player-glow': `radial-gradient(at 50% 0%, ${current.artColor ?? '#8B5CF6'} 22%, transparent)` } as React.CSSProperties}
    >
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
        <X className="size-6" />
      </button>

      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="relative w-full max-w-sm">
          {current.artUrl ? (
            <img src={current.artUrl} alt="" className="aspect-square w-full rounded-xl object-cover shadow-2xl" />
          ) : (
            <div className="aspect-square w-full rounded-xl bg-muted" />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-xl" style={{ background: 'var(--player-glow)', opacity: 0.15 }} />
        </div>

        <div className="w-full text-center">
          <p className="text-lg font-semibold">{current.title}</p>
          <p className="text-sm text-muted-foreground">{current.artist}</p>
        </div>

        <div className="w-full">
          <div
            className="group relative flex h-5 cursor-pointer items-center"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              seek((x / rect.width) * duration)
            }}
          >
            <div className="h-1 w-full rounded-full bg-muted transition-all group-hover:h-1.5">
              <div className="h-full rounded-full accent-gradient" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="mt-1 flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => setShuffle(!shuffle)}
            className={cn('rounded-full p-2 transition-colors hover:text-foreground', shuffle ? 'text-primary' : 'text-muted-foreground')}
          >
            <Shuffle className="size-5" />
          </button>
          <button type="button" onClick={prev} className="rounded-full p-2 text-foreground hover:text-primary">
            <SkipBack className="size-6" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="accent-gradient flex size-14 items-center justify-center rounded-full text-primary-foreground active:scale-95"
          >
            {isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-0.5" />}
          </button>
          <button type="button" onClick={next} className="rounded-full p-2 text-foreground hover:text-primary">
            <SkipForward className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              const modes = ['off', 'all', 'one'] as const
              const idx = modes.indexOf(repeat)
              setRepeat(modes[(idx + 1) % 3])
            }}
            className={cn('relative rounded-full p-2 transition-colors hover:text-foreground', repeat !== 'off' ? 'text-primary' : 'text-muted-foreground')}
          >
            <Repeat className="size-5" />
            {repeat === 'one' && <span className="absolute -top-0.5 right-0.5 text-[0.5rem] font-bold">1</span>}
          </button>
        </div>

        <div className="flex w-full max-w-sm items-center gap-3">
          <button
            type="button"
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 accent-[var(--primary)]"
          />
        </div>
      </div>
    </div>
  )
}