# Downloader Rebuild — Phase-Based Manual Flow

## Goal
Replace the broken monolithic downloader with a 4-phase manual flow.
Each phase = one function + one IPC handler + one UI button.
Phases share a persistent scraper window (visible throughout).
No multi-chapter. No automation yet.

---

## Files to Modify

| File | Action |
|---|---|
| `manga/src/types.ts` | Replace downloader types with new phase types |
| `manga/electron/main/downloader.ts` | Rewrite — 4 exported functions only |
| `manga/electron/main/index.ts` | Rewrite IPC — 4 phase handlers + session window |
| `manga/electron/preload/index.ts` | Rewrite bridge — expose 4 phase APIs |
| `manga/src/downloader/DownloaderApp.tsx` | Rewrite UI — 4 phase buttons + status |
| `manga/src/downloader/JobCard.tsx` | Delete — replaced by PhasePanel |
| `manga/src/downloader/PhasePanel.tsx` | New — per-phase status row |

---

## Step 1 — types.ts

Remove all old downloader types. Add:

```ts
// Phase system
export type PhaseStatus = "idle" | "running" | "done" | "error";

export interface PhaseState {
  status: PhaseStatus;
  message?: string;
}

// Images harvested from the page
export interface HarvestedImage {
  src: string;
  top: number;
}

// Events pushed from main → renderer during phase execution
export type PhaseEvent =
  | { type: "scroll-progress"; height: number; images: number; stable: number }
  | { type: "fetch-progress"; done: number; total: number }
  | { type: "compile-done"; file: string; pages: number; skipped: number }
  | { type: "phase-error"; message: string };

// IPC return types
export interface ScrollResult { imageCount: number }
export interface HarvestResult { images: HarvestedImage[] }
export interface CompileResult { file: string; pages: number; skipped: number }
```

Keep reader types (ReadingMode, CbzLoadResult, HistoryEntry, ScannedChapter, ScannedSeries) unchanged.

---

## Step 2 — downloader.ts

4 exported async functions. No runJob, no discoverChapters, no runParallel.

### openScraper(url, win)
- Sets UA on the window
- Blocks popup-ad windows
- Calls loadPage(win, url)
- Returns when page is ready

### runScroll(win, emit)
- Resets scroll to top
- Suppresses alert/confirm/prompt
- Detects the real scrollable container (inner div vs window) — port from extension
- Loop: scroll step → sample (height + imgCount + atBottom) → emit progress
- Stability: 8 consecutive ticks at bottom with no height/imgCount change → done
- Hard cap: 80 iterations
- Returns final image count found

### runHarvest(win)
- Executes JS to collect all img tags
- Checks data-src, data-lazy-src, data-original, data-url, srcset, currentSrc, src
- Also checks CSS background-image on divs/sections
- Filters: http only, not logo/banner/avatar, >150×150 (or 0 = not measured yet)
- Dedupes by src, sorts by top position
- Returns HarvestedImage[]

### compileCbz(images, outputDir, win, emit)
- Gets page title from win (document.title)
- extractSeries splits on [-–|·•/] to get folder name
- For each image: downloadImage with 3 retries, emit fetch-progress
- Skip images that fail all retries (count as skipped)
- packageCBZ: JSZip STORE compression, zero-padded filenames, guessExt from magic bytes
- resolveTargetPath: rename collision policy
- emit compile-done with result
- Returns CompileResult

Keep helpers: sleep, loadPage, createHiddenWindow, fetchImageOnce, downloadImage,
guessExt, cleanTitle, extractSeries, resolveTargetPath, packageCBZ, log

---

## Step 3 — index.ts

Session management: one scraper window at a time, stored as `scraperWin`.

New IPC handlers (replace start-job, cancel-job):

```
"phase-open"    → creates scraperWin, calls openScraper(url, scraperWin), returns sessionId
"phase-scroll"  → calls runScroll(scraperWin, emit), returns ScrollResult
"phase-harvest" → calls runHarvest(scraperWin), returns HarvestResult
"phase-compile" → calls compileCbz(images, outputDir, scraperWin, emit), returns CompileResult
"phase-close"   → destroys scraperWin, clears session
```

Keep: pick-folder, open-folder handlers.
Keep: emit() helper for pushing phase-event to renderer.

Push channel: `phase-event` (replaces job-event).

---

## Step 4 — preload/index.ts

Replace old API with:

```ts
window.api = {
  pickFolder(): Promise<string | null>
  openFolder(dir: string): Promise<void>
  phaseOpen(url: string): Promise<string>           // returns sessionId
  phaseScroll(): Promise<ScrollResult>
  phaseHarvest(): Promise<HarvestResult>
  phaseCompile(images, outputDir): Promise<CompileResult>
  phaseClose(): Promise<void>
  onPhaseEvent(cb: (e: PhaseEvent) => void): void
}
```

---

## Step 5 — DownloaderApp.tsx

State:
- url, outputDir (inputs)
- sessionId: string | null
- phase1..4: PhaseState
- fetchProgress: { done, total } (during compile)
- harvestedImages: HarvestedImage[] (kept between phase 3 and 4)
- scrollImageCount: number (shown after phase 2)

Logic:
- onPhaseEvent subscription on mount
- handlePhase1: calls phaseOpen(url) → sets sessionId, phase1=done
- handlePhase2: calls phaseScroll() → phase2=done, scrollImageCount from result
- handlePhase3: calls phaseHarvest() → phase3=done, harvestedImages stored
- handlePhase4: calls phaseCompile(harvestedImages, outputDir) → phase4=done
- Each handler: set running → await → set done/error

UI:
- Top bar: URL input + folder picker (same as before)
- 4 PhasePanel rows below
- Phase N button disabled until phase N-1 is done
- Reset button when all done or error (calls phaseClose)

---

## Step 6 — PhasePanel.tsx

Simple row component. Props:
- label: string
- status: PhaseStatus
- detail?: string  (image count, fetch N/M, file path, error message)
- onRun: () => void
- disabled: boolean

Renders: status icon + label + detail text + Run button

Status icons: ⬜ idle, ⏳ running (animated), ✅ done, ❌ error

---

## Step 7 — src/env.d.ts

Update Window["api"] type to match new preload surface.

---

## Execution Order

1. types.ts
2. downloader.ts
3. index.ts
4. preload/index.ts
5. PhasePanel.tsx (new file)
6. DownloaderApp.tsx
7. Delete JobCard.tsx
8. src/env.d.ts
