/**
 * Layer Motion Module - unified spin & orbit processing
 *
 * This module replaces the legacy layerSpin/layerOrbit processors with a single
 * cohesive motion builder. It consumes the existing LayerConfigEntry fields,
 * resolves clock aliases, and produces both a frame processor and optional
 * stage markers.
 */

import type { LayerConfigEntry } from "../config/Config";
import { getImageCenter, type ImageMapping } from "../layer/layerCore";
import type { UniversalLayerData } from "../layer/layerCore";
import { normalizePercent, type PercentPoint, type Point2D } from "../layer/layerBasic";
import {
  calculateRotationDegrees,
  resolveClockSpeed,
  type ClockMotionConfig,
  type RotationDirection,
} from "../layer/clockTime";
import type { EnhancedLayerData } from "../layer/layer";

export type LayerMotionMarker = {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  kind?: "point" | "circle";
  lineWidth?: number;
  motion?: {
    type: "orbit";
    centerX: number;
    centerY: number;
    radius: number;
    rotationsPerHour: number;
    direction: RotationDirection;
    initialAngleDeg: number;
  };
};

type LayerMotionConfig = {
  stageSize: number;
  blueStage: Point2D;
  blueVisible: boolean;
  redStage?: Point2D;
  redVisible: boolean;
  circleVisible: boolean;
  pivotPercent: PercentPoint;
  pivotVisible: boolean;
  circleRadius?: number;
  initialAngleDeg?: number;
  spinMotion: MotionResolution;
  orbitMotion: MotionResolution;
};

type MotionResolution = {
  active: boolean;
  motionConfig?: ClockMotionConfig;
  resolved: ReturnType<typeof resolveClockSpeed>;
};

type ProcessorState = {
  startPerfTime?: number;
  startWallClockMs?: number;
  spinTimezoneCache: Map<number, Date>;
  orbitTimezoneCache: Map<number, Date>;
};

export type LayerMotionArtifacts = {
  processor?: (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;
  markers?: LayerMotionMarker[];
};

export function buildLayerMotion(
  entry: LayerConfigEntry,
  layer: UniversalLayerData,
  stageSize: number,
): LayerMotionArtifacts {
  const config = deriveLayerMotionConfig(entry, stageSize);
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
  stageSize: number,
): LayerMotionConfig | null {
  const stageCenter = { x: stageSize / 2, y: stageSize / 2 };

  const pivotPercent =
    sanitizePercent(entry.spinImagePoint) ?? sanitizePercent(entry.BasicImagePoint) ?? {
      x: 50,
      y: 50,
    };

  const blueStage =
    sanitizeStagePoint(entry.spinStagePoint, stageSize) ??
    sanitizeStagePoint(entry.orbitLinePoint, stageSize) ??
    sanitizeStagePoint(entry.BasicStagePoint, stageSize) ??
    stageCenter;

  const redStage = sanitizeStagePoint(entry.orbitStagePoint, stageSize);

  const circleRadius =
    redStage !== undefined
      ? distanceBetween(blueStage, redStage)
      : undefined;
  const initialAngleDeg =
    redStage !== undefined && circleRadius !== undefined && circleRadius > 0
      ? ((Math.atan2(-(blueStage.y - redStage.y), blueStage.x - redStage.x) * 180) / Math.PI + 360) %
        360
      : undefined;

  const spinMotion = resolveMotion({
    speed: entry.spinSpeedAlias ?? entry.spinSpeed,
    direction: entry.spinDirection,
    format: entry.spinFormat,
    timezone: entry.spinTimezone,
  }, entry.spinSpeed ?? 0);

  const orbitMotion = resolveMotion({
    speed: entry.orbitSpeedAlias ?? entry.orbitSpeed,
    direction: entry.orbitDirection,
    format: entry.orbitFormat,
    timezone: entry.orbitTimezone,
  }, entry.orbitSpeed ?? 0);

  const spinActive = spinMotion.active;
  const orbitActive =
    redStage !== undefined &&
    circleRadius !== undefined &&
    circleRadius > 0 &&
    orbitMotion.active;

  if (!spinActive && !orbitActive) {
    return null;
  }

  return {
    stageSize,
    blueStage,
    blueVisible: true,
    redStage,
    redVisible: Boolean(redStage),
    circleVisible: Boolean(entry.orbitLine),
    pivotPercent,
    pivotVisible: Boolean(entry.spinImagePoint),
    circleRadius,
    initialAngleDeg,
    spinMotion,
    orbitMotion: orbitActive
      ? orbitMotion
      : {
          active: false,
          motionConfig: undefined,
          resolved: orbitMotion.resolved,
        },
  };
}

function createLayerMotionProcessor(
  entry: LayerConfigEntry,
  config: LayerMotionConfig,
  imageMapping: ImageMapping,
) {
  const state: ProcessorState = {
    spinTimezoneCache: new Map<number, Date>(),
    orbitTimezoneCache: new Map<number, Date>(),
  };

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
      rotationDeg = normaliseAngle(
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

      currentOrbitAngle = normaliseAngle((config.initialAngleDeg ?? 0) + orbitAngleDelta);
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
      config.orbitMotion.active && config.redStage && config.circleRadius && config.initialAngleDeg !== undefined
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
    motion.speed !== undefined ||
    motion.format !== undefined ||
    motion.timezone !== undefined;

  const resolved = resolveClockSpeed(hasConfig ? motion : undefined, 0, fallbackNumeric);

  const active =
    resolved.kind === "alias" ||
    (resolved.kind === "numeric" && resolved.rotationsPerHour !== 0);

  return {
    active,
    motionConfig: hasConfig ? motion : undefined,
    resolved,
  };
}

function calculatePositionForPivot(
  stageAnchor: Point2D,
  pivotPercent: PercentPoint,
  imageMapping: ImageMapping,
  scale: Point2D,
  rotationDeg: number,
): Point2D {
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const imageCenter = getImageCenter(imageMapping);

  const pivotPoint: Point2D = {
    x: (pivotPercent.x / 100) * imageMapping.imageDimensions.width,
    y: (pivotPercent.y / 100) * imageMapping.imageDimensions.height,
  };

  const offsetFromCenter: Point2D = {
    x: (pivotPoint.x - imageCenter.x) * scale.x,
    y: (pivotPoint.y - imageCenter.y) * scale.y,
  };

  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);

  const rotatedOffset: Point2D = {
    x: offsetFromCenter.x * cosR - offsetFromCenter.y * sinR,
    y: offsetFromCenter.x * sinR + offsetFromCenter.y * cosR,
  };

  return {
    x: stageAnchor.x - rotatedOffset.x,
    y: stageAnchor.y - rotatedOffset.y,
  };
}

function sanitizePercent(value?: number[] | PercentPoint | null): PercentPoint | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length < 2) return undefined;
    const [x, y] = value;
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

function sanitizeStagePoint(
  value: number[] | undefined,
  stageSize: number,
): Point2D | undefined {
  if (!value || value.length < 2) return undefined;
  const [x, y] = value;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return {
    x: clampStageCoordinate(x, stageSize),
    y: clampStageCoordinate(y, stageSize),
  };
}

function clampStageCoordinate(value: number, stageSize: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(stageSize, value));
}

function distanceBetween(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function normaliseAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function resolveRotationsPerHour(resolved: ReturnType<typeof resolveClockSpeed>): number {
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
