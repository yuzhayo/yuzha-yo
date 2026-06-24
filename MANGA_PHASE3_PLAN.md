# Manga Reader — Phase 3 Plan
## Feature: Offline Download (IndexedDB)

> **Read before building.** Phase 2 must be complete before starting Phase 3. This doc covers the full download system: IndexedDB schema, download queue, unified library, and all known bugs.

---

## 0. Prerequisites

- Phase 1 complete (history, folder scanner, home screen)
- Phase 2 complete (MangaDex search, detail screen, online streaming reader)
- `idb` npm package needed — install at root: `npm install idb`
  - `idb` is a tiny typed wrapper around the raw IndexedDB API. It prevents callback hell and gives clean async/await. Do NOT use raw `indexedDB.open()`.
- No other new packages needed

---

## 1. What Gets Built

### Download a Chapter
- "Download" button on `MangaDexDetail.tsx` becomes active (was disabled in Phase 2)
- Clicking it fetches all page images as blobs, stores them in IndexedDB
- A download queue shows progress: "Downloading Ch. 5 — 12 / 47 pages"
- After download: button changes to "✅ Downloaded" — clicking it removes the download

### Offline Reading
- Downloaded chapters open instantly with no internet — pages served from IndexedDB blobs
- The existing `MangaReader` component works unchanged — just gets blob: URLs instead of CDN URLs
- History still auto-saves page position the same way

### Unified Library
- Home screen library grid now shows 2 tabs: **Local** (CBZ/folder) and **Downloaded** (MangaDex)
- Downloaded manga appear as series cards with chapters marked ✅
- Delete a downloaded series: long-press card → delete confirmation

### Download Manager
- Small download queue panel (slide-up from bottom or drawer)
- Shows active download with progress bar
- Lists queued downloads
- Cancel button per download

---

## 2. IndexedDB Schema

**Database name:** `manga_offline_v1`  
**Version:** 1

### Object Store 1: `manga_meta`
Stores metadata about each downloaded manga (one record per manga).

```ts
// Key: mangaId (string)
type StoredMangaMeta = {
  mangaId: string;           // MangaDex manga ID
  title: string;             // English title
  coverBlob: Blob;           // cover image stored as blob
  status: string;            // "ongoing" | "completed" | etc.
  tags: string[];            // genre tag names
  addedAt: number;           // Date.now()
};
```

### Object Store 2: `chapter_meta`
Stores metadata about each downloaded chapter (one record per chapter).

```ts
// Key: chapterId (string)
// Index: "mangaId" for querying all chapters of a manga
type StoredChapterMeta = {
  chapterId: string;
  mangaId: string;           // for index lookup
  chapterLabel: string;      // "Ch. 5" or "Ch. 5 — Title"
  chapterNumber: string | null;
  totalPages: number;
  downloadedAt: number;
  sizeBytes: number;         // total bytes stored (for display)
};
```

### Object Store 3: `chapter_pages`
Stores page blobs for each chapter (one record per page).

```ts
// Key: `${chapterId}::${pageIndex}` (string)
// Index: "chapterId" for loading all pages of a chapter
type StoredPage = {
  key: string;              // composite key
  chapterId: string;        // for index lookup
  pageIndex: number;        // 0-indexed
  blob: Blob;               // image data
};
```

**Why separate stores for meta and pages?**
- Listing downloaded manga/chapters only needs meta — no need to load all page blobs
- Page blobs can be large (20–100MB per chapter) — keeping them separate avoids loading unnecessary data
- Deletion is efficient: one `index.openCursor(chapterId)` deletes all pages for a chapter

---

## 3. New Types (append to `types.ts`)

```ts
export type DownloadStatus =
  | { status: "idle" }
  | { status: "queued" }
  | { status: "downloading"; progress: number; total: number }
  | { status: "done" }
  | { status: "error"; message: string };

export type DownloadJob = {
  chapterId: string;
  mangaId: string;
  chapterLabel: string;
  mangaTitle: string;
  status: DownloadStatus;
};

export type DownloadedChapter = {
  chapterId: string;
  mangaId: string;
  chapterLabel: string;
  chapterNumber: string | null;
  totalPages: number;
  downloadedAt: number;
  sizeBytes: number;
};

export type DownloadedManga = {
  mangaId: string;
  title: string;
  coverUrl: string;         // blob: URL created from stored coverBlob
  status: string;
  tags: string[];
  chapters: DownloadedChapter[];
  addedAt: number;
};
```

---

## 4. New Files to Create

### 4.1 `yuzha/src/manga/mangaDb.ts`

All IndexedDB operations. Pure async functions, no React. Uses `idb` package.

