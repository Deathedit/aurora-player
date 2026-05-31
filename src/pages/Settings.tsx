import { usePlayer } from '@/player-context'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useFsAccessCtx } from '@/fs-access-context'
import {
  CLEAR_LIBRARY,
  CONNECT_FOLDER,
  RECONNECT_FOLDER,
  REFRESH_FOLDER,
  DISCONNECT_FOLDER,
  SCANNING,
  FOLDER_NOT_SUPPORTED,
  TRACKS_LOADED,
  THEME_LABEL,
  GLASS_LABEL,
  DARK,
  LIGHT,
} from '@/text'
import type { Theme } from '@/types'
import { FolderOpen, RefreshCw, Unplug, Loader2 } from 'lucide-react'

export function Settings() {
  const { library, clearLibrary } = usePlayer()
  const [theme, setTheme] = useLocalStorage<Theme>('theme', DARK)
  const [glass, setGlass] = useLocalStorage<boolean>('glass', true)
  const fs = useFsAccessCtx()

  function handleTheme(t: Theme) {
    setTheme(t)
    if (t === DARK) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }

  function handleGlass(next: boolean) {
    setGlass(next)
    document.documentElement.classList.toggle('no-glass', !next)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="mt-6 space-y-6">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Music Library</h2>
          {!fs.supported ? (
            <p className="mt-2 text-sm text-muted-foreground">{FOLDER_NOT_SUPPORTED}</p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {!fs.connected && !fs.reconnectNeeded && (
                <button
                  type="button"
                  onClick={fs.connect}
                  disabled={fs.scanning}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {fs.scanning ? <Loader2 className="size-4 animate-spin" /> : <FolderOpen className="size-4" />}
                  {fs.scanning ? SCANNING : CONNECT_FOLDER}
                </button>
              )}

              {fs.reconnectNeeded && (
                <button
                  type="button"
                  onClick={fs.reconnect}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <FolderOpen className="size-4" />
                  {RECONNECT_FOLDER}
                </button>
              )}

              {fs.connected && !fs.reconnectNeeded && (
                <>
                  <span className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm">
                    <FolderOpen className="size-4" />
                    {fs.dirName}
                    {fs.scanning && <Loader2 className="size-3.5 animate-spin" />}
                  </span>
                  <button
                    type="button"
                    onClick={fs.refresh}
                    disabled={fs.scanning}
                    className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
                  >
                    <RefreshCw className={`size-3.5 ${fs.scanning ? 'animate-spin' : ''}`} />
                    {REFRESH_FOLDER}
                  </button>
                  <button
                    type="button"
                    onClick={fs.disconnect}
                    className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
                  >
                    <Unplug className="size-3.5" />
                    {DISCONNECT_FOLDER}
                  </button>
                </>
              )}

              {library.length > 0 && (
                <span className="text-sm text-muted-foreground">{TRACKS_LOADED(library.length)}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{THEME_LABEL}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTheme(DARK)}
              className={`rounded-md px-3 py-1.5 text-sm ${theme === DARK ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => handleTheme(LIGHT)}
              className={`rounded-md px-3 py-1.5 text-sm ${theme === LIGHT ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
            >
              Light
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{GLASS_LABEL}</span>
          <button
            type="button"
            onClick={() => handleGlass(!glass)}
            className={`relative h-6 w-11 rounded-full transition-colors ${glass ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform ${glass ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={clearLibrary}
            className="rounded-md bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            {CLEAR_LIBRARY}
          </button>
        </div>
      </div>
    </div>
  )
}