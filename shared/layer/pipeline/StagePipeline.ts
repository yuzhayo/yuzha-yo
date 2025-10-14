import { loadLayerConfig, type LayerConfigEntry } from "../../config/Config";
import { STAGE_SIZE } from "../../utils/stage2048";
import { is2DLayer, prepareLayer } from "../LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "../LayerCorePipeline";
import { getProcessorsForEntry, type ProcessorContext } from "./ProcessorRegistry";

export type StagePipelineOptions = {
  stageSize?: number;
  processorContext?: ProcessorContext;
};

export type PreparedLayer = {
  entry: LayerConfigEntry;
  data: EnhancedLayerData;
  processors: LayerProcessor[];
};

export type StagePipeline = {
  stageSize: number;
  layers: PreparedLayer[];
};

export function toRendererInput(
  pipeline: StagePipeline,
): Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }> {
  return pipeline.layers.map(({ data, processors }) => ({
    data,
    processors,
  }));
}

/**
 * Load configuration, prepare layers, and attach processors.
 * This is the canonical entry point for renderer pipelines.
 */
export async function createStagePipeline(
  options: StagePipelineOptions = {},
): Promise<StagePipeline> {
  const stageSize = options.stageSize ?? STAGE_SIZE;
  const processorContext = options.processorContext;

  const config = loadLayerConfig();
  const twoDLayers = config.filter(is2DLayer);

  const prepared = (
    await Promise.all(
      twoDLayers.map(async (entry) => {
        try {
          const layer = await prepareLayer(entry, stageSize);
          if (!layer) {
            console.warn(
              `[StagePipeline] Skipping layer "${entry.layerId}" - prepareLayer returned null`,
            );
            return null;
          }

          const processors = getProcessorsForEntry(entry, processorContext);
          return {
            entry,
            data: layer as EnhancedLayerData,
            processors,
          } satisfies PreparedLayer;
        } catch (error) {
          console.error(
            `[StagePipeline] Failed to prepare layer "${entry.layerId}" (renderer=${entry.renderer})`,
            error,
          );
          return null;
        }
      }),
    )
  ).filter((layer): layer is PreparedLayer => layer !== null);

  return {
    stageSize,
    layers: prepared,
  };
}
