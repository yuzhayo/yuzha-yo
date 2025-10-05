import {
  imagePercentToImagePoint,
  type PercentPoint,
  type Point2D,
  type UniversalLayerData,
} from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";

export type OrbitalConfig = {
  orbitCenter?: [number, number]; // Stage coords (0-2048)
  orbitImagePoint?: [number, number]; // Image coords (0-100%)
  orbitRadius?: number; // Pixels (0-2048)
  orbitSpeed?: number; // Degrees per second (0 = no orbit)
  orbitDirection?: "cw" | "ccw"; // Default "cw"
  startTime?: number; // Optional animation start time (ms)
};

/**
 * Create an orbital processor with the given configuration
 * orbitCenter: [x, y] center point on stage (0-2048)
 * orbitImagePoint: [x, y] point on image that follows orbit (0-100%)
 * orbitRadius: radius of orbit in pixels (0-2048)
 * orbitSpeed: degrees per second (0 = no orbit, default = 0)
 * orbitDirection: "cw" (clockwise) or "ccw" (counter-clockwise), default = "cw"
 */
export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor {
  const orbitRadius = config.orbitRadius ?? 0;
  const orbitSpeed = config.orbitSpeed ?? 0;
  const orbitDirection = config.orbitDirection ?? "cw";
  const configStartTime = config.startTime; // Read from config

  if (orbitSpeed === 0 || orbitRadius === 0) {
    return (layer: UniversalLayerData): EnhancedLayerData => layer as EnhancedLayerData;
  }

  const overrideCenter = normaliseStagePoint(config.orbitCenter);
  const overrideImagePercent = normalisePercent(config.orbitImagePoint);

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    const currentTime = timestamp ?? performance.now();
    const startTime = configStartTime ?? currentTime; // Use config or current

    const elapsed = (currentTime - startTime) / 1000;
    let orbitAngle = (elapsed * orbitSpeed) % 360;
    if (orbitDirection === "ccw") {
      orbitAngle = -orbitAngle;
    }

    const stageSize = layer.calculation.stageCenter.point.x * 2;

    const baseOrbitCenter = layer.calculation.orbitPoint.stage.point;
    const resolvedOrbitCenter: Point2D = overrideCenter ?? baseOrbitCenter;

    const baseOrbitImagePercent = layer.calculation.orbitPoint.image.percent;
    const resolvedOrbitImagePercent: PercentPoint = overrideImagePercent ?? baseOrbitImagePercent;

    const baseOrbitImagePoint = layer.calculation.orbitPoint.image.point;
    const resolvedOrbitImagePoint = overrideImagePercent
      ? imagePercentToImagePoint(resolvedOrbitImagePercent, layer.imageMapping.imageDimensions)
      : baseOrbitImagePoint;

    const orbitAngleRad = (orbitAngle * Math.PI) / 180;
    const orbitPoint = {
      x: resolvedOrbitCenter.x + orbitRadius * Math.cos(orbitAngleRad),
      y: resolvedOrbitCenter.y + orbitRadius * Math.sin(orbitAngleRad),
    };

    const imageCenter = {
      x: layer.imageMapping.imageDimensions.width / 2,
      y: layer.imageMapping.imageDimensions.height / 2,
    };

    const newPosition = {
      x: orbitPoint.x + (imageCenter.x - resolvedOrbitImagePoint.x),
      y: orbitPoint.y + (imageCenter.y - resolvedOrbitImagePoint.y),
    };

    const halfWidth = layer.imageMapping.imageDimensions.width / 2;
    const halfHeight = layer.imageMapping.imageDimensions.height / 2;
    const isOffScreen =
      newPosition.x + halfWidth < 0 ||
      newPosition.x - halfWidth > stageSize ||
      newPosition.y + halfHeight < 0 ||
      newPosition.y - halfHeight > stageSize;

    let orbitRotation = 0;
    if (!layer.hasSpinAnimation) {
      const dx = orbitPoint.x - resolvedOrbitCenter.x;
      const dy = orbitPoint.y - resolvedOrbitCenter.y;
      const outwardAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      orbitRotation = outwardAngle - 90;
    }

    return {
      ...layer,
      position: newPosition,
      orbitCenter: resolvedOrbitCenter,
      orbitImagePoint: resolvedOrbitImagePercent,
      orbitRadius,
      orbitSpeed,
      orbitDirection,
      currentOrbitAngle: orbitAngle,
      orbitRotation,
      hasOrbitalAnimation: true,
      visible: !isOffScreen,
    };
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
