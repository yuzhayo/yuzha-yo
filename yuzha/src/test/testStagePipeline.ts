import { prepareLayer } from "../../../shared/layer/layerCore";
import {
  clampStagePoint,
  computePositionForPivot,
  type StagePoint,
  type PercentPoint,
  type ImageDimensions,
} from "./mapping";
import {
  TEST_STAGE_SIZE,
  type TestLayerConfigEntry,
  type TestStagePipeline,
  type TestPreparedLayer,
  type TestStageMarker,
  type TestLayerProcessor,
} from "./testStageSystem";

async function loadTestConfig(): Promise<MinimalTestEntry[]> {
  const module = (await import(
    /* @vite-ignore */
    `./test.json?t=${Date.now()}`
  )) as { default: MinimalTestEntry | MinimalTestEntry[] };
  const config = module.default;
  return Array.isArray(config) ? config : [config];
}

type MinimalTestEntry = {
  LayerID: string;
  ImageID: string;
  LayerOrder?: number;
  ImageScale?: number[];
  renderer?: TestLayerConfigEntry["renderer"];
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
  BlueSpin?: number;
  BlueSpinDirection?: "cw" | "ccw";
};

type PreparedEntry = {
  raw: MinimalTestEntry;
  normalised: TestLayerConfigEntry;
  derived: DerivedInfo;
};

type DerivedInfo = {
  blueStage: StagePoint;
  blueVisible: boolean;
  redStage?: StagePoint;
  redVisible: boolean;
  circleVisible: boolean;
  pivotPercent: PercentPoint;
  pivotVisible: boolean;
  circleRadius?: number;
  initialAngleDeg?: number;
  blueSpinValue: number;
  blueSpinDirection: "cw" | "ccw";
  imageSpinValue: number;
  imageSpinDirection: "cw" | "ccw";
};

type TestAnimationConfig = {
  pivotPercent: PercentPoint;
  blueStage: StagePoint;
  redStage?: StagePoint;
  circleRadius?: number;
  initialAngleDeg?: number;
  blueSpinValue: number;
  blueSpinDirection: "cw" | "ccw";
  imageSpinValue: number;
  imageSpinDirection: "cw" | "ccw";
  imageDimensions: ImageDimensions;
};

const HOURS_TO_DEGREES = 360;
const MILLISECONDS_PER_HOUR = 3600000;

function toStagePoint(value: unknown, stageSize: number): StagePoint | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const [x, y] = value;
  if (typeof x !== "number" || typeof y !== "number") return null;
  return clampStagePoint({ x, y }, stageSize);
}

