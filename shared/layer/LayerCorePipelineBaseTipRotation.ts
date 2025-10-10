import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import { normalizeAngle } from "./LayerCoreAnimationUtils";

const loggedLayers = new Set<string>();

/**
 * BaseTip Rotation Processor
 *
 * Aligns the base→tip axis of an image with the orbit radius so the tip
 * always points outward from the orbit centre (clock-hand behaviour).
 *
 * Priority notes:
 * - Spin overrides BaseTip (when spinSpeed > 0)
 * - BaseTip only runs when orbital animation is active
 * - Basic rotation is ignored once this processor executes
 */
export function createBaseTipRotationProcessor(): LayerProcessor {
  return (layer: EnhancedLayerData): EnhancedLayerData => {
    // Spin animation retains control of rotation
    if (layer.spinSpeed && layer.spinSpeed > 0) {
      return layer;
    }

    // Require orbital animation metadata
    if (!layer.hasOrbitalAnimation || !layer.orbitRadius || layer.orbitRadius === 0) {
      return layer;
    }

    if (!layer.orbitPoint || !layer.orbitCenter) {
      console.warn(
        `[BaseTipRotation] Layer "${layer.layerId}": Missing orbitPoint or orbitCenter. ` +
          `Orbital processor must run before BaseTip processor.`,
      );
      return layer;
    }

    const rawAxisAngle = layer.imageMapping?.displayAxisAngle;
    if (rawAxisAngle === undefined || Number.isNaN(rawAxisAngle)) {
      console.warn(
        `[BaseTipRotation] Layer "${layer.layerId}": Missing displayAxisAngle from image mapping.`,
      );
      return layer;
    }

    const axisAngle = normalizeAngle(rawAxisAngle);

    const dx = layer.orbitPoint.x - layer.orbitCenter.x;
    const dy = layer.orbitPoint.y - layer.orbitCenter.y;
    if (dx === 0 && dy === 0) {
      return layer;
    }

    // Convert to same coordinate system as displayAxisAngle (0°=right, 90°=up)
    const radiusAngle = normalizeAngle((Math.atan2(-dy, dx) * 180) / Math.PI);

    const baseTipRotation = normalizeAngle(axisAngle - radiusAngle);

    if (import.meta.env.DEV && !loggedLayers.has(layer.layerId)) {
      console.debug("[BaseTipRotation] alignment", {
        layerId: layer.layerId,
        axisAngle,
        radiusAngle,
        rotation: baseTipRotation,
        orbitPoint: layer.orbitPoint,
        orbitCenter: layer.orbitCenter,
      });
      loggedLayers.add(layer.layerId);
    }

    return {
      ...layer,
      baseTipRotation,
      rotation: baseTipRotation,
    };
  };
}
