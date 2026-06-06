# Components & Logic

Component hierarchy, the virtualization strategy, a reference for every custom hook / service /
type, and the Chakra v3 patterns used throughout.

---

## 1. Component hierarchy

Components fall into three groups: **providers** (state, no UI), **pages** (route containers), and
**reusable UI**.

```
App
└── AppShell                         # layout frame (manual, not a route layout)
    ├── Sidebar                      # desktop nav (collapsible)
    ├── <main> (scroll container)
    │   └── Routes
    │       ├── Library              # page: virtualized track list
    │       │   ├── TrackRow ×N      # one row (memoized) — also embeds Equalizer
    │       │   └── SearchDialog     # K command palette (Dialog) — reuses TrackRow
    │       ├── Albums               # page: grid/list of albums + in-page detail
    │       │   ├── AlbumGridItem    # grid cell (button)
    │       │   ├── AlbumListRow     # list row (virtualized)
    │       │   └── AlbumDetail      # selected-album track list (virtualized)
    │       └── Settings             # page
    │           ├── LibrarySection   # connect/rescan (local or server variant)
    │           └── GlassToggle      # glass on/off switch
    ├── TransportBar                 # persistent player bar (desktop row / mobile compact)
    │   ├── Scrubber, VolumeControl, ShuffleButton, RepeatButton
    ├── TabBar                       # mobile bottom nav
    └── NowPlaying                   # full-screen Chakra Dialog (focus-trapped)
        └── Scrubber, VolumeControl, ShuffleButton, RepeatButton
```

**Pages vs reusable UI.** Pages (`pages/`) own data selection and layout — e.g. `Library` sorts the
library and feeds `Virtuoso`; `Albums` groups tracks into `AlbumGroup`s and manages the
grid/list/detail view. They render small, focused, reusable components from `components/`. Transport
controls (`Scrubber`, `VolumeControl`, `ShuffleButton`, `RepeatButton`) are shared between the
`TransportBar` and the `NowPlaying` dialog — they read/write player state via `usePlayer()` and take
only presentational props (icon size, slider props), so both hosts reuse them unchanged.

**Native elements** use Chakra's factory (`chakra.button`, `chakra.img`, `chakra.input`) so they
accept style props while staying semantic — the app styles primitives directly rather than wrapping
Chakra's higher-level `Button`/`Image`.

---

## 2. Virtualization strategy (react-virtuoso)

Long lists are virtualized with **one component everywhere**: a single `<Virtuoso>` that scrolls
against the page's `<main>` element rather than its own internal scroller.

### The pattern

```tsx
// pages/Library.tsx
<Virtuoso
  data={sorted}
  itemContent={renderTrack}        // (index, track) => <TrackRow ... />
  fixedItemHeight={56}
  customScrollParent={scrollParent} // the shared <main> element
/>
```

- **`customScrollParent={main}`** — instead of a fixed-height scroll box, Virtuoso virtualizes
  against `<main>`. There's no nested scrollbar and no separate mobile code path; the list grows
  inside the one page scroller at every breakpoint.
- **`fixedItemHeight`** — rows are a known height (`56` for tracks, `64` for album list rows), so
  Virtuoso skips measurement.