```ts
import { openDB } from "idb";

const DB_NAME = "manga_offline_v1";
const DB_VERSION = 1;

// Initialize DB (call once on app start)
export async function initDb(): Promise<void>

// Save manga metadata (called when first chapter of a manga is downloaded)
export async function saveMangaMeta(meta: StoredMangaMeta): Promise<void>

// Save chapter metadata
export async function saveChapterMeta(meta: StoredChapterMeta): Promise<void>

// Save one page blob
export async function savePage(chapterId: string, pageIndex: number, blob: Blob): Promise<void>

// Load all pages of a chapter as blob: URLs (returns string[])
export async function loadChapterPages(chapterId: string): Promise<string[]>

// Check if a chapter is downloaded
export async function isChapterDownloaded(chapterId: string): Promise<boolean>

// Get all downloaded manga with their chapters
export async function getAllDownloadedManga(): Promise<DownloadedManga[]>

// Delete a chapter and all its pages
export async function deleteChapter(chapterId: string): Promise<void>

// Delete a manga and ALL its chapters and pages
export async function deleteManga(mangaId: string): Promise<void>

// Get total storage used (sum of sizeBytes across all chapter_meta)
export async function getTotalStorageBytes(): Promise<number>
```

**`loadChapterPages` implementation:**
```ts
export async function loadChapterPages(chapterId: string): Promise<string[]> {
  const db = await getDb();
  const pages: StoredPage[] = await db.getAllFromIndex("chapter_pages", "chapterId", chapterId);
  pages.sort((a, b) => a.pageIndex - b.pageIndex);
  return pages.map((p) => URL.createObjectURL(p.blob));
  // Caller is responsible for revoking these URLs when done reading
}
```

**Important:** Blob URLs created from IndexedDB must be revoked when the reader closes. Add cleanup to `useCbzLoader.ts` reset function (already handles blob: URLs with the existing guard).

### 4.2 `yuzha/src/manga/useDownloadManager.ts`

React hook. Manages download queue and drives the actual download process.

```ts
export function useDownloadManager() {
  return {
    queue: DownloadJob[],
    addDownload: (manga: MangaDexManga, chapter: MangaDexChapter) => void,
    cancelDownload: (chapterId: string) => void,
    isDownloaded: (chapterId: string) => boolean,
    downloadedChapterIds: Set<string>,   // refreshed from DB on mount
    refreshDownloaded: () => Promise<void>,
  };
}
```

**Download process (for one chapter):**
```
1. Fetch page URLs: getChapterPages(chapterId) → string[] (CDN URLs)
2. For each URL (in order):
   a. fetch(url) → Response
   b. response.blob() → Blob
   c. savePage(chapterId, index, blob)
   d. update progress state
3. Save chapter metadata (totalPages, sizeBytes)
4. Save manga metadata (if not already saved, fetch + store cover blob)
5. Mark job as "done", remove from queue
6. Refresh downloadedChapterIds
```

**Queue behavior:**
- Only 1 download active at a time (sequential, not parallel)
- New `addDownload` calls are appended to queue and processed in order
- If active download errors, log error to job, continue with next queued item
- Cancel: if currently downloading, abort via `AbortController`; if queued, just remove from queue

**AbortController pattern:**
```ts
const abortControllerRef = useRef<AbortController | null>(null);

// In download loop:
const controller = new AbortController();
abortControllerRef.current = controller;
const response = await fetch(url, { signal: controller.signal });

// In cancelDownload:
abortControllerRef.current?.abort();
```

### 4.3 `yuzha/src/manga/DownloadQueue.tsx`

UI panel showing active download queue. Fixed bottom bar, only shown when queue is non-empty.

```tsx
type Props = {
  queue: DownloadJob[];
  onCancel: (chapterId: string) => void;
};
```

**Layout:**
```
┌─────────────────────────────────────────────┐
│ ⬇ Downloading: Ch. 5 — Chapter Title        │
│ ████████░░░░░░░░░░░░ 12 / 47 pages  [✕]     │
│                                              │
│ Queued: Ch. 6, Ch. 7                         │
└─────────────────────────────────────────────┘
```

Fixed to bottom of screen, above `MangaControls` if reader is open, above bottom edge otherwise. `z-index: 40` (below toolbar at 50).

### 4.4 `yuzha/src/manga/MangaDownloadedLibrary.tsx`

Shows downloaded manga in a grid, same visual style as folder library.

```tsx
type Props = {
  manga: DownloadedManga[];
  onOpenManga: (manga: DownloadedManga) => void;
  onDeleteManga: (mangaId: string) => void;
  totalStorageBytes: number;
};
```

**Grid card shows:**
- Cover image from blob: URL
- Title
- Chapter count
- "X MB" storage usage

