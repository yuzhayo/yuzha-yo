/** LAYER MOTION - Motion builder utilities extracted from the engine. */

import type {
  ClockMotionConfig,
  LayerConfigEntry,
  LayerMotionArtifacts,
  LayerMotionMarker,
  LayerProcessor,
  Point2D,
  PercentPoint,
  RotationDirection,
  UniversalLayerData,
  ImageMapping,
  ResolvedClockSpeed,
  EnhancedLayerData,
} from "./model";
import {
  calculatePositionForPivot,
  calculateRotationDegrees,
  clampStage,
  normalizeAngle,
  normalizePercent,
  resolveClockSpeed,
} from "./math";

type LayerMotionConfig = {
  stageSize: number;
  blueStage: Point2D;
  redStage?: Point2D;
  circleRadius?: number;
  initialAngleDeg?: number;
  pivotPercent: PercentPoint;
  circleVisible: boolean;
  pivotVisible: boolean;
  spinMotion: MotionResolution;
  orbitMotion: MotionResolution;
};

type MotionResolution = {
  active: boolean;
  motionConfig?: ClockMotionConfig;
  resolved: ResolvedClockSpeed;
};

type ProcessorState = {
  startPerfTime?: number;
  startWallClockMs?: number;
  spinTimezoneCache: Map<number, Date>;
  orbitTimezoneCache: Map<number, Date>;
};

const processorStateCache = new Map<string, ProcessorState>();

const acquireProcessorState = (layerId: string): ProcessorState => {
  let state = processorStateCache.get(layerId);
  if (!state) {
    state = {
      spinTimezoneCache: new Map<number, Date>(),
      orbitTimezoneCache: new Map<number, Date>(),
    };
    processorStateCache.set(layerId, state);
  }
  return state;
};

export const clearProcessorStates = (layerId?: string): void => {
  if (layerId) {
    processorStateCache.delete(layerId);
    return;
  }
  processorStateCache.clear();
};

/** Build layer motion processor and markers. */
export function buildLayerMotion(
  entry: LayerConfigEntry,
  layer: UniversalLayerData,
  stageSize: number,
): LayerMotionArtifacts {
  const config = deriveLayerMotionConfig(entry, layer, stageSize);
  if (!config) {
    return {};
  }

  const markers = createMotionMarkers(entry.LayerID, config);
  const processor = createLayerMotionProcessor(entry, config, layer.imageMapping);

  return {
    processor,
    markers: markers.length > 0 ? markers : undefined,
  };
}

function deriveLayerMotionConfig(
  entry: LayerConfigEntry,
  layer: UniversalLayerData,
  stageSize: number,
): LayerMotionConfig | null {
  const stageCenterPoint = layer.calculation.stageCenter?.point ?? {
    x: stageSize / 2,
    y: stageSize / 2,
  };

  const computedSpinPercent = layer.spinStagePoint
    ? layer.calculation.spinPoint.image.percent
    : undefined;

  const pivotPercent = layer.spinPercent ??
    sanitizePercent(entry.spinImagePoint) ??
    sanitizePercent(entry.BasicImagePoint) ??
    computedSpinPercent ?? {
      x: 50,
      y: 50,
    };

  const blueStage =
    layer.spinStagePoint ??
    layer.orbitLinePoint ??
    sanitizeStagePoint(entry.spinStagePoint, stageSize) ??
    sanitizeStagePoint(entry.orbitLinePoint, stageSize) ??
    sanitizeStagePoint(entry.BasicStagePoint, stageSize) ??
    stageCenterPoint;

  const redStage = layer.orbitStagePoint ?? sanitizeStagePoint(entry.orbitStagePoint, stageSize);

  const circleRadius =
    layer.orbitRadius ??
    (redStage !== undefined ? distanceBetween(blueStage, redStage) : undefined);

  const initialAngleDeg =
    layer.orbitRadius && layer.orbitLinePoint && layer.orbitStagePoint
      ? normalizeAngle(
          (Math.atan2(
            -(layer.orbitLinePoint.y - layer.orbitStagePoint.y),
            layer.orbitLinePoint.x - layer.orbitStagePoint.x,
          ) *
            180) /
            Math.PI,
        )
      : redStage !== undefined && circleRadius !== undefined && circleRadius > 0
        ? normalizeAngle(
            (Math.atan2(-(blueStage.y - redStage.y), blueStage.x - redStage.x) * 180) / Math.PI,
          )
        : undefined;

  const spinMotion = resolveMotion(
    {
      speed: entry.spinSpeedAlias ?? entry.spinSpeed,
      direction: entry.spinDirection,
      format: entry.spinFormat,
      timezone: entry.spinTimezone,
    },
    entry.spinSpeed ?? 0,
  );

  const orbitMotion = resolveMotion(
    {
      speed: entry.orbitSpeedAlias ?? entry.orbitSpeed,
      direction: entry.orbitDirection,
      format: entry.orbitFormat,
      timezone: entry.orbitTimezone,
    },
    entry.orbitSpeed ?? 0,
  );

  const spinActive = spinMotion.active;
  const orbitActive =
    redStage !== undefined && circleRadius !== undefined && circleRadius > 0 && orbitMotion.active;

  if (!spinActive && !orbitActive) {
    return null;
  }

  return {
    stageSize,
    blueStage,
    redStage,
    circleRadius,
    initialAngleDeg,
    circleVisible: layer.orbitLineVisible ?? Boolean(entry.orbitLine),
    pivotPercent,
    pivotVisible: Boolean(entry.spinImagePoint),
    spinMotion,
    orbitMotion,
  };
}

