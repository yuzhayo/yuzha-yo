
Action: file_editor create /app/manga/DOCUMENTATION.md --file-text 


"# `manga/` — Manga Reader Desktop App (Electron)

> Comprehensive technical documentation for the `manga/` workspace inside the
> `yuzha-yo` monorepo. This file is the in-folder reference. For how this
> workspace plugs into the monorepo root, see
> [`/MANGA_ROOT_INTEGRATION.md`](../MANGA_ROOT_INTEGRATION.md).

---

## 1. What This Workspace Is

`manga/` is a **self-contained Electron desktop application** named **“Manga Reader”** (appId `com.yuzha.manga`). It is **not** a browser app and is **not served via a Vite dev server in the conventional sense** — `electron-vite dev` spawns an Electron BrowserWindow that loads the dev-server URL internally.

It exposes two features behind a top tab bar:

| Tab | Purpose |
|-----|---------|
| 📖 **Reader** | Fully offline CBZ reader. Open a single `.cbz` file or scan a folder/library, with reading history, keyboard navigation, zoom, single-page / webtoon modes, and RTL toggle. |
| ⬇ **Downloader** | Scrape-and-download manga chapters from arbitrary manga websites into `.cbz` archives using hidden Electron BrowserWindows to scroll/harvest images. |

**There is no MangaDex API and no network access from the Reader.** All network requests originate exclusively from the Electron main process (via Node's global `fetch` / undici) when running the Downloader.

The migration plan that produced this codebase is preserved verbatim in `MANGA_ELECTRON_PLAN.md`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop shell | Electron | `^42.5.0` |
| Build orchestrator | electron-vite | `^5.0.0` |
| Renderer bundler | Vite (via electron-vite) | 7.x (transitive) |
| UI framework | React | `^18.3.1` |
| Language | TypeScript | `^5.6.3` |
| Styling | Tailwind CSS | `^3.4.17` (+ PostCSS, Autoprefixer) |
| CBZ reading (renderer) | `fflate` | `^0.8.2` |
| CBZ writing (main proc) | `jszip` | `^3.10.1` |
| Packaging | electron-builder | `^26.15.3` |
| HTTP (main proc) | Node global `fetch` (undici) | built-in |

**Critical placement rule** (BUG-01 in `MANGA_ELECTRON_PLAN.md`): `jszip` is in `dependencies`, not `devDependencies`. `electron-vite` externalizes all dependencies in the main process bundle, so anything `require`/`import`ed at runtime in `electron/main/*` must exist in `node_modules` after packaging.

---

## 3. Directory Layout

```
manga/
├── electron/                       # Electron-side code (Node runtime)
│   ├── main/
│   │   ├── index.ts                # App lifecycle, BrowserWindow, IPC handlers
│   │   └── downloader.ts           # Full scrape-and-download engine
│   └── preload/
│       └── index.ts                # contextBridge → exposes `window.api`
│
├── src/                            # Renderer-side code (Chromium runtime, React)
│   ├── App.tsx                     # Root; tab nav (Reader | Downloader)
│   ├── main.tsx                    # ReactDOM.createRoot entry
│   ├── index.html                  # Renderer HTML (loaded by Vite)
│   ├── index.css                   # Tailwind directives + body bg #0f0f1a
│   ├── env.d.ts                    # Ambient declaration for window.api
│   ├── types.ts                    # Shared types (Reader + Downloader IPC)
│   │
│   ├── reader/                     # Reader tab feature
│   │   ├── ReaderScreen.tsx        # Orchestrator: routes views home|library|reader
│   │   ├── MangaHome.tsx           # Home screen: history, library, file/folder open
│   │   ├── MangaLibrary.tsx        # Library/series chapter list
│   │   ├── MangaReader.tsx         # Page renderer (single + webtoon modes)
│   │   ├── MangaToolbar.tsx        # Top toolbar: title, page jump, back
│   │   ├── MangaControls.tsx       # Bottom controls: prev/next/zoom/mode/RTL
│   │   ├── MangaUploader.tsx       # File/drop helper
│   │   ├── useCbzLoader.ts         # CBZ → page Blob URLs (fflate)
│   │   ├── useFolderScanner.ts     # showDirectoryPicker → ScannedSeries[]
│   │   ├── useReaderState.ts       # currentPage, zoom, mode, RTL state
│   │   ├── useReadingHistory.ts    # localStorage history (key `manga_history_v1`)
│   │   └── useKeyboardNav.ts       # Arrow keys / +/-/0 / Ctrl+wheel
│   │
│   └── downloader/                 # Downloader tab feature
│       ├── DownloaderApp.tsx       # Job form + jobs list, IPC event consumer
│       └── JobCard.tsx             # Per-job UI: badge, progress, chapters
│
├── out/                            # Build output (electron-vite emits here)
│   ├── main/index.js               # Bundled main process (entry: package.json \"main\")
│   ├── preload/index.mjs           # Bundled preload
│   └── renderer/                   # Bundled renderer (HTML + assets)
│
├── electron.vite.config.ts         # electron-vite config (main/preload/renderer)
├── tsconfig.json                   # Solution file → references node + web
├── tsconfig.node.json              # main/preload + src/types.ts
├── tsconfig.web.json               # src/** renderer
├── tailwind.config.ts              # Content paths: src/** and electron/**
├── postcss.config.ts               # tailwindcss + autoprefixer
├── index.html                      # (legacy at root, unused by electron-vite)
├── package.json                    # Workspace manifest + electron-builder config
└── MANGA_ELECTRON_PLAN.md          # Original migration playbook (source of truth)
```

> The `index.html` at `manga/` root is **not** used by `electron-vite`. The
> renderer's true entry HTML is `manga/src/index.html` (referenced by
> `electron.vite.config.ts → renderer.build.rollupOptions.input`).

