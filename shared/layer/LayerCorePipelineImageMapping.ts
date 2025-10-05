export type ImageMapping = {
  imageCenter: { x: number; y: number };
  imageTip: { x: number; y: number };
  imageBase: { x: number; y: number };
  imageDimensions: { width: number; height: number };
  displayAxisAngle: number;
  displayRotation: number;
  axisCenterOffset: { x: number; y: number };
};

/**
 * Calculate image mapping (center, tip, base, axis angle, rotation)
 * @param imageDimensions - Width and height of the image
 * @param tipAngle - Angle in degrees where tip is located (default 90° = top)
 * @param baseAngle - Angle in degrees where base is located (default 270° = bottom)
 */
export function computeImageMapping(
  imageDimensions: { width: number; height: number },
  tipAngle: number = 90,
  baseAngle: number = 270,
): ImageMapping {
  const { width, height } = imageDimensions;

  // Image center is the geometric center
  const imageCenter = {
    x: width / 2,
    y: height / 2,
  };

  // Convert angles to radians
  // In image/screen coordinates: 0° is right, 90° is UP (top), 180° is left, 270° is down
  // Standard math has Y increasing upward, but screen Y increases downward
  // So we negate the angle to flip the Y-axis orientation
  const tipAngleRad = (-tipAngle * Math.PI) / 180;
  const baseAngleRad = (-baseAngle * Math.PI) / 180;

  // Calculate tip point at the edge of the actual image rectangle
  // Project from center to rectangle boundary at given angle
  const tipDx = Math.cos(tipAngleRad);
  const tipDy = Math.sin(tipAngleRad);

  // Find intersection with rectangle by checking which edge we hit first
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Calculate scaling factor to reach rectangle edge for tip
  const tipScaleX = tipDx !== 0 ? halfWidth / Math.abs(tipDx) : Infinity;
  const tipScaleY = tipDy !== 0 ? halfHeight / Math.abs(tipDy) : Infinity;
  const tipScale = Math.min(tipScaleX, tipScaleY);

  const imageTip = {
    x: imageCenter.x + tipScale * tipDx,
    y: imageCenter.y + tipScale * tipDy,
  };

  // Calculate base point independently at baseAngle from center
  const baseDx = Math.cos(baseAngleRad);
  const baseDy = Math.sin(baseAngleRad);

  const baseScaleX = baseDx !== 0 ? halfWidth / Math.abs(baseDx) : Infinity;
  const baseScaleY = baseDy !== 0 ? halfHeight / Math.abs(baseDy) : Infinity;
  const baseScale = Math.min(baseScaleX, baseScaleY);

  const imageBase = {
    x: imageCenter.x + baseScale * baseDx,
    y: imageCenter.y + baseScale * baseDy,
  };

  // Calculate display axis orientation
  // Vector from base to tip
  const axisDx = imageTip.x - imageBase.x;
  const axisDy = imageTip.y - imageBase.y;

  // Angle of base→tip line in degrees (0° = right, 90° = up, etc.)
  const displayAxisAngle = (Math.atan2(-axisDy, axisDx) * 180) / Math.PI;

  // Rotation needed to make axis point upward (90°)
  const displayRotation = 90 - displayAxisAngle;

  // Midpoint of base-tip axis
  const axisMidpoint = {
    x: (imageBase.x + imageTip.x) / 2,
    y: (imageBase.y + imageTip.y) / 2,
  };

  // Offset of geometric center from axis midpoint
  const axisCenterOffset = {
    x: imageCenter.x - axisMidpoint.x,
    y: imageCenter.y - axisMidpoint.y,
  };

  return {
    imageCenter,
    imageTip,
    imageBase,
    imageDimensions,
    displayAxisAngle,
    displayRotation,
    axisCenterOffset,
  };
}
