<h1>
  <img src="public/favicon.svg" alt="" width="64" height="64" align="middle" />
  Aurora
</h1>

A music player for your own files that runs entirely in the browser — no backend, no streaming, no accounts, nothing leaves your machine. Point it at a folder on disk and Aurora reads the audio and tags locally, builds a browsable, searchable library, and plays it back with a Spotify-style transport. The UI recolors itself to match each track's cover art, and your library reconnects automatically on return.

Built as a fully client-side app: the File System Access API reads files directly off disk, `music-metadata` parses tags in the browser, and a single `<audio>` element handles playback. Parsed metadata and cover art are cached in IndexedDB, so a library you've opened before loads near-instantly the next time.

> **Browser support:** Chromium-based browsers only (Chrome/Edge) — the File System Access API isn't available elsewhere.

## Features

- **Play your own music folder** — pick a folder once and Aurora remembers it, reconnecting automatically next time you open it.
- **Colors that match your album art** — the whole interface gently tints itself to match the cover of whatever's playing.
- **Handles huge libraries smoothly** — thousands of tracks scroll without lag.
- **Familiar player controls** — play, pause, skip, shuffle, repeat, and a seek bar, with a full-screen Now Playing view on your phone.
- **Works with your device's media keys** — control playback from your keyboard, headphones, or lock screen.
- **Loads as you go** — tracks start appearing right away instead of making you wait for the whole folder.
- **Fast on return visits** — Aurora remembers the details and artwork it already read, so a library you've opened before loads almost instantly.

| Stack | |
|---|---|
| React 19 + TS | Chakra UI v3 + Emotion |
| Vite 8 | react-virtuoso |
| React Router (HashRouter) | Lucide React |

## Develop

```sh
npm install && npm run dev
# Open in Chrome/Edge (FS Access API required)
```

```sh
npm run build   # tsc -b && vite build
npm run lint    # eslint
```

## Run with Docker

Pull the prebuilt image from GHCR and serve it with nginx (SPA fallback included). Create a `compose.yaml`:

```yaml
services:
  aurora:
    image: ghcr.io/deathedit/aurora-player:latest
    ports:
      - "8080:80"
    restart: unless-stopped
```

```sh
docker compose up -d
# Open http://localhost:8080 in Chrome/Edge (FS Access API required)
```

`http://localhost` is a secure context, so the File System Access API works.

To build the image from source locally (build/test), use the bundled [docker-compose.yml](./docker-compose.yml):

```sh
docker compose up -d --build   # build/test; stop with docker compose down
```

See [AGENTS.md](./AGENTS.md) for architecture details.