---

## 4. Process Model & Runtime Architecture

Electron has **two cooperating runtimes**. The split is enforced both physically (by folders) and at the TypeScript-project level (`tsconfig.node.json` vs `tsconfig.web.json`).

```
┌─────────────────────────────────────────────────────────────────┐
│                       Main Process (Node)                       │
│  electron/main/index.ts                                         │
│    • app lifecycle / BrowserWindow creation                     │
│    • ipcMain.handle('pick-folder' | 'open-folder' |             │
│                     'cancel-job' | 'start-job')                 │
│    • emit(JobEvent) → webContents.send('job-event', …)          │
│  electron/main/downloader.ts                                    │
│    • Hidden BrowserWindow scrapers                              │
│    • executeJavaScript-based DOM scrolling + image harvesting   │
│    • Node global fetch (undici) for image downloads             │
│    • JSZip → .cbz on disk                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │  IPC (structured-clone messages)
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    Preload (Node + isolated)                    │
│  electron/preload/index.ts                                      │
│    contextBridge.exposeInMainWorld(\"api\", {                     │
│      startJob, cancelJob, pickFolder, openFolder, onJobEvent    │
│    })                                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │  window.api (typed via src/env.d.ts)
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                  Renderer Process (Chromium)                    │
│  src/main.tsx → <App />                                         │
│  src/App.tsx — tab bar; both panels stay mounted (display:hide) │
│   ├── src/reader/ReaderScreen.tsx — local CBZ + localStorage    │
│   └── src/downloader/DownloaderApp.tsx — talks to window.api    │
└─────────────────────────────────────────────────────────────────┘
```

### Why both panels stay mounted (BUG-10 / Section 5.3 of plan)

`App.tsx` toggles a `hidden` Tailwind class instead of conditionally rendering. This preserves the user's reading position when they switch to the Downloader and back. The cost is a permanent React tree for both features — acceptable since neither holds heavy globals.

---

## 5. Bootstrap & Lifecycle

### 5.1 Dev mode (`npm run dev` inside `manga/`)

1. `electron-vite dev` reads `electron.vite.config.ts`.
2. It builds `electron/main/index.ts` and `electron/preload/index.ts` to `out/main` / `out/preload` (CommonJS-style entry suitable for Electron).
3. It starts a Vite dev server for the renderer rooted at `src/`. This server's URL is exported as the env var **`ELECTRON_RENDERER_URL`**.
4. It launches Electron, which executes `out/main/index.js` (the path declared by `package.json → \"main\"`).
5. `createMainWindow()` in `electron/main/index.ts` checks for `process.env.ELECTRON_RENDERER_URL`:
   - **Present (dev):** `mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)` + opens detached DevTools.
   - **Absent (prod):** `mainWindow.loadFile(path.join(__dirname, \"../renderer/index.html\"))`.

### 5.2 Production build (`npm run build` / `npm run dist:*`)

