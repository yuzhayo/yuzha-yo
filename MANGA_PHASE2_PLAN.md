# Manga Reader — Phase 2 Plan
## Feature: MangaDex Online Search & Browse

> **Read before building.** This doc covers exact architecture, API details, new files, modified files, data types, known bugs, and a step-by-step checklist. Phase 1 must be complete before starting Phase 2.

---

## 0. Prerequisites

- Phase 1 complete (`useReadingHistory`, `useFolderScanner`, `MangaHome`, `MangaLibrary`, 4-view state machine)
- No new npm packages needed — MangaDex API is plain `fetch` (REST/JSON)
- No API key needed — MangaDex has a free public API at `https://api.mangadex.org`

---

## 1. What Gets Built

### MangaDex Search
- Search bar on home screen → calls MangaDex API → shows result grid
- Each result: cover image, title, description snippet, content rating badge
- Clicking a result → opens **Manga Detail** screen

### Manga Detail Screen
- Full title, description, genre tags, content rating
- Chapter list (sorted by chapter number, newest first)
- Language filter dropdown (English default)
- "Read" button per chapter → opens reader directly (streams pages from MangaDex CDN)
- "Download" button per chapter → Phase 3 (show disabled button with "Coming soon" tooltip in Phase 2)

### Reading MangaDex Chapters (Online Streaming)
- MangaDex provides a `/at-home/server/{chapterId}` endpoint that returns page URLs
- Pages load from their CDN into the existing `MangaReader` component
- No CBZ unzipping needed — pages are already JPG/PNG URLs
- History auto-save works the same way (key format: `mangadex::${chapterId}`)

### New View Added to State Machine
```
MangaReaderScreen
  ├── "home"    →  MangaHome  (+ search bar integrated here)
  ├── "search"  →  MangaDexSearch  ← NEW
  ├── "detail"  →  MangaDexDetail  ← NEW
  ├── "library" →  MangaLibrary
  └── "reader"  →  existing reader
```

---

## 2. MangaDex API Reference

**Base URL:** `https://api.mangadex.org`

All requests must include header: `User-Agent: YuzhaMangaReader/1.0`

### Search manga
```
GET /manga?title={query}&limit=20&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive
```
Response: `{ data: MangaDexManga[] }`

### Get chapter list for a manga
```
GET /manga/{mangaId}/feed?limit=100&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group
```
Response: `{ data: MangaDexChapter[] }`

### Get page URLs for a chapter
```
GET /at-home/server/{chapterId}
```
Response:
```json
{
  "baseUrl": "https://uploads.mangadex.org",
  "chapter": {
    "hash": "abc123",
    "data": ["page1.jpg", "page2.jpg", ...],
    "dataSaver": ["page1.jpg", ...]
  }
}
```
Page URL construction:
```
High quality: {baseUrl}/data/{hash}/{filename}
Data saver:   {baseUrl}/data-saver/{hash}/{filename}
```

### Get cover art URL
Cover file is returned in the manga's `relationships` array with `type: "cover_art"`.
```
Cover URL: https://uploads.mangadex.org/covers/{mangaId}/{fileName}
Thumbnail: https://uploads.mangadex.org/covers/{mangaId}/{fileName}.256.jpg
```

### Rate limits
- MangaDex allows ~5 requests/second per IP
- Search should be debounced: **500ms** after user stops typing
- Chapter page fetch: 1 request per chapter open (not per page)

---

## 3. New Types (append to `types.ts`)

```ts
export type MangaDexManga = {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;           // { en: "One Piece", ja: "ワンピース" }
    description: Record<string, string>;
    status: "ongoing" | "completed" | "hiatus" | "cancelled";
    contentRating: "safe" | "suggestive" | "erotica" | "pornographic";
    tags: Array<{
      id: string;
      attributes: { name: Record<string, string>; group: string };
    }>;
    lastVolume: string | null;
    lastChapter: string | null;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: { fileName?: string };
  }>;
};

export type MangaDexChapter = {
  id: string;
  type: "chapter";
  attributes: {
    title: string | null;
    volume: string | null;
    chapter: string | null;       // "1", "1.5", "10" etc.
    translatedLanguage: string;   // "en", "ja", etc.
    publishAt: string;            // ISO date string
    pages: number;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: { name?: string }; // scanlation_group name
  }>;
};

export type MangaDexPageData = {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];       // high quality filenames
    dataSaver: string[];  // compressed filenames
  };
};
```

---

