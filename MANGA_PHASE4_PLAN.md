# Manga Reader — Phase 4 Plan
## Feature: Polish & Quality of Life

> **Read before building.** Phase 3 must be complete before starting Phase 4. This is the final polish phase — no major new architecture, only enhancements and UX improvements.

---

## 0. Prerequisites

- Phase 1 complete (history, folder scanner, home screen)
- Phase 2 complete (MangaDex search, online streaming)
- Phase 3 complete (IndexedDB downloads, unified library)
- No new npm packages needed

---

## 1. What Gets Built

| Feature | Description |
|---|---|
| Chapter auto-advance | At end of chapter, show "Next Chapter →" prompt |
| Bulk series download | Download all chapters of a manga in one click |
| Library search/filter | Search box + filter by status/tag within downloaded library |
| Library sort | Sort by: recently read, title, date added |
| Data-saver mode | Use MangaDex compressed pages (smaller file sizes) |
| Storage manager | See how much space each manga uses, free up space |
| IndexedDB folder persistence | Remember folder handle across sessions (re-ask permission) |
| Reading statistics | Total pages read, reading streak, time estimates |

---

## 2. Feature Breakdown

### Feature 1 — Chapter Auto-Advance

**When:** User reaches the last page of a chapter that came from:
- MangaDex online streaming (Phase 2)
- MangaDex downloaded chapter (Phase 3)

**Not for:** Drag-drop CBZ or folder-scan chapters (no "next chapter" context available)

**UX:**
- On last page, a subtle banner slides in from the bottom (above `MangaControls`):
  ```
  ┌─────────────────────────────────────────────┐
  │  End of Ch. 5 — Title                        │
  │  [Next: Ch. 6 — Next Title →]  [Stay here]  │
  └─────────────────────────────────────────────┘
  ```
- Auto-dismisses after 5 seconds if user doesn't interact
- "Next Chapter" button opens the next chapter in the same series
- "Stay here" dismisses the banner

**Implementation:**
- `MangaReaderScreen` tracks `mangaChapterList: MangaDexChapter[]` — loaded when opening any MangaDex chapter
- A `useEffect` watches `currentPage === pages.length - 1 && pages.length > 0` to show the banner
- `findNextChapter(currentChapterId, chapterList)` — finds the next chapter by chapter number

**New component:** `NextChapterBanner.tsx`

```tsx
type Props = {
  nextChapter: MangaDexChapter | null;
  onNext: () => void;
  onDismiss: () => void;
};
```

### Feature 2 — Bulk Series Download

**Where:** `MangaDexDetail.tsx` — add a "Download All" button at the top of the chapter list.

**UX:**
- "⬇ Download All (47 chapters)" button
- Click → confirmation dialog: "This will download ~1.2 GB. Continue?"
  - Estimate size: `chapters.length × 50MB` average (rough estimate, no exact pre-calculation)
- Confirmed → adds all undownloaded chapters to queue
- Already-downloaded chapters are skipped

**Implementation:** Loop through `chapters`, call `downloadManager.addDownload(manga, chapter)` for each not already downloaded. `useDownloadManager` already handles sequential processing — no changes needed there.

**Note:** Storage warning (BUG-01 from Phase 3) becomes more important here — bulk downloads can easily hit quota.

### Feature 3 — Library Search & Filter

**Where:** `MangaHome.tsx` — add controls above the "Downloaded" tab.

**Search:** A text input that filters `downloadedManga` by title (case-insensitive `includes`). Client-side only — no API call.

**Filter chips:**
```
[All] [Ongoing] [Completed] [Action] [Romance] ...
```

- Status filters: "Ongoing", "Completed", "Hiatus"
- Genre filters: dynamically generated from all unique tags in `downloadedManga`
- Multiple filters can be active simultaneously (AND logic: manga must match ALL active filters)

**Sort dropdown:**
```
Sort by: [Recently Read ▾]
Options: Recently Read | Title A–Z | Date Added | Most Chapters
```

**Implementation:** All filtering is pure array operations on `downloadedManga` — computed with `useMemo`.