**Long-press to delete:** Show confirmation dialog before calling `deleteManga`.

---

## 5. Modified Files

### 5.1 `yuzha/src/manga/MangaHome.tsx` — Add library tabs

Replace the single library section with a 2-tab layout:

```
My Library    [Local] [Downloaded]
```

- **Local tab:** folder-scanned series (existing code, unchanged)
- **Downloaded tab:** `MangaDownloadedLibrary` component

Add props:
```tsx
downloadedManga: DownloadedManga[];
totalStorageBytes: number;
onOpenDownloadedManga: (manga: DownloadedManga) => void;
onDeleteDownloadedManga: (mangaId: string) => void;
```

### 5.2 `yuzha/src/manga/MangaDexDetail.tsx` — Enable Download button

The "Download" button (disabled in Phase 2) becomes functional:

```tsx
// New props:
downloadManager: ReturnType<typeof useDownloadManager>;
```

Per chapter row, the download button logic:
```tsx
const downloaded = downloadManager.isDownloaded(chapter.id);
const inQueue = downloadManager.queue.some(j => j.chapterId === chapter.id);

// Button states:
// downloaded  → "✅ Remove" (red on click → deleteChapter)
// inQueue     → "⏳ Queued" (disabled)
// else        → "⬇ Download" (calls addDownload)
```

### 5.3 `yuzha/src/manga/MangaReaderScreen.tsx` — Wire download manager + offline reader

**New state/hooks:**
```ts
const downloadManager = useDownloadManager();
const [downloadedManga, setDownloadedManga] = useState<DownloadedManga[]>([]);
```

**New function: `openDownloadedChapter(chapter: DownloadedChapter)`**
```ts
const openDownloadedChapter = async (chapter: DownloadedChapter) => {
  setView("reader");
  const pageUrls = await loadChapterPages(chapter.chapterId);
  // pageUrls are blob: URLs — existing loader handles cleanup
  loadUrls(pageUrls, chapter.chapterLabel);
  setActiveHistoryKey(`mangadex::${chapter.chapterId}`);
  const hist = getHistoryEntry(`mangadex::${chapter.chapterId}`);
  if (hist && hist.page > 0) pendingPageRestoreRef.current = hist.page;
};
```

**New view: `"downloaded-detail"`** (or reuse `MangaDexDetail` with a different data source — see below)

**Option A (simpler):** Downloaded manga detail is a separate simple screen that just lists chapters with "Read" buttons.

**Option B:** Reuse `MangaDexDetail` by fetching the manga metadata from MangaDex API and augmenting with local chapter data.

**Recommendation for Phase 3:** Use Option A — simpler, no extra API call needed, less failure surface.

### 5.4 `yuzha/src/manga/useCbzLoader.ts` — No changes needed
The existing `loadUrls` from Phase 2 already handles blob: URLs correctly with the guard added in Phase 2.

---

## 6. Known Bugs & Solutions

### BUG-01: IndexedDB storage quota exceeded
**Symptom:** Downloads fail after ~500MB–1GB on most browsers.  
**Cause:** Chrome allows ~60% of free disk space for a site's IndexedDB. Firefox has similar limits.  
**Solution:** Before starting a download, check estimated storage: `navigator.storage.estimate()`. If less than 100MB remaining, warn user: "Low storage space — you may not be able to complete this download." Do NOT block the download; just warn.

### BUG-02: Blob URLs from IndexedDB not revoked after reader closes
**Symptom:** Memory grows over time — each chapter open leaks blob URLs.  
**Cause:** `loadChapterPages` creates blob: URLs that must be manually revoked.  
**Solution:** Track which URLs came from IndexedDB in `useCbzLoader` using a flag. On `reset()`, revoke all blob: URLs. The existing `revokePreviousUrls` guard already handles `blob:` prefix check — this works automatically.

### BUG-03: Download interrupted mid-chapter (browser tab closed)
**Symptom:** Partial chapter stored in IndexedDB — appears as "downloaded" but reader crashes.  
**Cause:** Download aborted between pages, but some pages already saved.  
**Solution:** Don't save `chapter_meta` until all pages are saved. The `isChapterDownloaded` check queries `chapter_meta` — if that record doesn't exist, the chapter is not considered downloaded even if some pages are in `chapter_pages`. On app startup, run a cleanup: delete any `chapter_pages` entries whose `chapterId` doesn't have a matching `chapter_meta` record. Call this cleanup in `initDb`.

### BUG-04: Cover blob stored multiple times (one per chapter download)
**Symptom:** IndexedDB grows unnecessarily when downloading multiple chapters of the same manga.  
**Cause:** `saveMangaMeta` called for every chapter download.  
**Solution:** In `saveMangaMeta`, check if the manga already exists before writing: `const existing = await db.get("manga_meta", mangaId); if (existing) return;`

