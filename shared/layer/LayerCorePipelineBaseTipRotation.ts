import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import type { Point2D } from "./LayerCore";
import { normalizeAngle } from "./LayerCoreAnimationUtils";

/**
 * BaseTip Rotation Processor
 * 
 * Implements radial clock-hand alignment for orbital motion.
 * Makes imageTip ALWAYS point OUTWARD from orbit center.
 * 
 * Key Concept:
 * Three points must be collinear:
 * orbitCenter → midpoint(base,tip) → imageTip (pointing outward)
 * 
 * Priority:
 * - Spin overrides BaseTip (when spinSpeed > 0)
 * - BaseTip only active when orbital is active
 * - BaseTip ignores BasicAngleImage rotation
 */

/**
 * Create a BaseTip rotation processor
 * No config needed - uses layer's imageTip and imageBase angles
 */
export function createBaseTipRotationProcessor(): LayerProcessor {
  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    // RULE 1: Spin overrides everything
    if (layer.spinSpeed && layer.spinSpeed > 0) {
      return layer; // Early exit - spin controls rotation
    }

    // RULE 2: Orbital must be active
    if (!layer.hasOrbitalAnimation || !layer.orbitRadius || layer.orbitRadius === 0) {
      return layer; // No orbital, no base-tip rotation
    }

    // RULE 3: Need orbitPoint from orbital processor
    if (!layer.orbitPoint || !layer.orbitCenter) {
      console.warn(
        `[BaseTipRotation] Layer "${layer.layerId}": Missing orbitPoint or orbitCenter. ` +
        `Orbital processor must run before BaseTip processor.`
      );
      return layer;
    }

    // Get imageTip and imageBase angles (defaults: 90°, 270°)
    const imageTipAngle = layer.imageTip ?? 90;
    const imageBaseAngle = layer.imageBase ?? 270;

    // EDGE CASE 1: Check if angles are too close (within 1° tolerance)
    const angleDiff = Math.abs(normalizeAngle(imageTipAngle - imageBaseAngle));
    if (angleDiff < 1 || Math.abs(angleDiff - 180) < 1) {
      if (angleDiff < 1) {
        console.warn(
          `[BaseTipRotation] Layer "${layer.layerId}": imageTip (${imageTipAngle}°) ` +
          `and imageBase (${imageBaseAngle}°) are too close. Using zero rotation.`
        );
      }
      return {
        ...layer,
        baseTipRotation: 0,
        rotation: layer.rotation || 0,
      };
    }

    // Get image dimensions and center
    const { width, height } = layer.imageMapping.imageDimensions;
    const imageCenter = layer.imageMapping.imageCenter;

    // Calculate tip and base positions in image space
    const tipPos = projectAngleToImageBoundary(imageTipAngle, imageCenter, { width, height });
    const basePos = projectAngleToImageBoundary(imageBaseAngle, imageCenter, { width, height });

    // Calculate midpoint between tip and base
    const midpoint = {
      x: (tipPos.x + basePos.x) / 2,
      y: (tipPos.y + basePos.y) / 2,
    };

    // Calculate axis angle (base→tip direction in image space)
    let axisAngle = Math.atan2(
      tipPos.y - basePos.y,
      tipPos.x - basePos.x
    ) * (180 / Math.PI);
    axisAngle = normalizeAngle(axisAngle);

    // Calculate radius angle (center→orbit position in stage space)
    let radiusAngle = Math.atan2(
      layer.orbitPoint.y - layer.orbitCenter.y,
      layer.orbitPoint.x - layer.orbitCenter.x
    ) * (180 / Math.PI);
    radiusAngle = normalizeAngle(radiusAngle);

    // Calculate rotation to align axis with radius
    // This makes imageTip point outward from orbit center
    const baseTipRotation = normalizeAngle(radiusAngle - axisAngle);

    return {
      ...layer,
      baseTipRotation,
      rotation: baseTipRotation, // Override rotation field
    };
  };
}

/**
 * Project an angle from image center to image boundary
 * 
 * @param angle - Angle in degrees (0° = right, 90° = top, 180° = left, 270° = bottom)
 * @param center - Image center point
 * @param dimensions - Image width and height
 * @returns Point on image boundary at the given angle
 */
function projectAngleToImageBoundary(
  angle: number,
  center: Point2D,
  dimensions: { width: number; height: number }
): Point2D {
  const angleRad = angle * (Math.PI / 180);
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  // Handle edge case: angle pointing at edge (dx or dy is 0)
  if (Math.abs(dx) < 0.0001) {
    // Pointing straight up or down
    return {
      x: center.x,
      y: dy > 0 ? dimensions.height : 0,
    };
  }
  if (Math.abs(dy) < 0.0001) {
    // Pointing straight left or right
    return {
      x: dx > 0 ? dimensions.width : 0,
      y: center.y,
    };
  }

  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  // Calculate distance to boundary in each direction
  const tX = Math.abs(halfWidth / dx);
  const tY = Math.abs(halfHeight / dy);

  // Use smaller distance (hits boundary first)
  const t = Math.min(tX, tY);

  return {
    x: center.x + dx * t,
    y: center.y + dy * t,
  };
}
