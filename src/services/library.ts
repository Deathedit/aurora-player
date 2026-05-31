import { parseBlob } from 'music-metadata'
import type { Track } from '@/types'
import { cacheKey, getCached, putCached, pruneCache, setCachedColor } from '@/services/library-cache'

export interface FileEntry {
  file: File
  folder?: string
}

let nextId = 0

function makeId(file: File): string {
  return `${file.name}-${file.size}-${nextId++}`
}

function audioMime(f: File): boolean {
  return f.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|m4a|aac|wma|opus|webm)$/i.test(f.name)
}

async function parseEntry(entry: FileEntry): Promise<{ track: Track; art?: Blob }> {
  try {
    const meta = await parseBlob(entry.file)
    const url = URL.createObjectURL(entry.file)

    let art: Blob | undefined
    let artUrl: string | undefined
    const picture = meta.common.picture?.[0]
    if (picture) {
      art = new Blob([new Uint8Array(picture.data)], { type: picture.format })
      artUrl = URL.createObjectURL(art)
    }

    const metaAlbum = meta.common.album
    const album = metaAlbum && metaAlbum !== 'Unknown Album' ? metaAlbum : (entry.folder ?? 'Unknown Album')

    return {
      track: {
        id: makeId(entry.file),
        file: entry.file,
        url,
        title: meta.common.title || entry.file.name.replace(/\.[^.]+$/, ''),
        artist: meta.common.artist || 'Unknown Artist',
        album,
        folder: entry.folder,
        durationSec: meta.format.duration ?? 0,
        artUrl,
        artColor: undefined,
      },
      art,
    }
  } catch {
    const url = URL.createObjectURL(entry.file)
    return {
      track: {
        id: makeId(entry.file),
        file: entry.file,
        url,
        title: entry.file.name.replace(/\.[^.]+$/, ''),
        artist: 'Unknown Artist',
        album: entry.folder ?? 'Unknown Album',
        folder: entry.folder,
        durationSec: 0,
        artUrl: undefined,
        artColor: undefined,
      },
    }
  }
}

async function resolveEntry(entry: FileEntry): Promise<Track> {
  const key = cacheKey(entry.file, entry.folder)
  const cached = await getCached(key)
  if (cached) {
    return {
      id: makeId(entry.file),
      file: entry.file,
      url: URL.createObjectURL(entry.file),
      title: cached.title,
      artist: cached.artist,
      album: cached.album,
      folder: entry.folder,
      durationSec: cached.durationSec,
      artUrl: cached.art ? URL.createObjectURL(cached.art) : undefined,
      artColor: cached.artColor,
    }
  }

  const { track, art } = await parseEntry(entry)
  await putCached(key, {
    title: track.title,
    artist: track.artist,
    album: track.album,
    folder: entry.folder,
    durationSec: track.durationSec,
    artColor: track.artColor,
    art,
  })
  return track
}

const CONCURRENCY = 5
const BATCH_SIZE = 20

export async function parseFiles(
  entries: FileEntry[],
  onBatch?: (tracks: Track[]) => void,
): Promise<Track[]> {
  const audio = entries.filter((e) => audioMime(e.file))
  const all: Track[] = []
  let batch: Track[] = []

  let i = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, audio.length) }, async () => {
    while (true) {
      const idx = i++
      if (idx >= audio.length) break
      const track = await resolveEntry(audio[idx])
      all.push(track)
      batch.push(track)
      if (batch.length >= BATCH_SIZE) {
        onBatch?.(batch)
        batch = []
      }
    }
  })

  await Promise.all(workers)

  if (batch.length > 0) {
    onBatch?.(batch)
  }

  await pruneCache(new Set(audio.map((e) => cacheKey(e.file, e.folder))))

  return all
}

export async function extractArtColor(artUrl: string): Promise<string | undefined> {
  try {
    const { FastAverageColor } = await import('fast-average-color')
    const analyzer = new FastAverageColor()
    const result = await analyzer.getColorAsync(artUrl)
    return result.hex
  } catch {
    return undefined
  }
}

export async function cacheColor(file: File, folder: string | undefined, color: string): Promise<void> {
  await setCachedColor(cacheKey(file, folder), color)
}

export function revokeTrack(track: Track) {
  URL.revokeObjectURL(track.url)
  if (track.artUrl) URL.revokeObjectURL(track.artUrl)
}

export function fileEntry(file: File, folder?: string): FileEntry {
  return { file, folder }
}