### BUG-05: Chapter page fetch fails for some MangaDex chapters (403/404)
**Symptom:** Download stalls at a specific page index, never completes.  
**Cause:** MangaDex CDN occasionally returns 403 for specific page URLs, especially for older chapters.  
**Solution:** Retry failed page fetches up to 3 times with 1s delay between attempts. After 3 failures, mark the job as error: `"Failed to download page ${index + 1} — chapter may be unavailable."` Delete any partially saved pages via cleanup logic.

### BUG-06: Long-press on mobile doesn't work reliably for delete
**Symptom:** Long-press doesn't trigger on mobile browsers.  
**Cause:** React `onContextMenu` doesn't fire on mobile; `onTouchStart` + `setTimeout` approach has timing issues.  
**Solution:** Instead of long-press, add a ⋮ (three-dot) menu button on each card in `MangaDownloadedLibrary`. Click it to show a small dropdown: "Delete". This is more reliable across devices.

### BUG-07: `idb` package not available in workspace
**Symptom:** `import { openDB } from "idb"` fails at runtime.  
**Cause:** `idb` installed at root level needs to be resolved by the `yuzha` workspace.  
**Solution:** Install `idb` in the `yuzha` workspace: `npm install idb --workspace yuzha`. Verify it appears in `yuzha/package.json` dependencies. If it's already hoisted to root `node_modules`, it may just work without workspace-specific install — test first before adding.

### BUG-08: `getAllDownloadedManga` returns chapters in wrong order
**Symptom:** Chapter list in downloaded library shows random order.  
**Cause:** IndexedDB `getAllFromIndex` returns records in insertion order, not chapter number order.  
**Solution:** Sort chapters after fetching: `chapters.sort((a, b) => parseFloat(a.chapterNumber ?? "0") - parseFloat(b.chapterNumber ?? "0"))`.

---

## 7. Step-by-Step Checklist

### Step 1 — Install package
- [ ] `npm install idb --workspace yuzha`
- [ ] Verify no TypeScript errors after install

### Step 2 — Types
- [ ] Append `DownloadStatus`, `DownloadJob`, `DownloadedChapter`, `DownloadedManga` to `types.ts`
- [ ] Append `StoredMangaMeta`, `StoredChapterMeta`, `StoredPage` (internal types, can be in `mangaDb.ts`)

### Step 3 — Database layer
- [ ] Create `mangaDb.ts` with all IndexedDB functions
- [ ] Verify schema creation works (check DevTools → Application → IndexedDB)
- [ ] Verify cleanup of orphaned `chapter_pages` runs on init

### Step 4 — Download manager hook
- [ ] Create `useDownloadManager.ts`
- [ ] Test queue: add 3 downloads, verify they run sequentially
- [ ] Test cancel: cancel mid-download, verify AbortController works

### Step 5 — Download Queue UI
- [ ] Create `DownloadQueue.tsx`
- [ ] Verify it shows/hides based on queue being non-empty

### Step 6 — Downloaded Library UI
- [ ] Create `MangaDownloadedLibrary.tsx`
- [ ] Verify delete works with ⋮ menu

### Step 7 — Modify existing files
- [ ] `MangaDexDetail.tsx` — enable download button, wire `downloadManager` prop
- [ ] `MangaHome.tsx` — add [Local] / [Downloaded] tabs
- [ ] `MangaReaderScreen.tsx` — wire `useDownloadManager`, `openDownloadedChapter`, new view

### Step 8 — End-to-end verify
- [ ] Download a chapter → progress shows correctly in queue
- [ ] Reader opens downloaded chapter with no internet (test in DevTools offline mode)
- [ ] History saves correctly for downloaded chapter
- [ ] Continue Reading works for downloaded chapter after browser refresh
- [ ] Delete chapter → disappears from library, pages cleared from IndexedDB
- [ ] Storage warning appears when <100MB free
- [ ] Partial download cleanup runs on next app start (simulate by killing tab mid-download)

### Step 9 — Do NOT change
- [ ] `MangaReader.tsx`
- [ ] `MangaControls.tsx`
- [ ] `MangaLibrary.tsx`
- [ ] `useReaderState.ts`
- [ ] `useKeyboardNav.ts`
- [ ] `useCbzLoader.ts` (no changes needed if Phase 2 added `loadUrls` correctly)

---

## 8. Out of Scope for Phase 3
- Bulk download (download entire series) — Phase 4
- Search/filter in library — Phase 4
- Chapter auto-advance — Phase 4
- Data-saver mode toggle — Phase 4
- Sort downloaded by date/title — Phase 4
