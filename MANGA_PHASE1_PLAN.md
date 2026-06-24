# Manga Reader — Phase 1 Implementation Plan
## Features: Reading History + Continue Reading + Folder Scanner

> **For AI agents:** Read this fully before touching any file. It covers exact architecture changes, new files, modified files, data structures, and every known bug with solutions. The existing reader works — do NOT rewrite it, only extend it.

---

## 0. Current State (What Already Exists)

**Location:** `yuzha/src/manga/`

**Existing files — do not delete any of these:**
```
types.ts              ← type definitions
useCbzLoader.ts       ← unzips CBZ → blob URLs
useReaderState.ts     ← page/zoom/mode/rtl state
useKeyboardNav.ts     ← arrow keys + ctrl+scroll
MangaUploader.tsx     ← drag-drop / click-to-open screen
MangaReader.tsx       ← core image display (single + webtoon)
MangaToolbar.tsx      ← top bar: back, title, page counter
MangaControls.tsx     ← bottom bar: prev/next, zoom, mode, rtl
MangaReaderScreen.tsx ← orchestrator: idle→loading→reading flow
```

**Current flow (simple 2-state machine):**
```
MangaReaderScreen
  ├── result.status !== "ready"  →  MangaUploader  (drag-drop entry)
  └── result.status === "ready"  →  Reader (MangaReader + toolbar + controls)
```

**Problem:** No history, no folder scanning, app resets to page 1 every time.

---

## 1. New Architecture

**New flow (4-view state machine):**
```
MangaReaderScreen  (view: "home" | "library" | "reader")
  ├── "home"    →  MangaHome
  │               ├── Continue Reading row  (from useReadingHistory)
  │               ├── [Open Folder] button  (from useFolderScanner)
  │               ├── [Open File] drag-drop (existing MangaUploader logic, inline)
  │               └── Scanned library grid  (from useFolderScanner)
  │
  ├── "library" →  MangaLibrary
  │               └── Series detail: chapter list with progress badges
  │
  └── "reader"  →  existing MangaReader + MangaToolbar + MangaControls
                   (+ history auto-save on every page change)
```

**Key rule:** `MangaUploader.tsx` becomes **unused** once `MangaHome` exists. Keep the file but stop using it in `MangaReaderScreen`. Do not delete it.

---

## 2. Data Structures

### 2.1 Reading History (localStorage)

**Storage key:** `"manga_history_v1"`  
**Format:** JSON array of `HistoryEntry[]`, sorted newest-first

```ts
// Add to types.ts
export type HistoryEntry = {
  key: string;           // unique ID: filename for drag-drop, "series::chapter" for folder
  displayTitle: string;  // shown in UI: chapter name without .cbz
  seriesName?: string;   // parent folder name (folder scan only)
  page: number;          // 0-indexed last read page
  totalPages: number;    // total pages in this chapter
  lastRead: number;      // Date.now() timestamp
  source: "file" | "folder"; // how it was opened
};
```

**Max entries:** 50. When adding a new entry that would exceed 50, drop the oldest (last item after sort).

**Key generation rules:**
- Drag-drop file: key = `file::${file.name}` (just the filename, no path available)
- Folder chapter: key = `folder::${seriesName}::${chapterFileName}`

### 2.2 Scanned Series (in-memory only, NOT persisted)

```ts
// Add to types.ts
export type ScannedChapter = {
  name: string;           // filename without .cbz, e.g. "Chapter 001"
  fileName: string;       // full filename with extension
  fileHandle: FileSystemFileHandle; // File System Access API handle
  historyEntry?: HistoryEntry;      // filled in by matching against history
};

export type ScannedSeries = {
  name: string;           // folder name, e.g. "One Piece"
  chapters: ScannedChapter[];  // sorted by natural filename order
  coverHandle?: FileSystemFileHandle; // first chapter's file handle for cover
};
```

**Why not persist FileSystemFileHandle?** Storing handles in IndexedDB requires re-requesting permission each session anyway, and adds significant complexity. Phase 1 = session-only scan. The user picks the folder once per browser session. History (page numbers) IS persisted.

---

## 3. New Files to Create

### 3.1 `yuzha/src/manga/useReadingHistory.ts`

Pure localStorage CRUD. No React state — just functions. Consumers call these functions directly.

