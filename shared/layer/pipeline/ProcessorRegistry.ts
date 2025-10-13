import type { LayerConfigEntry } from "../../config/Config";
import type { LayerProcessor } from "../LayerCorePipeline";
import { createImageMappingDebugProcessor } from "../LayerCorePipelineImageMappingUtils";
import { createSpinProcessor } from "../LayerCorePipelineSpin";
import { createOrbitalProcessor } from "../LayerCorePipelineOrbital";

export type ProcessorContext = {
  /**
   * Allows runtime overrides (e.g., forcing a processor even when config is false).
   * Currently unused but kept for future extensions.
   */
  force?: Record<string, unknown>;
};

type ProcessorPlugin = {
  name: string;
  shouldAttach(entry: LayerConfigEntry, context?: ProcessorContext): boolean;
  create(entry: LayerConfigEntry, context?: ProcessorContext): LayerProcessor;
};

const plugins: ProcessorPlugin[] = [];

export function registerProcessor(plugin: ProcessorPlugin): void {
  const existingIndex = plugins.findIndex((p) => p.name === plugin.name);
  if (existingIndex >= 0) {
    plugins.splice(existingIndex, 1, plugin);
  } else {
    plugins.push(plugin);
  }
}

export function getProcessorsForEntry(
  entry: LayerConfigEntry,
  context?: ProcessorContext,
): LayerProcessor[] {
  const attached: LayerProcessor[] = [];
  for (const plugin of plugins) {
    try {
      if (plugin.shouldAttach(entry, context)) {
        attached.push(plugin.create(entry, context));
      }
    } catch (error) {
      console.warn(
        `[ProcessorRegistry] Failed to attach processor "${plugin.name}" for layer "${entry.layerId}":`,
        error,
      );
    }
  }
  return attached;
}

// ---------------------------------------------------------------------------
// Default processors
// ---------------------------------------------------------------------------
registerProcessor({
  name: "image-mapping-debug",
  shouldAttach(entry) {
    return Boolean(
      entry.showCenter ||
        entry.showTip ||
        entry.showBase ||
        entry.showStageCenter ||
        entry.showAxisLine ||
        entry.showRotation ||
        entry.showTipRay ||
        entry.showBaseRay ||
        entry.showBoundingBox,
    );
  },
  create(entry) {
    return createImageMappingDebugProcessor({
      showCenter: entry.showCenter,
      showTip: entry.showTip,
      showBase: entry.showBase,
      showStageCenter: entry.showStageCenter,
      showAxisLine: entry.showAxisLine,
      showRotation: entry.showRotation,
      showTipRay: entry.showTipRay,
      showBaseRay: entry.showBaseRay,
      showBoundingBox: entry.showBoundingBox,
      centerStyle: entry.centerStyle,
      tipStyle: entry.tipStyle,
      baseStyle: entry.baseStyle,
      stageCenterStyle: entry.stageCenterStyle,
      colors: entry.debugColors,
    });
  },
});

registerProcessor({
  name: "spin",
  shouldAttach(entry) {
    return typeof entry.spinSpeed === "number" && entry.spinSpeed > 0;
  },
  create(entry) {
    return createSpinProcessor({
      spinSpeed: entry.spinSpeed,
      spinDirection: entry.spinDirection,
    });
  },
});

registerProcessor({
  name: "orbital",
  shouldAttach(entry) {
    return Boolean(
      entry.orbitStagePoint !== undefined ||
        entry.orbitOrient === true ||
        (entry.orbitSpeed !== undefined && entry.orbitSpeed !== 0) ||
        entry.orbitLine === true ||
        entry.orbitLinePoint !== undefined ||
        entry.orbitImagePoint !== undefined,
    );
  },
  create(entry) {
    return createOrbitalProcessor({
      orbitStagePoint: entry.orbitStagePoint as [number, number] | undefined,
      orbitLinePoint: entry.orbitLinePoint as [number, number] | undefined,
      orbitImagePoint: entry.orbitImagePoint as [number, number] | undefined,
      orbitLine: entry.orbitLine,
      orbitSpeed: entry.orbitSpeed,
      orbitDirection: entry.orbitDirection,
    });
  },
});
