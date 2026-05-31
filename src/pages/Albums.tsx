import { usePlayer } from '@/player-context'
import { TrackRow } from '@/components/library/TrackRow'
import { NO_ALBUMS } from '@/text'
import { useMemo, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import type { Track } from '@/types'

function albumKey(t: Track): string {
  return t.folder ?? t.album
}

function albumDisplayName(key: string): string {
  const parts = key.split('/')
  return parts[parts.length - 1]
}

export function Albums({ scrollParent }: { scrollParent: HTMLElement }) {
  const { library } = usePlayer()
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)

  const albums = useMemo(() => {
    const map = new Map<string, { displayName: string; artUrl?: string; tracks: Track[] }>()
    for (const t of library) {
      const key = albumKey(t)
      if (!map.has(key)) {
        map.set(key, { displayName: albumDisplayName(key), artUrl: t.artUrl, tracks: [] })
      }
      map.get(key)!.tracks.push(t)
    }
    return map
  }, [library])

  const sortedAlbums = useMemo(
    () => [...albums.values()].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [albums],
  )

  if (library.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Albums</h1>
        <p className="mt-4 text-muted-foreground">{NO_ALBUMS}</p>
      </div>
    )
  }

  const album = selectedAlbum ? albums.get(selectedAlbum) : null

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
      {album ? (
        <>
          <button
            type="button"
            onClick={() => setSelectedAlbum(null)}
            className="mb-4 text-sm text-primary hover:underline"
          >
            &larr; All Albums
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">{album.displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{album.tracks.length} tracks</p>
          <div className="mt-4">
            <Virtuoso
              data={album.tracks}
              itemContent={(i, track) => <TrackRow track={track} index={i} />}
              fixedItemHeight={56}
              customScrollParent={scrollParent}
            />
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Albums</h1>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {sortedAlbums.map((a) => {
              const key = albumKey(a.tracks[0])
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedAlbum(key)}
                  className="group flex flex-col items-start gap-2 overflow-hidden rounded-lg transition-colors hover:bg-muted"
                >
                  {a.artUrl ? (
                    <img src={a.artUrl} alt="" className="aspect-square w-full rounded-md object-cover" />
                  ) : (
                    <div className="aspect-square w-full rounded-md bg-muted" />
                  )}
                  <span className="w-full truncate text-sm font-medium">{a.displayName}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}