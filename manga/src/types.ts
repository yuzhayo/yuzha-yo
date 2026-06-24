export type ReadingMode = "single" | "webtoon";

export type ReaderState = {
  pages: string[];
  currentPage: number;
  zoom: number;
  mode: ReadingMode;
  rtl: boolean;
  fileName: string;
};

export type CbzLoadResult =
  | { status: "idle" }
  | { status: "loading"; progress: number }
  | { status: "ready"; pages: string[]; fileName: string }
  | { status: "error"; message: string };
