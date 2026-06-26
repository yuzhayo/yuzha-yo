import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("api", {
  startJob: (opts) => ipcRenderer.invoke("start-job", opts),
  cancelJob: (jobId) => ipcRenderer.invoke("cancel-job", jobId),
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  openFolder: (dir) => ipcRenderer.invoke("open-folder", dir),
  onJobEvent: (cb) => {
    ipcRenderer.on("job-event", (_e, data) => cb(data));
  }
});