```ts
const filtered = useMemo(() => {
  return downloadedManga
    .filter(m => searchQuery ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) : true)
    .filter(m => statusFilter ? m.status === statusFilter : true)
    .filter(m => tagFilter ? m.tags.includes(tagFilter) : true)
    .sort(sortComparator);
}, [downloadedManga, searchQuery, statusFilter, tagFilter, sortOrder]);
```

### Feature 4 — Data-Saver Mode

**What:** Use MangaDex's compressed page images instead of full quality. Pages are ~50–70% smaller.

**Where:** Settings accessible from home screen — a ⚙️ icon → simple toggle list.

**Toggle:** "Data Saver" — persisted to `localStorage` under key `manga_settings_v1`.

**Implementation:**
- In `mangaDexApi.ts`, `getChapterPages(chapterId, dataSaver: boolean)` already has this param (Phase 2 added it)
- Read from `localStorage` when calling `getChapterPages`
- Also affects `useDownloadManager` — downloads compressed pages if enabled

**New file:** `yuzha/src/manga/useMangaSettings.ts`

```ts
type MangaSettings = {
  dataSaver: boolean;
  defaultLanguage: string;  // "en"
};

const DEFAULTS: MangaSettings = { dataSaver: false, defaultLanguage: "en" };

export function useMangaSettings() {
  const [settings, setSettings] = useState<MangaSettings>(() => {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("manga_settings_v1") ?? "{}") };
    } catch {
      return DEFAULTS;
    }
  });

  const update = (patch: Partial<MangaSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem("manga_settings_v1", JSON.stringify(next));
      return next;
    });
  };

  return { settings, update };
}
```

### Feature 5 — Storage Manager

**Where:** Home screen, small info line below the Downloaded tab:

```
💾 4.2 GB used · Manage →
```

Clicking "Manage →" opens a simple panel:

```
Storage
──────────────────────────────────
One Piece            2.1 GB  [Delete]
Naruto               1.4 GB  [Delete]
Bleach               0.7 GB  [Delete]
──────────────────────────────────
Total: 4.2 GB
```

**Implementation:** `getTotalStorageBytes()` and per-manga bytes already available from `StoredChapterMeta.sizeBytes`. Simple list with delete buttons.

### Feature 6 — IndexedDB Folder Persistence

**What:** Remember the user's manga folder handle across browser sessions using IndexedDB. On next visit, ask permission to re-access it and auto-scan without the user needing to pick again.

**How:**
- Add a new IndexedDB object store `settings` to `manga_offline_v1`
- Store key: `"folderHandle"`, value: `FileSystemDirectoryHandle`
- On app load: check if handle exists → call `handle.requestPermission({ mode: "read" })` → if granted, auto-scan

**UX:**
```
[📂 Resume Library]   ← shown if saved handle exists
[📂 Open New Folder]  ← always shown
```

- If permission denied (user clicks "Block"), clear the saved handle and fall back to manual pick
- Browser support: Chrome 86+, Edge 86+ — same as `showDirectoryPicker`

**New functions in `mangaDb.ts`:**
```ts
export async function saveFolderHandle(handle: FileSystemDirectoryHandle): Promise<void>
export async function loadFolderHandle(): Promise<FileSystemDirectoryHandle | null>
export async function clearFolderHandle(): Promise<void>
```

**Modification to `useFolderScanner.ts`:**
```ts
// After successful scan, save handle
await saveFolderHandle(dirHandle);

// On hook mount, check for saved handle
useEffect(() => {
  loadFolderHandle().then(async (handle) => {
    if (!handle) return;
    const perm = await (handle as any).requestPermission({ mode: "read" });
    if (perm === "granted") {
      setSavedHandle(handle);
    } else {
      clearFolderHandle();
    }
  });
}, []);
```

### Feature 7 — Reading Statistics

**Where:** Home screen, small stats row below the header.

```
📚 1,247 pages read  ·  🔥 5-day streak  ·  🕐 ~52 hrs
```

