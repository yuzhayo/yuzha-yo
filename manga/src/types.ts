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
  source: "file" | "folder" | "mangadex";
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

export type MangaDexManga = {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;
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
    attributes?: { fileName?: string; name?: string };
  }>;
};

export type MangaDexChapter = {
  id: string;
  type: "chapter";
  attributes: {
    title: string | null;
    volume: string | null;
    chapter: string | null;
    translatedLanguage: string;
    publishAt: string;
    pages: number;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: { name?: string };
  }>;
};

export type MangaDexPageData = {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
};
