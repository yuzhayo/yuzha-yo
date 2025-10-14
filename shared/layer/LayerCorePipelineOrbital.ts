import { imagePercentToImagePoint, type PercentPoint, type Point2D } from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import {
  applyRotationDirection,
  calculateOrbitPosition,
  calculateOrbitalVisibility,
  normalizeAngle,
} from "./LayerCorePipeline";

export type OrbitalConfig = {
  orbitStagePoint?: [number, number];
  orbitLinePoint?: [number, number];
  orbitImagePoint?: [number, number];
  orbitLine?: boolean;
  orbitOrient?: boolean;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
};

export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor {
  const overrideStagePoint = normaliseStagePoint(config.orbitStagePoint);
  const overrideLinePoint = normaliseStagePoint(config.orbitLinePoint);
  const overrideImagePercent = normalisePercent(config.orbitImagePoint);
  const overrideOrbitLine = config.orbitLine;
  const overrideOrient = config.orbitOrient;
  const orbitSpeed = config.orbitSpeed ?? 0;
  const orbitDirection = config.orbitDirection ?? "cw";

  if (orbitSpeed <= 0 && !overrideOrient && !overrideOrbitLine) {
    return (layer: EnhancedLayerData): EnhancedLayerData => layer;
  }

  let startTime: number | undefined;

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    const orient = overrideOrient ?? layer.orbitOrient ?? false;
    const requestedLine = overrideOrbitLine ?? layer.orbitLineVisible ?? false;
    const hasSpin = Boolean((layer as EnhancedLayerData).hasSpinAnimation);

    const hasMotion = orbitSpeed > 0;
    const shouldUpdatePath = hasMotion || orient;
    const shouldRenderLine = requestedLine || shouldUpdatePath;

    if (!shouldRenderLine) {
      return layer;
    }

    const stageCenterPoint = layer.calculation.stageCenter.point;
    const baseStagePoint: Point2D | { x: number; y: number } = overrideStagePoint ??
      layer.orbitStagePoint ?? {
        x: stageCenterPoint.x,
        y: stageCenterPoint.y,
      };

    const baseLinePoint = overrideLinePoint ?? layer.orbitLinePoint ?? baseStagePoint;

    const radiusDx = baseLinePoint.x - baseStagePoint.x;
    const radiusDy = baseLinePoint.y - baseStagePoint.y;
    const orbitRadius = Math.sqrt(radiusDx * radiusDx + radiusDy * radiusDy);

    const imagePercent =
      overrideImagePercent ?? layer.orbitImagePercent ?? ({ x: 50, y: 50 } satisfies PercentPoint);
    const imagePoint =
      overrideImagePercent !== undefined
        ? imagePercentToImagePoint(imagePercent, layer.imageMapping.imageDimensions)
        : (layer.orbitImagePoint ??
          imagePercentToImagePoint(imagePercent, layer.imageMapping.imageDimensions));

    const { imageDimensions } = layer.imageMapping;
    const imageCenter = {
      x: imageDimensions.width / 2,
      y: imageDimensions.height / 2,
    };

    let orbitPoint: Point2D = baseLinePoint;
    let newPosition = layer.position;
    let currentOrbitAngle = layer.currentOrbitAngle;
    let visibility = layer.visible;
    let rotationOverride: number | undefined;

    if (shouldUpdatePath && orbitRadius > 0) {
      let orbitAngle = 0;
      if (hasMotion) {
        const baseTime = timestamp ?? performance.now();
        if (startTime === undefined) {
          startTime = baseTime;
        }
        const elapsedSeconds = (baseTime - startTime) / 1000;

        // Calculate initial angle offset from orbitLinePoint position
        const initialAngle = normalizeAngle(
          (Math.atan2(-(baseLinePoint.y - baseStagePoint.y), baseLinePoint.x - baseStagePoint.x) *
            180) /
            Math.PI,
        );

        // Add initial angle to time-based rotation
        const timeBasedAngle = (elapsedSeconds * orbitSpeed) % 360;
        orbitAngle = normalizeAngle(
          initialAngle + applyRotationDirection(timeBasedAngle, orbitDirection),
        );
        orbitPoint = calculateOrbitPosition(baseStagePoint, orbitRadius, orbitAngle);
      } else {
        orbitPoint = baseLinePoint;
        orbitAngle = normalizeAngle(
          (Math.atan2(-(orbitPoint.y - baseStagePoint.y), orbitPoint.x - baseStagePoint.x) * 180) /
            Math.PI,
        );
      }

      currentOrbitAngle = orbitAngle;
      newPosition = {
        x: orbitPoint.x + (imageCenter.x - imagePoint.x),
        y: orbitPoint.y + (imageCenter.y - imagePoint.y),
      };

      const stageSize = stageCenterPoint.x * 2;
      visibility = calculateOrbitalVisibility(newPosition, imageDimensions, {
        min: 0,
        max: stageSize,
      });

      if (orient && !hasSpin && orbitRadius > 0) {
        const radiusAngle = normalizeAngle(
          (Math.atan2(-(orbitPoint.y - baseStagePoint.y), orbitPoint.x - baseStagePoint.x) * 180) /
            Math.PI,
        );
        const axisAngle = normalizeAngle(layer.imageMapping.displayAxisAngle ?? 0);
        const alignDelta = normalizeAngle(axisAngle - radiusAngle);
        const baseRotation = layer.rotation ?? 0;
        rotationOverride = normalizeAngle(baseRotation + alignDelta);
      }
    }

    const result: EnhancedLayerData = {
      ...layer,
      orbitPoint,
      orbitStagePoint: baseStagePoint,
      orbitLinePoint: baseLinePoint,
      orbitLineVisible: requestedLine,
      orbitImagePoint: imagePercent,
      orbitRadius,
      orbitSpeed,
      orbitDirection,
      orbitOrient: orient,
      hasOrbitalAnimation: hasMotion,
      orbitLineStyle: requestedLine
        ? {
            radius: orbitRadius,
            visible: true,
          }
        : undefined,
    } as EnhancedLayerData;

    if (shouldUpdatePath) {
      result.position = newPosition;
      result.visible = visibility;
      result.currentOrbitAngle = currentOrbitAngle;
    }

    if (rotationOverride !== undefined) {
      result.currentRotation = rotationOverride;
    }

    return result;
  };
}

