import { contextBridge, ipcRenderer } from "electron";
import type { StartJobOpts, JobEvent } from "../../src/types";

contextBridge.exposeInMainWorld("api", {
  startJob: (opts: StartJobOpts): Promise<string> =>
    ipcRenderer.invoke("start-job", opts),

  cancelJob: (jobId: string): Promise<void> =>
    ipcRenderer.invoke("cancel-job", jobId),

  pickFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("pick-folder"),

  openFolder: (dir: string): Promise<void> =>
    ipcRenderer.invoke("open-folder", dir),

  onJobEvent: (cb: (event: JobEvent) => void): void => {
    ipcRenderer.on("job-event", (_e, data: JobEvent) => cb(data));
  },
});