function createLayerMotionProcessor(
  entry: LayerConfigEntry,
  config: LayerMotionConfig,
  imageMapping: ImageMapping,
): LayerProcessor | undefined {
  const state = acquireProcessorState(entry.LayerID);

  const hasSpin = config.spinMotion.active;
  const hasOrbit = config.orbitMotion.active && config.redStage && config.circleRadius;

  if (!hasSpin && !hasOrbit) {
    return undefined;
  }

  const pivotPercent = config.pivotPercent;

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    const perfNow = timestamp ?? performance.now();

    if (state.startPerfTime === undefined) {
      state.startPerfTime = perfNow;
      state.startWallClockMs = Date.now();
    }

    const baseNowMs =
      state.startWallClockMs !== undefined && state.startPerfTime !== undefined
        ? state.startWallClockMs + (perfNow - state.startPerfTime)
        : Date.now();

    const baseDate = new Date(baseNowMs);

    let rotationDeg = layer.rotation ?? 0;
    if (hasSpin) {
      rotationDeg = normalizeAngle(
        calculateRotationDegrees(
          config.spinMotion.resolved,
          baseDate,
          state.spinTimezoneCache,
          state.startWallClockMs,
        ),
      );
    }

    let orbitPoint = config.blueStage;
    let currentOrbitAngle = config.initialAngleDeg ?? 0;

    if (hasOrbit && config.redStage && config.circleRadius !== undefined) {
      const orbitAngleDelta = calculateRotationDegrees(
        config.orbitMotion.resolved,
        baseDate,
        state.orbitTimezoneCache,
        state.startWallClockMs,
      );

      currentOrbitAngle = normalizeAngle((config.initialAngleDeg ?? 0) + orbitAngleDelta);
      const angleRad = (currentOrbitAngle * Math.PI) / 180;

      orbitPoint = {
        x: config.redStage.x + config.circleRadius * Math.cos(angleRad),
        y: config.redStage.y - config.circleRadius * Math.sin(angleRad),
      };
    }

    const newPosition = calculatePositionForPivot(
      orbitPoint,
      pivotPercent,
      imageMapping,
      layer.scale,
      rotationDeg,
    );

    const motionAugments: Record<string, unknown> = {
      position: newPosition,
      currentRotation: rotationDeg,
      hasSpinAnimation: hasSpin,
      spinDirection: entry.spinDirection ?? "cw",
      spinSpeed:
        entry.spinSpeed ??
        (config.spinMotion.resolved.kind === "numeric"
          ? config.spinMotion.resolved.rotationsPerHour
          : 0),
      spinSpeedAlias:
        entry.spinSpeedAlias ??
        (config.spinMotion.resolved.kind === "alias"
          ? config.spinMotion.resolved.alias
          : undefined),
      spinFormat: entry.spinFormat,
      spinTimezone: entry.spinTimezone,
      spinStagePoint: orbitPoint,
      spinPercent: pivotPercent,
      hasOrbitalAnimation: hasOrbit,
      orbitPoint,
      orbitStagePoint: config.redStage,
      orbitLinePoint: config.blueStage,
      orbitLineVisible: config.circleVisible,
      orbitRadius: config.circleRadius,
      orbitSpeed:
        entry.orbitSpeed ??
        (config.orbitMotion.resolved.kind === "numeric"
          ? config.orbitMotion.resolved.rotationsPerHour
          : 0),
      orbitSpeedAlias:
        entry.orbitSpeedAlias ??
        (config.orbitMotion.resolved.kind === "alias"
          ? config.orbitMotion.resolved.alias
          : undefined),
      orbitFormat: entry.orbitFormat,
      orbitTimezone: entry.orbitTimezone,
      orbitDirection: entry.orbitDirection ?? "cw",
      orbitLineStyle:
        config.circleVisible && config.circleRadius
          ? { radius: config.circleRadius, visible: true }
          : undefined,
      currentOrbitAngle: currentOrbitAngle,
    };

    return {
      ...layer,
      ...motionAugments,
    } as EnhancedLayerData;
  };
}

