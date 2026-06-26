import type { StartJobOpts, JobEvent } from "./types";

declare global {
  interface Window {
    api: {
      startJob: (opts: StartJobOpts) => Promise<string>;
      cancelJob: (jobId: string) => Promise<void>;
      pickFolder: () => Promise<string | null>;
      openFolder: (dir: string) => Promise<void>;
      onJobEvent: (cb: (event: JobEvent) => void) => void;
    };
  }
}
