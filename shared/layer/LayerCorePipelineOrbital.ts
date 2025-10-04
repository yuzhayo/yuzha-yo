import type { UniversalLayerData } from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";

export type OrbitalConfig = {
  orbitCenter?: [number, number]; // Stage coords (0-2048), default [1024, 1024]
  orbitImagePoint?: [number, number]; // Image coords (0-100%), default [50, 50]
  orbitRadius?: number; // Pixels (0-2048)
  orbitSpeed?: number; // Degrees per second, 0 = no orbit
  orbitDirection?: "cw" | "ccw"; // Default "cw"
};

const STAGE_SIZE = 2048;
const STAGE_CENTER = 1024;

/**
 * Create an orbital processor with the given configuration
 * orbitCenter: [x, y] center point on stage (0-2048), default = [1024, 1024]
 * orbitImagePoint: [x, y] point on image that follows orbit (0-100%), default = [50, 50]
 * orbitRadius: radius of orbit in pixels (0-2048)
 * orbitSpeed: degrees per second (0 = no orbit, default = 0)
 * orbitDirection: "cw" (clockwise) or "ccw" (counter-clockwise), default = "cw"
 */
export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor {
  // Extract config with defaults
  const orbitCenter = config.orbitCenter ?? [STAGE_CENTER, STAGE_CENTER];
  const orbitImagePoint = config.orbitImagePoint ?? [50, 50];
  const orbitRadius = config.orbitRadius ?? 0;
  const orbitSpeed = config.orbitSpeed ?? 0;
  const orbitDirection = config.orbitDirection ?? "cw";

  // If no orbital motion, return passthrough processor
  if (orbitSpeed === 0 || orbitRadius === 0) {
    return (layer: UniversalLayerData): EnhancedLayerData => layer as EnhancedLayerData;
  }

  // Track start time for this processor instance
  let startTime: number | null = null;

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    // Initialize start time on first call
    const currentTime = timestamp ?? performance.now();
    if (startTime === null) {
      startTime = currentTime;
    }

    // Calculate orbital angle based on elapsed time
    const elapsed = (currentTime - startTime) / 1000; // Convert to seconds
    let orbitAngle = (elapsed * orbitSpeed) % 360;
    if (orbitDirection === "ccw") {
      orbitAngle = -orbitAngle;
    }

    // Convert angle to radians for trigonometry
    const orbitAngleRad = (orbitAngle * Math.PI) / 180;

    // Calculate orbitPoint position on stage
    const orbitPoint = {
      x: orbitCenter[0] + orbitRadius * Math.cos(orbitAngleRad),
      y: orbitCenter[1] + orbitRadius * Math.sin(orbitAngleRad),
    };

    // Convert orbitImagePoint from percentage to pixels
    const { width, height } = layer.imageMapping.imageDimensions;
    const orbitImagePointPixels = {
      x: (orbitImagePoint[0] / 100) * width,
      y: (orbitImagePoint[1] / 100) * height,
    };

    // Calculate new image position so orbitImagePoint is at orbitPoint
    const newPosition = {
      x: orbitPoint.x - orbitImagePointPixels.x,
      y: orbitPoint.y - orbitImagePointPixels.y,
    };

    // Off-screen culling: Check if object is completely outside stage bounds
    const isOffScreen =
      newPosition.x + width < 0 || // Completely left of stage
      newPosition.x > STAGE_SIZE || // Completely right of stage
      newPosition.y + height < 0 || // Completely above stage
      newPosition.y > STAGE_SIZE; // Completely below stage

    // Handle static image rotation (if no spin animation)
    let orbitRotation = 0;
    if (!layer.hasSpinAnimation) {
      // Calculate angle from orbitCenter to orbitPoint (outward direction)
      const dx = orbitPoint.x - orbitCenter[0];
      const dy = orbitPoint.y - orbitCenter[1];
      const outwardAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Rotate so imageTip points in outward direction
      // imageTip default is 90° (pointing up), so we adjust from there
      orbitRotation = outwardAngle - 90;
    }

    return {
      ...layer,
      position: newPosition,
      orbitCenter: { x: orbitCenter[0], y: orbitCenter[1] },
      orbitImagePoint: { x: orbitImagePoint[0], y: orbitImagePoint[1] },
      orbitRadius,
      orbitSpeed,
      orbitDirection,
      currentOrbitAngle: orbitAngle,
      orbitRotation,
      hasOrbitalAnimation: true,
      visible: !isOffScreen, // Mark as invisible if off-screen
    };
  };
}
