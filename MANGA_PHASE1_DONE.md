# Manga Reader — Phase 1 Implementation Record
## Features Built: Reading History + Continue Reading + Folder Scanner

> **Status:** ✅ COMPLETE — TypeScript clean, zero errors, deployed in yuzha workspace.
> This document records exactly what was built, the architecture decisions made, and serves as reference for Phase 2 work.

---

## 1. What Was Built

### Feature 1 — Reading History (localStorage)
- Every page turn in the reader is auto-saved to `localStorage` under key `manga_history_v1`
- Stores: chapter title, series name, current page (0-indexed), total pages, timestamp, source type
- Max 50 entries, newest first — oldest entry is dropped when limit is exceeded
- Survives browser refresh/close — fully persistent
- Deduplication: reopening the same file updates its entry rather than creating a duplicate

### Feature 2 — Continue Reading
- Home screen shows a horizontal scroll row of last 10 read chapters
- Each card shows: chapter title, series name (if folder), progress bar, "Page X / Y"
- Completed chapters show "✅ Done" in green
- Click a card → jumps directly to that page (page restore uses a ref to avoid timing bug)
- × button on each card removes it from history
- For folder-sourced chapters: requires folder to be re-scanned first (session-only handles)
- For drag-drop files: shows an alert asking user to re-open the same file

### Feature 3 — Folder Scanner (File System Access API)
- "📂 Open Folder" button calls `showDirectoryPicker()` — browser native folder picker
- Recursively scans: top-level subfolders = series, CBZ files inside = chapters
- CBZ files at root level grouped as "📄 Standalone Files" series
- Results appear as a library grid on the home screen
- Chapters sorted by natural filename order (Ch.1, Ch.2, ... Ch.10, not Ch.1, Ch.10, Ch.2)
- History entries are matched against scanned chapters — shows progress badges on chapter list
- Button is hidden automatically if browser doesn't support the API (Firefox/Safari)

### Architecture — 4-View State Machine

```
MangaReaderScreen (orchestrator)
  ├── "home"    →  MangaHome
  ├── "library" →  MangaLibrary (series detail)
  ├── "reader"  →  MangaToolbar + MangaReader + MangaControls
  └── loading / error states (inline)
```

---

## 2. Files Created

### `yuzha/src/manga/useReadingHistory.ts` ← NEW
Pure functions (no React). All localStorage CRUD.

```
Exports:
  saveHistory(entry)       — upsert entry, keep newest first, trim to 50
  loadHistory()            — returns HistoryEntry[] from localStorage
  getHistoryEntry(key)     — look up a single entry by key
  deleteHistoryEntry(key)  — remove one entry
  clearHistory()           — wipe all history
```

**Key format rules:**
- Drag-drop file: `file::${file.name}`
- Folder chapter: `folder::${seriesName}::${chapterFileName}`
- Root-level folder file: `folder::__root__::${chapterFileName}`

### `yuzha/src/manga/useFolderScanner.ts` ← NEW
React hook. Manages folder scan state and calls File System Access API.

```
Exports:
  useFolderScanner()       — returns { state, scanFolder, reset }
  isFolderScanSupported()  — returns boolean (checks showDirectoryPicker in window)

State shape:
  { status: "idle" }
  { status: "scanning" }
  { status: "ready", series: ScannedSeries[] }
  { status: "error", message: string }
```

**Design decisions:**
- Handles are session-only (not persisted to IndexedDB)
- User cancelling the picker is silently swallowed (AbortError catch)
- Hidden dot files and `__MACOSX` artifacts are skipped
- `(window as any).showDirectoryPicker` — cast to avoid TS lib mismatch

### `yuzha/src/manga/MangaHome.tsx` ← NEW
Home screen component. Replaces `MangaUploader` as the entry point.

```
Props:
  onBack?            — optional back to main app
  history            — HistoryEntry[] for Continue Reading row
  folderState        — FolderScanState from useFolderScanner
  onScanFolder       — triggers folder picker
  onOpenFile(file)   — triggers CBZ load from drag-drop / file picker
  onContinueReading  — handles click on history card
  onOpenSeries       — navigates to library view for a series
  onDeleteHistory    — removes one entry from history
  isLoadingFile      — shows loading indicator
  fileError          — shows error banner
```

**Sections rendered (in order):**
1. Header (← Back button + title)
2. Continue Reading row — horizontal scroll, max 10 cards (only if history exists)
3. Action buttons — [📂 Open Folder] [📄 Open File]
4. Error banners (folder error, file error)
5. Library grid — 2–5 columns responsive (only after folder scan)
6. Empty state hint (only if no history and no scan)

**Drag-and-drop:** whole page is a drop target — blue overlay appears when dragging