## 4. New Files to Create

### 4.1 `yuzha/src/manga/mangaDexApi.ts`

Pure async functions. No React. All MangaDex API calls live here.

```ts
const BASE = "https://api.mangadex.org";
const HEADERS = { "User-Agent": "YuzhaMangaReader/1.0" };

export async function searchManga(query: string): Promise<MangaDexManga[]>
export async function getMangaChapters(mangaId: string, lang?: string): Promise<MangaDexChapter[]>
export async function getChapterPages(chapterId: string, dataSaver?: boolean): Promise<string[]>
export function getCoverUrl(manga: MangaDexManga, size?: 256 | 512 | null): string | null
export function getMangaTitle(manga: MangaDexManga): string
export function getChapterLabel(chapter: MangaDexChapter): string   // "Ch. 1 — Title" or "Ch. 1"
```

**`getChapterPages` implementation:**
1. `GET /at-home/server/{chapterId}` → get `MangaDexPageData`
2. Map filenames to full URLs using `baseUrl + "/data/" + hash + "/" + filename`
3. Return array of full page URLs (these are passed directly to `MangaReader` as `pages` prop)

**Error handling:** All functions throw on non-2xx responses. Callers wrap in try/catch and show error UI.

### 4.2 `yuzha/src/manga/useMangaDexSearch.ts`

React hook. Manages search state with debounce.

```ts
export type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "ready"; results: MangaDexManga[]; query: string }
  | { status: "error"; message: string };

export function useMangaDexSearch() {
  // Returns:
  return {
    state: SearchState,
    query: string,
    setQuery: (q: string) => void,  // triggers debounced search
    clearSearch: () => void,
  };
}
```

**Debounce:** Use `useEffect` + `setTimeout` (500ms) — do NOT use lodash.debounce. Cancel with `clearTimeout` in cleanup.

**Empty query:** If query is empty, reset to `{ status: "idle" }` — do NOT call the API.

**Min query length:** Only search if `query.trim().length >= 2` to avoid hammering the API.

### 4.3 `yuzha/src/manga/MangaDexSearch.tsx`

Search results screen. Shown when user submits a search query.

```tsx
type Props = {
  state: SearchState;
  query: string;
  onSelectManga: (manga: MangaDexManga) => void;
  onBack: () => void;
};
```

**Layout:**
```
[← Back]  Search results for "naruto"    [spinner if searching]
─────────────────────────────────────────
┌────┐  Naruto                          ← result card
│    │  Ongoing • Action, Adventure
│cover│  Long description truncated...
└────┘
┌────┐  Naruto Shippuden
│    │  Completed • Action
│cover│  ...
└────┘
... more results
```

**Result card:**
- Cover thumbnail (128.jpg size from CDN, lazy loaded with `loading="lazy"`)
- Title (English preferred, fallback to `ja-ro` then first available)
- Status badge: green = ongoing, grey = completed, yellow = hiatus
- Content rating badge: `safe` = hidden, `suggestive` = yellow "16+", `erotica/pornographic` = red "18+"
- First 2-3 genre tags from `attributes.tags` where `group === "genre"`
- Description (first 120 chars, truncated)

**Empty state:** "No results for '{query}'" with a 🔍 icon

**Error state:** Red banner with error message + retry button

### 4.4 `yuzha/src/manga/MangaDexDetail.tsx`

Manga detail + chapter list screen.

```tsx
type Props = {
  manga: MangaDexManga;
  onBack: () => void;
  onReadChapter: (manga: MangaDexManga, chapter: MangaDexChapter) => void;
};
```

**State inside component:**
```ts
const [chapters, setChapters] = useState<MangaDexChapter[]>([]);
const [loadingChapters, setLoadingChapters] = useState(true);
const [lang, setLang] = useState("en");
const [error, setError] = useState<string | null>(null);
```

Fetch chapters on mount with `useEffect`.

**Layout:**
```
[← Back]
───────────────────────────────────
[Cover 200px tall]  Title
                    Ongoing • 2000 chapters
                    [Action] [Adventure] [Shonen]
                    Description text here...
───────────────────────────────────
Language: [English ▾]
───────────────────────────────────
Ch. 1100 — Title          [Read ›]
Ch. 1099 — Another Title  [Read ›]
...
───────────────────────────────────
```

