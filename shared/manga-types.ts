// ─── Reader types ────────────────────────────────────────────────────

export type ReadingMode = "single" | "webtoon";

export type CbzLoadResult =
  | { status: "idle" }
  | { status: "loading"; progress: number }
  | { status: "ready"; pages: string[]; fileName: string }
  | { status: "error"; message: string };

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

// ─── Downloader types ────────────────────────────────────────────────

export type PhaseStatus = "idle" | "running" | "done" | "error";

export interface PhaseState {
  status: PhaseStatus;
  message?: string;
}

export interface HarvestedImage {
  src: string;
  top: number;
}

// Events pushed main → renderer during phase execution
export type PhaseEvent =
  | { type: "scroll-progress"; height: number; images: number; stable: number }
  | { type: "fetch-progress"; done: number; total: number }
  | { type: "compile-done"; file: string; pages: number; skipped: number }
  | { type: "phase-error"; message: string };

export interface ScrollResult {
  imageCount: number;
}

export interface HarvestResult {
  images: HarvestedImage[];
}

export interface CompileResult {
  file: string;
  pages: number;
  skipped: number;
}
