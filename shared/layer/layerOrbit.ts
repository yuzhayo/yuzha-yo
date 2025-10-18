/**
 * ============================================================================
 * LAYER ORBIT - Orbital Animation System
 * ============================================================================
 *
 * This module provides orbital motion functionality for layers. It allows
 * layers to move in circular paths around a center point with optional
 * orientation toward the center.
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This handles ORBITAL MOTION - layers moving in circles around a center point.
 * Use this for clock hands, orbiting elements, or any circular motion.
 *
 * RESPONSIBILITIES:
 * -----------------
 * 1. Orbital Configuration
 *    - orbitStagePoint: Center of orbit (stage pixels)
 *    - orbitLinePoint: Initial position on orbit (stage pixels)
 *    - orbitImagePoint: Which image point orbits (0-100%)
 *    - orbitLine: Show orbit path visualization
 *    - orbitOrient: Rotate to face orbit center
 *    - orbitSpeed: Rotation speed (degrees per second)
 *    - orbitDirection: "cw" or "ccw"
 *
 * 2. Orbital Processor
 *    - createOrbitalProcessor: Creates processor for orbital animation
 *    - Calculates position on orbit based on elapsed time
 *    - Handles orientation toward center (orbitOrient)
 *    - Manages visibility when orbiting off-stage
 *
 * 3. Coordinate Calculations
 *    - Orbit radius from orbitStagePoint to orbitLinePoint
 *    - Angle calculation from elapsed time
 *    - Position calculation on circular path
 *    - Visibility culling for off-stage positions
 *
 * HOW IT WORKS:
 * -------------
 * 1. Configuration specifies orbit center, initial position, speed
 * 2. Processor calculates radius and initial angle
 * 3. Each frame, angle updated based on elapsed time and speed
 * 4. Position calculated on circle at current angle
 * 5. Optional: rotation adjusted to face center (orbitOrient)
 * 6. Visibility toggled when position moves off-stage
 *
 * COORDINATE SYSTEMS:
 * -------------------
 * - orbitStagePoint: Center of orbit in stage space (pixels)
 * - orbitLinePoint: Position on orbit in stage space (pixels)
 * - orbitImagePoint: Which image point orbits (0-100%)
 * - Angle 0° = right, 90° = down (standard screen coordinates)
 *
 * USED BY:
 * --------
 * - layer.ts (registers orbital processor)
 * - StageCanvas/StageThree (renders orbiting layers)
 *
 * @module layer/layerOrbit
 */

import { imagePercentToImagePoint, type PercentPoint, type Point2D } from "./layerBasic";
import type { UniversalLayerData } from "./layerCore";
import {
  applyRotationDirection,
  calculateOrbitPosition,
  calculateOrbitalVisibility,
  normalizeAngle,
  type EnhancedLayerData,
  type LayerProcessor,
} from "./layer";

/**
 * Orbital configuration
 */
export type OrbitalConfig = {
  orbitStagePoint?: [number, number];
  orbitLinePoint?: [number, number];
  orbitImagePoint?: [number, number];
  orbitLine?: boolean;
  orbitOrient?: boolean;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
};

/**
 * Create orbital processor with the given configuration
 *
 * This processor handles circular motion around a center point with optional
 * orientation toward the center (like clock hands).
 *
 * @param config - Orbital configuration
 * @returns LayerProcessor that adds orbital animation
 */
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
      let timeBasedAngle = 0;
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
        timeBasedAngle = (elapsedSeconds * orbitSpeed) % 360;
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

      if (orient && !hasSpin && hasMotion && orbitRadius > 0) {
        // Use timeBasedAngle (same for all pieces) instead of radiusAngle (different per piece)
        // This ensures all pieces in a tiled background rotate together by the same amount
        const rotationDelta = applyRotationDirection(timeBasedAngle, orbitDirection);
        const baseRotation = layer.rotation ?? 0;
        rotationOverride = normalizeAngle(baseRotation + rotationDelta);
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
      // Only override position when orbital motion is active
      if (hasMotion) {
        result.position = newPosition;
        result.visible = visibility;
      }
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