1. `electron-vite build` emits:
   - `out/main/index.js`
   - `out/preload/index.mjs`
   - `out/renderer/index.html` (+ hashed assets)
2. `npm run dist` (and `dist:win`, `dist:mac`, `dist:linux`) then runs `electron-builder`, which reads the `build` block in `package.json`:
   - `appId: com.yuzha.manga`, `productName: \"Manga Reader\"`, output to `release/`.
   - Files included: `out/**/*` minus `.map`.
   - Targets: `nsis` on Windows, `dmg` on macOS, `AppImage` on Linux.
   - Icons expected at `assets/icon.{ico,icns,png}` (note: the `assets/` folder is **not** present in this checkout — packaging without icons will produce a default-icon binary).

### 5.3 Window creation (`electron/main/index.ts → createMainWindow`)

Key properties:

| Property | Value | Reason |
|---|---|---|
| `width / height` | 1200 / 820 | Default app size |
| `minWidth / minHeight` | 800 / 600 | Prevents layout breakage |
| `backgroundColor` | `#0f0f1a` | Hides white flash before the dark UI mounts (matches `index.css`) |
| `titleBarStyle` | `hiddenInset` on darwin, `default` elsewhere | Native traffic-light look on macOS |
| `webPreferences.preload` | `path.join(__dirname, \"../preload/index.mjs\")` | Resolved from `import.meta.url` — relative to `out/main/` |
| `webPreferences.contextIsolation` | `true` | Renderer cannot touch Node directly |
| `webPreferences.nodeIntegration` | `false` | Defense-in-depth |
| `webPreferences.sandbox` | `false` | Required for the preload to call Node's `electron` APIs |

A native context menu (cut/copy/paste/select-all/undo/redo) is wired via `webContents.on(\"context-menu\")`, because Electron renderers have no default context menu and would otherwise silently swallow right-click paste.

### 5.4 Shutdown

`window-all-closed` quits the app on non-darwin platforms. On macOS the app stays alive (standard mac convention); `activate` re-opens a window if none exist.

---

## 6. IPC Contract (the only allowed Renderer ↔ Main channel)

Declared in three files that **must remain in sync** (failure mode: `window.api.X is not a function`):

| File | Role |
|---|---|
| `electron/main/index.ts` | `ipcMain.handle(...)` registrations |
| `electron/preload/index.ts` | `contextBridge.exposeInMainWorld(\"api\", …)` |
| `src/env.d.ts` | Ambient `Window[\"api\"]` type for the renderer |

### Channels

| Channel | Direction | Payload type | Return | Purpose |
|---|---|---|---|---|
| `pick-folder` | renderer → main (`invoke`) | — | `string \| null` | Open native folder picker dialog; returns first picked path or `null` if cancelled |
| `open-folder` | renderer → main (`invoke`) | `dir: string` | `void` | `shell.openPath(dir)` to reveal in the OS file explorer |
| `cancel-job` | renderer → main (`invoke`) | `jobId: string` | `void` | Sets `cancelFlags.set(jobId, true)`; the running job polls `isCancelled()` between awaits |
| `start-job` | renderer → main (`invoke`) | `StartJobOpts` | `string` (jobId) | Fire-and-forget: returns `job_<Date.now()>` immediately; the actual work runs in a detached IIFE |
| `job-event` | main → renderer (`send` / `on`) | `JobEvent` (discriminated union) | push (no return) | Progress stream: `phase` / `discover` / `chapter` / `progress` / `done` / `error` |

### `StartJobOpts`

```ts
interface StartJobOpts {
  startUrl: string;                       // URL of the first chapter to scrape
  direction: \"next\" | \"prev\";             // Which chapter-nav link to follow
  count: number;                          // How many chapters to fetch (≥1)
  outputDir: string;                      // Absolute folder path from pick-folder
  showScraperWindow?: boolean;            // If true, hidden scrape windows become visible (debug / CAPTCHA solving)
  onConflict?: \"rename\" | \"overwrite\";    // CBZ filename collision policy
}
```

### `JobEvent`

```ts
type JobEvent =
  | { type: \"phase\";    jobId; phase: \"discovering\" | \"downloading\" | \"done\" | \"error\";
                        chapters?: { url; title }[] }
  | { type: \"discover\"; jobId; current; total; url }
  | { type: \"chapter\";  jobId; chapter: Chapter }
  | { type: \"progress\"; jobId; done; total }
  | { type: \"done\";     jobId; message; outputDir; succeeded; failed }
  | { type: \"error\";    jobId; message };
```