function normalisePercent(value?: [number, number]): PercentPoint | undefined {
  if (!value || value.length < 2) return undefined;
  return {
    x: clampPercent(value[0]),
    y: clampPercent(value[1]),
  };
}

function normaliseStagePoint(value?: [number, number]): Point2D | undefined {
  if (!value || value.length < 2) return undefined;
  return {
    x: clampStage(value[0]),
    y: clampStage(value[1]),
  };
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clampStage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(2048, value));
}

export type OrbitCenterMarker = {
  type: "dot" | "crosshair";
  center: { x: number; y: number };
  size: number;
  color: string;
};

export type OrbitLineTrace = {
  center: { x: number; y: number };
  radius: number;
  points: Array<{ x: number; y: number }>;
  thickness: number;
  color: string;
  opacity: number;
};

export type OrbitRadiusLine = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
  color: string;
  opacity: number;
};

export type OrbitPointMarker = {
  type: "circle";
  position: { x: number; y: number };
  size: number;
  color: string;
};

export type OrbitalDebugVisuals = {
  centerMarker?: OrbitCenterMarker;
  lineTrace?: OrbitLineTrace;
  radiusLine?: OrbitRadiusLine;
  pointMarker?: OrbitPointMarker;
};

export type OrbitalDebugConfig = {
  showCenter?: boolean;
  showOrbitLine?: boolean;
  showRadiusLine?: boolean;
  showOrbitPoint?: boolean;
  centerStyle?: "dot" | "crosshair";
  colors?: {
    center?: string;
    orbitLine?: string;
    radiusLine?: string;
    orbitPoint?: string;
  };
};

