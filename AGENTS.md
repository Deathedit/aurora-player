# Aurora Player — Agent Notes

## Commands
- **Dev:** `npm run dev`
- **Build (gate):** `npm run build` — `tsc -b && vite build`; tsc must pass
- **Lint:** `npm run lint` — eslint; no separate typecheck

## TS Conventions
- `verbatimModuleSyntax` → `import type` for type-only imports
- `erasableSyntaxOnly` → no `enum`/`namespace`/parameter properties; use `as const`
- `noUnusedLocals` / `noUnusedParameters` → prefix unused params with `_`
- Project refs: `tsconfig.app.json` (src) + `tsconfig.node.json` (vite config)

## Architecture
**Local-files music player** — no backend/streaming. FS Access API picks folders from disk, `music-metadata` parses metadata, single `<audio>` element plays.

### Core Patterns
- **Hash routing** (`HashRouter`): `/#/` Library, `/#/albums`, `/#/settings`; Now-Playing is overlay
- **Single `<audio>`** in `PlayerProvider`; URLs are `URL.createObjectURL(file)` — must revoke on replace
- **Player context** in own file (`player-context.ts`) for Fast Refresh compat
- **`useLocalStorage`** with `aurora-` prefix (volume, repeat, shuffle, theme, glass)
- **Art-reactive theming**: `fast-average-color` → `--art` CSS var → `--player-glow`; extracted lazily only for current track
- **Object URL lifecycle**: `parseFiles` creates art+audio URLs; `revokeTrack` frees them
- **Progressive loading**: `parseFiles` uses concurrent pool of 5, `onBatch` callback every 20 tracks
- **`useSyncedRef`** pattern for reading mutable state inside callbacks
- **FS Access API** (Chromium only): handle persisted in IndexedDB, auto-reconnect on mount
- **`react-virtuoso`** for virtualized lists on desktop; simple `.map()` on mobile (no nested scroll)
- **MediaSession API**: sets metadata + play/pause/next/prev handlers

### Layout Model
- **Outer div**: `h-dvh overflow-hidden` mobile / `md:min-h-svh md:overflow-auto md:grid`
- **Sidebar**: collapsible (default collapsed `w-16`, expanded `w-64`), toggle in header; Settings pinned at bottom; `md:sticky md:top-0 md:max-h-[calc(100svh-4rem)]`
- **`<main>`**: `overflow-y-auto pb-[8.5rem]` mobile / `md:overflow-visible md:mb-16` desktop
- **TabBar** (mobile only): `h-14 fixed bottom-0`; includes Settings as separate NavLink (not in `NAV_ITEMS`)
- **TransportBar**: Spotify-style single row desktop (`h-16 bottom-0`), compact mobile (`h-20 bottom-14`); track-info left, controls center, scrubber+volume right (desktop-only)
- **NowPlaying**: full-screen overlay (mobile), triggered by TransportBar tap

## Style Rules
- **No code comments** — omit entirely
- **Semantic Tailwind tokens only** — `bg-background`, `text-foreground`, `bg-primary`, etc.
- **shadcn/ui base-nova** + `@base-ui/react`
- **Glass surfaces**: `.glass` / `.glass-sidebar` with `backdrop-blur-xl`
- **Accent gradient**: `linear-gradient(120deg,#8B5CF6,#FF5CA8)` — PlayFAB, active-row left-bar, scrubber fill
- **Numerics**: `tabular-nums` on duration/time
- **Active track**: 2px gradient left-bar, equalizer (3 bars staggered), like button `opacity-0 group-hover:opacity-100`

## Verification
`lint` → `build`. No test suite — `npm run build` passing is the gate.

## Gotchas
- `"type": "module"` in package.json — ESM only
- Library state (queue, current track) is **in-memory only** (lost on refresh), but parsed **metadata is cached in IndexedDB** (`library-cache.ts`, DB `aurora-library`): title/artist/album/duration/artColor + cover-art `Blob`, keyed by `folder/name|size|lastModified`. Cache hits on rescan skip `parseBlob`; `pruneCache` drops keys no longer on disk; `clearCache` runs on disconnect (not refresh). Object URLs (`url`/`artUrl`) are regenerated each session, never persisted.
- `music-metadata` `parseBlob` is async per file — batch but don't block UI
- Web Audio API **not** in MVP
- FS Access API only Chromium; `isSupported()` provides fallback message
- `PermissionStatus` DOM type conflicts with custom string union → renamed to `FsPermissionStatus`
- Virtuoso: on desktop only (hidden on mobile), `fixedItemHeight={56}`, `data` prop, `itemContent(index, item)` signature
- Mobile scroll: outer div is `h-dvh overflow-hidden`; `<main>` is scroll container, Virtuoso not used on mobile