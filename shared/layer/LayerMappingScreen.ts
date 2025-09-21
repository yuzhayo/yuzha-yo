import type { StageConfigNormalized, Vec2 } from "./LayerTypes";

/**
 * Konversi koordinat antara top-left dan center-based.
 * - toCenter : input top-left → output center-based
 * - toTopLeft: input center-based → output top-left
 * - center   : titik tengah dalam koordinat origin aktif
 * - bounds   : {w,h} stage
 */
export function createScreenMapping(stage: StageConfigNormalized) {
  const { width, height, origin } = stage;
  const half: Vec2 = { x: width / 2, y: height / 2 };

  const toCenter = (p: Vec2): Vec2 =>
    origin === "center" ? { ...p } : { x: p.x - half.x, y: p.y - half.y };

  const toTopLeft = (p: Vec2): Vec2 =>
    origin === "top-left" ? { ...p } : { x: p.x + half.x, y: p.y + half.y };

  const center = (): Vec2 =>
    origin === "center" ? { x: 0, y: 0 } : { ...half };

  const bounds = () => ({ w: width, h: height });

  return { toCenter, toTopLeft, center, bounds };
}

/**
 * Posisi default layer baru pada koordinat origin aktif.
 */
export function defaultPlacement(stage: StageConfigNormalized): Vec2 {
  return stage.origin === "center"
    ? { x: 0, y: 0 }
    : { x: stage.width / 2, y: stage.height / 2 };
}
