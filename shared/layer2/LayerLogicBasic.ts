import type { LayerConfigNormalized, StageConfigNormalized, Vec2 } from "./LayerTypes";
import { postProcessBasicTransform } from "./LayerLogicBasicScreenMapping";

export interface BasicTransform {
  position: Vec2;
  scale: Vec2;
  angle: number;
  tilt: Vec2;
  anchor: Vec2;
  opacity: number;
}

/**
 * Base transform yang stabil: pass-through dari layer normalized.
 * Hook tambahan bisa ditangani di child file lewat postProcessBasicTransform.
 */
export function applyBasicTransform(
  layer: LayerConfigNormalized,
  stage: StageConfigNormalized,
): BasicTransform {
  const base: BasicTransform = {
    position: { ...layer.position },
    scale: { ...layer.scale },
    angle: layer.angle,
    tilt: { ...layer.tilt },
    anchor: { ...layer.anchor },
    opacity: layer.opacity,
  };

  return postProcessBasicTransform(base, layer, stage);
}
