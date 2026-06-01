import { usePlayer } from '@/player-context';
import { TrackRow } from '@/components/library/TrackRow';
import { NO_ALBUMS } from '@/text';
import { formatTime } from '@/text';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Track } from '@/types';

function albumKey(t: Track): string {
  return t.folder ?? t.album;
}

function albumDisplayName(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1];
}

interface AlbumGroup {
  key: string;
  displayName: string;
  artUrl?: string;
  tracks: Track[];
}

export function Albums({ scrollParent }: { scrollParent: HTMLElement }) {
  const { library } = usePlayer();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [view, setView] = useLocalStorage<'grid' | 'list'>('albumView', 'grid');

  const albums = useMemo(() => {
    const map = new Map<string, AlbumGroup>();
    for (const t of library) {
      const key = albumKey(t);
      if (!map.has(key)) {
        map.set(key, {
          key,
          displayName: albumDisplayName(key),
          artUrl: t.artUrl,
          tracks: [],
        });
      }
      map.get(key)!.tracks.push(t);
    }
    return map;
  }, [library]);

  const sortedAlbums = useMemo(
    () =>
      [...albums.values()].sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      ),
    [albums],
  );

  if (library.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Albums</h1>
        <p className="mt-4 text-muted-foreground">{NO_ALBUMS}</p>
      </div>
    );
  }

  const album = selectedAlbum ? albums.get(selectedAlbum) : null;

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
          <h1 className="text-2xl font-semibold tracking-tight">
            {album.displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {album.tracks.length} tracks
          </p>
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Albums</h1>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  view === 'grid'
                    ? 'text-primary bg-primary/12'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  view === 'list'
                    ? 'text-primary bg-primary/12'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
          {view === 'list' ? (
            <div className="mt-4">
              <Virtuoso
                data={sortedAlbums}
                itemContent={(_i, a) => (
                  <button
                    type="button"
                    onClick={() => setSelectedAlbum(a.key)}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                    style={{ height: 64 }}
                  >
                    {a.artUrl ? (
                      <img
                        src={a.artUrl}
                        alt=""
                        className="size-12 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="size-12 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">
                        {a.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.tracks.length} tracks &middot;{' '}
                        {formatTime(
                          a.tracks.reduce((s, t) => s + t.durationSec, 0),
                        )}
                      </p>
                    </div>
                  </button>
                )}
                fixedItemHeight={64}
                customScrollParent={scrollParent}
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {sortedAlbums.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setSelectedAlbum(a.key)}
                  className="group flex flex-col items-start gap-2 overflow-hidden rounded-lg transition-colors hover:bg-muted"
                >
                  {a.artUrl ? (
                    <img
                      src={a.artUrl}
                      alt=""
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full rounded-md bg-muted" />
                  )}
                  <span className="w-full truncate text-sm font-medium">
                    {a.displayName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
