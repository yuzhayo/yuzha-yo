import type { LibraryConfig } from "@shared/layer2/LayerTypes";
import runtimeConfigJson from "@shared/layer2/LayerConfig.json";

const runtimeConfig = runtimeConfigJson as LibraryConfig;

export const mainScreenConfigs = {
  runtime: runtimeConfig,
};

export const configPresets = [
  {
    name: "Runtime",
    description: "Loaded from shared/layer2/LayerConfig.json",
    config: runtimeConfig,
  },
];

export default mainScreenConfigs;
