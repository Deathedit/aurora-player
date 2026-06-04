# Aurora Player — Agent Notes

## Commands
- **Dev:** `npm run dev`
- **Build (gate):** `npm run build` — `tsc -b && vite build`; tsc must pass
- **Lint:** `npm run lint` — eslint
- **Typecheck:** `npm run typecheck` — `tsc -b tsconfig.test.json` (covers `src` + `tests`)
- **Test:** `npm test` — `vitest run`; `npm run test:watch` to watch; `npm run test:coverage` for a V8 report
- **Format:** `npm run format` — prettier --write src; `npm run format:check` for CI
- **Server (optional):** `cd server && npm run build` (`tsc`); `npm run dev` (tsx watch). Env: `MUSIC_DIR`, `DB_PATH`, `PORT`, `STATIC_DIR`

## TS Conventions
- `verbatimModuleSyntax` → `import type` for type-only imports
- `erasableSyntaxOnly` → no `enum`/`namespace`/parameter properties; use `as const`
- `noUnusedLocals` / `noUnusedParameters` → prefix unused params with `_`
- Project refs: `tsconfig.app.json` (src) + `tsconfig.node.json` (vite config)

## Architecture
**Local-files music player** with two modes. **Local mode** (default): FS Access API picks folders from disk, `music-metadata` parses metadata, single `<audio>` element plays. **Server mode** (optional, `server/`): Node + Fastify + better-sqlite3 scans `MUSIC_DIR`, streams audio with HTTP Range, serves the built frontend; `LibrarySourceProvider` probes `/api/health` and, when present, loads tracks from `services/backend.ts` (HTTP `url`/`artUrl`, no `File`) via `addTracks` instead of `FsAccessProvider`. `Track.file` is optional; `revokeTrack`/persistence (`trackKey`)/art-color caching guard on it. Endpoints: `GET /api/health|tracks|art/:hash|stream/:id`, `POST /api/rescan`. One combined Docker image runs the server.

