# Architecture & Wiring

How Aurora boots, how it routes, how data flows, how it's themed, and how the optional backend
fits in.

---

## 1. App wiring & entry

### Boot sequence

`index.html` loads `src/main.tsx` as a module. [`main.tsx`](../src/main.tsx):

```tsx
if (localStorage.getItem('aurora-glass') === 'false') {
  document.documentElement.classList.add('no-glass');   // restore glass pref before first paint
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>   {/* system = createSystem(...) from theme/system.ts */}
      <App />
    </ChakraProvider>
  </StrictMode>,
);
```

Two things happen before React renders:

1. The `aurora-glass` preference is read from `localStorage` and, if disabled, the `no-glass` class
   is set on `<html>` synchronously — this avoids a flash of glass effects on reload (the
   `_noGlass` theme condition keys off this class; see §4).
2. `ChakraProvider` is given the app's custom `system`, making all tokens/`layerStyle`s available.

`import './index.css'` brings in the variable fonts (`@fontsource-variable/inter` and `geist`) and a
handful of base globals; nearly all styling lives in the theme.

### Provider nesting

[`App.tsx`](../src/App.tsx) composes the providers:

```
ChakraProvider (main.tsx)
└── App
    └── BrowserRouter
        └── PlayerProvider              # library state + <audio> + playback API
            └── LibrarySourceProvider   # decides backend vs local; supplies tracks
                └── AppShell            # layout + <Routes>
                    └── (FsAccessProvider is injected here by LibrarySourceProvider in local mode)
```

Order matters:

- **`PlayerProvider`** is outermost (after the router) because everything below consumes
  `usePlayer()` — including `LibrarySourceProvider`, which calls `addTracks`/`clearLibrary`, and
  `FsAccessProvider`, which calls `addFiles`/`clearLibrary`.
- **`LibrarySourceProvider`** probes the backend and, in **local** mode, renders
  `FsAccessProvider` around its children; in **backend** mode it renders children directly. So
  `FsAccessProvider` is conditional, not a fixed layer.

---

## 2. Routing architecture

Routing is deliberately minimal. [`App.tsx`](../src/App.tsx):

```tsx
<BrowserRouter>
  <PlayerProvider>
    <LibrarySourceProvider>
      <AppShell />
    </LibrarySourceProvider>
  </PlayerProvider>
</BrowserRouter>
```

Inside `AppShell`:

```tsx
<Routes>
  <Route path="/"        element={withScroll(<Library scrollParent={scrollParent!} />)} />
  <Route path="/albums"  element={withScroll(<Albums  scrollParent={scrollParent!} />)} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

| Route | Page | Notes |
|---|---|---|
| `/` | `Library` | Virtualized, sorted track list. |
| `/albums` | `Albums` | Grid/list of albums; album detail is in-page state, not a route. |
| `/settings` | `Settings` | Library connection + glass toggle. |

Key design points:

- **`AppShell` is a manual layout**, not a React Router layout route. It renders the `Sidebar`
  (desktop), `<main>` scroll container, `TransportBar`, `TabBar` (mobile), and the `NowPlaying`
  dialog around the `<Routes>`. There is no `<Outlet>` and no nested route tree.
- **`scrollParent` gate.** `<main>` is the single scroll container at every breakpoint. `AppShell`
  captures it with a ref-callback (`ref={setScrollParent}`) into state, and `withScroll(el)` returns
  `null` until that element exists — so `Library`/`Albums` only mount once they have a real
  `HTMLElement` to give `react-virtuoso`'s `customScrollParent`. The `Settings` route doesn't need
  it and renders immediately.
- **Global `f` shortcut.** `AppShell` adds a `keydown` listener that toggles the Now-Playing
  overlay on `f`/`F`, unless focus is in an input/textarea/contenteditable.
- **Clean URLs.** `BrowserRouter` produces real paths (`/albums`), so any deployment must serve
  `index.html` for unknown client routes. Vite's dev/preview do this automatically; in server mode
  the Fastify static handler does it (see §5).

### Not used (by design)

- **No `createBrowserRouter`, loaders, or actions.** Data isn't fetched per-route; the library is
  loaded once into `PlayerProvider` and read from context. For three client routes over an
  already-in-memory library, route data APIs would add indirection with no benefit.
- **No route-level error boundaries / `errorElement`.** Provider hooks throw explicit errors if
  misused (e.g. `usePlayer must be used within PlayerProvider`), but there is no router error UI.

---

## 3. Data flow & state

State is **React Context + hooks** — no Redux/Zustand/Jotai, and no React Router data layer.

### The three contexts

Each context lives in its **own file** under `src/contexts/`, separate from the provider component
that fills it. This is intentional: co-locating a context object with a component breaks React Fast
Refresh, so the object + its `use*` hook are isolated.

| Context | Hook | Provided by | Holds |
|---|---|---|---|
| [`player-context.ts`](../src/contexts/player-context.ts) | `usePlayer()` / `usePlayerProgress()` | `PlayerProvider` | Library, current track id, play state, volume/repeat/shuffle, queue, and all transport actions. Progress (`currentTime`/`duration`) is a **separate** context so high-frequency time updates don't re-render every consumer of the main player state. |
| [`fs-access-context.ts`](../src/contexts/fs-access-context.ts) | `useFsAccessCtx()` | `FsAccessProvider` | Folder connection state + `connect`/`reconnect`/`refresh`/`disconnect` (local mode only). |
| [`library-source-context.ts`](../src/contexts/library-source-context.ts) | `useLibrarySource()` | `LibrarySourceProvider` | `mode` (`'backend' \| 'local'`) + `refresh`/`refreshing` (rescan in server mode). |

### Dual library source

[`LibrarySourceProvider`](../src/components/LibrarySourceProvider.tsx) runs once on mount:

```
checkHealth()  →  GET /api/health (cache: 'no-store')
   ├── ok    → mode='backend'; fetchTracks() streams NDJSON → addTracks(batch) → restorePlayback(all)
   └── fail  → mode='local';   render <FsAccessProvider> (File System Access flow)
