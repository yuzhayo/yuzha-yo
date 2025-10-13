import { imagePercentToImagePoint, type PercentPoint, type Point2D } from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import {
  applyRotationDirection,
  calculateOrbitPosition,
  calculateOrbitalVisibility,
  normalizeAngle,
} from "./LayerCoreAnimationUtils";

export type OrbitalConfig = {
  orbitStagePoint?: [number, number];
  orbitLinePoint?: [number, number];
  orbitImagePoint?: [number, number];
  orbitLine?: boolean;
  orbitOrient?: boolean;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
};

export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor {
  const overrideStagePoint = normaliseStagePoint(config.orbitStagePoint);
  const overrideLinePoint = normaliseStagePoint(config.orbitLinePoint);
  const overrideImagePercent = normalisePercent(config.orbitImagePoint);
  const overrideOrbitLine = config.orbitLine;
  const overrideOrient = config.orbitOrient;
  const orbitSpeed = config.orbitSpeed ?? 0;
  const orbitDirection = config.orbitDirection ?? "cw";
  const speedPerSecond = orbitSpeed;

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    const baseStagePoint = overrideStagePoint ??
      layer.orbitStagePoint ?? {
        x: layer.calculation.stageCenter.point.x,
        y: layer.calculation.stageCenter.point.y,
      };

    const baseLinePoint = overrideLinePoint ??
      layer.orbitLinePoint ?? { x: baseStagePoint.x, y: baseStagePoint.y };

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

    const currentTime = timestamp ?? performance.now();
    const elapsedSeconds = currentTime / 1000;
    let orbitAngle = orbitSpeed === 0 ? 0 : (elapsedSeconds * speedPerSecond) % 360;
    orbitAngle = applyRotationDirection(orbitAngle, orbitDirection);
    orbitAngle = normalizeAngle(orbitAngle);

    const orbitPoint = calculateOrbitPosition(baseStagePoint, orbitRadius, orbitAngle);

    const { imageDimensions } = layer.imageMapping;
    const imageCenter = {
      x: imageDimensions.width / 2,
      y: imageDimensions.height / 2,
    };

    const newPosition = {
      x: orbitPoint.x + (imageCenter.x - imagePoint.x),
      y: orbitPoint.y + (imageCenter.y - imagePoint.y),
    };

    const stageSize = layer.calculation.stageCenter.point.x * 2;
    const isVisible = calculateOrbitalVisibility(newPosition, imageDimensions, {
      min: 0,
      max: stageSize,
    });

    const orient = overrideOrient ?? layer.orbitOrient ?? false;
    const hasSpin = typeof layer.spinSpeed === "number" && layer.spinSpeed > 0;
    let currentRotation = layer.currentRotation;

    if (orient && !hasSpin && orbitRadius > 0) {
      const radiusAngle = normalizeAngle(
        (Math.atan2(-(orbitPoint.y - baseStagePoint.y), orbitPoint.x - baseStagePoint.x) * 180) /
          Math.PI,
      );
      const axisAngle = normalizeAngle(layer.imageMapping.displayAxisAngle ?? 0);
      const alignDelta = normalizeAngle(axisAngle - radiusAngle);
      const baseRotation = layer.rotation ?? 0;
      currentRotation = normalizeAngle(baseRotation + alignDelta);
    }

    return {
      ...layer,
      position: newPosition,
      orbitPoint,
      orbitStagePoint: baseStagePoint,
      orbitLinePoint: baseLinePoint,
      orbitLineVisible: overrideOrbitLine ?? layer.orbitLineVisible ?? false,
      orbitImagePoint: imagePercent,
      orbitRadius,
      orbitSpeed,
      orbitDirection,
      currentOrbitAngle: orbitAngle,
      currentRotation,
      orbitOrient: orient,
      hasOrbitalAnimation: orbitRadius > 0 || orbitSpeed !== 0,
      visible: isVisible,
      orbitLineStyle: {
        radius: orbitRadius,
        visible: overrideOrbitLine ?? layer.orbitLineVisible ?? false,
      },
    };
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