- **The `scrollParent` handshake** — `AppShell` captures `<main>` via a ref-callback into state and
  withholds `Library`/`Albums` until it's set (`withScroll` returns `null` otherwise), guaranteeing
  `customScrollParent` receives a real, non-null `HTMLElement`. See
  [architecture-and-wiring.md](architecture-and-wiring.md#2-routing-architecture).
- **Memoized rows** — `TrackRow` is wrapped in `React.memo` so scrolling re-renders only new rows.
  `renderTrack`/`itemContent` are module-level or stable callbacks to avoid re-creating per render.

### What is and isn't virtualized

| View | Virtualized? | Detail |
|---|---|---|
| Library track list | ✅ `Virtuoso`, `fixedItemHeight={56}` | The main list. |
| Albums — **list** view | ✅ `Virtuoso`, `fixedItemHeight={64}` | `AlbumListRow`s. |
| Album **detail** track list | ✅ `Virtuoso` | Receives the same `scrollParent`. |
| Albums — **grid** view | ❌ Chakra `SimpleGrid` | Responsive `columns={{ base: 2, sm: 3, lg: 4, xl: 6 }}`; album counts are small enough not to need virtualization. |

---

## 3. Custom hooks & utilities

### Hooks (`src/hooks/`)

#### `usePlaybackEngine(options)` — [usePlaybackEngine.ts](../src/hooks/usePlaybackEngine.ts)
The transport core. Owns the playback state machine driving the single `<audio>` element.

- **Arguments:** `{ audioRef: RefObject<HTMLAudioElement | null>; libraryRef: RefObject<Track[]>;
  repeatRef: RefObject<RepeatMode>; shuffleRef: RefObject<boolean>; volume: number }`. The `*Ref`s
  are synced refs (see `useSyncedRef`) so event callbacks read current values without re-subscribing.
- **Returns:** `{ currentId, isPlaying, currentTime, duration, queue, play, toggle, next, prev,
  seek, restoreLastPlayed, resetPlayback }`.
- **Side effects:** binds `<audio>` events (`timeupdate`, `loadedmetadata`, `ended`, `play`,
  `pause`); advances on `ended` per `repeat` mode; throttles position saves to ~every 5s; pushes
  play history (capped at 100) so `prev` walks back; sets `el.volume` when `volume` changes.
- **Tested:** [`tests/hooks/usePlaybackEngine.test.tsx`](../tests/hooks/usePlaybackEngine.test.tsx)
  (happy-dom + Testing Library, mock `<audio>`) covers play/toggle/next/prev/seek, the
  `ended`×repeat-mode paths, volume, reset, and resume-from-`localStorage`.

#### `usePositionPersistence(params)` — [usePositionPersistence.ts](../src/hooks/usePositionPersistence.ts)
Resume-where-you-left-off. Used internally by the playback engine.

- **Arguments:** refs + setters from the engine (`audioRef`, `currentIdRef`, `libraryRef`,
  `shuffleRef`, `historyRef`, `setQueue`, `setCurrentId`).
- **Returns:** `{ savePosition, restoreLastPlayed, restoringRef, restoredRef, lastSaveRef }`.
- **Side effects:** writes `aurora-lastplayed` (`{ key: trackKey(track), time }`) to `localStorage`;
  listens on `beforeunload` and `visibilitychange` (hidden) to save; `restoreLastPlayed(tracks)`
  finds the track by `trackKey`, seeks to the saved time on `loadedmetadata` (with a 5s safety
  timeout), and guards re-entry with `restoredRef`/`restoringRef`.

#### `useArtColor(current)` — [useArtColor.ts](../src/hooks/useArtColor.ts)
Drives art-reactive theming.

- **Arguments:** `current: Track | null`.
- **Returns:** `void`.
- **Side effects:** sets/removes the `--art` CSS var on `documentElement`. Reuses a known color
  (`track.artColor` or the in-memory `artColors` registry keyed by `artHash`); otherwise calls
  `extractArtColor` (fast-average-color) and, in local mode, persists the result via `cacheColor`.
  Decodes each unique image **once**.

#### `useMediaSession(current, toggle, next, prev)` — [useMediaSession.ts](../src/hooks/useMediaSession.ts)
Wires OS media controls.

- **Arguments:** `current: Track | null`, and the three transport callbacks.
- **Returns:** `void`.
- **Side effects:** sets `navigator.mediaSession.metadata` (title/artist/album/artwork) and
  `play`/`pause`/`nexttrack`/`previoustrack` action handlers. No-op if `mediaSession` is
  unsupported.

#### `useFsAccess(addFiles, clearLibrary)` — [useFsAccess.ts](../src/hooks/useFsAccess.ts)
Local-mode folder lifecycle (consumed by `FsAccessProvider`).

- **Arguments:** `addFiles: (entries: FileEntry[]) => Promise<void>`, `clearLibrary: () => void`.
- **Returns:** `FsAccessState` (`connected`, `dirName`, `scanning`, `reconnectNeeded`, `supported`)
  plus `connect`, `reconnect`, `refresh`, `disconnect`, `initOnMount`.
- **Side effects:** picks/persists a directory handle, walks it for audio files, scans into the
  player (guarded by `scanningRef` so concurrent scans can't overlap), and re-connects a stored
  handle on mount when permission is still granted.

#### `useLocalStorage<T>(key, initialValue)` — [useLocalStorage.ts](../src/hooks/useLocalStorage.ts)
Persisted state, `useState`-shaped.

- **Arguments:** `key: string` (auto-prefixed `aurora-`), `initialValue: T`.
- **Returns:** `[T, (value: T | ((prev: T) => T)) => void]`.
- **Side effects:** lazy-reads from `localStorage` on init; writes JSON on change. Both wrapped in
  `try/catch` (corrupt value → initial; quota exceeded → silently skipped).

#### `useVolumeWheel(enabled?)` — [useVolumeWheel.ts](../src/hooks/useVolumeWheel.ts)
Mouse-wheel volume on a container (desktop only).

- **Arguments:** `enabled = true`.
- **Returns:** a stable callback ref `(el: HTMLElement | null) => void` — spread onto the target
  element's `ref`.
- **Side effects:** on attach, binds a non-passive `wheel` listener (cleaned up on detach) that
  nudges volume ±0.05 (clamped 0–1). Inactive on touch/mobile (`useIsDesktop`) or when `enabled`
  is false. Uses a callback ref rather than a `RefObject`+effect so it still binds inside
  Chakra `Dialog` content, which mounts a tick late via Presence.

#### `useSyncedRef<T>(value)` — [useSyncedRef.ts](../src/hooks/useSyncedRef.ts)
Keeps a ref mirroring the latest value so stable callbacks read fresh state without re-subscribing.

- **Arguments:** `value: T`. **Returns:** `RefObject<T>` (updated in an effect each render).

#### `useCurrentTrack()` — [useCurrentTrack.ts](../src/hooks/useCurrentTrack.ts)
- **Returns:** `Track | null` — the library entry matching `currentId`, memoized. Convenience for
  components that need the current track but not the whole player API.

#### `useIsDesktop()` — [useIsDesktop.ts](../src/hooks/useIsDesktop.ts)
- **Returns:** `boolean` — tracks `(min-width: 768px)` via `matchMedia`, updating on change.

### Services (`src/services/`)

| Module | Key exports | Responsibility |
|---|---|---|
| [`library.ts`](../src/services/library.ts) | `parseFiles`, `revokeTrack`, `revokeAllArt`, `extractArtColor`, `cacheColor`, `getArtColor`/`setArtColor`, `fileEntry` | Local-mode pipeline: filter audio, read cache or `parseBlob`, build `Track`s, dedupe art by SHA-256 + object-URL registry, extract colors. Concurrency pool of 5, `onBatch` every 20 tracks. `music-metadata` and `fast-average-color` are lazy-imported. (Tested.) |
| [`library-cache.ts`](../src/services/library-cache.ts) | `cacheKey`, `trackKey`, `getCached`/`putCached`, `getArt`/`putArt`, `setCachedColor`, `pruneCacheToScan`, `clearCache` | IndexedDB (`aurora-library` v2): `tracks` + `art` stores. `trackKey(track)` returns the content key when a `File` is present, else `track.id` (server mode). (Tested with `fake-indexeddb`.) |
| [`queue.ts`](../src/services/queue.ts) | `buildQueue(tracks, currentId, shuffle)`, `shuffleArray` | Pure queue construction: in-order when not shuffling, else current-first + Fisher–Yates shuffle of the rest. (Unit-tested.) |
| [`backend.ts`](../src/services/backend.ts) | `checkHealth`, `fetchTracks`, `rescan` | Server-mode client: health probe, NDJSON streaming parser → `Track`s with HTTP `url`/`artUrl`, rescan trigger. (Tested.) |
| [`fs-access.ts`](../src/services/fs-access.ts) | `isSupported`, `pickDirectory`, `getStoredHandle`, `query`/`requestPermission`, `readDirectory`, `clearStoredHandle` | File System Access wrapper: directory picker, handle persistence in IndexedDB (`aurora-fs`), recursive audio walk. Chromium-only. |
| [`audio-files.ts`](../src/services/audio-files.ts) | re-exports `AUDIO_EXTS`/`isAudioFile`; `FileEntry` | Thin bridge to `shared/audio.ts` + the `FileEntry` type. |

### Utilities & shared

- [`utils/time.ts`](../src/utils/time.ts) — `formatTime(seconds: number): string` → `m:ss`, guarding
  against `NaN`/`Infinity`/negatives (returns `0:00`). (Unit-tested.)
- [`shared/audio.ts`](../shared/audio.ts) — `AUDIO_EXTS` regex + `isAudioFile(name)`; shared by
  frontend and server.
- [`shared/metadata.ts`](../shared/metadata.ts) — `TrackMeta` interface + `albumFallback(album,
  folder)` (folder name when the album tag is missing/`Unknown Album`). (Unit-tested.)

### Core types (`src/types/index.ts`)

```ts
export interface Track extends TrackMeta {   // TrackMeta from shared/metadata.ts
  file?: File;        // present in local mode, absent in server mode
  url: string;        // blob: object URL (local) or /api/stream/:id (server)
  artUrl?: string;    // blob: URL (local) or /api/art/:hash (server)
  artColor?: string;  // cached dominant cover color
}

export type RepeatMode = 'off' | 'all' | 'one';
```

`TrackMeta` contributes `id`, `title`, `artist`, `album`, `folder?`, `durationSec`, `artHash?`,
`artType?`. The **`Track.file` invariant** is central: file-dependent code (`revokeTrack`,
`trackKey`, art-color caching) guards on it so the same `Track` shape works in both modes.

---

## 4. Chakra UI v3 usage patterns

- **Style props over CSS.** Layout/visuals are expressed as props on Chakra primitives:
  `<Flex alignItems="center" gap="3">`, `<Box mt="4" rounded="lg" bg="elevated">`. The `css` prop is
  used only for things props can't express (keyframe animations, dynamic CSS vars, descendant
  selectors like `&:hover .scrubber-track`).
- **Semantic tokens, not raw hex.** Colors come from the theme — `bg="background"`,
  `color="mutedForeground"`, `color="primary"` — so the palette lives in one place
  ([theme/system.ts](../src/theme/system.ts)).
- **`layerStyle` for reusable bundles.** `layerStyle="glass"`, `layerStyle="accentGradient"`,
  `layerStyle="accentGradientText"` — applied as a single prop instead of repeating declarations.
- **Responsive breakpoint objects.** `px={{ base: '4', sm: '6', lg: '8' }}`,
  `columns={{ base: 2, sm: 3, lg: 4, xl: 6 }}`, `display={{ base: 'flex', md: 'none' }}` — the
  idiomatic v3 way to vary a value per breakpoint (replacing Tailwind-style prefixes).
- **`chakra.*` factory for native elements.** `chakra.button`, `chakra.img`, `chakra.input` give
  semantic HTML full access to style props.
- **Compound components.** The Now-Playing overlay uses the v3 **`Dialog`** compound API
  (`Dialog.Root` / `Portal` / `Dialog.Positioner` / `Dialog.Content` / `Dialog.Title` /
  `Dialog.CloseTrigger`) — controlled via `open` + `onOpenChange`, which provides focus trapping,
  focus restoration, an inert background, and scroll lock by default. See
  [`NowPlaying.tsx`](../src/components/player/NowPlaying.tsx). The
  [`SearchDialog`](../src/components/library/SearchDialog.tsx) command palette uses the same API
  plus `Dialog.Backdrop` (`layerStyle="glassBackdrop"`) for its dimmed/frosted overlay.
- **Accessibility.** Icon-only `chakra.button`s carry `aria-label`s (strings in
  [`constants/text.ts`](../src/constants/text.ts)); toggles use `aria-pressed`; the `Scrubber` is a
  keyboard-operable `role="slider"`; the global `:focus-visible` ring in `globalCss` covers focus
  indication. The `Scrubber` (keyboard seek), `TrackRow` (Enter/Space/click activation), and
  `SearchDialog` (K opens, ↑/↓ highlight + `aria-selected`, Enter to play) keyboard
  behavior is covered by component tests under `tests/components/`.
