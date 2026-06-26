# Manga Workspace — Electron Migration Plan
## Authoritative Playbook for AI Agents

> **Read this entire document before touching any file.**
> This is the single source of truth. Every phase must be completed in order.
> Every bug listed in Section 6 must be resolved during the phase it belongs to.

---

## Table of Contents

1. [Goal](#1-goal)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure — Before & After](#3-directory-structure--before--after)
4. [What Gets Removed / Kept / Added](#4-what-gets-removed--kept--added)
5. [Phased Implementation](#5-phased-implementation)
6. [Bug Catalog & Solutions](#6-bug-catalog--solutions)
7. [File-by-File Specification](#7-file-by-file-specification)
8. [IPC API Contract](#8-ipc-api-contract)
9. [Types Reference](#9-types-reference)
10. [Verification Checklist](#10-verification-checklist)

---

## 1. Goal

Transform the `manga/` workspace into a single **Electron desktop app** with two features accessible via a top tab bar:

| Tab | Description |
|-----|-------------|
| **📖 Reader** | Offline CBZ reader — open file, open folder/library, reading history, keyboard nav. Fully local, no network calls. |
| **⬇ Downloader** | Scrape-and-download manga chapters from any manga website into `.cbz` files. Uses hidden Electron BrowserWindows to scroll/harvest images. |

**MangaDex API is removed entirely.** The Reader is fully offline.

The workspace stays at `manga/` in the monorepo. The app runs on port 3003 in dev mode via `electron-vite dev`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop shell | Electron | ^42 |
| Build system | electron-vite | ^5 |
| Renderer bundler | Vite | ^7 (via electron-vite) |
| UI framework | React | ^18 |
| Language | TypeScript | ^5.6 |
| Styling | Tailwind CSS | ^3 |
| CBZ reading | fflate | ^0.8 (renderer only) |
| CBZ writing | jszip | ^3.10 (main process only) |
| HTTP (main process) | `electron.net.fetch` | built-in |

**Important:** `jszip` goes in `dependencies` (not `devDependencies`) because the Electron main process uses it at runtime after packaging. `fflate` stays in `dependencies` for the renderer.

---

## 3. Directory Structure — Before & After

### BEFORE (current state)

```
manga/
├── src/
│   ├── MangaControls.tsx
│   ├── MangaDexDetail.tsx       ← DELETE
│   ├── MangaDexSearch.tsx       ← DELETE
│   ├── MangaHome.tsx            ← MODIFY (strip search)
│   ├── MangaLibrary.tsx
│   ├── MangaReader.tsx
│   ├── MangaReaderScreen.tsx    ← HEAVILY MODIFY → ReaderScreen.tsx
│   ├── MangaToolbar.tsx
│   ├── MangaUploader.tsx
│   ├── index.css
│   ├── main.tsx                 ← MODIFY
│   ├── mangaDexApi.ts           ← DELETE
│   ├── types.ts                 ← MODIFY
│   ├── useCbzLoader.ts          ← MODIFY (remove loadUrls)
│   ├── useFolderScanner.ts      ← MODIFY (fix error message)
│   ├── useKeyboardNav.ts
│   ├── useMangaDexSearch.ts     ← DELETE
│   ├── useReaderState.ts
│   └── useReadingHistory.ts
├── index.html                   ← MODIFY (update title)
├── package.json                 ← HEAVILY MODIFY
├── postcss.config.ts
├── tailwind.config.ts
├── tsconfig.json                ← REPLACE (solution file)
└── vite.config.ts               ← DELETE → replaced by electron.vite.config.ts
```

### AFTER (target state)

```
manga/
├── electron/
│   ├── main/
│   │   ├── index.ts             ← NEW: app lifecycle, IPC handlers
│   │   └── downloader.ts        ← NEW: full download engine
│   └── preload/
│       └── index.ts             ← NEW: contextBridge → window.api
│
├── src/
│   ├── reader/                  ← NEW FOLDER (moved from src/)
│   │   ├── MangaControls.tsx    ← MOVED
│   │   ├── MangaHome.tsx        ← MOVED + MODIFIED
│   │   ├── MangaLibrary.tsx     ← MOVED
│   │   ├── MangaReader.tsx      ← MOVED
│   │   ├── MangaToolbar.tsx     ← MOVED
│   │   ├── MangaUploader.tsx    ← MOVED
│   │   ├── ReaderScreen.tsx     ← RENAMED from MangaReaderScreen.tsx + MODIFIED
│   │   ├── useCbzLoader.ts      ← MOVED + MODIFIED
│   │   ├── useFolderScanner.ts  ← MOVED + MODIFIED
│   │   ├── useKeyboardNav.ts    ← MOVED (no changes)
│   │   ├── useReaderState.ts    ← MOVED (no changes)
│   │   └── useReadingHistory.ts ← MOVED (no changes)
│   │
│   ├── downloader/              ← NEW FOLDER
│   │   ├── DownloaderApp.tsx    ← NEW: job list UI
│   │   └── JobCard.tsx          ← NEW: per-job progress card
│   │
│   ├── types.ts                 ← MODIFIED (remove MangaDex types, add downloader types)
│   ├── env.d.ts                 ← NEW: window.api TypeScript declaration
│   ├── App.tsx                  ← NEW: root with tab nav (Reader | Downloader)
│   ├── main.tsx                 ← MODIFY (render App)
│   ├── index.html               ← MODIFY
│   └── index.css                ← KEEP (add body background)
│
├── electron.vite.config.ts      ← NEW: replaces vite.config.ts
├── tsconfig.json                ← REPLACE (solution file)
├── tsconfig.node.json           ← NEW: main + preload config
├── tsconfig.web.json            ← NEW: renderer config
├── package.json                 ← HEAVILY MODIFIED
├── postcss.config.ts            ← KEEP
└── tailwind.config.ts           ← MODIFY (add electron src paths)
```

---

## 4. What Gets Removed / Kept / Added

### Remove Completely

| File | Reason |
|------|--------|
| `src/mangaDexApi.ts` | MangaDex API gone |
| `src/useMangaDexSearch.ts` | MangaDex search gone |
| `src/MangaDexSearch.tsx` | MangaDex search UI gone |
| `src/MangaDexDetail.tsx` | MangaDex detail UI gone |
| `vite.config.ts` | Replaced by electron.vite.config.ts |

### Modify Significantly

| File | Changes |
|------|---------|
| `src/MangaReaderScreen.tsx` → `src/reader/ReaderScreen.tsx` | Remove all MangaDex state/imports/views. Views become `"home" \| "library" \| "reader"` only. Remove `onSearch` handler. |
| `src/MangaHome.tsx` → `src/reader/MangaHome.tsx` | Remove search form (lines 191–207 + label line 207). Remove `onSearch` from Props. Fix empty state text. Fix history icon logic. |
| `src/types.ts` | Remove `MangaDexManga`, `MangaDexChapter`, `MangaDexPageData`. Add downloader types from Section 9. Change `HistoryEntry.source` to `"file" \| "folder"`. |
| `src/useCbzLoader.ts` → `src/reader/useCbzLoader.ts` | Remove `loadUrls` function (MangaDex-only). Simplify return type. |
| `src/useFolderScanner.ts` → `src/reader/useFolderScanner.ts` | Fix error message to say "Electron" instead of "Chrome or Edge". |
| `package.json` | Major overhaul — see Phase 1. |
| `tsconfig.json` | Becomes solution file referencing tsconfig.node.json + tsconfig.web.json. |
| `tailwind.config.ts` | Add `electron/**/*.{ts,tsx}` to content paths. |
| `index.html` | Update title. Remove charset comment about vite proxy. |
| `src/main.tsx` | Render `<App />` instead of `<MangaReaderScreen />`. |

### Keep Unchanged (just move to `src/reader/`)

- `MangaControls.tsx`
- `MangaLibrary.tsx`
- `MangaReader.tsx`
- `MangaToolbar.tsx`
- `MangaUploader.tsx`
- `useKeyboardNav.ts`
- `useReaderState.ts`
- `useReadingHistory.ts`

### Add New

- `electron/main/index.ts` — See Section 7
- `electron/main/downloader.ts` — See Section 7
- `electron/preload/index.ts` — See Section 7
- `src/env.d.ts` — See Section 7
- `src/App.tsx` — See Section 7
- `src/downloader/DownloaderApp.tsx` — See Section 7
- `src/downloader/JobCard.tsx` — See Section 7
- `electron.vite.config.ts` — See Section 7
- `tsconfig.node.json` — See Section 7
- `tsconfig.web.json` — See Section 7

---

## 5. Phased Implementation

Complete each phase fully before starting the next. Run the verification step at the end of each phase.

---

### Phase 1 — Package & Config Foundation

**Goal:** Get the project scaffolding correct before writing any application code.

#### 1.1 Update `manga/package.json`

Replace the scripts and add Electron deps. The complete target state:

```json
{
  "name": "manga-reader",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux",
    "typecheck": "tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json",
    "preview": "electron-vite preview"
  },
  "build": {
    "appId": "com.yuzha.manga",
    "productName": "Manga Reader",
    "directories": { "output": "release" },
    "files": [
      "out/**/*",
      "!out/**/*.map"
    ],
    "win": { "target": "nsis", "icon": "assets/icon.ico" },
    "mac": { "target": "dmg", "icon": "assets/icon.icns" },
    "linux": { "target": "AppImage", "icon": "assets/icon.png" }
  },
  "dependencies": {
    "fflate": "^0.8.2",
    "jszip": "^3.10.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.7",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "electron": "^42.0.0",
    "electron-builder": "^25.0.0",
    "electron-vite": "^5.0.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.6.3"
  }
}
```

> **BUG PREVENTION:** `jszip` MUST be in `dependencies`, not `devDependencies`.
> electron-vite externalizes all node_modules for main/preload — they load
> at runtime from the installed `node_modules`. If jszip is only in devDeps,
> it will be missing in the packaged production build.

#### 1.2 Create `manga/electron.vite.config.ts`

```ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/main",
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/preload",
    },
  },
  renderer: {
    root: "src",
    build: {
      outDir: "out/renderer",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  },
});
```

> **BUG PREVENTION:** No `@shared` alias here. The manga workspace no longer
> imports from `../shared` at all. Remove any lingering `@shared` references.

> **BUG PREVENTION:** No proxy config needed. The renderer no longer calls
> `/api/mangadex*`. All network requests are made from the main process via
> `net.fetch`, which bypasses CORS entirely.

#### 1.3 Delete `manga/vite.config.ts`

This file must be deleted. Having both `vite.config.ts` and `electron.vite.config.ts`
will cause electron-vite to use the wrong config.

#### 1.4 Create `manga/tsconfig.json` (solution file)

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

#### 1.5 Create `manga/tsconfig.node.json`

Covers `electron/main/` and `electron/preload/` and shared types.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "composite": true,
    "types": ["node"],
    "outDir": "out"
  },
  "include": [
    "electron/**/*",
    "electron.vite.config.ts",
    "src/types.ts"
  ]
}
```

> **Why `src/types.ts` is included:** The main process imports `StartJobOpts`,
> `JobEvent`, etc. from `src/types.ts`. This is the same pattern as the
> architecture doc — shared types live in src/ but are imported by both sides.

#### 1.6 Create `manga/tsconfig.web.json`

Covers the renderer only. No Node types.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "composite": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

#### 1.7 Update `manga/tailwind.config.ts`

Add `electron/` paths:

```ts
export default {
  content: [
    "./src/**/*.{ts,tsx,html}",
    "./electron/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
```

#### 1.8 Update `manga/index.html`

Move to be at root of the project (electron-vite uses `src/index.html` for renderer):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; connect-src 'self'" />
    <title>Manga Reader</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

> **CSP Note:** `img-src` includes `blob:` for CBZ images and `https:` for
> any remote images. The CSP is set here AND enforced in main process.

**Phase 1 verification:**
- `ls manga/` shows `electron.vite.config.ts` present and `vite.config.ts` absent
- `node -e "require('./manga/package.json')"` shows `main: "out/main/index.js"`
- `cd manga && npx tsc -p tsconfig.node.json --noEmit` — no shared type errors yet (ok if empty)

---

### Phase 2 — Electron Main Process

**Goal:** Write the main process, preload, and IPC layer. No renderer changes yet.

#### 2.1 Create `manga/electron/main/index.ts`

Full file content:

```ts
import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "node:url";
import { runJob } from "./downloader";
import type { StartJobOpts, JobEvent } from "../../src/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

const cancelFlags = new Map<string, boolean>();

function emit(event: JobEvent): void {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send("job-event", event);
  }
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0f0f1a",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC: pick output folder
ipcMain.handle("pick-folder", async () => {
  if (!mainWindow) return null;
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Choose download folder",
  });
  return filePaths[0] ?? null;
});

// IPC: open folder in OS explorer
ipcMain.handle("open-folder", async (_e, dir: string) => {
  await shell.openPath(dir);
});

// IPC: cancel a running job
ipcMain.handle("cancel-job", (_e, jobId: string) => {
  cancelFlags.set(jobId, true);
});

// IPC: start a download job
ipcMain.handle("start-job", async (_e, opts: StartJobOpts): Promise<string> => {
  const jobId = `job_${Date.now()}`;
  cancelFlags.set(jobId, false);
  const isCancelled = () => cancelFlags.get(jobId) === true;

  // Fire and forget — returns jobId immediately
  (async () => {
    try {
      await runJob(jobId, opts, isCancelled, emit);
    } catch (err) {
      emit({ type: "error", jobId, message: String(err) });
    } finally {
      cancelFlags.delete(jobId);
    }
  })();

  return jobId;
});
```

#### 2.2 Create `manga/electron/main/downloader.ts`

This is the full download engine. Implement every function from the architecture doc Section 8 exactly. Key implementation notes:

```ts
import { BrowserWindow, net } from "electron";
import JSZip from "jszip";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import type {
  Chapter,
  ChapterStatus,
  StartJobOpts,
  JobEvent,
} from "../../src/types";

export const CFG = {
  SCROLL_STEP_PX: 2000,
  SCROLL_DELAY_MS: 400,
  STABLE_NEED: 10,
  PAGE_TIMEOUT_MS: 20_000,
  CONCURRENCY: 3,
} as const;

interface ImageRef {
  src: string;
  top: number;
}

// All functions listed in architecture doc Section 8 must be implemented:
// - createHiddenWindow()
// - sleep(ms)
// - loadPage(win, url)
// - scrollAndCollect(win) → ImageRef[]
// - findChapterLink(win, direction) → string | null
// - getPageTitle(win) → string
// - cleanTitle(raw) → string
// - extractSeries(title) → string
// - downloadImage(url, referer) → Promise<Buffer>
// - guessExt(buf) → string
// - packageCBZ(pages, title, series, outputDir) → Promise<string>
// - downloadChapter(chapter, outputDir, onUpdate, isCancelled)
// - discoverChapters(startUrl, direction, count, onDiscover, isCancelled)
// - runParallel(chapters, outputDir, onChapter, onProgress, isCancelled)
// - runJob(jobId, opts, isCancelled, emit) ← top-level export
```

> **CRITICAL: `net.fetch` usage**
> In the main process, ALWAYS use `net.fetch` from `'electron'`, NOT the
> global `fetch`. The global fetch is not available in older Electron main
> processes. `net.fetch` bypasses CORS and supports custom headers.
>
> ```ts
> import { net } from "electron";
> const res = await net.fetch(url, { headers: { Referer: referer } });
> ```

> **CRITICAL: Hidden window settings**
> `createHiddenWindow()` must use `contextIsolation: false` so that
> `executeJavaScript()` can read the full DOM. These windows are never shown
> and never load a preload script:
>
> ```ts
> function createHiddenWindow(): BrowserWindow {
>   return new BrowserWindow({
>     show: false,
>     webPreferences: {
>       contextIsolation: false,   // required for executeJavaScript DOM access
>       nodeIntegration: false,    // still no Node in hidden window renderer
>       offscreen: false,          // true breaks some lazy-loaders (avoid)
>     },
>   });
> }
> ```

> **CRITICAL: Always destroy hidden windows in finally blocks**
> ```ts
> async function downloadChapter(...) {
>   const win = createHiddenWindow();
>   try {
>     // ... work ...
>   } finally {
>     if (!win.isDestroyed()) win.destroy();
>   }
> }
> ```

> **CRITICAL: JSZip compression**
> Use `compression: 'STORE'` (no compression). CBZ readers expect uncompressed
> for fast random page access:
>
> ```ts
> const buf = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
> ```

> **CRITICAL: `runJob` signature**
> The architecture doc has `emit` as a closure inside `index.ts`. In our
> implementation, pass `emit` as a parameter to keep `downloader.ts` pure:
>
> ```ts
> export async function runJob(
>   jobId: string,
>   opts: StartJobOpts,
>   isCancelled: () => boolean,
>   emit: (event: JobEvent) => void,
> ): Promise<void>
> ```

#### 2.3 Create `manga/electron/preload/index.ts`

```ts
import { contextBridge, ipcRenderer } from "electron";
import type { StartJobOpts, JobEvent } from "../../src/types";

contextBridge.exposeInMainWorld("api", {
  startJob: (opts: StartJobOpts): Promise<string> =>
    ipcRenderer.invoke("start-job", opts),

  cancelJob: (jobId: string): Promise<void> =>
    ipcRenderer.invoke("cancel-job", jobId),

  pickFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("pick-folder"),

  openFolder: (dir: string): Promise<void> =>
    ipcRenderer.invoke("open-folder", dir),

  onJobEvent: (cb: (event: JobEvent) => void): void => {
    ipcRenderer.on("job-event", (_e, data: JobEvent) => cb(data));
  },
});
```

**Phase 2 verification:**
- `cd manga && npx tsc -p tsconfig.node.json --noEmit` — zero errors

---

### Phase 3 — Types & Shared Contracts

**Goal:** Establish the final `src/types.ts` and `src/env.d.ts` that both
main process and renderer agree on.

#### 3.1 Rewrite `manga/src/types.ts`

The new types.ts combines the reader types (kept) with downloader types (new),
and removes all MangaDex types.

**Reader types — KEEP:**
```ts
// CBZ loader
export type CbzLoadResult =
  | { status: "idle" }
  | { status: "loading"; progress: number }
  | { status: "ready"; pages: string[]; fileName: string }
  | { status: "error"; message: string };

// Reading history — source is now ONLY "file" | "folder"
export interface HistoryEntry {
  key: string;
  source: "file" | "folder";
  identifier: string;
  displayTitle: string;
  seriesName?: string;
  page: number;
  totalPages: number;
  savedAt: number;
}

// Folder scan
export interface ScannedChapter {
  name: string;
  fileName: string;
  fileHandle: FileSystemFileHandle;
  historyEntry?: HistoryEntry;
}

export interface ScannedSeries {
  name: string;
  chapters: ScannedChapter[];
  coverHandle?: FileSystemFileHandle;
}
```

**Downloader types — ADD (matches architecture doc exactly):**
```ts
export type Direction = "next" | "prev";

export type Phase = "discovering" | "downloading" | "done" | "error";

export type ChapterStatus =
  | "pending"
  | "loading"
  | "scrolling"
  | "fetching"
  | "packaging"
  | "done"
  | "error";

export interface Chapter {
  url: string;
  title: string;
  status: ChapterStatus;
  fetchDone?: number;
  fetchTotal?: number;
  pages?: number;
  file?: string;
  error?: string;
}

export interface StartJobOpts {
  startUrl: string;
  direction: Direction;
  count: number;
  outputDir: string;
}

export type JobEvent =
  | { type: "phase"; jobId: string; phase: Phase; chapters?: Pick<Chapter, "url" | "title">[] }
  | { type: "discover"; jobId: string; current: number; total: number; url: string }
  | { type: "chapter"; jobId: string; chapter: Chapter }
  | { type: "progress"; jobId: string; done: number; total: number }
  | { type: "done"; jobId: string; message: string; outputDir: string }
  | { type: "error"; jobId: string; message: string };
```

**REMOVE from types.ts:**
- `MangaDexManga` interface
- `MangaDexChapter` interface
- `MangaDexPageData` interface

#### 3.2 Create `manga/src/env.d.ts`

```ts
import type { StartJobOpts, JobEvent } from "./types";

declare global {
  interface Window {
    api: {
      startJob: (opts: StartJobOpts) => Promise<string>;
      cancelJob: (jobId: string) => Promise<void>;
      pickFolder: () => Promise<string | null>;
      openFolder: (dir: string) => Promise<void>;
      onJobEvent: (cb: (event: JobEvent) => void) => void;
    };
  }
}
```

> **Rule:** Any time a new IPC channel is added, update ALL THREE: 
> `electron/preload/index.ts`, `electron/main/index.ts`, and `src/env.d.ts`.

**Phase 3 verification:**
- `cd manga && npx tsc -p tsconfig.node.json --noEmit` — zero errors
- `cd manga && npx tsc -p tsconfig.web.json --noEmit` — zero errors (will have errors until Phase 4)

---

### Phase 4 — Reader Restructure

**Goal:** Move and clean all existing reader files into `src/reader/`.
No new features — only cleanup and MangaDex removal.

#### 4.1 Move files (exact copy then delete originals)

Move these files from `src/` to `src/reader/` (update all relative imports):

```
MangaControls.tsx      → src/reader/MangaControls.tsx
MangaHome.tsx          → src/reader/MangaHome.tsx       (MODIFIED below)
MangaLibrary.tsx       → src/reader/MangaLibrary.tsx
MangaReader.tsx        → src/reader/MangaReader.tsx
MangaToolbar.tsx       → src/reader/MangaToolbar.tsx
MangaUploader.tsx      → src/reader/MangaUploader.tsx
MangaReaderScreen.tsx  → src/reader/ReaderScreen.tsx    (MODIFIED below)
useCbzLoader.ts        → src/reader/useCbzLoader.ts     (MODIFIED below)
useFolderScanner.ts    → src/reader/useFolderScanner.ts (MODIFIED below)
useKeyboardNav.ts      → src/reader/useKeyboardNav.ts
useReaderState.ts      → src/reader/useReaderState.ts
useReadingHistory.ts   → src/reader/useReadingHistory.ts
```

All imports like `from "./MangaReader"` become `from "./MangaReader"` (same folder — no path change needed within reader/).
All imports like `from "./types"` become `from "../types"`.

#### 4.2 Modify `src/reader/MangaHome.tsx`

**Remove:**
- `onSearch` from Props interface (line ~15)
- The entire search `<form>` JSX block (lines ~191–207 including the "Powered by MangaDex" label)
- The `handleSearchSubmit` callback function (~lines 148–155)
- The `searchQuery` useState (~line 125)

**Change in `HistoryCard`:**
```tsx
// BEFORE (line 43):
const icon = entry.source === "mangadex" ? "🌐" : "📖";

// AFTER:
const icon = entry.source === "folder" ? "📂" : "📖";
```

**Change empty state text** (around line 304):
```tsx
// BEFORE:
"Search MangaDex above, open a folder, or drop a .cbz file anywhere on this page."

// AFTER:
"Open a folder to scan your library, or drop a .cbz file anywhere on this page."
```

**Change footer text** (around line 312):
```tsx
// BEFORE:
"Local files are processed locally — nothing is uploaded"

// AFTER: keep as-is (still true)
```

#### 4.3 Modify `src/reader/ReaderScreen.tsx` (was MangaReaderScreen.tsx)

**Remove all MangaDex imports and state:**
```ts
// DELETE these imports:
import { useMangaDexSearch } from "./useMangaDexSearch";
import { getChapterPages, getChapterLabel, getMangaTitle } from "../mangaDexApi";
import MangaDexSearch from "./MangaDexSearch";    // file deleted
import MangaDexDetail from "./MangaDexDetail";    // file deleted
import type { MangaDexManga, MangaDexChapter } from "../types";

// DELETE this state:
const { state: searchState, query: searchQuery, setQuery: setSearchQuery, clearSearch } = useMangaDexSearch();
const [activeManga, setActiveManga] = useState<MangaDexManga | null>(null);
const [onlineError, setOnlineError] = useState<string | null>(null);
```

**Change View type:**
```ts
// BEFORE:
type View = "home" | "library" | "search" | "detail" | "reader";

// AFTER:
type View = "home" | "library" | "reader";
```

**Remove `activeSource` mangadex branch**, keep only `"file" | "folder"`.

**Remove `onSearch` prop from MangaHome call:**
```tsx
// BEFORE:
<MangaHome onSearch={(q) => { setSearchQuery(q); setView("search"); }} ... />

// AFTER:
<MangaHome ... />  // no onSearch prop
```

**Remove `case "search"` and `case "detail"` from the view router.**

**Update the `onBack` for Reader tab context:**
```tsx
// In Electron standalone, onBack goes to "home" view.
// The prop onBack?: () => void stays but in App.tsx we don't pass it.
// When onBack is undefined and view === "home", hide the back button.
```

#### 4.4 Modify `src/reader/useCbzLoader.ts`

Remove `loadUrls` function entirely (was MangaDex-only):

```ts
// DELETE the entire loadUrls function and its export

// BEFORE return:
return { result, loadFile, loadUrls, reset };

// AFTER return:
return { result, loadFile, reset };
```

Update any callers in `ReaderScreen.tsx` to remove `loadUrls` from destructuring.

#### 4.5 Modify `src/reader/useFolderScanner.ts`

Fix the error message (line ~28):

```ts
// BEFORE:
message: "Folder scanning is not supported in this browser. Use Chrome or Edge.",

// AFTER:
message: "Folder scanning is not supported in this environment.",
```

**Phase 4 verification:**
- `cd manga && npx tsc -p tsconfig.web.json --noEmit` — zero errors in reader/
- No imports reference `mangaDexApi`, `useMangaDexSearch`, `MangaDexSearch`, `MangaDexDetail`

---

### Phase 5 — Downloader UI & Root App

**Goal:** Build the Downloader UI components and the root App that ties both tabs together.

#### 5.1 Create `src/downloader/DownloaderApp.tsx`

This is the renderer-side job management UI. It calls `window.api.*` to communicate with the main process.

State model (mirrors architecture doc Section 11):
```ts
interface Job {
  id: string;
  startUrl: string;
  direction: Direction;
  phase: Phase;
  discoverCurrent?: number;
  discoverTotal?: number;
  chapters: Map<string, Chapter>;
  chapterOrder: string[];
  done: number;
  total: number;
  message?: string;
  outputDir: string;
}
```

The component:
- Inputs: URL field, Direction toggle (next/prev), Chapter count number input, Output folder (read-only, set via `window.api.pickFolder()`)
- Start button: validates, calls `window.api.startJob(opts)`, adds job card immediately
- On mount: calls `window.api.onJobEvent(handler)` once — subscribed for app lifetime
- Job list: `Array.from(jobs.values()).reverse()` — newest first
- Each job renders as a `<JobCard>`

#### 5.2 Create `src/downloader/JobCard.tsx`

Renders one job. Props:
```ts
interface Props {
  job: Job;
  onCancel: () => void;
  onOpenFolder: () => void;
}
```

Visual design (from architecture doc Section 12, adapted to navy dark theme):

- **Phase badge** top-left: amber=discovering, blue=downloading, emerald=done, red=error
- **Progress bar**: thin rose-500 bar in card header, fills `done/total × 100%`
- **Chapter list**: collapsible, scrollable at `max-h-64`
- **Status icons per chapter:**
  - pending: ⏳ slate-500
  - loading: 🌐 slate-400
  - scrolling: 📜 amber-400
  - fetching: ⬇️ blue-400
  - packaging: 📦 violet-400
  - done: ✅ emerald-400
  - error: ❌ red-400
- **Buttons**: Cancel (when discovering/downloading), Open Folder (when done/error)

#### 5.3 Create `src/App.tsx`

Root component with tab navigation:

```tsx
import React, { useState } from "react";
import ReaderScreen from "./reader/ReaderScreen";
import DownloaderApp from "./downloader/DownloaderApp";

type Tab = "reader" | "downloader";

export default function App() {
  const [tab, setTab] = useState<Tab>("reader");

  return (
    <div className="flex flex-col w-screen h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-neutral-800 bg-neutral-900 flex-shrink-0">
        <button
          type="button"
          onClick={() => setTab("reader")}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "reader"
              ? "border-blue-500 text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          📖 Reader
        </button>
        <button
          type="button"
          onClick={() => setTab("downloader")}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "downloader"
              ? "border-rose-500 text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          ⬇ Downloader
        </button>
      </div>

      {/* Tab content — keep both mounted to preserve state */}
      <div className={`flex-1 overflow-hidden ${tab === "reader" ? "block" : "hidden"}`}>
        <ReaderScreen />
      </div>
      <div className={`flex-1 overflow-hidden ${tab === "downloader" ? "block" : "hidden"}`}>
        <DownloaderApp />
      </div>
    </div>
  );
}
```

> **Why keep both mounted:** If we unmount the Reader when switching to
> Downloader, the user loses their current reading position. Using
> `display: hidden` (via `hidden` class) keeps both trees alive.

#### 5.4 Update `src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 5.5 Update `src/index.css`

Add the dark body background (matches downloader color from architecture doc):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0f0f1a;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

**Phase 5 verification:**
- `cd manga && npx tsc -p tsconfig.web.json --noEmit` — zero errors
- No `window.api` calls exist outside `src/downloader/`
- `ReaderScreen` has zero references to MangaDex

---

### Phase 6 — Integration & Root Package Scripts

**Goal:** Wire everything up, run the app, and update root package.json.

#### 6.1 Run npm install from root

```bash
npm install
```

This registers the updated `manga/package.json` deps in the workspace.

#### 6.2 Update root `package.json` — manga scripts

Replace the existing manga scripts with electron-vite-aware versions:

```json
"dev:manga":          "npm run dev --workspace manga",
"build:manga":        "npm run build --workspace manga",
"dist:manga":         "npm run dist --workspace manga",
"dist:manga:win":     "npm run dist:win --workspace manga",
"dist:manga:mac":     "npm run dist:mac --workspace manga",
"dist:manga:linux":   "npm run dist:linux --workspace manga",
"typecheck:manga":    "npm run typecheck --workspace manga",
"preview:manga":      "npm run preview --workspace manga"
```

> **Note:** `dev:manga` now launches electron-vite (opens an Electron window),
> not a browser tab. The Yuzha main page button `window.open(port 3003)` will
> no longer be the right way to open manga.
> Update `MainScreenUtils.tsx` in yuzha: the "Manga Reader ↗" button should
> either be removed or shown as a note that manga is now a desktop app.

#### 6.3 Update `yuzha/src/MainScreenUtils.tsx`

The manga button currently does `window.open(getStandaloneUrl(3003), "_blank")`.
Since manga is now an Electron app (not a browser app), this no longer makes sense.

**Options:**
1. Remove the Manga Reader button from the launcher entirely
2. Keep it but change tooltip to "Launch Manga Reader (desktop app)"

Recommended: **Remove** the button. The manga app is now a separate desktop application, not a web tab.

**Phase 6 verification:**
- `cd manga && npm run dev` — Electron window opens with two tabs
- Reader tab loads local CBZ files correctly
- Downloader tab shows the job input form
- `cd manga && npm run typecheck` — zero errors both node + web

---

## 6. Bug Catalog & Solutions

All known bugs and their fixes. Each entry has a Phase tag — resolve it during that phase.

### BUG-01: `jszip` missing in production build
**Phase:** 1
**Symptom:** Packaged app crashes on first download with `Cannot find module 'jszip'`
**Cause:** `jszip` was put in `devDependencies`. electron-vite externalizes all deps
in the main process bundle — they must be present in `dependencies` at runtime.
**Fix:** `jszip` in `dependencies`. Verified in package.json spec above.

---

### BUG-02: `net.fetch` not available
**Phase:** 2
**Symptom:** `TypeError: fetch is not a function` in main process
**Cause:** Global `fetch` is not reliably available in Electron's main process (Node.js context).
**Fix:** Always import `net` from `'electron'` and call `net.fetch(url, opts)`.

---

### BUG-03: Hidden window `executeJavaScript` fails silently
**Phase:** 2
**Symptom:** `scrollAndCollect` returns empty arrays, no images found
**Cause:** `contextIsolation: true` (default) blocks `executeJavaScript` from reading
DOM in ways needed for scraping.
**Fix:** Hidden windows use `contextIsolation: false`. This is safe because:
- They are never shown to the user
- They never load preload scripts
- They are always destroyed in `finally` blocks

---

### BUG-04: Electron window freezes during parallel downloads
**Phase:** 2
**Symptom:** UI becomes unresponsive during `runParallel` with CONCURRENCY=3
**Cause:** 3 hidden BrowserWindows + image downloads are CPU/memory intensive
**Fix:** This is expected behavior — the main process is busy. The UI (renderer)
stays responsive because it's in a separate process. If the main window freezes,
it means the main thread itself is blocked — check for synchronous operations in
`runJob` and make them truly async.

---

### BUG-05: CBZ files corrupted / unreadable by readers
**Phase:** 2
**Symptom:** Generated `.cbz` files don't open in reader apps
**Cause:** Using `DEFLATE` compression instead of `STORE`
**Fix:** Always use `compression: "STORE"` in `zip.generateAsync()`. CBZ is just
a ZIP with `.cbz` extension — comic readers expect uncompressed for fast page seeks.

---

### BUG-06: `onSearch` prop missing error in MangaHome
**Phase:** 4
**Symptom:** TypeScript error: `onSearch` prop passed to `MangaHome` but not in Props
**Cause:** `ReaderScreen.tsx` still passes `onSearch` after MangaHome Props were updated
**Fix:** Remove `onSearch` from both the Props definition in `MangaHome.tsx`
AND all call sites in `ReaderScreen.tsx`. Run typecheck to confirm.

---

### BUG-07: `loadUrls` called on undefined after removal
**Phase:** 4
**Symptom:** TypeScript error or runtime crash: `loadUrls is not a function`
**Cause:** `ReaderScreen.tsx` destructures `loadUrls` from `useCbzLoader()` but it
was removed from the hook.
**Fix:** Remove `loadUrls` from destructuring in `ReaderScreen.tsx`. Also remove
the `activeSource === "mangadex"` branch that called it.

---

### BUG-08: HistoryEntry `source: "mangadex"` in existing localStorage
**Phase:** 4
**Symptom:** Old history entries with `source: "mangadex"` cause rendering issues
since the type no longer includes `"mangadex"`.
**Fix:** In `useReadingHistory.ts`, add a migration guard when loading history:
```ts
export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    // Filter out legacy mangadex entries
    return parsed.filter((e) => e.source === "file" || e.source === "folder");
  } catch {
    return [];
  }
}
```

---

### BUG-09: `window.api` undefined in renderer during dev
**Phase:** 5
**Symptom:** `TypeError: Cannot read properties of undefined (reading 'startJob')`
**Cause:** In electron-vite dev mode, the renderer loads from HMR server but the
preload script path may not be resolved correctly if `__dirname` logic is wrong.
**Fix:** In `electron/main/index.ts`, the preload path must use `__dirname` from
`fileURLToPath(import.meta.url)` — NOT `process.cwd()` or relative paths:
```ts
const __dirname = path.dirname(fileURLToPath(import.meta.url));
preload: path.join(__dirname, "../preload/index.js"),
```

---

### BUG-10: Tab content overflow causes double scrollbars
**Phase:** 5
**Symptom:** Both a tab-level scrollbar and an inner scrollbar appear
**Cause:** Reader content has `min-h-screen` which overflows the tab container
**Fix:** Tab content divs use `overflow-hidden` + `h-full`. Inner screens use
`overflow-y-auto` on their own scroll container. ReaderScreen needs
`h-full flex flex-col` at its root, not `min-h-screen`.
Update `MangaHome.tsx` root div: change `min-h-screen` → `h-full`.

---

### BUG-11: `showDirectoryPicker` blocked in Electron
**Phase:** 5
**Symptom:** Folder scan button does nothing, no error shown
**Cause:** In some Electron versions, `showDirectoryPicker` requires explicit
permission granting or is restricted in certain security contexts.
**Fix:** The API is available in Electron 13+ (Chromium 86+). Electron 42 supports
it. However, add a try/catch in `isFolderScanSupported`:
```ts
export function isFolderScanSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}
```
If users still report issues, fallback to `<input webkitdirectory>` (already
present in MangaHome as the "Open Folder" via input — actually `showDirectoryPicker`
is the purple button, file input is separate).

---

### BUG-12: `vite.config.ts` and `electron.vite.config.ts` conflict
**Phase:** 1
**Symptom:** `electron-vite dev` uses wrong config or ignores electron.vite.config.ts
**Cause:** Both config files exist. electron-vite picks `electron.vite.config.ts`
first, but having both causes confusion and potential conflicts.
**Fix:** Delete `vite.config.ts` entirely after creating `electron.vite.config.ts`.

---

### BUG-13: `@shared` alias still referenced after migration
**Phase:** 4
**Symptom:** TypeScript error: `Cannot find module '@shared/...'`
**Cause:** Some moved file still imports from `@shared` (was valid when manga was a
browser app using Yuzha's shared modules).
**Fix:** `grep -r "@shared" manga/src/` — result must be zero. The manga workspace
is fully standalone. All needed code was already in `manga/src/`.

---

### BUG-14: Yuzha main page still has Manga Reader ↗ button
**Phase:** 6
**Symptom:** Clicking Manga Reader ↗ in Yuzha opens port 3003 which now serves
electron-vite's renderer HMR (only accessible from within Electron), not a web app.
**Cause:** The button was wired before manga became an Electron app.
**Fix:** Remove the "Manga Reader ↗" button from `yuzha/src/MainScreenUtils.tsx`
in Phase 6.

---

## 7. File-by-File Specification

### `electron/main/index.ts`
- Creates main BrowserWindow (1200×820, min 800×600)
- Sets `backgroundColor: "#0f0f1a"` to prevent white flash on load
- In dev: loads `process.env.ELECTRON_RENDERER_URL` + opens DevTools detached
- In prod: loads `path.join(__dirname, "../renderer/index.html")`
- Registers 4 IPC handlers: `pick-folder`, `open-folder`, `cancel-job`, `start-job`
- `start-job` returns jobId before any work starts (fire-and-forget pattern)
- `cancelFlags: Map<string, boolean>` — cleaned up in `finally` after job finishes

### `electron/main/downloader.ts`
- Pure functions — no side effects except documented ones (file writes, window lifecycle)
- `CFG` object at top — all tuning constants in one place
- `scrollAndCollect`: tries reader container selectors in priority order before falling back to `document`
- `findChapterLink`: tries CSS selectors first, text-content fallback second
- `downloadImage`: uses `net.fetch` with Referer + realistic User-Agent headers
- `guessExt`: reads first 2 magic bytes from Buffer to determine format
- `packageCBZ`: `compression: "STORE"`, zero-padded filenames (`001.jpg`)
- `discoverChapters`: reuses ONE hidden window across all chapters for efficiency
- `runParallel`: sliding-window queue, up to `CFG.CONCURRENCY` chapters at once
- `runJob`: exported, takes `emit` as parameter

### `electron/preload/index.ts`
- Exactly 5 methods exposed: `startJob`, `cancelJob`, `pickFolder`, `openFolder`, `onJobEvent`
- `onJobEvent` is fire-and-forget subscription (no unsubscribe, lives for app lifetime)
- No other globals exposed — renderer has no Node access

### `src/types.ts`
- Imported by BOTH main process (via tsconfig.node.json include) and renderer
- Must not import renderer-only or Node-only APIs
- Contains: reader types + downloader IPC types
- Does NOT contain: MangaDex types (all deleted)

### `src/env.d.ts`
- Augments global `Window` interface with `api` property
- Must mirror `electron/preload/index.ts` exactly
- If types diverge, you will get `window.api.X is not a function` at runtime

### `src/App.tsx`
- Two tabs: Reader (blue indicator), Downloader (rose indicator)
- Both panels always mounted (`hidden` class toggle, not conditional render)
- Tab state managed in App — not persisted to localStorage

### `src/reader/ReaderScreen.tsx`
- Views: `"home" | "library" | "reader"` only
- No `onBack` passed from App.tsx (back button in Reader goes home within Reader)
- `activeSource: "file" | "folder"` only

### `src/downloader/DownloaderApp.tsx`
- Calls `window.api.onJobEvent` exactly ONCE on mount
- Jobs state: `Map<string, Job>` keyed by jobId
- Renders newest job first: `Array.from(jobs.values()).reverse()`
- Chapter updates are O(1) using Map: `new Map(prev).set(jobId, updatedJob)`

### `src/downloader/JobCard.tsx`
- Stateless — all data from props
- Uses `job.chapterOrder` (array) to render chapters in insertion order
- Chapter data from `job.chapters.get(url)` (Map)

---

## 8. IPC API Contract

| Channel | Direction | Payload | Return |
|---------|-----------|---------|--------|
| `pick-folder` | renderer → main | none | `string \| null` |
| `open-folder` | renderer → main | `dir: string` | `void` |
| `cancel-job` | renderer → main | `jobId: string` | `void` |
| `start-job` | renderer → main | `StartJobOpts` | `string` (jobId) |
| `job-event` | main → renderer | `JobEvent` | push (no return) |

All channels use `ipcMain.handle` / `ipcRenderer.invoke` except `job-event`
which uses `webContents.send` / `ipcRenderer.on`.

---

## 9. Types Reference

### `StartJobOpts`
```ts
{
  startUrl: string;    // URL of first chapter
  direction: "next" | "prev";  // which chapter link to follow
  count: number;       // how many chapters (≥1)
  outputDir: string;   // absolute path (from dialog)
}
```

### `JobEvent` Discriminated Union
```ts
type JobEvent =
  | { type: "phase";    jobId: string; phase: Phase; chapters?: Pick<Chapter, "url"|"title">[] }
  | { type: "discover"; jobId: string; current: number; total: number; url: string }
  | { type: "chapter";  jobId: string; chapter: Chapter }
  | { type: "progress"; jobId: string; done: number; total: number }
  | { type: "done";     jobId: string; message: string; outputDir: string }
  | { type: "error";    jobId: string; message: string }
```

### `Chapter` Status Flow
```
pending → loading → scrolling → fetching → packaging → done
                                                      ↘ error
```

---

## 10. Verification Checklist

Run these checks at the end of each phase. Do not proceed to the next phase if any check fails.

### After Phase 1
- [ ] `manga/electron.vite.config.ts` exists
- [ ] `manga/vite.config.ts` does NOT exist
- [ ] `manga/package.json` has `"main": "out/main/index.js"`
- [ ] `manga/package.json` has `jszip` in `dependencies` (not devDeps)
- [ ] `manga/package.json` has `electron`, `electron-vite`, `electron-builder` in `devDependencies`
- [ ] `manga/tsconfig.json` is the solution file (references node + web)
- [ ] `manga/tsconfig.node.json` exists with `"types": ["node"]`
- [ ] `manga/tsconfig.web.json` exists with `"types": ["vite/client"]`

### After Phase 2
- [ ] `manga/electron/main/index.ts` exists
- [ ] `manga/electron/main/downloader.ts` exists with all functions from architecture doc
- [ ] `manga/electron/preload/index.ts` exists
- [ ] `cd manga && npx tsc -p tsconfig.node.json --noEmit` → zero errors

### After Phase 3
- [ ] `manga/src/types.ts` has NO references to `MangaDex*`
- [ ] `manga/src/types.ts` has `StartJobOpts`, `JobEvent`, `Chapter`, `Direction`, `Phase`, `ChapterStatus`
- [ ] `manga/src/env.d.ts` exists with `Window.api` declaration
- [ ] `cd manga && npx tsc -p tsconfig.node.json --noEmit` → zero errors

### After Phase 4
- [ ] `manga/src/reader/` folder exists with all 12 files
- [ ] `manga/src/MangaReaderScreen.tsx` does NOT exist (replaced by `src/reader/ReaderScreen.tsx`)
- [ ] `manga/src/mangaDexApi.ts` does NOT exist
- [ ] `manga/src/useMangaDexSearch.ts` does NOT exist
- [ ] `manga/src/MangaDexSearch.tsx` does NOT exist
- [ ] `manga/src/MangaDexDetail.tsx` does NOT exist
- [ ] `grep -r "mangadex\|MangaDex\|@shared" manga/src/` → zero matches
- [ ] `cd manga && npx tsc -p tsconfig.web.json --noEmit` → zero errors in reader/

### After Phase 5
- [ ] `manga/src/App.tsx` exists with tab nav
- [ ] `manga/src/downloader/DownloaderApp.tsx` exists
- [ ] `manga/src/downloader/JobCard.tsx` exists
- [ ] `manga/src/main.tsx` renders `<App />`
- [ ] `cd manga && npx tsc -p tsconfig.web.json --noEmit` → zero errors

### After Phase 6
- [ ] `npm install` from root completes without errors
- [ ] Root `package.json` has `dist:manga`, `dist:manga:win`, etc.
- [ ] Yuzha MainScreenUtils "Manga Reader ↗" button is removed
- [ ] `cd manga && npm run dev` opens Electron window (not a browser)
- [ ] Reader tab: can open a .cbz file, pages render
- [ ] Reader tab: folder scan opens directory picker
- [ ] Downloader tab: shows URL + direction + count + folder picker inputs
- [ ] Downloader tab: starting a job adds a card with discovery phase
- [ ] `cd manga && npm run typecheck` → zero errors

---

## Appendix — Additions Beyond User's Spec

These were not explicitly requested but are necessary for correctness:

1. **CSP in `index.html`** — Electron requires Content-Security-Policy. Without it, some Electron versions show warnings or block resources. The `img-src blob:` allowance is critical for CBZ image rendering.

2. **`backgroundColor: "#0f0f1a"` in BrowserWindow** — Prevents a white flash before the dark UI loads.

3. **`titleBarStyle: "hiddenInset"` on macOS** — Native traffic-light buttons. Falls back to default on Windows/Linux.

4. **HistoryEntry migration guard** — Existing users may have `source: "mangadex"` entries in localStorage. These must be filtered out on load rather than crashing.

5. **Both tabs always mounted** — Prevents loss of reading position when switching to Downloader and back. Uses `hidden` CSS class toggle, not conditional rendering.

6. **`onJobEvent` registered once on mount** — Registering it multiple times (e.g., on re-renders) would cause duplicate event handling and double-updating of job state.

7. **`emit` guard for destroyed `webContents`** — The main window can be closed while a download is in progress. Always check `!mainWindow.isDestroyed()` before `webContents.send`.

8. **`cancel-job` cleans up `cancelFlags` in `finally`** — Memory leak prevention for long-running sessions with many jobs.