**Implementation:** Computed from `loadHistory()`:
- **Total pages:** Sum of `entry.page + 1` for all history entries (approximate — max page reached per chapter)
- **Reading streak:** Count consecutive days with at least 1 reading session (check `lastRead` timestamps)
- **Estimated time:** `totalPages × 30 seconds` average per page (rough estimate)

**New file:** `yuzha/src/manga/readingStats.ts`

```ts
export type ReadingStats = {
  totalPages: number;
  streakDays: number;
  estimatedHours: number;
};

export function computeReadingStats(history: HistoryEntry[]): ReadingStats
```

All pure functions, no React, no side effects.

---

## 3. New Files

| File | Purpose |
|---|---|
| `NextChapterBanner.tsx` | End-of-chapter prompt component |
| `useMangaSettings.ts` | localStorage-backed settings hook |
| `readingStats.ts` | Pure functions for computing reading statistics |

---

## 4. Modified Files

| File | Changes |
|---|---|
| `types.ts` | Add `MangaSettings` type |
| `MangaHome.tsx` | Add search/filter/sort controls, stats row, storage info, Resume Library button |
| `MangaDexDetail.tsx` | Add "Download All" button |
| `MangaReaderScreen.tsx` | Add `NextChapterBanner`, `chapterList` state, `findNextChapter` logic, settings hook |
| `mangaDb.ts` | Add `settings` store, `saveFolderHandle`/`loadFolderHandle`/`clearFolderHandle` |
| `useFolderScanner.ts` | Save handle after scan, auto-load saved handle on mount |
| `mangaDexApi.ts` | `getChapterPages` respects `dataSaver` setting from `useMangaSettings` |

---

## 5. Known Bugs & Solutions

### BUG-01: `requestPermission` not available in all browsers
**Symptom:** `handle.requestPermission is not a function` in Firefox or older Chrome.  
**Cause:** `FileSystemHandle.requestPermission()` is Chrome 86+ only. Firefox doesn't support it.  
**Solution:** Wrap in try/catch. If it throws, treat as "denied" and fall back to manual picker. Cast to `any` to avoid TS errors.

### BUG-02: Reading streak miscalculates across timezones
**Symptom:** Streak resets unexpectedly for users in non-UTC timezones.  
**Cause:** Comparing `Date` objects across midnight using UTC timestamps doesn't match local calendar days.  
**Solution:** Use `new Date(ts).toLocaleDateString()` to normalize timestamps to local day strings before comparing. Group history entries by local date string, then count consecutive days.

### BUG-03: Auto-advance fires on single-page chapters (e.g., cover pages)
**Symptom:** Auto-advance banner shows immediately when opening a 1-page chapter.  
**Cause:** `currentPage === pages.length - 1` is true immediately when `pages.length === 1`.  
**Solution:** Only show the banner if `pages.length > 1` AND the user has been on the page for at least 3 seconds (use a `setTimeout` ref). This prevents the banner from flashing on chapter open.

### BUG-04: "Download All" adds hundreds of items to queue simultaneously
**Symptom:** Queue shows 100+ items, UI feels sluggish.  
**Cause:** Adding 100 chapters at once triggers 100 state updates.  
**Solution:** Use a single `setQueue(prev => [...prev, ...newJobs])` instead of calling `addDownload` in a loop. This batches all updates into one render.

### BUG-05: Storage estimate is wildly inaccurate
**Symptom:** "Download All (47 chapters) ~2.3 GB" but actual download is 400MB.  
**Cause:** `chapters.length × 50MB` is a rough guess. Chapter lengths vary enormously (5 pages vs 60 pages).  
**Solution:** Use available data: `chapter.attributes.pages × 0.8MB` per page as the estimate. This is still an approximation but much more accurate. Show as "~X GB" with tilde to signal it's an estimate.

### BUG-06: Filter chips overflow on small screens
**Symptom:** Genre filter chips wrap to 3+ lines on mobile, pushing library grid far down.  
**Cause:** Many genre tags (Action, Adventure, Comedy, Drama, Fantasy, Horror, Mystery, Romance...).  
**Solution:** Show at most 5 genre chips. If more genres exist, add a "+ N more" chip that expands inline. Alternatively, put genre filters in a collapsible "Advanced filters" section.