function createMotionMarkers(layerId: string, config: LayerMotionConfig): LayerMotionMarker[] {
  const markers: LayerMotionMarker[] = [];

  if (config.redStage) {
    markers.push({
      id: `${layerId}-StageRed`,
      x: config.redStage.x,
      y: config.redStage.y,
      color: "#ef4444",
      radius: 6,
      kind: "point",
    });
  }

  if (config.blueStage) {
    const motion =
      config.orbitMotion.active &&
      config.redStage &&
      config.circleRadius &&
      config.initialAngleDeg !== undefined
        ? {
            type: "orbit" as const,
            centerX: config.redStage.x,
            centerY: config.redStage.y,
            radius: config.circleRadius,
            rotationsPerHour: resolveRotationsPerHour(config.orbitMotion.resolved),
            direction: (config.orbitMotion.motionConfig?.direction ?? "cw") as RotationDirection,
            initialAngleDeg: config.initialAngleDeg,
          }
        : undefined;

    markers.push({
      id: `${layerId}-StageBlue`,
      x: config.blueStage.x,
      y: config.blueStage.y,
      color: "#3b82f6",
      radius: 6,
      kind: "point",
      motion,
    });
  }

  if (config.circleVisible && config.redStage && config.circleRadius) {
    markers.push({
      id: `${layerId}-StageCircle`,
      x: config.redStage.x,
      y: config.redStage.y,
      color: "rgba(255, 255, 255, 0.9)",
      radius: config.circleRadius,
      kind: "circle",
      lineWidth: 1,
    });
  }

  if (config.pivotVisible) {
    markers.push({
      id: `${layerId}-ImagePivot`,
      x: config.blueStage.x,
      y: config.blueStage.y,
      color: "#facc15",
      radius: 3,
      kind: "point",
    });
  }

  return markers;
}

function resolveMotion(motion: ClockMotionConfig, fallbackNumeric: number): MotionResolution {
  const hasConfig =
    motion.speed !== undefined || motion.format !== undefined || motion.timezone !== undefined;

  const resolved = resolveClockSpeed(hasConfig ? motion : undefined, 0, fallbackNumeric);

  const active =
    resolved.kind === "alias" || (resolved.kind === "numeric" && resolved.rotationsPerHour !== 0);

  return {
    active,
    motionConfig: hasConfig ? motion : undefined,
    resolved,
  };
}

function sanitizePercent(value?: number[] | PercentPoint | null): PercentPoint | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length < 2) return undefined;
    const [x, y] = value;
    if (x === undefined || y === undefined) return undefined;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
    return {
      x: normalizePercent(x),
      y: normalizePercent(y),
    };
  }
  if (typeof value.x === "number" && typeof value.y === "number") {
    return {
      x: normalizePercent(value.x),
      y: normalizePercent(value.y),
    };
  }
  return undefined;
}

function sanitizeStagePoint(value: number[] | undefined, stageSize: number): Point2D | undefined {
  if (!value || value.length < 2) return undefined;
  const [x, y] = value;
  if (x === undefined || y === undefined) return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return {
    x: clampStage(x, stageSize),
    y: clampStage(y, stageSize),
  };
}

function distanceBetween(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function resolveRotationsPerHour(resolved: ResolvedClockSpeed): number {
  if (resolved.kind === "numeric") {
    return resolved.rotationsPerHour;
  }
  if (resolved.kind === "alias") {
    switch (resolved.alias) {
      case "second":
        return 60;
      case "minute":
        return 1;
      case "hour":
        return 1 / 12;
      default:
        return 0;
    }
  }
  return 0;
}