`Chapter.status` flows: `pending → loading → scrolling → fetching → packaging → done` (or `→ error` at any step).

### Subscription semantics

`window.api.onJobEvent(cb)` is registered **once** on `DownloaderApp` mount (`subscribedRef`) and lives for the app lifetime. Re-registration would cause duplicate state updates.

In the main process, `emit(event)` guards against a destroyed window:

```ts
if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
  mainWindow.webContents.send(\"job-event\", event);
}
```

`cancelFlags` is a `Map<jobId, boolean>` that is cleaned up in a `finally` block in `start-job` — this prevents an unbounded leak across long sessions.

---

## 7. Downloader Engine (`electron/main/downloader.ts`)

### 7.1 Configuration (`CFG` constant — single source of truth)

```ts
SCROLL_STEP_PX:       2000     // (legacy) default scroll step
SCROLL_DELAY_MS:      400      // between scroll iterations
STABLE_NEED:          10       // # of stable iterations before exit
SCROLL_MAX_ITERATIONS: 60      // hard cap (safety net)
PAGE_TIMEOUT_MS:      20_000   // per-page navigation timeout
IMG_TIMEOUT_MS:       15_000   // per-image fetch timeout
IMG_RETRIES:          3
IMG_RETRY_DELAYS_MS:  [500, 1000, 2000]
CONCURRENCY:          3        // # of chapters fetched in parallel
UA:                   \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...\"
```

### 7.2 End-to-end pipeline (`runJob`)

```
runJob(jobId, opts, isCancelled, emit)
  ├── emit phase=discovering
  ├── discoverChapters(startUrl, direction, count, …)
  │     └── ONE hidden BrowserWindow reused across all chapters
  │         for each i in count:
  │           emit discover {current, total, url}
  │           loadPage(win, url)
  │           getPageTitle(win)
  │           if not last: url = findChapterLink(win, direction)
  ├── emit phase=downloading { chapters: [{url,title}, …] }
  ├── runParallel(chapters, …)
  │     └── sliding-window queue, up to CFG.CONCURRENCY in flight
  │         each → downloadChapter(chapter, …)
  │                 ├── createHiddenWindow(showScraperWindow)
  │                 ├── loadPage
  │                 ├── scrollAndCollect → ImageRef[]
  │                 │     • resets scroll
  │                 │     • neutralises alert/confirm/prompt to keep loop alive
  │                 │     • scrolls 80% of viewport per step
  │                 │     • stable when atBottom + height + img-count unchanged
  │                 │     • final pass: scrollIntoView on every <img>
  │                 │     • picks src from data-src / data-lazy-src /
  │                 │       data-original / data-url / srcset[0] / currentSrc / src
  │                 │     • drops thumbs (<=150×150) and non-http(s)
  │                 ├── for each image: downloadImage(url, referer=chapter.url)
  │                 │     • Node global fetch (NOT electron.net.fetch — see below)
  │                 │     • 3 attempts, backoff [500, 1000, 2000]ms
  │                 ├── packageCBZ(pages, title, series, outputDir, onConflict)
  │                 │     • JSZip compression: \"STORE\"  (CBZ readers expect uncompressed)
  │                 │     • filenames zero-padded: \"001.jpg\", \"002.png\", …
  │                 │     • ext sniffed from first 2 magic bytes
  │                 │     • output: <outputDir>/<sanitized series>/<sanitized title>.cbz
  │                 │     • collision: \"rename\" → \" (2).cbz\", \" (3).cbz\", … up to 9999, then timestamp
  │                 └── finally: win.destroy() if not destroyed
  └── emit done { succeeded, failed, message }
```

### 7.3 Hidden window settings (BUG-03)

```ts
new BrowserWindow({
  show: visible,                  // toggled by showScraperWindow option
  webPreferences: {
    contextIsolation: false,      // ESSENTIAL for executeJavaScript DOM read
    nodeIntegration: false,
    offscreen: false,             // true breaks lazy-loaders
  }
});
win.webContents.setUserAgent(CFG.UA);
win.webContents.setWindowOpenHandler(() => ({ action: \"deny\" }));  // block popup ads
```

### 7.4 Why Node `fetch`, not `electron.net.fetch`

