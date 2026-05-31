import { parseBlob } from 'music-metadata'
import type { Track } from '@/types'

export interface FileEntry {
  file: File
  folder?: string
}

let nextId = 0

function audioMime(f: File): boolean {
  return f.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|m4a|aac|wma|opus|webm)$/i.test(f.name)
}

async function parseEntry(entry: FileEntry): Promise<Track> {
  try {
    const meta = await parseBlob(entry.file)
    const url = URL.createObjectURL(entry.file)

    let artUrl: string | undefined
    const picture = meta.common.picture?.[0]
    if (picture) {
      const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format })
      artUrl = URL.createObjectURL(blob)
    }

    const metaAlbum = meta.common.album
    const album = metaAlbum && metaAlbum !== 'Unknown Album' ? metaAlbum : (entry.folder ?? 'Unknown Album')

    return {
      id: `${entry.file.name}-${entry.file.size}-${nextId++}`,
      file: entry.file,
      url,
      title: meta.common.title || entry.file.name.replace(/\.[^.]+$/, ''),
      artist: meta.common.artist || 'Unknown Artist',
      album,
      folder: entry.folder,
      durationSec: meta.format.duration ?? 0,
      artUrl,
      artColor: undefined,
    }
  } catch {
    const url = URL.createObjectURL(entry.file)
    return {
      id: `${entry.file.name}-${entry.file.size}-${nextId++}`,
      file: entry.file,
      url,
      title: entry.file.name.replace(/\.[^.]+$/, ''),
      artist: 'Unknown Artist',
      album: entry.folder ?? 'Unknown Album',
      folder: entry.folder,
      durationSec: 0,
      artUrl: undefined,
      artColor: undefined,
    }
  }
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
  async function next(): Promise<Track | null> {
    if (i >= audio.length) return null
    const entry = audio[i++]
    return parseEntry(entry)
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, audio.length) }, async () => {
    while (true) {
      const track = await next()
      if (!track) break
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

export function revokeTrack(track: Track) {
  URL.revokeObjectURL(track.url)
  if (track.artUrl) URL.revokeObjectURL(track.artUrl)
}

export function fileEntry(file: File, folder?: string): FileEntry {
  return { file, folder }
}