```

- **Backend mode** ([`services/backend.ts`](../src/services/backend.ts)): `fetchTracks` reads the
  `/api/tracks` response as a stream and parses **NDJSON line-by-line**, dispatching batches of 50
  to `addTracks` so the UI fills progressively. Each row maps to a `Track` whose `url` is
  `/api/stream/:id` and `artUrl` is `/api/art/:hash` (no `File`, no object URLs). `refresh` triggers
  a re-fetch; `POST /api/rescan` asks the server to re-scan disk.
- **Local mode** ([`FsAccessProvider`](../src/components/FsAccessProvider.tsx) →
  [`useFsAccess`](../src/hooks/useFsAccess.ts) → [`services/fs-access.ts`](../src/services/fs-access.ts)):
  picks a directory handle, persists it in IndexedDB (`aurora-fs`), walks it for audio files, and
  feeds `FileEntry[]` to `PlayerProvider.addFiles`, which parses tags via
  [`services/library.ts`](../src/services/library.ts).

### Playback state

[`PlayerProvider`](../src/components/PlayerProvider.tsx) owns the single `<audio>` element and
delegates transport to [`usePlaybackEngine`](../src/hooks/usePlaybackEngine.ts). The provider stays
thin: it holds `library`, the persisted prefs (`volume`/`repeat`/`shuffle` via `useLocalStorage`),
derives `current`, and wires `useArtColor` + `useMediaSession`. See
[components-and-logic.md](components-and-logic.md#custom-hooks--utilities) for the engine internals.

**Playback state (queue, current track) is in-memory only** and lost on refresh — but the player
restores the *last played* track + position from `localStorage` (`aurora-lastplayed`), and parsed
**metadata is cached in IndexedDB**, so a returning library loads near-instantly.

### Caching & dedupe (local mode)

[`services/library-cache.ts`](../src/services/library-cache.ts) manages an IndexedDB database
`aurora-library` (**version 2**) with two object stores:

- **`tracks`** — text metadata + an `artHash`, keyed by `folder/name|size|lastModified`
  (`cacheKey`). On rescan, a cache hit skips the expensive `parseBlob` + color extraction.
- **`art`** — each cover image stored **once**, keyed by its **SHA-256 content hash**. Tracks that
  share identical art resolve to one `Blob` and one object URL via the `artUrls` registry in
  `library.ts`, so a 100-track album holds one image, not 100.

`parseFiles` reads the cache **per file** (`getCached`), never a bulk `getAll` (which would hold
every art blob in memory and OOM large libraries). `pruneCacheToScan(scanKeys)` drops removed files
and orphaned art (only safe with a complete scan). Object URLs are regenerated each session and
freed by `revokeAllArt()`; `clearCache` runs only on disconnect.

### Persisted preferences

[`useLocalStorage`](../src/hooks/useLocalStorage.ts) stores UI prefs under the `aurora-` prefix:
`aurora-volume`, `aurora-repeat`, `aurora-shuffle`, `aurora-glass`, `aurora-albumView`. Plus
`aurora-lastplayed` (resume point), written directly by `usePositionPersistence`.

---

## 4. UI theme & tokens

All styling is **Chakra UI v3 + Emotion**. There is no Tailwind, no shadcn, and no direct
`@emotion/styled` usage — Emotion is just the engine Chakra renders through.

### The theme system

[`src/theme/system.ts`](../src/theme/system.ts) builds the system:

```ts
const config = defineConfig({ conditions: {...}, theme: {...}, globalCss: {...} });
export const system = createSystem(defaultConfig, config);
```

- **Single flat dark theme.** Semantic tokens have flat values — **no light/dark color mode, no
  theme switching**. Token names mirror the old CSS-var names: `background` (`#121212`),
  `foreground`, `card`, `elevated`, `muted`, `mutedForeground`, `primary` (`#1db954`), `border`,
  etc. Use them as style props: `bg="background"`, `color="mutedForeground"`.
