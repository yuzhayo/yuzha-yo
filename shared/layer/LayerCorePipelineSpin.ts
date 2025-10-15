import {
  imagePercentToImagePoint,
  imagePointToStagePoint,
  type PercentPoint,
  type UniversalLayerData,
} from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import { applyRotationDirection, normalizeAngle } from "./LayerCorePipeline";

export type SpinConfig = {
  spinCenter?: [number, number] | PercentPoint; // Runtime override: 0-100% relative to image dimensions
  spinSpeed?: number; // degrees per second (0 = no spin)
  spinDirection?: "cw" | "ccw";
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

  const overridePercent = normalisePercent(config.spinCenter);

  let startTime: number | undefined;

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    if (spinSpeed === 0) {
      return layer as EnhancedLayerData;
    }

    const currentTime = timestamp ?? performance.now();
    
    // Use elapsed time from start like orbit processor does
    if (startTime === undefined) {
      startTime = currentTime;
    }
    const elapsedSeconds = (currentTime - startTime) / 1000;

    // Calculate rotation from elapsed time
    let rotation = (elapsedSeconds * spinSpeed) % 360;

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
