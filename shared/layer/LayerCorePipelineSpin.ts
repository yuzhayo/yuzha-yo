import {
  imagePercentToImagePoint,
  imagePointToStagePoint,
  type PercentPoint,
  type Point2D,
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

    // CRITICAL FIX: Recalculate position to keep spinImagePoint anchored at spinStagePoint during rotation
    // The image rotates around the pivot point (spinImagePoint), which must stay at spinStagePoint
    // We need to adjust the layer position so that after rotation, spinImagePoint ends up at spinStagePoint
    const newPosition = calculatePositionForSpinPivot(
      spinStagePoint,
      resolvedPercent,
      imageDimensions,
      layer.scale,
      rotation,
    );

    return {
      ...layer,
      position: newPosition, // Update position to maintain pivot anchor
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

/**
 * Calculate layer position such that spinImagePoint stays anchored at spinStagePoint during rotation.
 * This ensures the image rotates around the correct pivot point in stage space.
 *
 * @param spinStagePoint - The fixed point on stage where spinImagePoint should be anchored
 * @param spinImagePercent - The point on image (0-100%) that should be at spinStagePoint
 * @param imageDimensions - Image width and height
 * @param scale - Scale factors
 * @param rotation - Current rotation angle in degrees
 * @returns Position where image center should be placed for rendering
 */
function calculatePositionForSpinPivot(
  spinStagePoint: Point2D,
  spinImagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  rotation: number,
): Point2D {
  // Convert percent to image pixels (in unrotated space)
  const spinImagePointPixels: Point2D = {
    x: (spinImagePercent.x / 100) * imageDimensions.width,
    y: (spinImagePercent.y / 100) * imageDimensions.height,
  };

  // Image center in pixels
  const imageCenter: Point2D = {
    x: imageDimensions.width / 2,
    y: imageDimensions.height / 2,
  };

  // Offset from center to spin pivot point (in pixels, unrotated)
  const offsetFromCenter: Point2D = {
    x: spinImagePointPixels.x - imageCenter.x,
    y: spinImagePointPixels.y - imageCenter.y,
  };

  // Apply scale to offset
  const scaledOffset: Point2D = {
    x: offsetFromCenter.x * scale.x,
    y: offsetFromCenter.y * scale.y,
  };

  // Rotate the scaled offset by the current rotation
  const rotationRad = rotation * (Math.PI / 180);
  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);

  const rotatedOffset: Point2D = {
    x: scaledOffset.x * cosR - scaledOffset.y * sinR,
    y: scaledOffset.x * sinR + scaledOffset.y * cosR,
  };

  // Calculate position: spinStagePoint - rotatedOffset
  // This ensures when rendering engines place image center at position and apply rotation,
  // the spin pivot point ends up exactly at spinStagePoint
  const position: Point2D = {
    x: spinStagePoint.x - rotatedOffset.x,
    y: spinStagePoint.y - rotatedOffset.y,
  };

  return validatePoint(position);
}

function validatePoint(point: Point2D): Point2D {
  const x = Number.isFinite(point.x) ? point.x : 0;
  const y = Number.isFinite(point.y) ? point.y : 0;
  return { x, y };
}