Documented as a comment in `downloader.ts → fetchImageOnce`. `electron.net.fetch` runs through Chromium's `network_service_network_delegate`, which **cancels** requests when the explicit `Referer` header is judged invalid by the page's referrer policy (e.g. `comix.to → wowpic4.store`). Node's `fetch` (undici) sits in the Node runtime and honors the supplied headers verbatim, so the Referer + UA actually reach the origin.

### 7.5 CBZ integrity

CBZ is just a ZIP renamed to `.cbz`. Comic readers expect **uncompressed** entries so they can seek randomly without inflating. Hence `compression: \"STORE\"` (BUG-05).

---

## 8. Reader Feature (`src/reader/`)

### 8.1 Storage & history

- `useReadingHistory.ts` reads/writes `localStorage[\"manga_history_v1\"]` (capped at `MAX_ENTRIES = 50`, sorted MRU). It defensively filters out legacy `source: \"mangadex\"` entries (BUG-08).
- `HistoryEntry`:
  ```ts
  { key, source: \"file\" | \"folder\", identifier, displayTitle, seriesName?, page, totalPages, savedAt }
  ```
- `key` formats:
  - Single file: `file::<filename>`
  - Folder series chapter: `folder::<seriesName>::<chapterFileName>` (root-level loose `.cbz` files use `seriesName = \"__root__\"`)

### 8.2 CBZ → page Blob URLs (`useCbzLoader.ts`)

1. `FileReader.readAsArrayBuffer` (renderer-only — never crosses IPC).
2. `fflate.unzip` → entries.
3. Filter: `.jpg/.jpeg/.png/.webp/.gif/.avif`, exclude `__MACOSX/` and dotfiles.
4. Natural-sort filenames.
5. Each entry → `new Blob([bytes], { type: mime })` → `URL.createObjectURL`.
6. Previous blob URLs are revoked on next load/reset to prevent memory leaks.

### 8.3 Folder library (`useFolderScanner.ts`)

Uses the File System Access API: `window.showDirectoryPicker({ mode: \"read\" })`. Iterates two levels: a subdirectory containing `.cbz` files becomes a `ScannedSeries`; loose `.cbz` files at the root become a synthetic series called `\"📄 Standalone Files\"`.

`isFolderScanSupported()` is a feature check (`\"showDirectoryPicker\" in window`). Electron 42 (Chromium ≥126) supports it (BUG-11), but the API is unavailable in Firefox/Safari — relevant if anyone ever loads this UI in a non-Electron browser.

### 8.4 Reader state (`useReaderState.ts`)

- `currentPage` (clamped to `[0, totalPages-1]`)
- `zoom` ∈ `[MIN_ZOOM=0.5, MAX_ZOOM=4.0]`, step `0.25`
- `mode`: `\"single\" | \"webtoon\"` (default `\"webtoon\"`; toggling resets zoom + page)
- `rtl`: boolean — flips the meaning of `ArrowLeft`/`ArrowRight` in `useKeyboardNav`

### 8.5 Keyboard / wheel (`useKeyboardNav.ts`)

| Input | Action |
|---|---|
| `ArrowRight` / `ArrowLeft` | next / prev (swapped if `rtl`) |
| `ArrowDown` / `ArrowUp` | next / prev |
| `+` / `=` / `-` / `0` | zoom in / out / reset |
| `Ctrl + Wheel` | zoom in/out (preventDefault) |

Disabled (early-return) when focus is inside an `<input>` or `<textarea>`.

### 8.6 View routing (`ReaderScreen.tsx`)

`view: \"home\" | \"library\" | \"reader\"`. Auto-saves history on every page change (only when `view === \"reader\"` and the page actually changed). The `onBack` prop is intentionally **not** passed from `App.tsx` — the back button is hidden when there is no upstream container to return to.

---

## 9. Downloader UI (`src/downloader/`)

### 9.1 `DownloaderApp.tsx` state model

```ts
interface Job {
  id: string;                    // \"job_<Date.now()>\" from start-job invoke
  startUrl: string;
  direction: \"next\" | \"prev\";
  phase: \"discovering\" | \"downloading\" | \"done\" | \"error\";
  discoverCurrent?: number;
  discoverTotal?: number;
  chapters: Map<string, Chapter>;  // keyed by url, O(1) updates
  chapterOrder: string[];          // insertion order for rendering
  done: number;
  total: number;
  message?: string;
  outputDir: string;
  succeeded?: number;
  failed?: number;
}
```

