import { usePlayer } from '@/player-context'
import { TrackRow } from '@/components/library/TrackRow'
import { EMPTY_LIBRARY } from '@/text'
import { Virtuoso } from 'react-virtuoso'

export function Library() {
  const { library } = usePlayer()

  const sorted = [...library].sort((a, b) =>
    a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || a.title.localeCompare(b.title),
  )

  if (library.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-8 text-muted-foreground">{EMPTY_LIBRARY}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
      <p className="mt-2 text-sm text-muted-foreground">{library.length} tracks</p>
      <div className="mt-4 hidden md:block md:h-[calc(100svh-10rem)]">
        <Virtuoso
          data={sorted}
          itemContent={(i, track) => <TrackRow track={track} index={i} />}
          fixedItemHeight={56}
        />
      </div>
      <div className="mt-4 md:hidden">
        {sorted.map((track, i) => (
          <TrackRow key={track.id} track={track} index={i} />
        ))}
      </div>
    </div>
  )
}