**Chapter row:**
- Chapter label: "Ch. 1" or "Ch. 1.5 — Chapter Title"
- Scanlation group name (from relationships)
- Published date (relative: "3 days ago")
- `[Read ›]` button → calls `onReadChapter`
- Progress from history: if `getHistoryEntry("mangadex::${chapter.id}")` exists, show "Pg X / Y" badge
- "Download" button disabled, with `title="Coming in Phase 3"`

**Language filter:**
- Detect available languages from chapter list
- Show dropdown only if >1 language available
- Default to "en"

---

## 5. Modified Files

### 5.1 `yuzha/src/manga/MangaHome.tsx` — Add search bar

Add a search input at the top of the home screen (below header, above Continue Reading):

```tsx
// New prop added:
onSearch: (query: string) => void;
```

Search bar design:
```
┌────────────────────────────────────────┐
│ 🔍  Search MangaDex...                  │
└────────────────────────────────────────┘
```

- Pressing Enter or clicking a search icon calls `onSearch(query)`
- Shows a subtle "powered by MangaDex" label below it

### 5.2 `yuzha/src/manga/MangaReaderScreen.tsx` — Add 2 new views + online reader

**New state:**
```ts
const [activeManga, setActiveManga] = useState<MangaDexManga | null>(null);
const { state: searchState, query, setQuery, clearSearch } = useMangaDexSearch();
```

**New view cases in render:**
- `view === "search"` → `<MangaDexSearch />`
- `view === "detail"` → `<MangaDexDetail />`

**New function: `openOnlineChapter(manga, chapter)`**
```ts
const openOnlineChapter = async (manga: MangaDexManga, chapter: MangaDexChapter) => {
  setView("reader"); // go to reader immediately
  // Show loading state (result.status will be "loading")
  setActiveManga(manga);
  setActiveSeries(null);
  setActiveChapter(null);
  setActiveHistoryKey(`mangadex::${chapter.id}`);
  
  try {
    const pageUrls = await getChapterPages(chapter.id);
    // Inject pages directly into the reader — need new loader mode
    loadUrls(pageUrls, getChapterLabel(chapter)); // ← new function in useCbzLoader
  } catch (err) {
    // Show error state
  }
};
```

### 5.3 `yuzha/src/manga/useCbzLoader.ts` — Add `loadUrls` function

The existing hook loads files and unzips CBZ. Online chapters skip the unzip step — pages are already URLs.

Add a new callback:
```ts
const loadUrls = useCallback((urls: string[], title: string) => {
  revokePreviousUrls(); // won't revoke CDN URLs (they're not blob: URLs)
  setResult({ status: "ready", pages: urls, fileName: title });
}, []);

return { result, loadFile, loadUrls, reset };
```

**Note:** `revokePreviousUrls` only revokes `blob:` URLs — CDN URLs like `https://...` are not revocable and should not be passed to `URL.revokeObjectURL`. Add a guard:
```ts
const revokePreviousUrls = () => {
  for (const url of blobUrlsRef.current) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  blobUrlsRef.current = [];
};
```

---

## 6. Known Bugs & Solutions

### BUG-01: CORS on MangaDex cover images
**Symptom:** Cover images show broken icon in some environments.  
**Cause:** MangaDex CDN serves covers with CORS headers but some proxies strip them.  
**Solution:** Use `<img>` tags directly — browser handles CORS for `<img>` via `crossOrigin="anonymous"` or without it. Do NOT use `fetch` to load images. Always use `<img src="...">`.

### BUG-02: MangaDex rate limiting (429 Too Many Requests)
**Symptom:** Search stops working after rapid queries.  
**Cause:** MangaDex allows ~5 req/s. The 500ms debounce helps but rapid paste+delete can still trigger it.  
**Solution:** In `mangaDexApi.ts`, check for `response.status === 429` and throw a specific error: `"Rate limited — please wait a moment and try again."` The search hook shows this message in the error state.

### BUG-03: Chapter list API returns 0 results for some manga
**Symptom:** Manga detail shows "No chapters available" even for popular titles.  
**Cause:** `translatedLanguage[]=en` filter excludes manga with only Japanese chapters.  
**Solution:** If English results are empty, show a language selector prompt: "No English chapters found. Try another language?" with a dropdown to select from available languages. Refetch with the new language.