### BUG-07: Stats row looks broken when history is empty (new user)
**Symptom:** "📚 0 pages · 🔥 0 days · 🕐 0 hrs" — all zeros looks confusing.  
**Solution:** Hide the stats row entirely if `totalPages === 0`. Only show stats after the user has read at least 1 chapter.

---

## 6. Step-by-Step Checklist

### Step 1 — Settings infrastructure
- [ ] Create `useMangaSettings.ts`
- [ ] Verify settings persist across refresh (check localStorage in DevTools)

### Step 2 — Reading stats
- [ ] Create `readingStats.ts`
- [ ] Add stats row to `MangaHome.tsx` (hidden when 0 pages)

### Step 3 — Data-saver mode
- [ ] Wire `dataSaver` setting to `getChapterPages` calls
- [ ] Add settings toggle accessible from home screen (⚙️ button)
- [ ] Verify smaller images load in reader when enabled

### Step 4 — Chapter auto-advance
- [ ] Create `NextChapterBanner.tsx`
- [ ] Wire into `MangaReaderScreen` — only show for MangaDex chapters
- [ ] Verify: banner shows on last page, not on single-page chapters, auto-dismisses after 5s
- [ ] Verify: "Next Chapter" correctly opens the following chapter

### Step 5 — Bulk download
- [ ] Add "Download All" button to `MangaDexDetail.tsx`
- [ ] Add size estimate using `chapter.attributes.pages`
- [ ] Confirmation dialog before adding to queue
- [ ] Verify: already-downloaded chapters are skipped

### Step 6 — Library search/filter/sort
- [ ] Add search input to Downloaded tab in `MangaHome.tsx`
- [ ] Add status filter chips
- [ ] Add genre filter chips (max 5 visible)
- [ ] Add sort dropdown
- [ ] Verify: filtering is instant (no API call), sort works for all 4 options

### Step 7 — Storage manager
- [ ] Add storage info line to Downloaded tab
- [ ] Add "Manage →" panel with per-manga breakdown
- [ ] Verify: deleting a manga from here removes all data from IndexedDB

### Step 8 — Folder persistence (IndexedDB handle)
- [ ] Add `settings` store to `mangaDb.ts`
- [ ] Add `saveFolderHandle`/`loadFolderHandle`/`clearFolderHandle` to `mangaDb.ts`
- [ ] Modify `useFolderScanner.ts` to save handle after scan and load on mount
- [ ] Add "📂 Resume Library" button to `MangaHome.tsx` (only when saved handle exists)
- [ ] Verify: scan folder, refresh browser, "Resume Library" appears and auto-loads

### Step 9 — End-to-end verify
- [ ] Read to last page of a MangaDex chapter → auto-advance banner shows
- [ ] Click "Download All" on a 10-chapter manga → all queue up, process sequentially
- [ ] Enable data-saver → pages load with lower-resolution images
- [ ] Search "naruto" in library → filters immediately
- [ ] Stats row shows correct page count after reading
- [ ] Scan folder → close browser → reopen → "Resume Library" appears → click → auto-scans

---

## 7. Final State — Complete Feature List

After Phase 4, the manga reader will have:

**Local Reading:**
- ✅ Drag-drop CBZ files
- ✅ Folder scan (auto-remembered between sessions)
- ✅ Reading history + continue reading
- ✅ Progress auto-save per page

**Online Reading (MangaDex):**
- ✅ Search + browse
- ✅ Stream online chapters
- ✅ Download for offline use
- ✅ Bulk series download
- ✅ Data-saver mode

**Library:**
- ✅ Unified local + downloaded library
- ✅ Search, filter by status/genre, sort
- ✅ Storage manager with per-manga usage
- ✅ Chapter progress badges throughout

**Reader:**
- ✅ Single page mode
- ✅ Webtoon scroll mode
- ✅ RTL support
- ✅ Zoom controls + keyboard shortcuts
- ✅ Chapter auto-advance

**Quality of Life:**
- ✅ Reading statistics
- ✅ Persistent settings (data-saver, default language)
