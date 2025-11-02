import testConfig from "./test.json";
import {
  STAGE_SIZE,
  type StagePipeline,
  type PreparedLayer,
  type LayerConfigEntry,
  type StageMarker,
} from "../../../shared/stage/StageSystem";
import { prepareLayer } from "../../../shared/layer/layerCore";
import { getProcessorsForEntry } from "../../../shared/layer/layer";
import { clampStagePoint } from "./stageMapping";

type MinimalTestEntry = {
  LayerID: string;
  ImageID: string;
  LayerOrder?: number;
  ImageScale?: number[];
  renderer?: LayerConfigEntry["renderer"];
  BasicStagePoint?: number[];
  BasicImagePoint?: number[];
  BasicImageAngle?: number;
  Stage1Blue?: number[];
  Stage1BlueVisible?: boolean;
  Stage2Red?: number[];
  Stage2RedVisible?: boolean;
  StageRedBlueVisible?: boolean;
};

type MarkerKey = "Stage1Blue" | "Stage2Red";

const MARKER_SPECS: Array<{
  key: MarkerKey;
  color: string;
  radius: number;
  visibleKey: "Stage1BlueVisible" | "Stage2RedVisible";
}> = [
  { key: "Stage1Blue", color: "#3b82f6", radius: 6, visibleKey: "Stage1BlueVisible" },
  { key: "Stage2Red", color: "#ef4444", radius: 6, visibleKey: "Stage2RedVisible" },
];

function toStagePoint(value: unknown, stageSize: number) {
  if (!Array.isArray(value) || value.length < 2) return null;
  const [x, y] = value;
  if (typeof x !== "number" || typeof y !== "number") return null;
  return clampStagePoint({ x, y }, stageSize);
}

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

  const preparedEntries = entries.map((entry) => ({
    raw: entry,
    normalised: normaliseTestEntry(entry),
  }));

  const markers: StageMarker[] = [];
  const seenMarkers = new Set<string>();

  preparedEntries.forEach(({ raw, normalised }) => {
    MARKER_SPECS.forEach(({ key, color, radius, visibleKey }) => {
      const isVisibleRaw = (raw as Record<string, unknown>)[visibleKey];
      if (isVisibleRaw === false) {
        return;
      }
      const point = toStagePoint((raw as Record<string, unknown>)[key], stageSize);
      if (!point) return;
      const dedupeKey = `point:${key}:${point.x}:${point.y}:${color}`;
      if (seenMarkers.has(dedupeKey)) {
        return;
      }
      seenMarkers.add(dedupeKey);
      markers.push({
        id: `${normalised.LayerID}-${key}`,
        x: point.x,
        y: point.y,
        color,
        radius,
        kind: "point",
      });
    });

    const centerPoint = toStagePoint(raw.Stage2Red, stageSize);
    const perimeterPoint = toStagePoint(raw.Stage1Blue, stageSize);
    if (centerPoint && perimeterPoint && raw.StageRedBlueVisible !== false) {
      const dx = perimeterPoint.x - centerPoint.x;
      const dy = perimeterPoint.y - centerPoint.y;
      const rawRadius = Math.hypot(dx, dy);
      const roundedRadius = Math.round(rawRadius * 1000) / 1000;
      if (roundedRadius > 0) {
        const circleKey = `circle:${centerPoint.x}:${centerPoint.y}:${roundedRadius}`;
        if (!seenMarkers.has(circleKey)) {
          seenMarkers.add(circleKey);
          markers.push({
            id: `${normalised.LayerID}-StageCircle`,
            x: centerPoint.x,
            y: centerPoint.y,
            radius: roundedRadius,
            color: "rgba(255, 255, 255, 0.9)",
            lineWidth: 1,
            kind: "circle",
          });
        }
      }
    }
  });

  const sortedEntries = preparedEntries.sort((a, b) =>
    sortByLayerOrder(a.normalised, b.normalised),
  );

  const layers = (
    await Promise.all(
      sortedEntries.map<Promise<PreparedLayer | null>>(async ({ normalised: entry }) => {
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
    markers: markers.length > 0 ? markers : undefined,
  };
}