```ts
import type { HistoryEntry } from "./types";

const STORAGE_KEY = "manga_history_v1";
const MAX_ENTRIES = 50;

function loadAll(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveAll(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function saveHistory(entry: HistoryEntry): void {
  const entries = loadAll().filter((e) => e.key !== entry.key); // remove old entry for same key
  entries.unshift(entry); // add to front (newest first)
  saveAll(entries.slice(0, MAX_ENTRIES));
}

export function loadHistory(): HistoryEntry[] {
  return loadAll();
}

export function getHistoryEntry(key: string): HistoryEntry | undefined {
  return loadAll().find((e) => e.key === key);
}

export function deleteHistoryEntry(key: string): void {
  saveAll(loadAll().filter((e) => e.key !== key));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

**Why pure functions (not a hook)?** History saving happens inside `useEffect` in the reader — wrapping in a hook would cause unnecessary re-renders and closure stale-value bugs.

### 3.2 `yuzha/src/manga/useFolderScanner.ts`

Handles the File System Access API. Degrades gracefully when API is unavailable.

```ts
import { useState, useCallback } from "react";
import type { ScannedSeries, ScannedChapter } from "./types";
import { loadHistory } from "./useReadingHistory";

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const CBZ_EXTENSIONS = new Set([".cbz"]);

function isCbzFile(name: string): boolean {
  return CBZ_EXTENSIONS.has(name.slice(name.lastIndexOf(".")).toLowerCase());
}

export function isFolderScanSupported(): boolean {
  return "showDirectoryPicker" in window;
}

export type FolderScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "ready"; series: ScannedSeries[] }
  | { status: "error"; message: string };

