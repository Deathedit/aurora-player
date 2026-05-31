export interface Track {
  id: string
  file: File
  url: string
  title: string
  artist: string
  album: string
  folder?: string
  durationSec: number
  artUrl?: string
  artColor?: string
}

export type RepeatMode = 'off' | 'all' | 'one'

export type Theme = 'dark' | 'light'