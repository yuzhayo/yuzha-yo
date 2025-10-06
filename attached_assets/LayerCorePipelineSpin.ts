import {
  imagePercentToImagePoint,
  imagePointToStagePoint,
  type PercentPoint,
  type UniversalLayerData,
} from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import {
  calculateElapsedTime,
  applyRotationDirection,
  normalizeAngle,
} from "./LayerCoreAnimationUtils";

export type SpinConfig = {
  spinCenter?: [number, number] | PercentPoint; // Runtime override: 0-100% relative to image dimensions
  spinSpeed?: number; // degrees per second (0 = no spin)
  spinDirection?: "cw" | "ccw";
  startTime?: number; // Optional animation start time (ms)
};

/**
 * Create a spin processor with the given configuration
 * spinCenter: [x, y] array or {x, y} object in 0-100% coordinates relative to image dimensions (runtime override only)
 * spinSpeed: degrees per second (0 = no spin, default = 0)
 * spinDirection: "cw" (clockwise) or "ccw" (counter-clockwise), default = "cw"
 *
 * Note: spinCenter is a runtime override for image percent only.
 * Base spin point is calculated in LayerCore from spinStagePoint and spinImagePoint config fields.
 */
export function createSpinProcessor(config: SpinConfig): LayerProcessor {
  const spinSpeed = config.spinSpeed ?? 0;
  const spinDirection = config.spinDirection ?? "cw";
  const configStartTime = config.startTime; // Read from config

  const overridePercent = normalisePercent(config.spinCenter);

  // Cache speed calculation
  const speedPerMs = spinSpeed / 1000; // degrees per millisecond

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    if (spinSpeed === 0) {
      return layer as EnhancedLayerData;
    }

    const currentTime = timestamp ?? performance.now();

    // Use utility function
    const { elapsed } = calculateElapsedTime(currentTime, configStartTime);

    // Use cached calculations
    let rotation = (elapsed * speedPerMs) % 360;

    // Use utility functions
    rotation = applyRotationDirection(rotation, spinDirection);
    rotation = normalizeAngle(rotation);

    // Cache dimension lookups
    const { imageDimensions } = layer.imageMapping;
    const resolvedPercent: PercentPoint =
      overridePercent ?? layer.calculation.spinPoint.image.percent;

    // Use pre-calculated values when possible
    const spinImagePoint = overridePercent
      ? imagePercentToImagePoint(resolvedPercent, imageDimensions)
      : layer.calculation.spinPoint.image.point;

    const spinStagePoint = overridePercent
      ? imagePointToStagePoint(spinImagePoint, imageDimensions, layer.scale, layer.position)
      : layer.calculation.spinPoint.stage.point;

    return {
      ...layer,
      spinCenter: spinImagePoint,
      spinSpeed,
      spinDirection,
      currentRotation: rotation,
      hasSpinAnimation: true,
      spinStagePoint,
      spinPercent: resolvedPercent,
    } as EnhancedLayerData;
  };
}

function normalisePercent(value?: [number, number] | PercentPoint): PercentPoint | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length < 2) return undefined;
    const [x, y] = value;
    if (typeof x !== "number" || typeof y !== "number") return undefined;
    return {
      x: clampPercent(x),
      y: clampPercent(y),
    };
  }
  return {
    x: clampPercent(value.x),
    y: clampPercent(value.y),
  };
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