export function useFolderScanner() {
  const [state, setState] = useState<FolderScanState>({ status: "idle" });

  const scanFolder = useCallback(async () => {
    if (!isFolderScanSupported()) {
      setState({ status: "error", message: "Folder scanning is not supported in this browser. Use Chrome or Edge." });
      return;
    }

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await (window as any).showDirectoryPicker({ mode: "read" });
    } catch {
      // User cancelled — do nothing
      return;
    }

    setState({ status: "scanning" });
    const history = loadHistory();

    try {
      const seriesList: ScannedSeries[] = [];

      // Scan top-level: each subfolder = a series, each CBZ at root = standalone
      const rootCbzFiles: ScannedChapter[] = [];

      for await (const [name, handle] of (dirHandle as any).entries()) {
        if (handle.kind === "directory") {
          // This is a series folder
          const chapters: ScannedChapter[] = [];
          for await (const [chName, chHandle] of (handle as any).entries()) {
            if (chHandle.kind === "file" && isCbzFile(chName)) {
              const histKey = `folder::${name}::${chName}`;
              const historyEntry = history.find((e) => e.key === histKey);
              chapters.push({
                name: chName.replace(/\.cbz$/i, ""),
                fileName: chName,
                fileHandle: chHandle as FileSystemFileHandle,
                historyEntry,
              });
            }
          }
          if (chapters.length > 0) {
            chapters.sort((a, b) => naturalSort(a.fileName, b.fileName));
            seriesList.push({
              name,
              chapters,
              coverHandle: chapters[0]?.fileHandle,
            });
          }
        } else if (handle.kind === "file" && isCbzFile(name)) {
          // Standalone CBZ at root level — group as "Standalone" series
          const histKey = `folder::__root__::${name}`;
          const historyEntry = history.find((e) => e.key === histKey);
          rootCbzFiles.push({
            name: name.replace(/\.cbz$/i, ""),
            fileName: name,
            fileHandle: handle as FileSystemFileHandle,
            historyEntry,
          });
        }
      }

      // Sort series alphabetically
      seriesList.sort((a, b) => naturalSort(a.name, b.name));

      // Add standalone files as a synthetic series if any exist
      if (rootCbzFiles.length > 0) {
        rootCbzFiles.sort((a, b) => naturalSort(a.fileName, b.fileName));
        seriesList.unshift({
          name: "📄 Standalone Files",
          chapters: rootCbzFiles,
          coverHandle: rootCbzFiles[0]?.fileHandle,
        });
      }

      setState({ status: "ready", series: seriesList });
    } catch (err) {
      setState({ status: "error", message: `Scan failed: ${String(err)}` });
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, scanFolder, reset };
}
```

### 3.3 `yuzha/src/manga/MangaHome.tsx`

The new home/landing screen. Replaces `MangaUploader` as the first screen the user sees.

**Layout (top to bottom):**
1. Header: "📚 Manga Reader" title
2. **Continue Reading** row — horizontal scroll, max 10 recent items, only shown if history exists
3. Two action buttons: `[📂 Open Folder]` `[📄 Open File]`
4. **Library grid** — shown after folder scan, series cards in a responsive grid
5. Drag-and-drop zone (whole page accepts drops, subtle indicator)

```tsx
import React, { useRef, useState, useCallback } from "react";
import type { HistoryEntry, ScannedSeries, ScannedChapter } from "./types";
import { FolderScanState, isFolderScanSupported } from "./useFolderScanner";

type Props = {
  onBack?: () => void;
  history: HistoryEntry[];
  folderState: FolderScanState;
  onScanFolder: () => void;
  onOpenFile: (file: File) => void;
  onContinueReading: (entry: HistoryEntry) => void;
  onOpenChapter: (series: ScannedSeries, chapter: ScannedChapter) => void;
  onOpenSeries: (series: ScannedSeries) => void;
  onDeleteHistory: (key: string) => void;
  isLoadingFile: boolean;
  fileError: string | null;
};

export default function MangaHome({ ... }: Props) { ... }
```

**Continue Reading card** shows:
- Chapter title (truncated)
- Series name (if from folder)
- Progress bar: `page / totalPages`
- "Page X / Y" label
- "× Remove" button (calls `onDeleteHistory`)

**Series card** (library grid) shows:
- Cover image (first page of first chapter, lazy-loaded using `fileHandle.getFile()` + `useCbzLoader` logic inline)
- Series name
- Chapter count: "12 chapters"
- Progress: "Ch.3 / 12" if any chapters have history

**Chapter list** is NOT a separate screen — it's a collapsible panel below the series card in Phase 1, OR navigates to `MangaLibrary` view (either approach is fine; library view is simpler to implement correctly).

### 3.4 `yuzha/src/manga/MangaLibrary.tsx`

Shows when user clicks a series card. Displays the chapter list for that series.

```tsx
type Props = {
  series: ScannedSeries;
  onBack: () => void;
  onOpenChapter: (chapter: ScannedChapter) => void;
};
```

**Chapter row** shows:
- Chapter name
- Progress badge: "✅ Done" (page === totalPages - 1) | "Page 45 / 120" | "Unread" (no history)
- Click → opens reader

### 3.5 `yuzha/src/manga/useCoverLoader.ts`

Utility to extract and cache the first page of a CBZ as a blob URL for cover display in the library grid.

```ts
import { useState, useEffect } from "react";
import { unzip } from "fflate";

// Simple image extension check (same as useCbzLoader)
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

export function useCoverLoader(fileHandle: FileSystemFileHandle | undefined): string | null {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileHandle) return;
    let url: string | null = null;

    (async () => {
      try {
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        await new Promise<void>((resolve, reject) => {
          unzip(new Uint8Array(buffer), (err, files) => {
            if (err) { reject(err); return; }
            const imageEntries = Object.entries(files)
              .filter(([name]) => {
                const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
                return IMAGE_EXTENSIONS.has(ext) && !name.startsWith("__MACOSX");
              })
              .sort(([a], [b]) => naturalSort(a, b));
            
            if (imageEntries.length > 0) {
              const [name, data] = imageEntries[0]!;
              const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
              const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
              const blob = new Blob([data], { type: mime });
              url = URL.createObjectURL(blob);
              setCoverUrl(url);
            }
            resolve();
          });
        });
      } catch {
        // Cover load failed — show placeholder
      }
    })();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileHandle]);

  return coverUrl;
}
```

---

## 4. Modified Files

### 4.1 `yuzha/src/manga/types.ts` — ADD new types

Do not remove existing types. Append:

```ts
export type HistoryEntry = {
  key: string;
  displayTitle: string;
  seriesName?: string;
  page: number;
  totalPages: number;
  lastRead: number;
  source: "file" | "folder";
};

export type ScannedChapter = {
  name: string;
  fileName: string;
  fileHandle: FileSystemFileHandle;
  historyEntry?: HistoryEntry;
};