function normaliseTestEntry(entry: MinimalTestEntry): TestLayerConfigEntry {
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

function sortByLayerOrder(a: TestLayerConfigEntry, b: TestLayerConfigEntry): number {
  return a.LayerOrder - b.LayerOrder;
}

function sanitisePivotPercent(value: number[] | undefined): PercentPoint {
  if (!Array.isArray(value) || value.length < 2) {
    return { x: 50, y: 50 };
  }
  const [rawX, rawY] = value;
  return {
    x: Number.isFinite(rawX) ? (rawX as number) : 50,
    y: Number.isFinite(rawY) ? (rawY as number) : 50,
  };
}

function normaliseSpin(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0;
}

function createOrbitMotion(derived: DerivedInfo): TestStageMarker["motion"] | undefined {
  if (
    derived.blueSpinValue === 0 ||
    !derived.redStage ||
    derived.circleRadius === undefined ||
    derived.circleRadius <= 0 ||
    derived.initialAngleDeg === undefined
  ) {
    return undefined;
  }

  return {
    type: "orbit",
    centerX: derived.redStage.x,
    centerY: derived.redStage.y,
    radius: derived.circleRadius,
    rotationsPerHour: Math.abs(derived.blueSpinValue),
    direction: derived.blueSpinDirection,
    initialAngleDeg: derived.initialAngleDeg,
  };
}

function createTestLayerProcessor(config: TestAnimationConfig): TestLayerProcessor | null {
  const hasOrbit =
    config.blueSpinValue !== 0 &&
    config.redStage !== undefined &&
    config.circleRadius !== undefined &&
    config.circleRadius > 0 &&
    config.initialAngleDeg !== undefined;
  const hasSpin = config.imageSpinValue !== 0;

  if (!hasOrbit && !hasSpin) {
    return null;
  }

  let startTimestamp: number | null = null;

  return (layer, timestamp) => {
    if (timestamp === undefined) return layer;
    if (startTimestamp === null) startTimestamp = timestamp;

    const elapsedMs = timestamp - startTimestamp;

    let pivotStage = config.blueStage;
    if (hasOrbit && config.redStage && config.circleRadius !== undefined && config.initialAngleDeg !== undefined) {
      const directionSign = config.blueSpinDirection === "ccw" ? 1 : -1;
      const angleDeg =
        config.initialAngleDeg +
        directionSign * Math.abs(config.blueSpinValue) * HOURS_TO_DEGREES * (elapsedMs / MILLISECONDS_PER_HOUR);
      const angleRad = (angleDeg * Math.PI) / 180;
      pivotStage = {
        x: config.redStage.x + config.circleRadius * Math.cos(angleRad),
        y: config.redStage.y - config.circleRadius * Math.sin(angleRad),
      };
    }

    let rotationDeg = layer.rotation ?? 0;
    if (hasSpin) {
      const directionSign = config.imageSpinDirection === "ccw" ? -1 : 1;
      rotationDeg =
        directionSign * Math.abs(config.imageSpinValue) * HOURS_TO_DEGREES * (elapsedMs / MILLISECONDS_PER_HOUR);
      rotationDeg = ((rotationDeg % 360) + 360) % 360;
    }

    const newPosition = computePositionForPivot(
      pivotStage,
      config.pivotPercent,
      config.imageDimensions,
      layer.scale,
      rotationDeg,
    );

    return {
      ...layer,
      position: newPosition,
      currentRotation: rotationDeg,
      hasSpinAnimation: hasSpin,
      hasOrbitalAnimation: hasOrbit,
      orbitPoint: pivotStage,
    };
  };
}

export async function createTestStagePipeline(
  stageSize: number = TEST_STAGE_SIZE,
): Promise<TestStagePipeline> {
  const entries = await loadTestConfig();

  const defaultStage = clampStagePoint({ x: stageSize / 2, y: stageSize / 2 }, stageSize);

  const preparedEntries: PreparedEntry[] = entries.map((entry) => {
    const baseNormalised = normaliseTestEntry(entry);

    const rawBlue = toStagePoint(entry.Stage1Blue, stageSize);
    const blueStage = rawBlue ?? defaultStage;
    const pivotPercent = sanitisePivotPercent(entry.ImagePivot);

    const normalised: TestLayerConfigEntry = {
      ...baseNormalised,
      BasicStagePoint: [blueStage.x, blueStage.y],
      BasicImagePoint: [pivotPercent.x, pivotPercent.y],
    };

    const redStage = toStagePoint(entry.Stage2Red, stageSize) ?? undefined;
    const circleRadius = redStage
      ? Math.hypot(blueStage.x - redStage.x, blueStage.y - redStage.y)
      : undefined;
    const initialAngleDeg =
      redStage && circleRadius !== undefined && circleRadius > 0
        ? (
            (Math.atan2(-(blueStage.y - redStage.y), blueStage.x - redStage.x) * 180) /
              Math.PI +
            360
          ) % 360
        : undefined;

    const derived: DerivedInfo = {
      blueStage,
      blueVisible: entry.Stage1BlueVisible !== false,
      redStage,
      redVisible: entry.Stage2RedVisible !== false,
      circleVisible: entry.StageRedBlueVisible !== false,
      pivotPercent,
      pivotVisible: entry.ImagePivotVisible !== false,
      circleRadius,
      initialAngleDeg,
      blueSpinValue: normaliseSpin(entry.BlueSpin),
      blueSpinDirection: entry.BlueSpinDirection === "ccw" ? "ccw" : "cw",
      imageSpinValue: normaliseSpin(entry.ImageSpin),
      imageSpinDirection: entry.ImageSpinDirection === "ccw" ? "ccw" : "cw",
    };

    return { raw: entry, normalised, derived };
  });

  const sortedEntries = [...preparedEntries].sort((a, b) =>
    sortByLayerOrder(a.normalised, b.normalised),
  );

  const markers: TestStageMarker[] = [];

  sortedEntries.forEach(({ normalised, derived }) => {
    const motion = createOrbitMotion(derived);

    if (derived.redVisible && derived.redStage) {
      markers.push({
        id: `${normalised.LayerID}-Stage2Red`,
        x: derived.redStage.x,
        y: derived.redStage.y,
        color: "#ef4444",
        radius: 6,
        kind: "point",
      });
    }

    if (derived.blueVisible) {
      markers.push({
        id: `${normalised.LayerID}-Stage1Blue`,
        x: derived.blueStage.x,
        y: derived.blueStage.y,
        color: "#3b82f6",
        radius: 6,
        kind: "point",
        motion,
      });
    }

    if (
      derived.circleVisible &&
      derived.redStage &&
      derived.circleRadius !== undefined &&
      derived.circleRadius > 0
    ) {
      markers.push({
        id: `${normalised.LayerID}-StageCircle`,
        x: derived.redStage.x,
        y: derived.redStage.y,
        radius: derived.circleRadius,
        color: "rgba(255, 255, 255, 0.9)",
        lineWidth: 1,
        kind: "circle",
      });
    }

    if (derived.pivotVisible) {
      markers.push({
        id: `${normalised.LayerID}-ImagePivot`,
        x: derived.blueStage.x,
        y: derived.blueStage.y,
        color: "#facc15",
        radius: 3,
        kind: "point",
        motion,
      });
    }
  });

  const layers = (
    await Promise.all(
      sortedEntries.map<Promise<TestPreparedLayer | null>>(async ({ normalised, derived }) => {
        try {
          const prepared = await prepareLayer(normalised, stageSize);
          if (!prepared) return null;

          const animationConfig: TestAnimationConfig = {
            pivotPercent: derived.pivotPercent,
            blueStage: derived.blueStage,
            redStage: derived.redStage,
            circleRadius: derived.circleRadius,
            initialAngleDeg: derived.initialAngleDeg,
            blueSpinValue: derived.blueSpinValue,
            blueSpinDirection: derived.blueSpinDirection,
            imageSpinValue: derived.imageSpinValue,
            imageSpinDirection: derived.imageSpinDirection,
            imageDimensions: {
              width: prepared.imageMapping.imageDimensions.width,
              height: prepared.imageMapping.imageDimensions.height,
            },
          };

          const processor = createTestLayerProcessor(animationConfig);
          const processors: TestLayerProcessor[] = processor ? [processor] : [];

          return {
            entry: normalised,
            data: prepared,
            processors,
          };
        } catch (error) {
          console.error(
            `[TestStagePipeline] Failed to prepare layer "${normalised.LayerID}" (renderer=${normalised.renderer})`,
            error,
          );
          return null;
        }
      }),
    )
  ).filter((layer): layer is TestPreparedLayer => layer !== null);

  return {
    stageSize,
    layers,
    markers: markers.length > 0 ? markers : undefined,
  };
}
