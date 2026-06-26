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