export type ScannedSeries = {
  name: string;
  chapters: ScannedChapter[];
  coverHandle?: FileSystemFileHandle;
};
```

**TypeScript note:** `FileSystemFileHandle` and `FileSystemDirectoryHandle` are part of `lib.dom.d.ts` in TypeScript 4.4+. The project uses `"lib": ["ES2020", "DOM"]` in `tsconfig.base.json` — these types ARE available. Do not install any extra packages for this.

### 4.2 `yuzha/src/manga/MangaReaderScreen.tsx` — REWRITE orchestration logic

This is the main change. The file currently has a simple 2-state flow. Replace with a 4-view state machine.

**New state:**
```ts
type View = "home" | "library" | "reader";
const [view, setView] = useState<View>("home");
const [activeSeries, setActiveSeries] = useState<ScannedSeries | null>(null);
const [activeChapter, setActiveChapter] = useState<ScannedChapter | null>(null);
const [activeHistoryKey, setActiveHistoryKey] = useState<string | null>(null);
const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
```

**History auto-save (CRITICAL):**
Add a `useEffect` that fires whenever `currentPage` changes while in reader view. It must save to localStorage AND update the local `history` state so the home screen reflects it immediately when the user goes back.

```ts
useEffect(() => {
  if (view !== "reader" || !activeHistoryKey || pages.length === 0) return;
  
  const entry: HistoryEntry = {
    key: activeHistoryKey,
    displayTitle: activeChapter?.name ?? result.fileName.replace(/\.cbz$/i, ""),
    seriesName: activeSeries?.name,
    page: currentPage,
    totalPages: pages.length,
    lastRead: Date.now(),
    source: activeChapter ? "folder" : "file",
  };
  
  saveHistory(entry);
  setHistory(loadHistory()); // refresh local state
}, [currentPage, view]);
```

**IMPORTANT:** The `useEffect` dependency array must include `currentPage` and `view`. Do NOT include `pages`, `result`, `activeHistoryKey` as they would cause extra saves on initial render. Use a ref to track if we're "actively reading" before saving.

**Opening a chapter from history (continue reading):**
When user clicks a history entry on the home screen:
1. If `source === "file"` → show drag-drop uploader with a toast "Re-open the same file to continue"
2. If `source === "folder"` → find the matching chapter in `folderState.series`, call `openChapter(chapter)`

**Opening a chapter from folder scan:**
```ts
const openChapter = async (series: ScannedSeries, chapter: ScannedChapter) => {
  const file = await chapter.fileHandle.getFile();
  // Set active context
  setActiveSeries(series);
  setActiveChapter(chapter);
  setActiveHistoryKey(`folder::${series.name}::${chapter.fileName}`);
  // Load the file
  loadFile(file);
  // Restore page from history
  const hist = getHistoryEntry(`folder::${series.name}::${chapter.fileName}`);
  if (hist && hist.page > 0) {
    // goToPage called after pages are loaded — use a flag
    pendingPageRestoreRef.current = hist.page;
  }
  setView("reader");
};
```

**Restoring page position:**
Use a `useRef` for the pending page restore, and a `useEffect` that watches `pages.length` to apply it:
```ts
const pendingPageRestoreRef = useRef<number | null>(null);

useEffect(() => {
  if (pages.length > 0 && pendingPageRestoreRef.current !== null) {
    goToPage(pendingPageRestoreRef.current);
    pendingPageRestoreRef.current = null;
  }
}, [pages.length]);
```

**Going back from reader:**
When user presses ← Back in the toolbar while reading:
- If came from folder scan → go back to "library" view (show the series)
- If came from drag-drop file → go back to "home" view
- Save history before leaving (final save)

### 4.3 `yuzha/src/manga/MangaToolbar.tsx` — Add series name display

When reading a folder chapter, show series name above the chapter name:

```tsx
// If seriesName provided, show:
//  [← Back]  One Piece  ›  Chapter 001  [45 / 120]
// If no seriesName (drag-drop):
//  [← Back]  Chapter 001  [45 / 120]
```

Add optional `seriesName?: string` prop.

---

## 5. Screen Layout Details

### 5.1 MangaHome layout

```
┌─────────────────────────────────────┐
│  ← Back        📚 Manga Reader       │  ← header (if onBack provided)
├─────────────────────────────────────┤
│  Continue Reading                    │  ← only if history.length > 0
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │cover │ │cover │ │cover │  →      │  ← horizontal scroll
│  │Ch.5  │ │Ch.12 │ │Ch.2  │        │
│  │██░░░ │ │████░ │ │█░░░░ │        │  ← progress bar
│  └──────┘ └──────┘ └──────┘        │
├─────────────────────────────────────┤
│  [📂 Open Folder] [📄 Open File]     │  ← action buttons
│  (hidden if browser unsupported)    │
├─────────────────────────────────────┤
│  My Library                  (12)   │  ← only if folder scanned
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │cover │ │cover │ │cover │        │
│  │Series│ │Series│ │Series│        │
│  │12 ch │ │3 ch  │ │8 ch  │        │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
   Drag & drop anywhere to open file   ← subtle bottom text