`jobs` itself is a `Map<jobId, Job>`. Rendering uses `Array.from(jobs.values()).reverse()` so the newest job appears at the top of the list.

Two UI toggles persist to `localStorage`:

| Key | Effect |
|---|---|
| `downloader.showScraperWindow` | If `\"1\"`, hidden scrape windows are shown (debug / CAPTCHA) |
| `downloader.overwriteExisting` | If `\"1\"`, conflicts overwrite; otherwise rename with `\" (N)\"` suffix |

### 9.2 `JobCard.tsx`

Stateless. Reads `job.chapterOrder` to iterate chapters and `job.chapters.get(url)` to fetch the current state.

Visual primitives:

- **Phase badge** (top-left): amber=discovering, blue=downloading, emerald=done, red=error/failed, amber=partial.
- **Top progress bar**: `done/total × 100%`, color-coded by phase.
- **Per-chapter row**: status icon + title + phase label + thin progress bar.
- **`badgeForJob(job)`** computes a 3-state final outcome from `succeeded`/`failed`: `Done`, `Failed`, or `Partial N/M`.

---

## 10. Build Configuration

### 10.1 `electron.vite.config.ts`

```ts
defineConfig({
  main:    { plugins: [externalizeDepsPlugin()],
             build: { outDir: \"out/main\",
                      lib:  { entry: <abs>/electron/main/index.ts } } },
  preload: { plugins: [externalizeDepsPlugin()],
             build: { outDir: \"out/preload\",
                      lib:  { entry: <abs>/electron/preload/index.ts } } },
  renderer:{ root: <abs>/src,
             build: { outDir: \"out/renderer\",
                      rollupOptions: { input: <abs>/src/index.html } },
             plugins: [react()],
             resolve: { alias: { \"@\": <abs>/src } } },
});
```

Notes:

- `externalizeDepsPlugin()` keeps every `dependencies` entry as a runtime `require`, so they must exist in installed `node_modules` (re-emphasising BUG-01).
- The renderer uses `@/*` aliased to `src/*` — there is **no `@shared` alias**. The manga workspace is fully standalone (BUG-13). `grep \"@shared\" manga/src/` is expected to return zero matches.
- No Vite dev proxy is configured. The Reader is offline. The Downloader makes all network calls from the main process and so bypasses CORS entirely.

### 10.2 TypeScript project graph

```
tsconfig.json (solution file, files=[])
  ├── tsconfig.node.json      → electron/**, electron.vite.config.ts, src/types.ts
  │       types=[\"node\"]
  └── tsconfig.web.json       → src/**
          types=[\"vite/client\"]
          paths={ \"@/*\": [\"./src/*\"] }
          noUnusedLocals/Parameters: true
```

`src/types.ts` is the **only file deliberately shared between projects**. It defines IPC payload shapes consumed by both runtimes; it must not import anything renderer- or Node-specific.

`typecheck` script runs both projects in `--noEmit` mode:

```
tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json
```

### 10.3 Tailwind / PostCSS

- `tailwind.config.ts` content paths: `./src/**/*.{ts,tsx,html}` + `./electron/**/*.{ts,tsx}`.
- `postcss.config.ts` enables `tailwindcss` + `autoprefixer`.
- Tailwind directives live in `src/index.css`, plus a body background `#0f0f1a` and `overflow:hidden`.

### 10.4 Content-Security-Policy

`src/index.html` declares:

```
default-src 'self';
script-src 'self' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https:;
connect-src 'self' ws://localhost:* http://localhost:*;
```

`img-src blob:` is essential for CBZ rendering (each page is a Blob URL). `connect-src ws://localhost:*` is for Vite HMR in dev. No remote scripts are ever loaded into the main window — all scraping happens inside isolated hidden BrowserWindows, which have no CSP relationship with the main window.

---

## 11. Scripts (`manga/package.json`)

| Script | Effect |
|---|---|
| `dev` | `electron-vite dev` — launches Electron + HMR renderer |
| `build` | `electron-vite build` — emits to `out/` |
| `dist` | `build` then `electron-builder` (current OS target) |
| `dist:win` / `dist:mac` / `dist:linux` | Cross-target packaging |
| `typecheck` | TS check for node + web projects |
| `preview` | `electron-vite preview` — preview the built bundle |

