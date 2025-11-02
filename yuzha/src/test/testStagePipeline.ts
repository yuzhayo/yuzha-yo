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
import { createImageMapping, percentToImagePoint } from "./imageMapping";

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
  ImagePivot?: number[];
  ImagePivotVisible?: boolean;
  ImageSpin?: number;
  ImageSpinDirection?: "cw" | "ccw";
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

function calculatePivotStagePoint(
  prepared: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
    imageMapping: { imageDimensions: { width: number; height: number } };
  },
  pivotPercent: unknown,
  stageSize: number,
) {
  if (!Array.isArray(pivotPercent) || pivotPercent.length < 2) return null;
  const [pivotX, pivotY] = pivotPercent;
  if (typeof pivotX !== "number" || typeof pivotY !== "number") return null;

  const mapping = createImageMapping({
    width: prepared.imageMapping.imageDimensions.width,
    height: prepared.imageMapping.imageDimensions.height,
  });
  const imagePoint = percentToImagePoint({ x: pivotX, y: pivotY }, mapping);

  return clampStagePoint(
    {
      x: prepared.position.x + (imagePoint.x - mapping.center.x) * prepared.scale.x,
      y: prepared.position.y + (imagePoint.y - mapping.center.y) * prepared.scale.y,
    },
    stageSize,
  );
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
      sortedEntries.map<Promise<PreparedLayer | null>>(async ({ raw, normalised: entry }) => {
        try {
          let entryWithOverrides: LayerConfigEntry = { ...entry };

          let prepared = await prepareLayer(entryWithOverrides, stageSize);
          if (!prepared) return null;

          const pivotPercentArray =
            Array.isArray(raw.ImagePivot) &&
            raw.ImagePivot.length >= 2 &&
            typeof raw.ImagePivot[0] === "number" &&
            typeof raw.ImagePivot[1] === "number"
              ? [raw.ImagePivot[0], raw.ImagePivot[1]] as [number, number]
              : null;

          let pivotStagePoint = pivotPercentArray
            ? calculatePivotStagePoint(prepared, pivotPercentArray, stageSize)
            : null;

          if (pivotStagePoint && typeof raw.ImageSpin === "number" && raw.ImageSpin !== 0) {
            entryWithOverrides = {
              ...entryWithOverrides,
              spinSpeed: Math.abs(raw.ImageSpin),
              spinDirection: raw.ImageSpinDirection === "ccw" ? "ccw" : "cw",
              spinImagePoint: [pivotPercentArray![0], pivotPercentArray![1]],
              spinStagePoint: [pivotStagePoint.x, pivotStagePoint.y],
            };
            prepared = await prepareLayer(entryWithOverrides, stageSize);
            if (!prepared) return null;
            const recalculatedPivot = calculatePivotStagePoint(
              prepared,
              pivotPercentArray,
              stageSize,
            );
            if (recalculatedPivot) {
              pivotStagePoint = recalculatedPivot;
              entryWithOverrides = {
                ...entryWithOverrides,
                spinStagePoint: [pivotStagePoint.x, pivotStagePoint.y],
              };
            }
          }

          if (pivotStagePoint && raw.ImagePivotVisible !== false) {
            const pivotKey = `pivot:${pivotStagePoint.x}:${pivotStagePoint.y}`;
            if (!seenMarkers.has(pivotKey)) {
              seenMarkers.add(pivotKey);
              markers.push({
                id: `${entryWithOverrides.LayerID}-ImagePivot`,
                x: pivotStagePoint.x,
                y: pivotStagePoint.y,
                color: "#facc15",
                radius: 3,
                kind: "point",
              });
            }
          }

          const processors = getProcessorsForEntry(entryWithOverrides);

          return {
            entry: entryWithOverrides,
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
