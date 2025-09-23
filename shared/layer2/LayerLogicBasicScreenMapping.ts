import type {
  Alignment,
  AssetMeta,
  AssetRef,
  FitMode,
  LayerConfigNormalized,
  StageConfigNormalized,
  Vec2,
} from "./LayerTypes";
import type { BasicTransform } from "./LayerLogicBasic";

/**
 * Hook bawaan: default tidak mengubah transform.
 * Child file ini boleh dimodifikasi untuk menyesuaikan perilaku.
 */
export function postProcessBasicTransform(
  transform: BasicTransform,
  _layer: LayerConfigNormalized,
  _stage: StageConfigNormalized,
): BasicTransform {
  return transform;
}

/* ==============================
 * Screen Mapping Utilities
 * ============================== */

export function createScreenMapping(stage: StageConfigNormalized) {
  const { width, height, origin } = stage;
  const half: Vec2 = { x: width / 2, y: height / 2 };

  const toCenter = (p: Vec2): Vec2 =>
    origin === "center" ? { ...p } : { x: p.x - half.x, y: p.y - half.y };

  const toTopLeft = (p: Vec2): Vec2 =>
    origin === "top-left" ? { ...p } : { x: p.x + half.x, y: p.y + half.y };

  const center = (): Vec2 => (origin === "center" ? { x: 0, y: 0 } : { ...half });

  const bounds = () => ({ w: width, h: height });

  return { toCenter, toTopLeft, center, bounds };
}

export function defaultPlacement(stage: StageConfigNormalized): Vec2 {
  return stage.origin === "center" ? { x: 0, y: 0 } : { x: stage.width / 2, y: stage.height / 2 };
}

/* ==============================
 * Image Mapping Utilities
 * ============================== */

export interface ContainerSpec {
  width?: number;
  height?: number;
  fitMode: FitMode;
  alignment: Alignment;
}

export interface ImageMappingResult {
  displayWidth: number;
  displayHeight: number;
  offset: Vec2;
  anchor: Vec2;
}

export function mapImageIntoContainer(
  asset: AssetMeta,
  container: ContainerSpec | undefined,
  anchor: Vec2,
): ImageMappingResult {
  const finalAnchor = asset.anchor ?? anchor;

  if (!container || (container.width === undefined && container.height === undefined)) {
    return {
      displayWidth: Number.isFinite(asset.width) ? asset.width : 0,
      displayHeight: Number.isFinite(asset.height) ? asset.height : 0,
      offset: { x: 0, y: 0 },
      anchor: finalAnchor,
    };
  }

  const cw = container.width;
  const ch = container.height;

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
    const scale = container.fitMode === "contain" ? Math.min(sx, sy) : Math.max(sx, sy);
    displayWidth = aw * scale;
    displayHeight = ah * scale;
  }

  const offset = alignmentOffset(container.alignment, cw as number, ch as number);

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

/* ==============================
 * Asset Resolver
 * ============================== */

export function resolveAsset(ref: AssetRef, registry: Map<string, AssetMeta>): AssetMeta {
  if (ref.type === "path") {
    return { src: ref.path, width: Number.NaN, height: Number.NaN };
  }
  if (ref.type === "registry") {
    const meta = registry.get(ref.key);
    if (!meta) {
      throw new Error(`registry key "${ref.key}" not found`);
    }
    return { ...meta };
  }
  throw new Error(`unknown asset ref type: ${(ref as any).type}`);
}
