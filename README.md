# Aurora Player

Local-files music player — no backend, no streaming. Pick a folder from disk via File System Access API, parse metadata with `music-metadata`, play in-browser.

- **FS Access API** — folder picker, handle persisted in IndexedDB, auto-reconnect
- **Art-reactive theming** — `fast-average-color` → `--art` CSS var → accent glow
- **Virtualized lists** — `react-virtuoso` for large libraries
- **Spotify-style transport** — desktop: single-row with scrubber+volume; mobile: hint bar → full-screen Now Playing overlay with shuffle/repeat/volume
- **MediaSession API** — system media controls
- **Progressive loading** — concurrent pool, batches of 20 tracks

| Stack | |
|---|---|
| React 19 + TS | Tailwind CSS 4 + shadcn/ui base-nova |
| Vite 8 | @base-ui/react |
| React Router (HashRouter) | Lucide React |

```sh
npm install && npm run dev
# Open in Chrome/Edge (FS Access API required)
```

```sh
npm run build   # tsc -b && vite build
npm run lint    # eslint
```

See [AGENTS.md](./AGENTS.md) for architecture details.