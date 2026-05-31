import { usePlayer } from '@/player-context'
import { formatTime } from '@/text'
import { Play, Pause, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Track } from '@/types'

function Equalizer() {
  return (
    <div className="flex h-4 items-end gap-[2px]">
      <div className="eq-bar-1 w-[3px] rounded-full bg-primary" />
      <div className="eq-bar-2 w-[3px] rounded-full bg-primary" />
      <div className="eq-bar-3 w-[3px] rounded-full bg-primary" />
    </div>
  )
}

export function TrackRow({ track, index }: { track: Track; index: number }) {
  const { currentId, isPlaying, play, toggle } = usePlayer()
  const active = track.id === currentId

  const activate = () => (active ? toggle() : play(track.id))

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        activate()
      }}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-muted',
        active && 'border-l-2 border-l-primary bg-primary/8',
      )}
      style={{ height: 56 }}
    >
      <span className="flex w-8 shrink-0 justify-center text-sm tabular-nums text-muted-foreground">
        {active && isPlaying ? (
          <Equalizer />
        ) : active ? (
          <Pause className="size-4 text-primary" />
        ) : (
          <span className="group-hover:hidden">{index + 1}</span>
        )}
        {!active && !isPlaying && (
          <Play className="hidden size-4 group-hover:block" />
        )}
      </span>

      {track.artUrl ? (
        <img src={track.artUrl} alt="" className="size-10 shrink-0 rounded object-cover" />
      ) : (
        <div className="size-10 shrink-0 rounded bg-muted" />
      )}

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', active && 'text-primary')}>{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>

      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Heart className="size-4 text-muted-foreground hover:text-primary" />
      </button>

      <span className="text-xs tabular-nums text-muted-foreground">{formatTime(track.durationSec)}</span>
    </div>
  )
}