- **Custom condition `_noGlass`.** The only custom condition, targeting `.no-glass &`. It lets the
  glass `layerStyle`s swap their blur for an opaque fill when the user disables glass (the
  `GlassToggle` toggles `.no-glass` on `<html>`).
- **`layerStyle`s** (reusable style bundles):
  - `glass` / `glassSidebar` / `glassElevated` — `backdrop-filter: blur(24px) saturate(1.2)`, each
    with a `_noGlass` opaque fallback.
  - `accentGradient` / `accentGradientText` — the green accent
    `linear-gradient(120deg, #1db954, #1ed760)` as a fill or clipped text.
  - `scrollbarHidden` — hides scrollbars cross-browser.
- **Keyframes** — `equalizer1/2/3` for the now-playing equalizer bars (disabled under
  `prefers-reduced-motion` via `globalCss`).
- **`globalCss`** — box-sizing, body bg/color/font, and a `:focus-visible` outline using the `ring`
  token (so every focusable element gets a visible ring for free).

### Runtime art-reactive theming

`PlayerProvider` (via [`useArtColor`](../src/hooks/useArtColor.ts)) sets a `--art` CSS variable on
`documentElement` from the current cover's dominant color, which feeds `--player-glow`. Components
read it with `css={{ background: 'var(--player-glow)' }}`. These are **runtime** CSS vars, set
imperatively — not theme tokens.

> After adding custom tokens or `layerStyle`s, regenerate the typings:
> `npx @chakra-ui/cli typegen src/theme/system.ts --strict`.

---

## 5. Backend (server mode)

The optional backend in [`server/src/`](../server/src) is a standalone Node + Fastify process. It is
**not** React Server Components — it's a separate HTTP server that the SPA talks to over `fetch`.

### Boot — [`index.ts`](../server/src/index.ts)

`buildApp({ logger: true })` → if `STATIC_DIR` exists, `registerStatic` (serve the built SPA) →
`startScan(...)` (kick off a library scan) → register `SIGTERM`/`SIGINT` graceful shutdown →
`app.listen({ port: PORT, host: '0.0.0.0' })`.

### App + routes — [`app.ts`](../server/src/app.ts) / [`routes.ts`](../server/src/routes.ts)

`buildApp()` creates a Fastify instance and calls `registerApi`. Endpoints:

| Method & path | Purpose |
|---|---|
| `GET /api/health` | `{ ok: true }` — the probe the frontend uses to choose server mode. |
| `GET /api/tracks` | Streams **NDJSON** (one track per line) from SQLite via a generator, 100 rows per pump, ordered artist→album→title. |
| `GET /api/stream/:id` | Streams the audio file with `Accept-Ranges`; honours `Range` (`206`, suffix ranges, `416` for unsatisfiable) and guards against path traversal outside `MUSIC_DIR` (`403`). |
| `GET /api/art/:hash` | Serves a stored cover with `Cache-Control: immutable`; `404` if unknown. |
| `GET /api/scanning` | `{ scanning: boolean }`. |
| `POST /api/rescan` | Triggers a background re-scan. |

### Storage & scan — [`db.ts`](../server/src/db.ts) / [`scanner.ts`](../server/src/scanner.ts)

- `db.ts` is a synchronous **better-sqlite3** store with a `tracks` table and an `art` table (cover
  bytes keyed by hash). `iterateTracks()` returns a generator so `/api/tracks` streams without
  buffering the whole library; helpers include `upsertTrack(s)`, `getTrackPath`, `getArt`,
  `pruneOrphanArt`, `closeDb`.
- `scanner.ts` exposes `isScanning()` + `startScan(log?)`. The actual walk runs off the main thread
  in a **worker** (`scan.ts` / `scan-worker.ts`) using `music-metadata`, so scanning a large folder
  doesn't block request handling. `scan.ts` is **incremental**: it skips files whose `mtime`/`size`
  are unchanged, deletes rows for removed files, and prunes orphaned art.

> `db.ts` and the `scan.ts` diff/upsert/prune logic are covered by `tests/server/db.test.ts` and
> `scan.test.ts` (temp DB + temp music dir).

### Static + SPA fallback — [`static.ts`](../server/src/static.ts)

Registers `@fastify/static` with `wildcard: false`, then a `setNotFoundHandler` that returns
`index.html` for extension-less, non-`/api` GETs (client routes) and a JSON `404` for everything
else. This is what makes `BrowserRouter`'s clean URLs work when self-hosting.

### Configuration — [`config.ts`](../server/src/config.ts)

Reads `MUSIC_DIR`, `DB_PATH`, `PORT`, `STATIC_DIR` from `process.env` (see
[development-guide.md](development-guide.md#environment-variables)) and re-exports the shared
`isAudioFile`/`TrackMeta` from `shared/`.