`main: \"out/main/index.js\"` is what Electron loads at startup, which is why `npm run build` must precede any `electron` / `electron-builder` invocation.

---

## 12. Known Bugs & Their Solutions

The full catalog with phase tags lives in `MANGA_ELECTRON_PLAN.md` Section 6. Summary of items that are still load-bearing:

| ID | Topic | Where to look |
|---|---|---|
| BUG-01 | `jszip` must be in `dependencies` | `package.json` deps block |
| BUG-02 | `net.fetch` not always available — superseded; we use Node `fetch` anyway, for a different reason | `downloader.ts → fetchImageOnce` doc-comment |
| BUG-03 | Hidden windows need `contextIsolation: false` | `downloader.ts → createHiddenWindow` |
| BUG-05 | CBZ must use `STORE` compression | `downloader.ts → packageCBZ` |
| BUG-08 | Filter legacy `mangadex` history entries | `useReadingHistory.ts → loadAll` |
| BUG-09 | Preload path resolution from `__dirname` of `import.meta.url` | `electron/main/index.ts` (note current value `index.mjs`, not `index.js`, because electron-vite emits ESM preload) |
| BUG-10 | Both tabs always mounted via `hidden` | `App.tsx` |
| BUG-13 | No `@shared` alias in manga workspace | `electron.vite.config.ts` |

---

## 13. Connection to Monorepo Root — At a Glance

For the full picture see `/MANGA_ROOT_INTEGRATION.md`. Key bindings:

1. **Workspace registration.** `package.json` at root lists `\"manga\"` in `workspaces`. Running `npm install` at the root hoists `manga/`'s deps into the root `node_modules`.
2. **Convenience scripts.** Root `package.json` exposes `dev:manga`, `build:manga`, `dist:manga`, `dist:manga:{win,mac,linux}`, `typecheck:manga`, `preview:manga`, each delegating with `--workspace manga`.
3. **No shared code.** Unlike `yuzha/` and `meng/`, the manga workspace does **not** import from the root `shared/` folder, has no `@shared` alias, and is excluded from root `tsconfig.json` references.
4. **No Replit / hosting integration.** Per `replit.md`: *\"`manga/` — Electron-based manga reader (not used on Replit; Electron is incompatible).\"* `.replit` does not run it; `netlify.toml` does not publish it. The port `3003` mapping in `.replit` is a vestige from when manga was a Vite browser app — it currently has no consumer.
5. **Linked tooling.** The root `package.json` `devDependencies` already include `electron`, `tailwindcss`, `postcss`, `typescript`, `@vitejs/plugin-react`. These are reused by manga through npm hoisting, which keeps `manga/node_modules` minimal.

---

## 14. Verification Checklist (post-clone sanity)

Run from inside `manga/`:

```bash
npm install                       # (from repo root preferred — see root doc)
npm run typecheck                 # both tsconfig projects clean
npm run dev                       # Electron window opens with two tabs
npm run build                     # populates out/
npm run dist                      # produces release/ for current OS
```

Manual checks:

- Reader tab: drop a `.cbz` file → pages render; reload app → entry appears in *Continue Reading*.
- Reader tab: *Open Folder* → directory picker appears → series grid renders.
- Downloader tab: paste a chapter URL, pick a folder, hit *Start* → a job card appears with phase = `discovering`, transitions through `downloading` → `done`, and a `.cbz` lands in `<outputDir>/<series>/<title>.cbz`.

---

## 15. Glossary

| Term | Meaning |
|---|---|
| CBZ | Comic Book ZIP — a ZIP archive of ordered images with `.cbz` extension |
| Hidden scrape window | A `BrowserWindow` created with `show: false` (or `showScraperWindow` toggle) used solely for `executeJavaScript`-driven DOM scraping; destroyed in a `finally` block |
| Phase | Job-level lifecycle: `discovering → downloading → done/error` |
| ChapterStatus | Per-chapter lifecycle: `pending → loading → scrolling → fetching → packaging → done/error` |
| Stable runs | The scraper's \"I'm at the bottom and nothing new has loaded for N consecutive iterations\" exit signal (default `STABLE_NEED=10`) |
| Direction | Whether the discovery loop follows the *next* or *previous* chapter link on each page |
"
Observation: Create successful: /app/manga/DOCUMENTATION.md