### Core Patterns
- **Path routing** (`BrowserRouter`): `/` Library, `/albums`, `/settings`; Now-Playing is overlay. Clean URLs need an SPA history fallback per serving context — Vite dev/preview do it automatically; the Fastify server registers `@fastify/static` with `wildcard: false` plus a not-found handler (`server/src/static.ts`) that serves `index.html` for extension-less non-`/api` GETs and 404s everything else
- **Playback split**: `usePlaybackEngine` (`hooks/usePlaybackEngine.ts`) owns the single `<audio>` element + transport (play/next/prev/toggle/seek, audio-event effect, volume effect, position persistence, `resetPlayback`); `PlayerProvider` is thin wiring — library state + prefs + `current` derivation + art-color/MediaSession + context assembly. Public `usePlayer()` API is unchanged
- **`Track.file` invariant**: optional. **Local mode** → present, with `blob:` object-URL `url`/`artUrl` freed by `revokeTrack`. **Server mode** → absent, with HTTP `url`/`artUrl` (no revoke needed). File-dependent code guards on it: `revokeTrack` (`blob:` check), position persistence via `trackKey()` (falls back to `track.id`), `cacheColor` (skipped when no file)
- **Player context** in own file (`player-context.ts`) for Fast Refresh compat
- **`useLocalStorage`** with `aurora-` prefix (volume, repeat, shuffle, theme, glass)
- **Art-reactive theming**: `fast-average-color` → `--art` CSS var → `--player-glow`; extracted lazily only for current track
- **Object URL lifecycle**: `parseFiles` creates art+audio URLs; `revokeTrack` frees them
- **Progressive loading**: `parseFiles` uses concurrent pool of 5, `onBatch` callback every 20 tracks
- **`useSyncedRef`** pattern for reading mutable state inside callbacks
- **FS Access API** (Chromium only): handle persisted in IndexedDB, auto-reconnect on mount
- **`react-virtuoso`** for all track lists at every breakpoint — a single `<Virtuoso customScrollParent={main}>` virtualizes against the `<main>` scroller (no fixed-height box, no nested scrollbar, no mobile `.map()` fork). `AppShell` captures `<main>` via a `setScrollParent` ref-callback and passes the element to `Library`/`Albums` (rendered only once it's set)
- **MediaSession API**: sets metadata + play/pause/next/prev handlers

### Layout Model
> Sizing/breakpoints below are written in Tailwind-style shorthand for brevity (`h-dvh`, `md:grid`, `w-16` = 4rem). The app has **no Tailwind** — these map to Chakra responsive style props (e.g. `h="dvh"`, `display={{ md: 'grid' }}`, `w="16"`). Read them as intent, not literal classes.
- **Outer div**: `h-dvh overflow-hidden` mobile / `md:min-h-svh md:overflow-auto md:grid`
- **Sidebar**: collapsible (default collapsed `w-16`, expanded `w-64`), toggle in header; Settings pinned at bottom; `md:sticky md:top-0 md:max-h-[calc(100svh-4rem)]`
- **`<main>`** is the scroll container at **every** breakpoint: `flex-1 overflow-y-auto pb-[8.5rem] md:pb-16`. Outer is `h-dvh overflow-hidden md:h-svh md:grid` — it never scrolls; only `<main>` does
- **TabBar** (mobile only): `h-14 fixed bottom-0`; includes Settings as separate NavLink (not in `NAV_ITEMS`)
- **TransportBar**: Spotify-style single row desktop (`h-16 bottom-0`), compact mobile (`h-20 bottom-14`); track-info left, controls center, scrubber+volume right (desktop-only)
- **NowPlaying**: full-screen overlay (mobile), triggered by TransportBar tap

## Style Rules
- **No code comments** — omit entirely, except a short justification inside an empty `catch {}` (eslint `no-empty` requires it; see `fs-access.ts` / `library-cache.ts`)
- **Chakra UI v3 + Emotion** for all styling — no Tailwind, no shadcn. Style props on Chakra primitives (`Box`, `Flex`, `Text`, `chakra.*`) and `layerStyle` for reusable patterns. Use `chakra.button`/`chakra.img`/`chakra.input` for native elements needing style props
- **Theme system** in `src/theme/system.ts` (`createSystem(defaultConfig, defineConfig({...}))`). Single dark-green theme — semantic tokens have flat values (no color mode, no theme switching). After adding tokens/layerStyles, re-run `npx @chakra-ui/cli typegen src/theme/system.ts --strict`
- **Semantic tokens**: `bg="background"` (#121212), `color="foreground"`, `bg="card"`/`elevated`/`secondary`/`muted`, `color="mutedForeground"`, `primary` (#1db954). Token names mirror the old CSS-var names
- **Glass surfaces**: `layerStyle="glass" | "glassSidebar" | "glassElevated"` (`backdrop-filter: blur(24px) saturate(1.2)`). The only custom condition is `_noGlass` (`.no-glass &`), which swaps glass for an opaque fill; the `.no-glass` class is toggled on `documentElement` by `GlassToggle`
- **Accent gradient**: `linear-gradient(120deg,#1db954,#1ed760)` — exposed as `layerStyle="accentGradient"` (fill) and `"accentGradientText"` (clipped text). Used by PlayFAB, active-row left-bar, scrubber fill
- **Runtime glow**: `PlayerProvider` sets `--art`/`--player-glow` CSS vars on `documentElement`; reference via `css={{ background: 'var(--player-glow)' }}`
- **Active track**: 2px gradient left-bar, equalizer (3 staggered `equalizer1/2/3` keyframes; reduced-motion disables them), like button hover-revealed

## Verification
`lint` → `typecheck` → `test` → `build`. CI (`.github/workflows/ci.yml`) runs `npm run typecheck` then `npm test`; both must pass. Tests live in `tests/` (mirrors `src/`/`server/`/`shared/`). Most run in Vitest's `node` environment (logic, Fastify `app.inject`, server `db`/`scan`, IndexedDB via `fake-indexeddb`); hooks, components, and providers opt into `happy-dom` per file (`// @vitest-environment happy-dom` + `@testing-library/react`). Fully covered (100%): the **whole `server/src`**, **all of `src/services`**, and **all of `src/hooks` and `src/components`** (every hook, provider, and component — including `NowPlaying`, `TransportBar`, `TabBar`, the album views, `LibrarySection`, and `VolumeIcon`), plus `shared`/`utils`. Uncovered: `App.tsx`, `src/pages`, and `src/contexts`. See [docs/development-guide.md](docs/development-guide.md#testing) for the per-kind patterns and gotchas (dual `music-metadata` mock, server modules reading env at import, mocking `node:worker_threads`, testing the `index.ts` bootstrap, IndexedDB error/migration stubs).

## Gotchas
- `"type": "module"` in package.json — ESM only
- Library state (queue, current track) is **in-memory only** (lost on refresh), but parsed **metadata is cached in IndexedDB** (`library-cache.ts`, DB `aurora-library` v2, two stores): `tracks` holds title/artist/album/duration/artColor + an `artHash`, keyed by `folder/name|size|lastModified`; `art` holds each cover-image `Blob` **once**, keyed by its SHA-256 content hash. `parseFiles` reads the cache **per file** via `getCached` (deliberately not a bulk `getAll`, which would hold every art `Blob` in memory and OOM large libraries). Cache hits skip `parseBlob`; `clearCache` runs on disconnect (not refresh). Object URLs (`url`/`artUrl`) are regenerated each session, never persisted.
- **Cover art is deduped by content hash** (`Track.artHash`). Tracks of one album share byte-identical art → one `art` row, one `Blob`, one object URL. Two registries in `library.ts`: `artUrls` `Map<hash, objectURL>` hands every track with that hash the same URL; `artColors` `Map<hash, color>` caches the extracted glow color so it's decoded **once per unique image**, not per track — switching tracks within an album triggers no new art request or `fast-average-color` decode. `revokeTrack` does **not** revoke art (it's shared); `clearLibrary` calls `revokeAllArt()` to clear both registries. Warm loads seed `artColors` from each cached track's color.
- `pruneCacheToScan(allScannedKeys)` deletes every `tracks` key not in the set, then deletes orphaned `art` rows (hashes no longer referenced) — **only safe when passed a complete directory scan** (all `parseFiles` callers do). Never call it with a partial set.
- `CachedTrack` / store shape is at **DB version 2**; `open()` wipes+recreates `tracks` on upgrade (cache is rebuildable). If you change the shape, bump `DB_VERSION` and adjust `onupgradeneeded`, or stale rows deserialize with missing fields.
- `music-metadata` `parseBlob` is async per file — batch but don't block UI
- Web Audio API **not** in MVP
- FS Access API only Chromium; `isSupported()` provides fallback message
- `PermissionStatus` DOM type conflicts with custom string union → renamed to `FsPermissionStatus`
- Virtuoso: `fixedItemHeight={56}`, `data` prop, `itemContent(index, item)` signature, `customScrollParent={main}` (so no wrapping fixed-height div — it grows inside `<main>`)
- `customScrollParent` must be a real element, so `Library`/`Albums` receive a non-null `HTMLElement` — `AppShell` withholds them until the `<main>` ref-callback has set state