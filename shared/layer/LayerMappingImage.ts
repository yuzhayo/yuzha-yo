import type { AssetMeta, Vec2, FitMode, Alignment } from "./LayerTypes";

export interface ContainerSpec {
  width?: number;
  height?: number;
  fitMode: FitMode; // required jika container ada
  alignment: Alignment; // required jika container ada
}

export interface ImageMappingResult {
  displayWidth: number;
  displayHeight: number;
  offset: Vec2; // relatif center container
  anchor: Vec2; // asset.anchor ?? anchor argumen (pass-through)
}

/**
 * Map ukuran image ke dalam container (origin center-based).
 * - container undefined → ukuran asli, offset (0,0)
 * - asset dimensi invalid & container ada → 0×0, offset (0,0)
 * - container w/h tidak lengkap → 0×0 (fail-safe)
 */
export function mapImageIntoContainer(
  asset: AssetMeta,
  container: ContainerSpec | undefined,
  anchor: Vec2,
): ImageMappingResult {
  const finalAnchor = asset.anchor ?? anchor;

  // tanpa container: pass-through
  if (
    !container ||
    (container.width === undefined && container.height === undefined)
  ) {
    return {
      displayWidth: Number.isFinite(asset.width) ? asset.width : 0,
      displayHeight: Number.isFinite(asset.height) ? asset.height : 0,
      offset: { x: 0, y: 0 },
      anchor: finalAnchor,
    };
  }

  const cw = container.width;
  const ch = container.height;

  // container harus punya w & h valid
  if (
    !Number.isFinite(cw as number) ||
    !Number.isFinite(ch as number) ||
    (cw as number) <= 0 ||
    (ch as number) <= 0
  ) {
    return {
      displayWidth: 0,
      displayHeight: 0,
      offset: { x: 0, y: 0 },
      anchor: finalAnchor,
    };
  }

  const aw = asset.width;
  const ah = asset.height;

  // asset dimensi invalid → fail-safe
  if (!Number.isFinite(aw) || !Number.isFinite(ah) || aw <= 0 || ah <= 0) {
    return {
      displayWidth: 0,
      displayHeight: 0,
      offset: { x: 0, y: 0 },
      anchor: finalAnchor,
    };
  }

  let displayWidth = 0;
  let displayHeight = 0;

  if (container.fitMode === "stretch") {
    displayWidth = cw as number;
    displayHeight = ch as number;
  } else {
    const sx = (cw as number) / aw;
    const sy = (ch as number) / ah;
    const s =
      container.fitMode === "contain" ? Math.min(sx, sy) : Math.max(sx, sy);
    displayWidth = aw * s;
    displayHeight = ah * s;
  }

  const offset = alignmentOffset(
    container.alignment,
    cw as number,
    ch as number,
  );

  return { displayWidth, displayHeight, offset, anchor: finalAnchor };
}

function alignmentOffset(alignment: Alignment, cw: number, ch: number): Vec2 {
  const hx = cw / 2;
  const hy = ch / 2;
  switch (alignment) {
    case "center":
      return { x: 0, y: 0 };
    case "top":
      return { x: 0, y: -hy };
    case "bottom":
      return { x: 0, y: hy };
    case "left":
      return { x: -hx, y: 0 };
    case "right":
      return { x: hx, y: 0 };
    case "top-left":
      return { x: -hx, y: -hy };
    case "top-right":
      return { x: hx, y: -hy };
    case "bottom-left":
      return { x: -hx, y: hy };
    case "bottom-right":
      return { x: hx, y: hy };
    default:
      return { x: 0, y: 0 };
  }
}
