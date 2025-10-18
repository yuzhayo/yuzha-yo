import rawTestConfig from "./test.json";
import {
  STAGE_SIZE,
  toRendererInput,
  type StagePipeline,
  type PreparedLayer,
  type StagePipelineOptions,
} from "@shared/stage/StageSystem";
import { prepareLayer, is2DLayer } from "@shared/layer/layerCore";
import {
  getProcessorsForEntry,
  type EnhancedLayerData,
  type LayerProcessor,
  type ProcessorContext,
} from "@shared/layer/layer";
import type { LayerConfigEntry, LayerRenderer } from "@shared/config/Config";

type RawTestConfigEntry = {
  LayerID: string;
  ImageID: string;
  LayerOrder?: number;
  renderer?: LayerRenderer;
} & Partial<Omit<LayerConfigEntry, "LayerID" | "ImageID" | "LayerOrder" | "renderer">>;

const rawEntries = rawTestConfig as RawTestConfigEntry[];

function normalizeEntry(entry: RawTestConfigEntry): LayerConfigEntry {
  return {
    ...entry,
    renderer: entry.renderer ?? "2D",
    LayerOrder: entry.LayerOrder ?? 0,
  } satisfies LayerConfigEntry;
}

export function loadTestLayerConfig(): LayerConfigEntry[] {
  return rawEntries.map(normalizeEntry).sort((a, b) => a.LayerOrder - b.LayerOrder);
}

export async function createTestStagePipeline(
  options: StagePipelineOptions = {},
): Promise<StagePipeline> {
  const stageSize = options.stageSize ?? STAGE_SIZE;
  const processorContext: ProcessorContext | undefined = options.processorContext;
  const entries = loadTestLayerConfig().filter(is2DLayer);

  const prepared = (
    await Promise.all(
      entries.map(async (entry) => {
        try {
          const layer = await prepareLayer(entry, stageSize);
          if (!layer) {
            if (import.meta.env?.DEV) {
              console.warn(`[TestStage] Skipping layer "${entry.LayerID}" - prepareLayer returned null`);
            }
            return null;
          }

          const processors: LayerProcessor[] = getProcessorsForEntry(entry, processorContext);
          return {
            entry,
            data: layer as EnhancedLayerData,
            processors,
          } satisfies PreparedLayer;
        } catch (error) {
          console.error(`[TestStage] Failed to prepare layer "${entry.LayerID}"`, error);
          return null;
        }
      }),
    )
  ).filter((value): value is PreparedLayer => value !== null);

  return {
    stageSize,
    layers: prepared,
  };
}

export async function createTestRendererInput(options?: StagePipelineOptions) {
  const pipeline = await createTestStagePipeline(options);
  return toRendererInput(pipeline);
}

