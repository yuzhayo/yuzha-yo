/**
 * ============================================================================
 * CLOCK PROCESSOR - From JSON Config to Render Frames
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This module bridges the static JSON configuration (`ClockStageConfig.json`)
 * with runtime rendering. It loads assets, resolves motion rules, and
 * produces per-frame render instructions that any renderer (DOM, Canvas,
 * Three, etc.) can consume.
 *
 * HIGH-LEVEL FLOW:
 * ----------------
 * 1. Load config & image metadata -> `buildClockStageRuntime()`
 * 2. On each frame, call `computeClockFrame(runtime, now)` to get ordered
 *    element states (positions, rotations, dimensions).
 * 3. Feed those states into a renderer (React DOM in testscreen, or any other).
 *
 * DESIGN NOTES:
 * -------------
 * - The processor is deterministic given a timestamp.
 * - All heavy work (asset loading, geometry precomputation) happens once in
 *   `buildClockStageRuntime`.
 * - Time-dependent math lives in `clockTime.ts` so you can swap in different
 *   time sources without touching the geometry layer.
 *
 * @module shared/clock/ClockProcessor
 */

import clockConfigRaw from "../config/ClockStageConfig.json" assert { type: "json" };
import {
  CLOCK_STAGE_SIZE,
  type ClockElementConfig,
  type ClockImageAsset,
  type ClockRenderElementState,
  type ClockRenderFrame,
  type ClockStageConfig,
  type ClockStageRuntime,
  type SizePercent,
  type SpinImagePointPercent,
  type StageLine,
  type StagePoint,
} from "./clockTypes";
import {
  computeOrbitGeometry,
  calculateImageSize,
  calculateOrbitPivot,
  calculateImageTranslation,
} from "./clockGeometry";
import { resolveClockSpeed, calculateRotationDegrees, parseTimezoneOffset } from "./clockTime";
import { sortClockLayers } from "./clockLayering";
import { loadImage, resolveAssetPath, resolveAssetUrl } from "../layer/layerCore";

const clockConfig = clockConfigRaw as ClockStageConfig;

/**
 * Basic numeric guard to keep the processor resilient to malformed configs.
 */