### BUG-04: MangaDex chapter number is `null` for some chapters
**Symptom:** "Ch. null" displayed in chapter list.  
**Cause:** Some chapters (especially oneshots) have `chapter: null` in attributes.  
**Solution:** In `getChapterLabel()`: if `chapter === null`, use the title if available, otherwise fall back to "Oneshot". Never display "null".
```ts
export function getChapterLabel(chapter: MangaDexChapter): string {
  const num = chapter.attributes.chapter;
  const title = chapter.attributes.title;
  if (num === null) return title ?? "Oneshot";
  return title ? `Ch. ${num} — ${title}` : `Ch. ${num}`;
}
```

### BUG-05: Online chapter pages load slowly (CDN latency)
**Symptom:** Pages take 2–5 seconds to appear in the reader.  
**Cause:** MangaDex CDN images are loaded lazily by the browser.  
**Solution:** The existing `MangaReader` already uses standard `<img>` tags — the browser handles lazy loading. Add `loading="eager"` for the current page only (preload current page on chapter open). Consider data-saver mode toggle in Phase 4.

### BUG-06: `loadUrls` sets `fileName` to the chapter label but toolbar shows `.cbz` stripped
**Symptom:** Chapter label in toolbar shows "Ch. 5 — Title" correctly but `replace(/\.cbz$/i, "")` in `MangaToolbar` strips nothing (which is fine — no extension to strip).  
**Cause:** Not actually a bug — `.cbz` removal is a no-op on online chapter names.  
**Solution:** No action needed. The regex is safe to leave in place.

### BUG-07: History for MangaDex chapters needs manga title in `seriesName`
**Symptom:** Continue Reading card for online chapter shows no series name.  
**Cause:** `activeSeries` is `null` for MangaDex chapters.  
**Solution:** Set `seriesName` in the history entry to `getMangaTitle(manga)` in `openOnlineChapter`. The history entry stores the string, not the object, so this works fine.

### BUG-08: Content rating — showing adult content
**Symptom:** Erotica/pornographic manga appears in search results.  
**Cause:** MangaDex API default includes all ratings.  
**Solution:** Always include `contentRating[]=safe&contentRating[]=suggestive` in the search query. Never include `erotica` or `pornographic` in the API call. This is a hard filter in `searchManga()`, not a user toggle.

---

## 7. Step-by-Step Checklist

### Step 1 — Types
- [ ] Append `MangaDexManga`, `MangaDexChapter`, `MangaDexPageData` to `types.ts`

### Step 2 — API layer
- [ ] Create `mangaDexApi.ts` with all pure async functions
- [ ] Test: call `searchManga("naruto")` in browser console, confirm results

### Step 3 — Search hook
- [ ] Create `useMangaDexSearch.ts` with 500ms debounce
- [ ] Verify: rapid typing only fires one API call

### Step 4 — Search results screen
- [ ] Create `MangaDexSearch.tsx`
- [ ] Cover images load with `loading="lazy"`
- [ ] Empty state and error state render correctly

### Step 5 — Detail screen
- [ ] Create `MangaDexDetail.tsx`
- [ ] Chapters fetch on mount
- [ ] Language filter works (refetch on change)
- [ ] History badges appear for previously read chapters
- [ ] "Download" button renders disabled with tooltip

### Step 6 — Modify existing files
- [ ] `MangaHome.tsx` — add search bar, `onSearch` prop
- [ ] `useCbzLoader.ts` — add `loadUrls`, fix `revokePreviousUrls` guard
- [ ] `MangaReaderScreen.tsx` — add "search" and "detail" views, `openOnlineChapter`, `activeManga` state

### Step 7 — Verify end to end
- [ ] Search "one piece" → results appear with covers
- [ ] Click result → detail screen with chapter list
- [ ] Click "Read" on a chapter → reader opens with pages loading from CDN
- [ ] Read to page 5 → go back → Come back → "Continue Reading" shows "Pg 5 / X"
- [ ] Chapter in detail screen shows "Pg 5 / X" progress badge
- [ ] Rate limit: rapid search doesn't crash, shows friendly message

### Step 8 — Do NOT change
- [ ] `MangaReader.tsx` — no changes needed (accepts any URLs)
- [ ] `MangaControls.tsx` — no changes needed
- [ ] `MangaLibrary.tsx` — no changes needed
- [ ] `useReaderState.ts` — no changes needed
- [ ] `useKeyboardNav.ts` — no changes needed

---

## 8. Out of Scope for Phase 2
- Downloading chapters for offline use (Phase 3)
- Unified library showing downloaded MangaDex chapters alongside local files (Phase 3)
- Search/filter within library (Phase 4)
- Chapter auto-advance (Phase 4)
- Data-saver mode toggle (Phase 4)
