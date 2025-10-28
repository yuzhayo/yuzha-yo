/**
 * ============================================================================
 * LAYER SPIN - Spin Animation System
 * ============================================================================
 *
 * This module provides spin animation functionality for layers. It allows
 * layers to rotate around a pivot point at constant angular velocity.
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This handles SPIN ANIMATION - rotating layers around a fixed pivot point.
 * Use this when you need layers to rotate continuously (like spinning gears,
 * rotating clocks, or any rotating UI element).
 *
 * RESPONSIBILITIES:
 * -----------------
 * 1. Spin Configuration
 *    - spinCenter: Override pivot point (0-100% in image space)
 *    - spinSpeed: Rotation speed in ROTATIONS PER HOUR
 *    - spinDirection: "cw" (clockwise) or "ccw" (counter-clockwise)
 *
 * 2. Spin Processor
 *    - createSpinProcessor: Creates processor that adds spin animation
 *    - Calculates rotation based on elapsed time
 *    - Maintains pivot point position during rotation
 *
 * 3. Pivot-Based Rotation
 *    - Ensures image rotates around correct pivot point
 *    - Recalculates position to keep pivot anchored at spinStagePoint
 *    - Uses rotation matrices for precise transformation
 *
 * HOW IT WORKS:
 * -------------
 * 1. Configuration specifies spin parameters (speed, direction, center)
 * 2. Base spin point calculated in layerCore from spinStagePoint/spinImagePoint
 * 3. Processor calculates rotation angle from elapsed time using the formula:
 *    angle = elapsedSeconds × spinSpeed × 0.1
 *    where spinSpeed is in rotations per hour (1 = 1 full rotation in 1 hour)
 * 4. Position adjusted to maintain pivot at spinStagePoint during rotation
 * 5. Renderer applies rotation around pivot point
 *
 * SPEED SYSTEM (UPDATED):
 * -----------------------
 * - spinSpeed is measured in ROTATIONS PER HOUR (not degrees/second)
 * - spinSpeed = 1.0 → 1 complete rotation (360°) in 1 hour (3600 seconds)
 * - spinSpeed = 2.0 → 2 complete rotations in 1 hour (faster)
 * - spinSpeed = 0.5 → 0.5 rotations (180°) in 1 hour (slower)
 * - LOW VALUE = SLOW SPEED, HIGH VALUE = FAST SPEED
 * - Formula: angle = (elapsedSeconds / 3600) × spinSpeed × 360
 *            Simplified: angle = elapsedSeconds × spinSpeed × 0.1
 * - Conversion factor: 0.1 = 360° / 3600 seconds
 *
 * COORDINATE SYSTEMS:
 * -------------------
 * - spinImagePoint: Point on image to use as pivot (0-100%)
 * - spinStagePoint: Where pivot should be anchored on stage (pixels)
 * - During rotation, spinImagePoint must stay at spinStagePoint
 *
 * USED BY:
 * --------
 * - layer.ts (registers spin processor)
 * - StageCanvas/StageThree (renders rotated layers)
 *
 * @module layer/layerSpin
 */

import {
  imagePercentToImagePoint,
  imagePointToStagePoint,
  validatePoint,
  normalizePercent,
  type PercentPoint,
  type Point2D,
} from "./layerBasic";
import type { UniversalLayerData } from "./layerCore";
import { normalizeAngle, type EnhancedLayerData, type LayerProcessor } from "./layer";
import { calculateRotationDegrees, resolveClockSpeed, type ClockMotionConfig } from "./clockTime";

import type { ClockSpeedAlias, TimeFormat } from "./clockTime";

/**
 * Spin configuration
 *
 * FOR FUTURE AI AGENTS: Speed Unit System
 * ----------------------------------------
 * spinSpeed is measured in ROTATIONS PER HOUR:
 * - spinSpeed = 1.0 → 1 full rotation (360°) in 1 hour
 * - spinSpeed = 2.0 → 2 rotations in 1 hour (faster)
 * - spinSpeed = 0.5 → half rotation in 1 hour (slower)
 * - Low value = slow speed, High value = fast speed
 */
export type SpinConfig = {
  spinCenter?: [number, number] | PercentPoint; // Runtime override: 0-100% relative to image dimensions
  spinSpeed?: number; // rotations per hour (0 = no spin, 1 = 1 full rotation in 1 hour)
  spinDirection?: "cw" | "ccw";
  spinSpeedAlias?: ClockSpeedAlias;
  spinFormat?: TimeFormat;
  spinTimezone?: string;
};

