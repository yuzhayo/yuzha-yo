import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("api", {
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  openFolder: (dir) => ipcRenderer.invoke("open-folder", dir),
  phaseOpen: (url) => ipcRenderer.invoke("phase-open", url),
  phaseScroll: () => ipcRenderer.invoke("phase-scroll"),
  phaseHarvest: () => ipcRenderer.invoke("phase-harvest"),
  phaseCompile: (images, outputDir) => ipcRenderer.invoke("phase-compile", images, outputDir),
  phaseClose: () => ipcRenderer.invoke("phase-close"),
  onPhaseEvent: (cb) => {
    ipcRenderer.on("phase-event", (_e, data) => cb(data));
  }
});
