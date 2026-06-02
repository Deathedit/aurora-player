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
3. **`PlayerProvider`** owns a single `<audio>` element and all playback state, exposed through `contexts/player-context.ts`. Object URLs must be revoked when the current track is replaced. It wires the **MediaSession API** for system controls and drives **art-reactive theming**: `fast-average-color` extracts the current cover's color into the `--art` CSS var, which feeds `--player-glow`.

Playback **state** (queue, current track) is in-memory only and lost on refresh, but parsed **metadata is cached in IndexedDB** (`services/library-cache.ts`): on rescan, cache hits skip `parseBlob`/color extraction, so a returning library loads near-instantly. The IndexedDB DB (`aurora-library`, v2) has two stores: `tracks` (text metadata + an `artHash`, keyed by `folder/name|size|lastModified`) and `art` (each cover image stored **once**, keyed by SHA-256 content hash). **Cover art is deduped**: tracks sharing identical art resolve to one `Blob` and one object URL via the `artUrls` registry in `services/library.ts`, so an album of 100 tracks holds one image, not 100. Object URLs are regenerated each session (never persisted) and freed by `revokeAllArt()` in `clearLibrary` — `revokeTrack` only frees the per-track audio URL. `parseFiles` reads the cache per file (`getCached`), not one bulk `getAll` (which would OOM large libraries); `pruneCacheToScan` drops removed files and orphaned art (must be given the full scan); `clearCache` runs only on disconnect.

### Conventions that bite

- **Contexts live in their own files** (`contexts/player-context.ts`, `contexts/fs-access-context.ts`), separate from the providers, to keep React Fast Refresh working. UI strings/nav config live in `constants/text.ts`; pure helpers like `formatTime` in `utils/time.ts`.
- **No code comments** — match the existing style and omit them.
- **Chakra UI v3 + Emotion** for all styling — no Tailwind, no shadcn. Style props on Chakra primitives (`Box`, `Flex`, `Text`, `chakra.*`) and `layerStyle` for reusable patterns. The theme system lives in `src/theme/system.ts` (`createSystem` + `defineConfig`). Two themes ("dark" default, "spotify") are modelled as custom `conditions` (`_spotify` targeting `.spotify &`), not Chakra's light/dark color mode. Glass effects use a `_noGlass` condition. Runtime `--art`/`--player-glow` CSS vars are set on `documentElement` by `PlayerProvider` and referenced via `css={{ background: 'var(--player-glow)' }}`. The accent gradient (`linear-gradient(120deg,#8B5CF6,#FF5CA8)` dark / green spotify) is exposed as `layerStyle="accentGradient"` and `layerStyle="accentGradientText"`. Semantic token names mirror the old CSS var names: `bg="background"`, `color="mutedForeground"`, `bg="elevated"`, etc. Use `chakra.button`, `chakra.img`, `chakra.input` for native elements that need Chakra style props. After adding custom tokens/layerStyles, re-run `npx @chakra-ui/cli typegen src/theme/system.ts --strict`.
- **TS strictness** (see `tsconfig.app.json`): `verbatimModuleSyntax` → use `import type`; `erasableSyntaxOnly` → no `enum`/`namespace`/parameter properties (use `as const`); `noUnusedLocals`/`noUnusedParameters` → prefix intentionally-unused params with `_`.
- **`useLocalStorage`** persists UI prefs under the `aurora-` key prefix (volume, repeat, shuffle, theme, glass).
- **ESM only** (`"type": "module"`).
- **One virtualized list everywhere**: a single `react-virtuoso` (`fixedItemHeight={56}`) with `customScrollParent={main}` handles all breakpoints. `<main>` is the only scroll container (outer is `overflow-hidden`); `AppShell` captures it via a ref-callback and passes the element to `Library`/`Albums`, which render only once it's set.