/**
 * Create a spin processor with the given configuration
 *
 * FOR FUTURE AI AGENTS: Speed Calculation Formula
 * ------------------------------------------------
 * The rotation angle is calculated using:
 *   angle = elapsedSeconds × spinSpeed × 0.1
 *
 * Where:
 *   - elapsedSeconds: Time elapsed since animation start
 *   - spinSpeed: Rotations per hour (1 = 1 full rotation in 1 hour)
 *   - 0.1: Conversion factor (360° / 3600 seconds = 0.1°/second per rotation/hour)
 *
 * Example:
 *   - spinSpeed = 1, elapsed = 3600s (1 hour) → angle = 3600 × 1 × 0.1 = 360° (1 full rotation)
 *   - spinSpeed = 2, elapsed = 1800s (30 min) → angle = 1800 × 2 × 0.1 = 360° (1 full rotation)
 *   - spinSpeed = 0.5, elapsed = 3600s → angle = 3600 × 0.5 × 0.1 = 180° (half rotation)
 *
 * Configuration:
 *   - spinCenter: [x, y] array or {x, y} object in 0-100% coordinates relative to image dimensions (runtime override only)
 *   - spinSpeed: rotations per hour (0 = no spin, default = 0)
 *   - spinDirection: "cw" (clockwise) or "ccw" (counter-clockwise), default = "cw"
 *
 * Note: spinCenter is a runtime override for image percent only.
 * Base spin point is calculated in LayerCore from spinStagePoint and spinImagePoint config fields.
 */
export function createSpinProcessor(config: SpinConfig): LayerProcessor {
  /**
   * NOTE FOR FUTURE AI AGENTS:
   * This processor now supports both numeric speeds and clock-based aliases.
   * The resolver below converts any config (numeric or alias) into a unified
   * runtime object so the animation loop can remain single-path.
   */
  const motion: ClockMotionConfig = {
    speed: config.spinSpeedAlias ?? config.spinSpeed,
    direction: config.spinDirection,
    format: config.spinFormat,
    timezone: config.spinTimezone,
  };
  const resolvedSpeed = resolveClockSpeed(motion, 0, config.spinSpeed ?? 0);
  const hasAnimation = resolvedSpeed.kind !== "static";

  const overridePercent = normalisePercent(config.spinCenter);
  const timezoneCache = new Map<number, Date>();
  let startPerfTime: number | undefined;
  let startWallClockMs: number | undefined;

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    if (!hasAnimation) {
      return layer as EnhancedLayerData;
    }

    const perfNow = timestamp ?? performance.now();

    if (startPerfTime === undefined) {
      startPerfTime = perfNow;
      startWallClockMs = Date.now();
    }

    const baseNowMs =
      startWallClockMs !== undefined && startPerfTime !== undefined
        ? startWallClockMs + (perfNow - startPerfTime)
        : Date.now();

    const rotation = normalizeAngle(
      calculateRotationDegrees(resolvedSpeed, new Date(baseNowMs), timezoneCache, startWallClockMs),
    );

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
      spinSpeed:
        config.spinSpeed ?? (resolvedSpeed.kind === "numeric" ? resolvedSpeed.rotationsPerHour : 0),
      spinSpeedAlias:
        config.spinSpeedAlias ?? (resolvedSpeed.kind === "alias" ? resolvedSpeed.alias : undefined),
      spinFormat: config.spinFormat,
      spinTimezone: config.spinTimezone,
      spinDirection: config.spinDirection ?? "cw",
      currentRotation: rotation,
      hasSpinAnimation: true,
      spinStagePoint,
      spinPercent: resolvedPercent,
    } as EnhancedLayerData;
  };
}

/**
 * Normalize percent value for spin configuration
 *
 * FOR FUTURE AI AGENTS: Updated to use normalizePercent() from layerBasic
 * to support extended coordinate range (negative values and >100%).
 * This allows spin pivots to be placed outside image bounds.
 *
 * @param value - Percent value as array or object
 * @returns Normalized PercentPoint or undefined
 */
function normalisePercent(value?: [number, number] | PercentPoint): PercentPoint | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length < 2) return undefined;
    const [x, y] = value;
    if (typeof x !== "number" || typeof y !== "number") return undefined;
    return {
      x: normalizePercent(x),
      y: normalizePercent(y),
    };
  }
  return {
    x: normalizePercent(value.x),
    y: normalizePercent(value.y),
  };
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
