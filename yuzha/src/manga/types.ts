export type ReadingMode = "single" | "webtoon";

export type CbzLoadResult =
  | { status: "idle" }
  | { status: "loading"; progress: number }
  | { status: "ready"; pages: string[]; fileName: string }
  | { status: "error"; message: string };

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
