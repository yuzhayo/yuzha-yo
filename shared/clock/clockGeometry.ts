/**
 * ============================================================================
 * CLOCK GEOMETRY UTILITIES - Stage & Image Math Helpers
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * Clock rendering requires repeated geometric calculations: converting
 * percentage pivots to pixel offsets, deriving orbit radius/angles, and
 * positioning images so their defined pivot aligns with the orbit point.
 * This file centralises that math so it stays consistent across the project.
 *
 * WHEN TO TOUCH THIS FILE:
 * ------------------------
 * - Adding new geometric behaviours (elliptical orbits, bezier paths, etc.)
 * - Tweaking the pivot anchoring logic
 * - Supporting non-uniform scaling or shearing (currently uniform scaling only)
 *
 * @module shared/clock/clockGeometry
 */

import type {
  ClockImageAsset,
  OrbitGeometry,
  SizePercent,
  SpinImagePointPercent,
  StageLine,
  StagePoint,
} from "./clockTypes";

/**
 * Calculate orbit radius and base angle from stagePoint/stageLine.
 */
export function computeOrbitGeometry(stagePoint: StagePoint, stageLine: StageLine): OrbitGeometry {
  const dx = stageLine.x - stagePoint.x;
  const dy = stageLine.y - stagePoint.y;
  const radius = Math.hypot(dx, dy);
  const baseAngleDegrees = radius > 0 ? (Math.atan2(dy, dx) * 180) / Math.PI : 0;
  return {
    radius,
    baseAngleDegrees,
  };
}

/**
 * Convert additional orbital rotation into an absolute stage coordinate.
 */
export function calculateOrbitPivot(
  stagePoint: StagePoint,
  geometry: OrbitGeometry,
  additionalDegrees: number,
): StagePoint {
  const angleDegrees = geometry.baseAngleDegrees + additionalDegrees;
  const angleRad = (angleDegrees * Math.PI) / 180;
  const x = stagePoint.x + geometry.radius * Math.cos(angleRad);
  const y = stagePoint.y + geometry.radius * Math.sin(angleRad);
  return { x, y };
}

/**
 * Determine rendered dimensions of an image given size percent.
 */
export function calculateImageSize(
  image: ClockImageAsset,
  sizePercent: SizePercent,
): { width: number; height: number; scaleX: number; scaleY: number } {
  const scaleX = sizePercent.x / 100;
  const scaleY = sizePercent.y / 100;
  return {
    width: image.width * scaleX,
    height: image.height * scaleY,
    scaleX,
    scaleY,
  };
}

/**
 * Convert pivot percentages into pixel offsets relative to rendered dimensions.
 */
export function calculatePivotOffset(
  dimensions: { width: number; height: number },
  pivotPercent: SpinImagePointPercent,
): { offsetX: number; offsetY: number } {
  const offsetX = (pivotPercent.xPercent / 100) * dimensions.width;
  const offsetY = (pivotPercent.yPercent / 100) * dimensions.height;
  return { offsetX, offsetY };
}

/**
 * Determine top-left translation so the pivot aligns with the orbit position.
 */
export function calculateImageTranslation(
  pivotStage: StagePoint,
  dimensions: { width: number; height: number },
  pivotPercent: SpinImagePointPercent,
): { translateX: number; translateY: number } {
  const { offsetX, offsetY } = calculatePivotOffset(dimensions, pivotPercent);
  return {
    translateX: pivotStage.x - offsetX,
    translateY: pivotStage.y - offsetY,
  };
}