```

### 5.2 MangaLibrary layout

```
┌─────────────────────────────────────┐
│  ← One Piece                         │  ← back to home
│  12 chapters                         │
├─────────────────────────────────────┤
│  Chapter 001              Unread ›   │
│  Chapter 002          Page 45/120 ›  │
│  Chapter 003               Done ✅ ›  │
│  Chapter 004              Unread ›   │
│  ...                                 │
└─────────────────────────────────────┘
```

---

## 6. Known Bugs & Solutions

### BUG-01: `showDirectoryPicker` throws DOMException when user cancels
**Symptom:** Unhandled promise rejection crashes the app.  
**Cause:** User presses Cancel in the folder picker dialog — browser throws `DOMException: The user aborted a request.`  
**Solution:** Wrap in try/catch. Check `err.name === "AbortError"` and silently return. Already handled in `useFolderScanner.ts` with generic catch.

### BUG-02: Page restore fires too early (pages array still empty)
**Symptom:** `goToPage(45)` called before CBZ is unzipped → `setCurrentPage` clamps to 0.  
**Cause:** `openChapter` calls `loadFile` (async), then immediately calls `goToPage` — but pages aren't ready yet.  
**Solution:** Use `pendingPageRestoreRef`. The `useEffect` watching `pages.length` applies it after pages are ready. This is the correct pattern. Do NOT use `setTimeout` — it's a race condition.

### BUG-03: History auto-save fires on mount (saves page 0 before reading)
**Symptom:** Continue Reading shows "Page 0 / 120" for every newly opened chapter.  
**Cause:** `useEffect` with `currentPage` in deps fires on initial render with `currentPage = 0`.  
**Solution:** Use a ref `isReadingActiveRef` set to `true` only after `pages.length > 0` AND user has been on reader view for at least one render. Alternative: skip save if `page === 0 && Date.now() - openedAt < 2000`. Simplest: only save if `page > 0 || totalPages > 0`. **Best:** only save when `currentPage` actually changes — use a previous-value ref:
```ts
const prevPageRef = useRef<number>(-1);
// In effect: if (currentPage === prevPageRef.current) return;
// prevPageRef.current = currentPage;
```

### BUG-04: `FileSystemFileHandle.getFile()` fails if file was moved/deleted
**Symptom:** Clicking a chapter in library throws `NotFoundError`.  
**Cause:** User moved the file between scan and click.  
**Solution:** Wrap `fileHandle.getFile()` in try/catch in `openChapter`. Show an error toast: "File not found. Please re-scan your folder."

### BUG-05: Cover images for all series load simultaneously and freeze the UI
**Symptom:** Opening library with 20+ series causes visible lag.  
**Cause:** `useCoverLoader` fires for all series cards at once — each unzips a CBZ file.  
**Solution:** Use `loading="lazy"` on the img tag AND only start the cover extraction when the card is visible. Simplest: add a `useState(false)` initialized to `false`, set to `true` in an `IntersectionObserver` or just after a short timeout. Or: use React's `useEffect` with a delay based on index: `setTimeout(..., index * 100)`. Alternatively: don't show covers at all in Phase 1 — just show a placeholder icon with the series name. This avoids the complexity entirely.

**Recommended for Phase 1:** Skip covers for series cards, just show a 📚 placeholder icon + series name. Covers can be added in Phase 2.

### BUG-06: Folder scan includes system files and hidden files
**Symptom:** Items like `.DS_Store`, `Thumbs.db` appear in the chapter list.  
**Cause:** No filter for hidden/system files.  
**Solution:** Filter out any file/folder whose name starts with `.` (dot files). Already handled in `useFolderScanner.ts` with `!name.startsWith(".")` check.

### BUG-07: localStorage save fails silently when storage is full
**Symptom:** History stops persisting after many sessions.  
**Cause:** `localStorage` has a ~5MB limit. 50 history entries in JSON is tiny (~10KB) — not a real concern with MAX_ENTRIES=50. But if somehow corrupted, `JSON.parse` throws.  
**Solution:** The `loadAll()` function wraps parse in try/catch and returns `[]` on failure. The `saveAll()` function also wraps in try/catch. Already handled in `useReadingHistory.ts`.

### BUG-08: Continue Reading entry from "folder" source can't be resumed without folder re-scan
**Symptom:** User closes browser, reopens, sees "Chapter 5" in Continue Reading, clicks it — nothing happens because folder data is gone.  
**Cause:** `FileSystemDirectoryHandle` is session-only in Phase 1. History entry has `source: "folder"` but no handle in memory.  
**Solution:** When user clicks a folder-sourced history entry and folder is not scanned yet, show a message: "Scan your manga folder to continue this chapter" with a [Scan Folder] button. Do NOT silently fail. This is an expected Phase 1 limitation, not a bug.

### BUG-09: TypeScript error — `showDirectoryPicker` not in type definitions
**Symptom:** `Property 'showDirectoryPicker' does not exist on type 'Window'`.  
**Cause:** `showDirectoryPicker` is a newer API not fully typed in all TS lib.dom versions.  
**Solution:** Cast to `any`: `(window as any).showDirectoryPicker(...)`. Already handled in `useFolderScanner.ts`. Do NOT install `@types/wicg-file-system-access` — it conflicts with the existing DOM types.

### BUG-10: `for await...of handle.entries()` TypeScript error
**Symptom:** `Property 'entries' does not exist on type 'FileSystemDirectoryHandle'`.  
**Solution:** Cast the handle: `(dirHandle as any).entries()`. Same for subfolder handles. Already handled in `useFolderScanner.ts`.

### BUG-11: History state in `MangaReaderScreen` goes stale after save
**Symptom:** Continue Reading row doesn't update immediately when user returns from reader.  
**Cause:** `history` state is loaded once on mount with `useState(() => loadHistory())`. After saving, the state isn't refreshed.  
**Solution:** Call `setHistory(loadHistory())` after every `saveHistory()` call. Also call it in the cleanup of the reader's `useEffect` (when user leaves reader view). This keeps it in sync.

### BUG-12: Opening same filename but different CBZ gives wrong "continue" page
**Symptom:** User has "Ch01.cbz" for two different manga — history key collision.  
**Cause:** Drag-drop history key is just `file::Ch01.cbz` — no series context.  
**Solution:** This is a known Phase 1 limitation of drag-drop. Folder-scan is immune (key includes series name). Document in UI: "For best continue-reading support, use Scan Folder." Do NOT try to fix this in Phase 1.

---

## 7. Exact Checklist for the Building Agent

### Step 1 — Types
- [ ] Open `yuzha/src/manga/types.ts`
- [ ] Append `HistoryEntry`, `ScannedChapter`, `ScannedSeries` types
- [ ] Keep existing `ReadingMode` and `CbzLoadResult` unchanged

### Step 2 — New files (create in order)
- [ ] Create `yuzha/src/manga/useReadingHistory.ts` (pure functions, no React)
- [ ] Create `yuzha/src/manga/useFolderScanner.ts` (hook)
- [ ] Create `yuzha/src/manga/useCoverLoader.ts` (hook) — OPTIONAL for Phase 1 (can skip covers)
- [ ] Create `yuzha/src/manga/MangaHome.tsx` (home screen component)
- [ ] Create `yuzha/src/manga/MangaLibrary.tsx` (series chapter list component)

### Step 3 — Modify existing files
- [ ] `MangaToolbar.tsx` — add optional `seriesName?: string` prop, display it
- [ ] `MangaReaderScreen.tsx` — implement 4-view state machine (most complex change)

### Step 4 — Verify
- [ ] Drag-drop a CBZ, read to page 5, press Back → home shows "Continue Reading" with page 5
- [ ] Re-open the reader from history → jumps to page 5
- [ ] Scan a folder with subfolders → series appear in library grid
- [ ] Click series → chapter list → click chapter → opens reader
- [ ] Read chapter to page 10, go back → chapter shows "Page 10 / X" badge
- [ ] Reload browser tab → history survives (localStorage persisted)
- [ ] Folder library is GONE after reload (expected, session-only)
- [ ] Open Folder button is hidden if browser doesn't support File System Access API

### Step 5 — Do NOT change
- [ ] `useCbzLoader.ts` — no changes needed
- [ ] `useReaderState.ts` — no changes needed
- [ ] `useKeyboardNav.ts` — no changes needed
- [ ] `MangaReader.tsx` — no changes needed
- [ ] `MangaControls.tsx` — no changes needed
- [ ] Files in `manga/` standalone workspace (separate from `yuzha/src/manga/`)

---

## 8. Out of Scope for Phase 1

- IndexedDB persistence of FileSystemDirectoryHandle (Phase 2)
- Series covers extracted from CBZ (Phase 2)
- MangaDex integration (Phase 3)
- Delete/manage downloaded chapters (Phase 3)
- Search/filter within library (Phase 3)
- Chapter auto-advance (Phase 3)
