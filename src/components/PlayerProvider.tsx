import { useState, useRef, useCallback, useEffect } from 'react'
import { PlayerCtx } from '@/player-context'
import { parseFiles, revokeTrack, extractArtColor, cacheColor } from '@/services/library'
import type { FileEntry } from '@/services/library'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Track, RepeatMode } from '@/types'
import type { ReactNode } from 'react'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function useSyncedRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [library, setLibrary] = useState<Track[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useLocalStorage<number>('volume', 0.8)
  const [repeat, setRepeat] = useLocalStorage<RepeatMode>('repeat', 'off')
  const [shuffle, setShuffle] = useLocalStorage<boolean>('shuffle', false)
  const [queue, setQueue] = useState<Track[]>([])

  const libraryRef = useSyncedRef(library)
  const currentIdRef = useSyncedRef(currentId)
  const queueRef = useSyncedRef(queue)
  const repeatRef = useSyncedRef(repeat)
  const shuffleRef = useSyncedRef(shuffle)

  const playId = useCallback((id: string) => {
    const lib = libraryRef.current
    const track = lib.find((t) => t.id === id)
    if (!track) return
    setCurrentId(id)

    let newQueue: Track[]
    if (shuffleRef.current) {
      const rest = lib.filter((t) => t.id !== id)
      newQueue = [track, ...shuffleArray(rest)]
    } else {
      newQueue = [...lib]
    }
    setQueue(newQueue)

    const el = audioRef.current
    if (el) {
      el.src = track.url
      el.play()
    }
  }, [libraryRef, shuffleRef])

  const addFiles = useCallback(async (entries: FileEntry[]) => {
    await parseFiles(entries, (batch) => {
      setLibrary((prev) => [...prev, ...batch])
    })
  }, [])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      if (!el.src && libraryRef.current.length > 0) {
        playId(libraryRef.current[0].id)
      } else {
        el.play()
      }
    } else {
      el.pause()
    }
  }, [playId, libraryRef])

  const next = useCallback(() => {
    const q = queueRef.current
    if (q.length === 0) return
    const idx = q.findIndex((t) => t.id === currentIdRef.current)
    const nextIdx = idx + 1 < q.length ? idx + 1 : 0
    playId(q[nextIdx].id)
  }, [playId, queueRef, currentIdRef])

  const prev = useCallback(() => {
    const el = audioRef.current
    if (el && el.currentTime > 3) {
      el.currentTime = 0
      return
    }
    const q = queueRef.current
    if (q.length === 0) return
    const idx = q.findIndex((t) => t.id === currentIdRef.current)
    const prevIdx = idx > 0 ? idx - 1 : q.length - 1
    playId(q[prevIdx].id)
  }, [playId, queueRef, currentIdRef])

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current
    if (el) el.currentTime = seconds
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
  }, [setVolumeState])

  const clearLibrary = useCallback(() => {
    libraryRef.current.forEach(revokeTrack)
    setLibrary([])
    setCurrentId(null)
    setQueue([])
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    const el = audioRef.current
    if (el) {
      el.pause()
      el.src = ''
    }
  }, [libraryRef])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setCurrentTime(el.currentTime)
    const onDuration = () => setDuration(el.duration || 0)
    const onEnded = () => {
      if (repeatRef.current === 'one') {
        el.currentTime = 0
        el.play()
      } else {
        next()
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onDuration)
    el.addEventListener('ended', onEnded)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onDuration)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [next, repeatRef])

  useEffect(() => {
    const el = audioRef.current
    if (el) el.volume = volume
  }, [volume])

  const current = library.find((t) => t.id === currentId) ?? null

  useEffect(() => {
    if (!current?.artUrl) return
    if (current.artColor) {
      document.documentElement.style.setProperty('--art', current.artColor)
      return
    }
    let cancelled = false
    extractArtColor(current.artUrl).then((color) => {
      if (cancelled || !color) return
      document.documentElement.style.setProperty('--art', color)
      setLibrary((prev) =>
        prev.map((t) => (t.id === current.id ? { ...t, artColor: color } : t)),
      )
      cacheColor(current.file, current.folder, color)
    })
    return () => { cancelled = true }
  }, [current?.id, current?.artUrl, current?.artColor, current?.file, current?.folder])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = current
      ? new MediaMetadata({
          title: current.title,
          artist: current.artist,
          album: current.album,
          artwork: current.artUrl ? [{ src: current.artUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
        })
      : null
    navigator.mediaSession.setActionHandler('play', () => toggle())
    navigator.mediaSession.setActionHandler('pause', () => toggle())
    navigator.mediaSession.setActionHandler('nexttrack', () => next())
    navigator.mediaSession.setActionHandler('previoustrack', () => prev())
  }, [current, toggle, next, prev])

  return (
    <PlayerCtx.Provider
      value={{
        library,
        currentId,
        isPlaying,
        currentTime,
        duration,
        volume,
        repeat,
        shuffle,
        queue,
        addFiles,
        play: playId,
        toggle,
        next,
        prev,
        seek,
        setVolume,
        setRepeat,
        setShuffle,
        clearLibrary,
      }}
    >
      <audio ref={audioRef} />
      {children}
    </PlayerCtx.Provider>
  )
}