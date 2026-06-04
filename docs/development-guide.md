# Development Guide

Everything needed to run, build, configure, and contribute to Aurora Player.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 24** | CI (`.github/workflows/ci.yml`) runs on Node 24. There is no `engines` field pinning it, but match CI to avoid surprises. |
| **npm** | The repo ships a `package-lock.json`; use `npm` (not yarn/pnpm). |
| **A Chromium browser** (local mode) | The File System Access API (`showDirectoryPicker`) is Chromium-only — use Chrome or Edge. The app detects unsupported browsers and shows a fallback message; **server mode works in any browser.** |
| **Docker** (optional) | Only for the self-hosted, all-in-one server image. |

Install dependencies:

```bash
npm install
```

The optional backend has its own manifest:

```bash
cd server && npm install
```

---

## Environment variables

### Frontend

**The frontend uses no environment variables.** There are **no `VITE_*` vars** and no
`import.meta.env` reads in `src/`. Behavior that might otherwise be env-driven is decided at runtime
instead — most notably local vs server mode, chosen by probing `/api/health` (see
[architecture-and-wiring.md](architecture-and-wiring.md#dual-library-source)). In dev, Vite proxies
`/api` to `http://localhost:3000` (configured in [`vite.config.ts`](../vite.config.ts)), so running
the backend alongside `npm run dev` puts the app into server mode automatically.

### Backend (`server/`)

All configuration is plain Node `process.env`, read in [`server/src/config.ts`](../server/src/config.ts):

| Variable | Default | Meaning |
|---|---|---|
| `MUSIC_DIR` | `/music` | Absolute path to the music library to scan and stream from. Resolved with `path.resolve`. |
| `DB_PATH` | `/data/aurora.db` | Path to the SQLite database file (created if missing). |
| `PORT` | `3000` | HTTP port the server listens on (`host: 0.0.0.0`). |
| `STATIC_DIR` | `<dist>/../public` | Directory of the built frontend to serve. If it doesn't exist, the server runs **API-only** and logs a warning. |

Example:

```bash
MUSIC_DIR=/srv/music DB_PATH=/var/lib/aurora/aurora.db PORT=8080 node dist/server/src/index.js
```

---

## Scripts

### Frontend (root `package.json`)

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Start the dev server (HMR) at `http://localhost:5173`. Open in Chromium for local mode. |
| `npm run build` | `tsc -b tsconfig.app.json tsconfig.node.json && vite build` | Type-check the app + Vite config, then produce the production bundle in `dist/`. **`tsc` must pass.** |
| `npm run preview` | `vite preview` | Serve the built `dist/` locally to smoke-test the production build. |
| `npm run typecheck` | `tsc -b tsconfig.test.json` | Type-check `src` **and** `tests` without emitting. |
| `npm run lint` | `eslint .` | Lint (flat config, `eslint.config.js`). |
| `npm test` | `vitest run` | Run the test suite once. |
| `npm run test:watch` | `vitest` | Watch mode. |
| `npm run test:coverage` | `vitest run --coverage` | V8 coverage report (report-only, no thresholds). Output in `coverage/` (git-ignored). |
| `npm run format` | `prettier --write src tests` | Format source + tests. |
| `npm run format:check` | `prettier --check src tests` | Verify formatting (CI). |

**CI gate** (`.github/workflows/ci.yml`) runs `npm run typecheck` then `npm test`; `npm run build`
must also pass. Most tests are pure logic + Fastify HTTP tests in Vitest's `node` environment;
hooks, components, and providers opt into a `happy-dom` DOM environment. Fully covered (100%): the
**whole `server/src`** (`index`, `app`, `config`, `routes`, `static`, `db`, `scan`, `scanner`,
`scan-worker`), **all of `src/services`** (`backend`, `library`, `library-cache`, `queue`,
`fs-access`, `audio-files`), and **all of `src/hooks` and `src/components`** — every hook, every
provider (`PlayerProvider`, `LibrarySourceProvider`, `FsAccessProvider`), and every component
including the previously-uncovered `NowPlaying`, `TransportBar`, `TabBar`, the album views
(`AlbumGridItem`/`AlbumListRow`/`AlbumDetail`), `LibrarySection`/`SettingsButton`, and `VolumeIcon`
— plus `shared` and `utils`. Still uncovered: `App.tsx`, `src/pages`, and `src/contexts`.
`npm run test:coverage` is report-only (no thresholds).

### Backend (`server/package.json`)

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `tsx watch src/index.ts` | Run the server with reload. Needs `MUSIC_DIR`/`DB_PATH` (see above). |
| `npm run build` | `tsc -b` | Compile to `dist/`. |
| `npm start` | `node dist/server/src/index.js` | Run the compiled server. |

### Docker (combined image)

A root [`Dockerfile`](../Dockerfile) builds the frontend and server into one image that serves the
SPA and the API together; [`docker-compose.yml`](../docker-compose.yml) wires it up. This is the
intended way to self-host server mode — mount your music folder as `MUSIC_DIR` and a volume for
`DB_PATH`.

---

## Coding standards

These mirror [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) — consult those for the
canonical, terse rules.

### TypeScript strictness (`tsconfig.app.json`)

- **`verbatimModuleSyntax`** → use `import type { … }` for type-only imports.
- **`erasableSyntaxOnly`** → no `enum`, no `namespace`, no parameter properties; use `as const`
  objects/unions instead.
- **`noUnusedLocals` / `noUnusedParameters`** → prefix intentionally-unused params with `_`.
- **ESM only** (`"type": "module"`) across the repo.

### Component & module structure

- **No code comments.** Match the surrounding style and omit them — the one allowed exception is a
  short justification inside an otherwise-empty `catch {}` (the `no-empty` lint rule); see
  `services/fs-access.ts` / `services/library-cache.ts`.
- **Contexts live in their own files** under `src/contexts/`, separate from the provider component,
  to keep React Fast Refresh working. The `use*` hook that reads the context lives with it.
- **UI strings & nav config** go in [`constants/text.ts`](../src/constants/text.ts); pure helpers
  (e.g. `formatTime`) in `utils/`.
- **Styling is Chakra-only** — style props + `layerStyle`, semantic tokens, `chakra.*` for native
  elements. No Tailwind/CSS modules. After adding tokens or `layerStyle`s, regenerate types:
  `npx @chakra-ui/cli typegen src/theme/system.ts --strict`.

### Adding a new route

1. Create the page component in `src/pages/`. If it shows a long list, accept
   `scrollParent: HTMLElement` and render `<Virtuoso customScrollParent={scrollParent} … />`.
2. Add a `<Route path="…" element={…} />` in [`App.tsx`](../src/App.tsx) (wrap with `withScroll`
   only if the page needs the shared `<main>` scroller).
3. If it belongs in navigation, add an entry to `NAV_ITEMS` (and a matching icon) in
   [`constants/text.ts`](../src/constants/text.ts) — `Sidebar` and `TabBar` render from it.
4. Because routing uses `BrowserRouter` (clean URLs), no extra config is needed for dev/preview; the
   server's history fallback ([`server/src/static.ts`](../server/src/static.ts)) already covers
   self-hosted deployments.

### Adding a virtualized list

Reuse the established pattern: a single `<Virtuoso>` with `fixedItemHeight` and
`customScrollParent={scrollParent}`, a memoized row component, and a stable `itemContent` callback.
See [components-and-logic.md](components-and-logic.md#2-virtualization-strategy-react-virtuoso).

### Testing

Add tests under `tests/` mirroring the source path (`tests/services/…`, `tests/server/…`,
`tests/shared/…`, `tests/hooks/…`). Most run in Vitest's `node` environment — pure logic and the
Fastify app via `app.inject` (no DOM rendering); server tests reuse the
`tests/server/helpers.ts` `createTmpEnv()` setup.

**Hook/DOM tests** (`.test.tsx`) opt into a browser-like environment with a
`// @vitest-environment happy-dom` docblock and use `@testing-library/react`. Patterns by kind:

- **Hooks** — `renderHook` + `act`. The reference is
  [`tests/hooks/usePlaybackEngine.test.tsx`](../tests/hooks/usePlaybackEngine.test.tsx): it injects a
  fake `<audio>` through the engine's `audioRef` argument
  ([`tests/hooks/mock-audio.ts`](../tests/hooks/mock-audio.ts)) rather than relying on the DOM's
  unimplemented `HTMLMediaElement`.
- **Components** — `render` via the
  [`tests/components/render-with-player.tsx`](../tests/components/render-with-player.tsx) helper,
  which wraps the UI in `ChakraProvider` + the player contexts (see
  [`Scrubber.test.tsx`](../tests/components/Scrubber.test.tsx) /
  [`TrackRow.test.tsx`](../tests/components/TrackRow.test.tsx)).
- **Providers** — render the provider around a small probe component that reads its context, via the
  same `render-with-player` helper (see
  [`LibrarySourceProvider.test.tsx`](../tests/components/LibrarySourceProvider.test.tsx), which mocks
  `@/services/backend` and asserts the backend/local mode decision).
- **IndexedDB** (node env) — `import 'fake-indexeddb/auto'` at the top of the file, since neither
  Node nor happy-dom implements IndexedDB (see
  [`tests/services/library-cache-db.test.ts`](../tests/services/library-cache-db.test.ts)).
- **Network** (node env) — stub `global.fetch` with `vi.stubGlobal` and a real `ReadableStream`
  (see [`tests/services/backend.test.ts`](../tests/services/backend.test.ts)).
- **Server modules** (node env) — `config.ts`/`db.ts`/`scan.ts` read env and open SQLite at
  module-eval time, so call `createTmpEnv()` **before** dynamically `import()`-ing them (see
  [`tests/server/db.test.ts`](../tests/server/db.test.ts) /
  [`scan.test.ts`](../tests/server/scan.test.ts)). Isolate per test by wiping tables in `beforeEach`.
- **Node built-ins** (e.g. `node:worker_threads`) — mockable, but the factory **must spread the real
  module** and the replacement `Worker` must be a `class` (a `vi.fn(arrow)` is not `new`-able):
  `vi.mock('node:worker_threads', async (orig) => ({ ...(await orig()), Worker: MockWorker }))`. A
  hoisted (`vi.hoisted`) registry collects worker instances so tests can `fire('message'|'error'|'exit')`.
  See [`tests/server/scanner.test.ts`](../tests/server/scanner.test.ts).
- **The bootstrap** ([`server/src/index.ts`](../server/src/index.ts), top-level `await`) — mock every
  collaborator (`@server/app`'s `buildApp` → a stub app, `@server/static`, `@server/scanner`,
  `@server/db`), `vi.spyOn(process, 'exit')`, then `vi.resetModules()` + re-`import()` per scenario;
  drive shutdown with `process.emit('SIGTERM')` and `removeAllListeners` in `afterEach`. See
  [`tests/server/index.test.ts`](../tests/server/index.test.ts).
- **IndexedDB error paths** — `fake-indexeddb` never errors, so to cover the best-effort
  `onerror`/`reject`/catch branches, `vi.stubGlobal('indexedDB', …)` a hand-rolled stub whose
  requests/transactions fire `onerror` on the next microtask (open-fails vs ops-fail modes). Because
  `library-cache.ts` memoizes its `db()` promise, `vi.resetModules()` + dynamic `import()` per mode.
  See [`tests/services/library-cache-errors.test.ts`](../tests/services/library-cache-errors.test.ts).
  To exercise the v1→v2 **upgrade migration**, manually `indexedDB.open(name, 1)` and create the old
  stores **before** importing the module (see
  [`tests/services/library-cache-migrate.test.ts`](../tests/services/library-cache-migrate.test.ts)).

A global `setupFiles` ([`tests/setup-localstorage.ts`](../tests/setup-localstorage.ts)) installs an
in-memory `localStorage` (Node 24 ships a disabled global one that otherwise shadows happy-dom's).

> **Gotcha — dual `music-metadata`.** The server has its own copy under `server/node_modules`, so
> `scan.ts` resolves `music-metadata` there, not at the repo root. Mocking it requires the
> server-resolved path (`vi.mock('../../server/node_modules/music-metadata', …)`), not the bare
> specifier. Tests that touch `services/fs-access.ts` also need `src/types/fs-access.d.ts` in
> `tsconfig.test.json`'s `include` (its ambient File System Access types).

Run `npm test` (or `npm run test:coverage`) before pushing.
