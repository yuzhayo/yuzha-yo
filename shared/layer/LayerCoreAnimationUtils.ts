/**
 * Animation Utilities
 * Shared functions for animation processors and rendering engines
 */

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate elapsed time with optional start time
 */
export function calculateElapsedTime(
  timestamp: number,
  startTime?: number,
): { elapsed: number; effectiveStartTime: number } {
  const effectiveStartTime = startTime ?? timestamp;
  const elapsed = timestamp - effectiveStartTime;
  return { elapsed, effectiveStartTime };
}

/**
 * Apply rotation direction multiplier
 */
export function applyRotationDirection(angle: number, direction: "cw" | "ccw"): number {
  return direction === "ccw" ? -angle : angle;
}

/**
 * Calculate position on circular orbit
 */
export function calculateOrbitPosition(
  center: { x: number; y: number },
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleRad = degreesToRadians(angleInDegrees);
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
  };
}

/**
 * Calculate angle from center to point
 */
export function calculateAngleToPoint(
  center: { x: number; y: number },
  point: { x: number; y: number },
): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return radiansToDegrees(Math.atan2(dy, dx));
}

/**
 * Check if point is within bounds
 */
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: { min: number; max: number },
  margin: number = 0,
): boolean {
  return (
    point.x >= bounds.min - margin &&
    point.x <= bounds.max + margin &&
    point.y >= bounds.min - margin &&
    point.y <= bounds.max + margin
  );
}

/**
 * Calculate visibility for orbital animations
 */
export function calculateOrbitalVisibility(
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  stageBounds: { min: number; max: number },
): boolean {
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  return !(
    position.x + halfWidth < stageBounds.min ||
    position.x - halfWidth > stageBounds.max ||
    position.y + halfHeight < stageBounds.min ||
    position.y - halfHeight > stageBounds.max
  );
}

/**
 * Smooth animation easing (optional)
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Frame rate calculation helper
 */
export class FrameRateTracker {
  private frameTimes: number[] = [];
  private maxSamples: number = 60;

  addFrame(timestamp: number): void {
    this.frameTimes.push(timestamp);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  getCurrentFPS(): number {
    if (this.frameTimes.length < 2) return 0;

    const lastTime = this.frameTimes[this.frameTimes.length - 1];
    const firstTime = this.frameTimes[0];

    if (lastTime === undefined || firstTime === undefined) return 0;

    const timeSpan = lastTime - firstTime;
    const frameCount = this.frameTimes.length - 1;

    return Math.round((frameCount / timeSpan) * 1000);
  }

  reset(): void {
    this.frameTimes = [];
  }
}
