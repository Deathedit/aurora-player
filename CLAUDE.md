# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A detailed companion lives in [AGENTS.md](AGENTS.md) — consult it for the full architecture, layout model, style rules, and gotchas. This file is the high-level orientation.

## Commands

- **Dev:** `npm run dev` (Vite). Open in Chrome/Edge — the File System Access API is Chromium-only.
- **Build / gate:** `npm run build` → `tsc -b && vite build`. `tsc` must pass; this is the only verification gate.
- **Lint:** `npm run lint` (eslint). No separate typecheck step; no test suite.

## Architecture

Aurora Player is a **client-only, local-files music player** — no backend, no streaming, no network. The whole flow is browser-side:

1. **FS Access API** (`services/fs-access.ts`, `hooks/useFsAccess.ts`, `FsAccessProvider`) picks a folder from disk. The directory handle is persisted in IndexedDB and auto-reconnects on mount; permission is re-requested as needed.
2. **`services/library.ts`** walks the handle, reads files, and parses tags with `music-metadata` (`parseBlob`, async per file). Loading is progressive: a concurrency pool of 5 with an `onBatch` callback every 20 tracks so the UI fills in without blocking. Each track gets object URLs for audio and cover art (`URL.createObjectURL`); `revokeTrack` frees them.
3. **`PlayerProvider`** owns a single `<audio>` element and all playback state, exposed through `player-context.ts`. Object URLs must be revoked when the current track is replaced. It wires the **MediaSession API** for system controls and drives **art-reactive theming**: `fast-average-color` extracts the current cover's color into the `--art` CSS var, which feeds `--player-glow`.

Playback **state** (queue, current track) is in-memory only and lost on refresh, but parsed **metadata is cached in IndexedDB** (`services/library-cache.ts`): on rescan, cache hits skip `parseBlob`/color extraction, so a returning library loads near-instantly. The cache stores text metadata + cover-art `Blob` keyed by `folder/name|size|lastModified`; object URLs (`url`/`artUrl`) are regenerated every session, never persisted. `parseFiles` bulk-reads the cache once (`getAllCached`) per scan; `pruneCacheToScan` drops files removed from disk (must be given the full scan); `clearCache` runs only on disconnect (refresh keeps the cache).

### Conventions that bite

- **Contexts live in their own files** (`player-context.ts`, `fs-access-context.ts`), separate from the providers, to keep React Fast Refresh working.
- **No code comments** — match the existing style and omit them.
- **Tailwind: semantic tokens only** (`bg-background`, `text-foreground`, `bg-primary`…); shadcn/ui base-nova + `@base-ui/react`. The accent gradient `linear-gradient(120deg,#8B5CF6,#FF5CA8)` is the brand element.
- **TS strictness** (see `tsconfig.app.json`): `verbatimModuleSyntax` → use `import type`; `erasableSyntaxOnly` → no `enum`/`namespace`/parameter properties (use `as const`); `noUnusedLocals`/`noUnusedParameters` → prefix intentionally-unused params with `_`.
- **`useLocalStorage`** persists UI prefs under the `aurora-` key prefix (volume, repeat, shuffle, theme, glass).
- **ESM only** (`"type": "module"`).
- **Virtualization is desktop-only**: `react-virtuoso` (`fixedItemHeight={56}`) on desktop; plain `.map()` on mobile, because the mobile layout uses `<main>` as the single scroll container (`h-dvh overflow-hidden` outer) and nested scroll would break.
