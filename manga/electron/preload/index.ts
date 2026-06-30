import { contextBridge, ipcRenderer } from "electron";
import type { PhaseEvent, HarvestedImage, ScrollResult, HarvestResult, CompileResult } from "../../src/types";

contextBridge.exposeInMainWorld("api", {
  pickFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("pick-folder"),

  openFolder: (dir: string): Promise<void> =>
    ipcRenderer.invoke("open-folder", dir),

  phaseOpen: (url: string): Promise<void> =>
    ipcRenderer.invoke("phase-open", url),

  phaseScroll: (): Promise<ScrollResult> =>
    ipcRenderer.invoke("phase-scroll"),

  phaseHarvest: (): Promise<HarvestResult> =>
    ipcRenderer.invoke("phase-harvest"),

  phaseCompile: (images: HarvestedImage[], outputDir: string): Promise<CompileResult> =>
    ipcRenderer.invoke("phase-compile", images, outputDir),

  phaseClose: (): Promise<void> =>
    ipcRenderer.invoke("phase-close"),

  onPhaseEvent: (cb: (event: PhaseEvent) => void): void => {
    ipcRenderer.on("phase-event", (_e, data: PhaseEvent) => cb(data));
  },
});
