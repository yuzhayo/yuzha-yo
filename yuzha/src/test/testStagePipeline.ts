import testConfig from "./test.json";
import {
  STAGE_SIZE,
  type StagePipeline,
  type PreparedLayer,
  type LayerConfigEntry,
} from "../../../shared/stage/StageSystem";
import { prepareLayer } from "../../../shared/layer/layerCore";
import { getProcessorsForEntry } from "../../../shared/layer/layer";

type MinimalTestEntry = {
  LayerID: string;
  ImageID: string;
  LayerOrder?: number;
  ImageScale?: number[];
  renderer?: LayerConfigEntry["renderer"];
  BasicStagePoint?: number[];
  BasicImagePoint?: number[];
  BasicImageAngle?: number;
};

function normaliseTestEntry(entry: MinimalTestEntry): LayerConfigEntry {
  const {
    LayerID,
    ImageID,
    LayerOrder = 0,
    ImageScale,
    renderer = "2D",
    BasicStagePoint,
    BasicImagePoint,
    BasicImageAngle,
  } = entry;

  return {
    LayerID,
    ImageID,
    LayerOrder,
    renderer,
    ImageScale,
    BasicStagePoint,
    BasicImagePoint,
    BasicImageAngle,
  };
}

function sortByLayerOrder(a: LayerConfigEntry, b: LayerConfigEntry): number {
  return (a.LayerOrder ?? 0) - (b.LayerOrder ?? 0);
}

/**
 * Create a stage pipeline using the local test configuration.
 */
export async function createTestStagePipeline(stageSize: number = STAGE_SIZE): Promise<StagePipeline> {
  const entries = (Array.isArray(testConfig) ? testConfig : [testConfig]) as MinimalTestEntry[];

  const normalised = entries.map(normaliseTestEntry).sort(sortByLayerOrder);

  const layers = (
    await Promise.all(
      normalised.map<Promise<PreparedLayer | null>>(async (entry) => {
        try {
          const prepared = await prepareLayer(entry, stageSize);
          if (!prepared) return null;

          const processors = getProcessorsForEntry(entry);

          return {
            entry,
            data: prepared,
            processors,
          };
        } catch (error) {
          console.error(`[TestStagePipeline] Failed to prepare layer "${entry.LayerID}"`, error);
          return null;
        }
      }),
    )
  ).filter((layer): layer is PreparedLayer => layer !== null);

  return {
    stageSize,
    layers,
  };
}