const DEFAULT_DEBUG_CONFIG: Required<OrbitalDebugConfig> & {
  colors: { center: string; orbitLine: string; radiusLine: string; orbitPoint: string };
} = {
  showCenter: true,
  showOrbitLine: true,
  showRadiusLine: true,
  showOrbitPoint: true,
  centerStyle: "crosshair",
  colors: {
    center: "#FF0000",
    orbitLine: "#00FF00",
    radiusLine: "#FFFF00",
    orbitPoint: "#0000FF",
  },
};

export function generateOrbitCenterMarker(
  orbitCenter: [number, number],
  config?: Partial<OrbitalDebugConfig>,
): OrbitCenterMarker {
  const merged = { ...DEFAULT_DEBUG_CONFIG, ...config };
  const colors = { ...DEFAULT_DEBUG_CONFIG.colors, ...config?.colors };
  return {
    type: merged.centerStyle,
    center: { x: orbitCenter[0], y: orbitCenter[1] },
    size: merged.centerStyle === "dot" ? 6 : 15,
    color: colors.center,
  };
}

export function generateOrbitLineTrace(
  orbitCenter: [number, number],
  orbitRadius: number,
  config?: Partial<OrbitalDebugConfig>,
): OrbitLineTrace {
  const colors = { ...DEFAULT_DEBUG_CONFIG.colors, ...config?.colors };
  const segments = 64;
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = orbitCenter[0] + orbitRadius * Math.cos(angle);
    const y = orbitCenter[1] + orbitRadius * Math.sin(angle);
    points.push({ x, y });
  }
  return {
    center: { x: orbitCenter[0], y: orbitCenter[1] },
    radius: orbitRadius,
    points,
    thickness: 1,
    color: colors.orbitLine,
    opacity: 0.25,
  };
}

export function generateOrbitRadiusLine(
  orbitCenter: [number, number],
  orbitPoint: { x: number; y: number },
  config?: Partial<OrbitalDebugConfig>,
): OrbitRadiusLine {
  const colors = { ...DEFAULT_DEBUG_CONFIG.colors, ...config?.colors };
  return {
    start: { x: orbitCenter[0], y: orbitCenter[1] },
    end: orbitPoint,
    thickness: 1,
    color: colors.radiusLine,
    opacity: 0.35,
  };
}

export function generateOrbitPointMarker(
  orbitPoint: { x: number; y: number },
  config?: Partial<OrbitalDebugConfig>,
): OrbitPointMarker {
  const colors = { ...DEFAULT_DEBUG_CONFIG.colors, ...config?.colors };
  return {
    type: "circle",
    position: orbitPoint,
    size: 8,
    color: colors.orbitPoint,
  };
}

export function generateOrbitalDebugVisuals(
  orbitCenter: [number, number],
  orbitRadius: number,
  currentOrbitPoint: { x: number; y: number },
  config?: Partial<OrbitalDebugConfig>,
): OrbitalDebugVisuals {
  const merged = { ...DEFAULT_DEBUG_CONFIG, ...config };
  const visuals: OrbitalDebugVisuals = {};

  if (merged.showCenter) {
    visuals.centerMarker = generateOrbitCenterMarker(orbitCenter, config);
  }
  if (merged.showOrbitLine) {
    visuals.lineTrace = generateOrbitLineTrace(orbitCenter, orbitRadius, config);
  }
  if (merged.showRadiusLine) {
    visuals.radiusLine = generateOrbitRadiusLine(orbitCenter, currentOrbitPoint, config);
  }
  if (merged.showOrbitPoint) {
    visuals.pointMarker = generateOrbitPointMarker(currentOrbitPoint, config);
  }

  return visuals;
}
