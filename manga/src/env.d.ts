import type { PhaseEvent, HarvestedImage, ScrollResult, HarvestResult, CompileResult } from "./types";

declare global {
  interface Window {
    api: {
      pickFolder: () => Promise<string | null>;
      openFolder: (dir: string) => Promise<void>;
      phaseOpen: (url: string) => Promise<void>;
      phaseScroll: () => Promise<ScrollResult>;
      phaseHarvest: () => Promise<HarvestResult>;
      phaseCompile: (images: HarvestedImage[], outputDir: string) => Promise<CompileResult>;
      phaseClose: () => Promise<void>;
      onPhaseEvent: (cb: (event: PhaseEvent) => void) => void;
    };
  }
}
