# Aurora Player — Documentation

Aurora Player is a music player built around the browser. It runs in **two modes from a single
codebase**:

- **Local mode (default):** a client-only SPA. You point it at a folder on disk via the
  [File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_Access_API),
  it reads and tags your files in the browser with `music-metadata`, and plays them through one
  `<audio>` element. No network, no server, nothing leaves the machine.
- **Server mode (optional):** a self-hosted Node + Fastify backend (`server/`) scans a music
  folder, stores metadata in SQLite, streams audio over HTTP (with range requests), and serves the
  built frontend — so any device/browser on the network can play the library. The frontend
  auto-detects this by probing `/api/health` on startup.

The frontend is the same in both modes; only the **library source** differs. A `Track` may be
backed by a local `File` (local mode) or by HTTP URLs (server mode), and file-dependent features
degrade gracefully when there is no `File`.

> A combined Docker image bundles the built frontend into the server for one-command self-hosting.

---

## Tech stack

### Frontend (`/src`)

| Technology | Version | Role |
|---|---|---|
| [React](https://react.dev) | 19.2.6 | UI library. Function components + hooks; `StrictMode`. No Server Components — this is a client SPA. |
| [TypeScript](https://www.typescriptlang.org) | ~6.0.2 | Strict typing. `target: es2023`, `jsx: react-jsx`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. |
| [Vite](https://vite.dev) | ^8.0.12 (Rolldown) | Dev server + build (`tsc -b && vite build`). Manual chunk splitting via `rolldownOptions`. |
| [Chakra UI](https://chakra-ui.com) | 3.35.0 | Component + styling system. Single flat dark theme, `layerStyle`s, semantic tokens. |
| [Emotion](https://emotion.sh) (`@emotion/react`) | 11.14.0 | CSS-in-JS engine that powers Chakra (no direct `styled` usage in app code). |
| [React Router](https://reactrouter.com) (`react-router-dom`) | 7.16.0 | Client routing via `BrowserRouter` + `<Routes>`. Three routes; **no loaders/actions** (see note below). |
| [react-virtuoso](https://virtuoso.dev) | 4.18.7 | Virtualized track list and album list. |
| [lucide-react](https://lucide.dev) | 1.17.0 | Icon set. |
| [music-metadata](https://github.com/Borewit/music-metadata) | 11.12.3 | Tag/duration/cover parsing (`parseBlob`), lazy-imported. |
| [fast-average-color](https://github.com/fast-average-color/fast-average-color) | 9.5.2 | Extracts the dominant cover-art color for art-reactive theming, lazy-imported. |

### Backend (`/server`, optional)

| Technology | Version | Role |
|---|---|---|
| [Fastify](https://fastify.dev) | ^5.6.1 | HTTP server + routing. |
| [@fastify/static](https://github.com/fastify/fastify-static) | ^8.2.0 | Serves the built SPA with a history fallback. |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | ^12.4.1 | Synchronous SQLite store for track metadata + cover art. |
| `music-metadata` | ^11.12.3 | Server-side scan parsing (runs in a worker thread). |
| tsx / TypeScript | ^4.20.6 / ~6.0.2 | Dev runner / build. |

### Testing & tooling

| Tool | Version | Role |
|---|---|---|
| [Vitest](https://vitest.dev) | 4.1.8 | Test runner. Default `node` environment for logic/HTTP tests; DOM (`happy-dom`) opt-in per file for hook tests. |
| `@vitest/coverage-v8` | ^4.1.8 | V8 coverage (`npm run test:coverage`). |
| [happy-dom](https://github.com/capricorn86/happy-dom) | ^20.10.0 | DOM environment for hook and component tests (opt-in per file). |
| [@testing-library/react](https://testing-library.com/react) | ^16.3.2 | `renderHook`/`render` for hook (`usePlaybackEngine`) and component (`Scrubber`, `TrackRow`) tests. |
| [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB) | ^6.2.5 | In-memory IndexedDB for the `library-cache` tests. |
| ESLint | ^10.3.0 | Linting (flat config). |
| Prettier | ^3.8.3 | Formatting. |

> **A note on the assumed stack.** This app intentionally does **not** use several features often
> associated with this toolchain: React Router **data APIs** (loaders/actions/`createBrowserRouter`),
> React **Server Components**, and `VITE_*` **environment variables**. Where relevant, the docs call
> these out as "not used" rather than describe machinery that isn't there. See
> [architecture-and-wiring.md](architecture-and-wiring.md) and
> [development-guide.md](development-guide.md).

---

## Project structure

```
.
├── src/                          # Frontend SPA
│   ├── main.tsx                  # Entry: createRoot → ChakraProvider → App
│   ├── App.tsx                   # Providers + BrowserRouter + AppShell (layout, routes)
│   ├── index.css                 # Font imports + base globals (most styling is in the theme)
│   │
│   ├── components/
│   │   ├── PlayerProvider.tsx        # Owns library state, the <audio> element, playback API
│   │   ├── LibrarySourceProvider.tsx # Probes /api/health → backend vs local mode
│   │   ├── FsAccessProvider.tsx      # Local mode: wires useFsAccess to the player
│   │   ├── layout/                   # Logo, Sidebar (desktop), TabBar (mobile)
│   │   ├── player/                   # TransportBar, NowPlaying, Scrubber, Volume/Repeat/Shuffle
│   │   ├── library/                  # TrackRow (one virtualized row)
│   │   ├── albums/                   # AlbumDetail, AlbumGridItem, AlbumListRow, types
│   │   ├── settings/                 # LibrarySection, GlassToggle, SettingsButton
│   │   └── ui/                       # volume-icon (stateful icon)
│   │
│   ├── contexts/                 # React contexts (split from providers for Fast Refresh)
│   │   ├── player-context.ts         # usePlayer / usePlayerProgress
│   │   ├── fs-access-context.ts       # useFsAccessCtx
│   │   └── library-source-context.ts  # useLibrarySource
│   │
│   ├── hooks/                    # Custom hooks (playback engine, persistence, media session…)
│   ├── pages/                    # Library, Albums, Settings (route elements)
│   ├── services/                 # library, library-cache (IndexedDB), queue, backend, fs-access
│   ├── theme/system.ts           # Chakra createSystem(): tokens, layerStyles, conditions
│   ├── constants/text.ts         # All UI strings + nav config
│   ├── utils/time.ts             # formatTime
│   └── types/                    # Track / RepeatMode + File System Access ambient types
│
├── shared/                       # Code shared by frontend + server
│   ├── audio.ts                  # AUDIO_EXTS regex + isAudioFile
│   └── metadata.ts               # TrackMeta interface + albumFallback
│
├── server/src/                   # Optional self-hosted backend (Fastify)
│   ├── index.ts                  # Boot: build app, register static, start scan, listen
│   ├── app.ts                    # buildApp() → Fastify instance with API routes
│   ├── routes.ts                 # /api/health|tracks|stream/:id|art/:hash|scanning|rescan
│   ├── db.ts                     # better-sqlite3 store (tracks + art)
│   ├── scanner.ts / scan.ts / scan-worker.ts  # Worker-thread library scan
│   ├── static.ts                 # Serve built SPA + history fallback
│   └── config.ts                 # Env vars (MUSIC_DIR, DB_PATH, PORT, STATIC_DIR)
│
├── tests/                        # Vitest suites (mirror src/server/shared layout)
├── docs/                         # ← you are here
├── Dockerfile / docker-compose.yml
├── CLAUDE.md / AGENTS.md         # Contributor conventions (source of truth)
└── vite.config.ts / eslint.config.js / tsconfig.*.json
```

---

## Documentation map

| Document | Covers |
|---|---|
| **[README.md](README.md)** (this file) | What the app is, the tech stack, project layout, and where to find each topic. |
| **[architecture-and-wiring.md](architecture-and-wiring.md)** | App boot + provider nesting, routing, data flow & state (contexts, dual library source, IndexedDB cache), the Chakra theme system, and the server-mode backend. |
| **[components-and-logic.md](components-and-logic.md)** | Component hierarchy (pages vs reusable UI), the react-virtuoso virtualization strategy, a deep dive on every custom hook / service / type, and Chakra v3 usage patterns. |
| **[development-guide.md](development-guide.md)** | Prerequisites, environment variables, npm scripts, Docker, and coding standards (TS strictness, adding routes/lists). |

For the canonical, terse contributor rules, see [`CLAUDE.md`](../CLAUDE.md) and
[`AGENTS.md`](../AGENTS.md) at the repo root — these docs summarize and expand on them.
