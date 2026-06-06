<h1>
  <img src="public/favicon.svg" alt="" width="64" height="64" align="absmiddle" />
  Aurora
</h1>

A music player for your own files. Point it at a folder of music, get a browsable, searchable library with a Spotify-style transport, and a UI that recolors itself to match each track's cover art. It runs two ways:

- **Local mode** — fully client-side, nothing leaves your machine. The File System Access API reads files directly off disk, `music-metadata` parses tags in the browser, and metadata + cover art are cached in IndexedDB so a library you've opened before loads near-instantly. *(Chrome/Edge only — the File System Access API isn't available in other browsers.)*
- **Server mode** — run the bundled [self-hosted server](#self-hosted-server-any-device) (Docker) and it scans your music on the host and streams it over HTTP. Because the browser only fetches and plays audio, this works on **any device or browser** — iPhone, Android, Firefox, Safari, etc.

Aurora auto-detects: if a backend is reachable it streams from the server; otherwise it falls back to local mode.

## Features

- **Play your own music folder** — pick a folder once and Aurora remembers it, reconnecting automatically next time you open it.
- **Colors that match your album art** — the whole interface gently tints itself to match the cover of whatever's playing.
- **Handles huge libraries smoothly** — thousands of tracks scroll without lag.
- **Familiar player controls** — play, pause, skip, shuffle, repeat, and a seek bar, with a full-screen Now Playing view on your phone.
- **Instant search** — press <kbd>K</kbd> on your library for a command palette: type to filter by title, arrow through results, and hit Enter to play.
- **Works with your device's media keys** — control playback from your keyboard, headphones, or lock screen.
- **Loads as you go** — tracks start appearing right away instead of making you wait for the whole folder.
- **Fast on return visits** — Aurora remembers the details and artwork it already read, so a library you've opened before loads almost instantly.

### Keyboard shortcuts

| Key | Action |
|---|---|
| <kbd>F</kbd> | Toggle the full-screen Now Playing view |
| <kbd>K</kbd> | Open the search command palette (on the library) |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Move through search results |
| <kbd>Enter</kbd> | Play the highlighted result |
| <kbd>Esc</kbd> | Close the search palette |

| Stack | |
|---|---|
| React 19 + TS | Chakra UI v3 + Emotion |
| Vite 8 | react-virtuoso |
| React Router | Lucide React |

## Develop

```sh
npm install && npm run dev
# Open in Chrome/Edge (FS Access API required)
```

```sh
npm run build   # tsc -b && vite build
npm run lint    # eslint
```

To develop against the server, run it in another terminal (the Vite dev server proxies `/api` to it):

```sh
cd server && npm install && MUSIC_DIR=/path/to/music npm run dev
```

## Self-hosted server (any device)

Run the bundled server (a single Node image that scans a music folder, streams audio, and serves the web UI) so you can play your library from **any device or browser**. Point `MUSIC_DIR` at your music folder and start it with Docker — create a `compose.yaml`:

```yaml
services:
  aurora:
    image: ghcr.io/deathedit/aurora-player:latest
    ports:
      - "8080:3000"
    volumes:
      - /path/to/your/music:/music:ro
      - aurora-data:/data
    restart: unless-stopped

volumes:
  aurora-data:
```

```sh
docker compose up -d
# Open http://localhost:8080 from any device on your network
```

The library index is cached in a SQLite database on the `aurora-data` volume, so restarts don't trigger a full rescan. Use the **Rescan** button in Settings (or `POST /api/rescan`) after adding music.

> **Security:** there is no authentication — run it on a trusted LAN and don't expose it directly to the internet.

To build the image from source instead of pulling it, use the bundled [docker-compose.yml](./docker-compose.yml):

```sh
MUSIC_DIR=/path/to/your/music docker compose up -d --build
```

See [AGENTS.md](./AGENTS.md) for architecture details.