function ensureNumber(value: unknown, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normaliseStagePoint(point: StagePoint | undefined, fallback: StagePoint): StagePoint {
  if (!point) return fallback;
  return {
    x: ensureNumber(point.x, fallback.x),
    y: ensureNumber(point.y, fallback.y),
  };
}

function normaliseStageLine(line: StageLine | undefined, fallback: StageLine): StageLine {
  if (!line) return fallback;
  return {
    x: ensureNumber(line.x, fallback.x),
    y: ensureNumber(line.y, fallback.y),
  };
}

function normalisePivotPercent(pivot: SpinImagePointPercent | undefined): SpinImagePointPercent {
  if (!pivot) {
    return { xPercent: 50, yPercent: 50 };
  }
  return {
    xPercent: ensureNumber(pivot.xPercent, 50),
    yPercent: ensureNumber(pivot.yPercent, 50),
  };
}

function normaliseSizePercent(sizePercent: SizePercent | number | undefined): SizePercent {
  const fallback = { x: 100, y: 100 };
  if (typeof sizePercent === "number") {
    const value = sizePercent <= 0 ? 100 : sizePercent;
    return { x: value, y: value };
  }
  if (!sizePercent) return fallback;
  const x = ensureNumber(sizePercent.x, fallback.x);
  const y = ensureNumber(sizePercent.y, fallback.y);
  return {
    x: x <= 0 ? fallback.x : x,
    y: y <= 0 ? fallback.y : y,
  };
}

/**
 * Load all unique image assets referenced by the config.
 */
async function loadAssets(elements: ClockElementConfig[]): Promise<Map<string, ClockImageAsset>> {
  const assetMap = new Map<string, ClockImageAsset>();
  await Promise.all(
    elements.map(async (element) => {
      if (assetMap.has(element.imageId)) return;
      const assetPath = resolveAssetPath(element.imageId);
      if (!assetPath) {
        throw new Error(`[ClockProcessor] Unknown imageId "${element.imageId}"`);
      }
      const src = resolveAssetUrl(assetPath);
      const img = await loadImage(src);
      assetMap.set(element.imageId, {
        id: element.imageId,
        src,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    }),
  );
  return assetMap;
}

/**
 * Build runtime representation of the clock stage.
 */
export async function buildClockStageRuntime(): Promise<ClockStageRuntime> {
  const stageSize =
    clockConfig?.stageSize && Number.isFinite(clockConfig.stageSize)
      ? clockConfig.stageSize
      : CLOCK_STAGE_SIZE;

  const defaultTimezoneOffset = parseTimezoneOffset(clockConfig?.defaultTimezone ?? "UTC");
  const assetMap = await loadAssets(clockConfig.elements ?? []);
  const startTimestampMs = Date.now();

  const elements = (clockConfig.elements ?? []).map((elementConfig) => {
    const image = assetMap.get(elementConfig.imageId);
    if (!image) {
      throw new Error(
        `[ClockProcessor] Asset for imageId "${elementConfig.imageId}" was not loaded`,
      );
    }

    const stagePoint = normaliseStagePoint(elementConfig.stagePoint, {
      x: stageSize / 2,
      y: stageSize / 2,
    });
    const stageLine = normaliseStageLine(elementConfig.stageLine, stagePoint);
    const pivotPercent = normalisePivotPercent(elementConfig.spinImagePoint);
    const sizePercent = normaliseSizePercent(elementConfig.sizePercent);

    const orbitGeometry = computeOrbitGeometry(stagePoint, stageLine);
    const orbitSpeed = resolveClockSpeed(elementConfig.orbit, defaultTimezoneOffset, 0);
    const spinSpeed = resolveClockSpeed(elementConfig.spin, defaultTimezoneOffset, 0);

    if (import.meta.env?.DEV && orbitGeometry.radius === 0 && orbitSpeed.kind !== "static") {
      console.warn(
        `[ClockProcessor] Element "${elementConfig.id}" has orbit speed but zero radius. The element will stay at ${JSON.stringify(stagePoint)}.`,
      );
    }

    return {
      id: elementConfig.id,
      layer: ensureNumber(elementConfig.layer, 0),
      image,
      stagePoint,
      orbit: {
        linePoint: stageLine,
        geometry: orbitGeometry,
        speed: orbitSpeed,
      },
      spin: {
        pivotPercent,
        speed: spinSpeed,
      },
      sizePercent,
    };
  });

  return {
    stageSize,
    defaultTimezoneOffsetMinutes: defaultTimezoneOffset,
    startTimestampMs,
    elements,
  };
}

/**
 * Compute render frame for a given timestamp.
 */
export function computeClockFrame(
  runtime: ClockStageRuntime,
  baseDate: Date = new Date(),
): ClockRenderFrame {
  const timezoneCache = new Map<number, Date>();

  const states: ClockRenderElementState[] = runtime.elements.map((element, index) => {
    const dimensions = calculateImageSize(element.image, element.sizePercent);
    const orbitAngle = calculateRotationDegrees(
      element.orbit.speed,
      baseDate,
      timezoneCache,
      runtime.startTimestampMs,
    );
    const pivotStage = calculateOrbitPivot(element.stagePoint, element.orbit.geometry, orbitAngle);
    const translation = calculateImageTranslation(
      pivotStage,
      dimensions,
      element.spin.pivotPercent,
    );
    const rotationDegrees = calculateRotationDegrees(
      element.spin.speed,
      baseDate,
      timezoneCache,
      runtime.startTimestampMs,
    );

    return {
      id: element.id,
      orderIndex: index,
      imageSrc: element.image.src,
      width: dimensions.width,
      height: dimensions.height,
      layer: element.layer,
      transform: {
        translateX: translation.translateX,
        translateY: translation.translateY,
        rotationDegrees,
        pivotPercentX: element.spin.pivotPercent.xPercent,
        pivotPercentY: element.spin.pivotPercent.yPercent,
      },
      orbit: {
        pivotStageX: pivotStage.x,
        pivotStageY: pivotStage.y,
        radius: element.orbit.geometry.radius,
        angleDegrees: element.orbit.geometry.baseAngleDegrees + orbitAngle,
      },
    };
  });

  return {
    stageSize: runtime.stageSize,
    elements: sortClockLayers(states),
  };
}
