import {
  imagePercentToImagePoint,
  type PercentPoint,
  type Point2D,
  type UniversalLayerData,
} from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import {
  applyRotationDirection,
  calculateOrbitPosition,
  calculateAngleToPoint,
  calculateOrbitalVisibility,
  normalizeAngle,
} from "./LayerCoreAnimationUtils";

export type OrbitalConfig = {
  orbitCenter?: [number, number]; // Stage coords (0-2048)
  orbitImagePoint?: [number, number]; // Image coords (0-100%)
  orbitRadius?: number; // Pixels (0-2048)
  orbitSpeed?: number; // Degrees per second (0 = no orbit)
  orbitDirection?: "cw" | "ccw"; // Default "cw"
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

  if (orbitSpeed === 0 || orbitRadius === 0) {
    return (layer: UniversalLayerData): EnhancedLayerData => layer as EnhancedLayerData;
  }

  const overrideCenter = normaliseStagePoint(config.orbitCenter);
  const overrideImagePercent = normalisePercent(config.orbitImagePoint);

  // Cache speed per second
  const speedPerSecond = orbitSpeed;

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    const currentTime = timestamp ?? performance.now();

    // Calculate elapsed time in seconds from current timestamp
    const elapsedSeconds = currentTime / 1000;
    let orbitAngle = (elapsedSeconds * speedPerSecond) % 360;

    // Use utility functions
    orbitAngle = applyRotationDirection(orbitAngle, orbitDirection);
    orbitAngle = normalizeAngle(orbitAngle);

    // Cache stage size (calculated from pre-calculated value)
    const stageSize = layer.calculation.stageCenter.point.x * 2;

    // Use pre-calculated coordinates when possible
    const baseOrbitCenter = layer.calculation.orbitPoint.stage.point;
    const resolvedOrbitCenter: Point2D = overrideCenter ?? baseOrbitCenter;

    const baseOrbitImagePercent = layer.calculation.orbitPoint.image.percent;
    const resolvedOrbitImagePercent: PercentPoint = overrideImagePercent ?? baseOrbitImagePercent;

    const baseOrbitImagePoint = layer.calculation.orbitPoint.image.point;
    const resolvedOrbitImagePoint = overrideImagePercent
      ? imagePercentToImagePoint(resolvedOrbitImagePercent, layer.imageMapping.imageDimensions)
      : baseOrbitImagePoint;

    // Use utility function
    const orbitPoint = calculateOrbitPosition(resolvedOrbitCenter, orbitRadius, orbitAngle);

    // Cache image dimensions
    const { imageDimensions } = layer.imageMapping;
    const imageCenter = {
      x: imageDimensions.width / 2,
      y: imageDimensions.height / 2,
    };

    const newPosition = {
      x: orbitPoint.x + (imageCenter.x - resolvedOrbitImagePoint.x),
      y: orbitPoint.y + (imageCenter.y - resolvedOrbitImagePoint.y),
    };

    // Use utility function for visibility
    const isVisible = calculateOrbitalVisibility(newPosition, imageDimensions, {
      min: 0,
      max: stageSize,
    });

    let orbitRotation = 0;
    if (!layer.hasSpinAnimation) {
      // Use utility function
      orbitRotation = calculateAngleToPoint(resolvedOrbitCenter, orbitPoint) - 90;
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
      visible: isVisible,
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
