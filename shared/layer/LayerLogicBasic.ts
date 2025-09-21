import type {
  LayerConfigNormalized,
  StageConfigNormalized,
  Vec2,
} from "./LayerTypes";

export interface BasicTransform {
  position: Vec2;
  scale: Vec2;
  angle: number; // deg
  tilt: Vec2; // deg
  anchor: Vec2; // normalized [0..1]
  opacity: number; // 0..1
}

/**
 * Pass-through transform statis dari layer normalized.
 * (Validator sudah beri default; di sini cukup meneruskan.)
 */
export function applyBasicTransform(
  layer: LayerConfigNormalized,
  _stage: StageConfigNormalized,
): BasicTransform {
  return {
    position: { ...layer.position },
    scale: { ...layer.scale },
    angle: layer.angle,
    tilt: { ...layer.tilt },
    anchor: { ...layer.anchor },
    opacity: layer.opacity,
  };
}