### `yuzha/src/manga/MangaLibrary.tsx` ← NEW
Series detail screen. Shows chapter list for one series.

```
Props:
  series             — ScannedSeries with chapters
  onBack             — returns to home
  onOpenChapter      — opens a chapter in the reader
```

**Each chapter row shows:**
- Chapter name
- Progress bar (blue = in progress, green = done)
- Status badge: "Unread" | "Pg X / Y" | "✅ Done"

---

## 3. Files Modified

### `yuzha/src/manga/types.ts` ← MODIFIED
Added 3 new types (existing types unchanged):

```ts
HistoryEntry {
  key: string           // unique ID, format: "file::name" or "folder::series::chapter"
  displayTitle: string  // chapter title shown in UI
  seriesName?: string   // parent folder name (folder source only)
  page: number          // 0-indexed last read page
  totalPages: number    // total page count
  lastRead: number      // Date.now() timestamp
  source: "file" | "folder"
}

ScannedChapter {
  name: string                      // display name (no .cbz extension)
  fileName: string                  // full filename with extension
  fileHandle: FileSystemFileHandle  // live handle for reading the file
  historyEntry?: HistoryEntry       // matched from localStorage on scan
}

ScannedSeries {
  name: string                       // folder name
  chapters: ScannedChapter[]         // sorted by natural order
  coverHandle?: FileSystemFileHandle // first chapter handle (for future cover loading)
}
```

### `yuzha/src/manga/MangaToolbar.tsx` ← MODIFIED
Added optional `seriesName?: string` prop.

**Before:** `[← Back]  Chapter 001  [45 / 120]`  
**After (with series):** `[← Back]  One Piece (blue, small)  /  Chapter 001  [45 / 120]`

The series name appears as a small blue label above the chapter name in the title area.

### `yuzha/src/manga/MangaReaderScreen.tsx` ← MAJOR REWRITE
Changed from a 2-state (idle/ready) flow to a 4-view state machine.

**New state added:**
```ts
view: "home" | "library" | "reader"
activeSeries: ScannedSeries | null
activeChapter: ScannedChapter | null
activeHistoryKey: string | null
history: HistoryEntry[]
pendingPageRestoreRef: MutableRefObject<number | null>
prevPageRef: MutableRefObject<number>
```

**New behavior:**
- `openFile(file)` — for drag-drop, sets key `file::name`, checks history for restore, loads CBZ, goes to reader
- `openChapter(series, chapter)` — for folder scan, gets file from handle, sets key `folder::series::chapter`, checks history, loads CBZ, goes to reader
- `handleContinueReading(entry)` — dispatches to openChapter if folder is scanned, shows alert otherwise
- `handleReaderBack()` — final history save, then returns to library (if from folder) or home (if drag-drop)
- Auto-save `useEffect` — fires on every `currentPage` change, skips if page unchanged (prevPageRef guard)
- Page restore `useEffect` — watches `pages.length`, applies `pendingPageRestoreRef` once pages are ready

### `yuzha/src/manga/useCbzLoader.ts` ← MINOR FIX
Fixed pre-existing TypeScript error:
```ts
// Before (TS error: Uint8Array<ArrayBufferLike> not assignable to BlobPart)
new Blob([data], ...)

// After (correct cast)
new Blob([data.buffer as ArrayBuffer], ...)
```

---

## 4. Files NOT Changed (unchanged, do not touch)
```
MangaReader.tsx     — core image display component
MangaControls.tsx   — bottom navigation bar
MangaUploader.tsx   — kept but no longer used as entry point
useReaderState.ts   — page/zoom/mode/rtl state hook
useKeyboardNav.ts   — keyboard shortcuts hook
```

---

## 5. Known Limitations (Accepted for Phase 1)

| Limitation | Impact | Phase |
|---|---|---|
| Folder handles are session-only | User must re-scan folder after browser refresh | Phase 2 |
| Drag-drop history can't auto-resume (no file handle) | User must re-open same file manually | Phase 2 |
| No series covers (placeholder icon only) | Library grid shows 📚 icon instead of real cover | Phase 2 |
| History key collision for same filename, different manga | Rare edge case with drag-drop only | Phase 2 |

---

## 6. Phase 2 Scope (Next Steps)

1. **IndexedDB handle persistence** — store `FileSystemDirectoryHandle` so folder re-scans survive refresh
2. **Series covers** — extract first page of first chapter as cover image for library grid (lazy loaded)
3. **MangaDex integration** — search online, view chapters, download to IndexedDB for offline reading
4. **Chapter auto-advance** — at end of chapter, prompt "Next Chapter →"
5. **Series-aware continue reading** — clicking history card for a folder chapter auto-triggers folder re-scan
