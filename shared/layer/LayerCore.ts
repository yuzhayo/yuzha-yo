import type { LayerConfigEntry } from "../config/Config";
import registryData from "../config/ImageRegistry.json" assert { type: "json" };

const registry = registryData as Array<{ id: string; path: string }>;
const pathMap = new Map(registry.map((entry) => [entry.id, entry.path]));

export type Layer2DTransform = {
  position: { x: number; y: number };
  scale: { x: number; y: number };
};

export type ImageMapping = {
  imageCenter: { x: number; y: number };
  imageTip: { x: number; y: number };
  imageBase: { x: number; y: number };
  imageDimensions: { width: number; height: number };
};

export type UniversalLayerData = {
  layerId: string;
  imageId: string;
  imageUrl: string;
  imagePath: string;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  imageMapping: ImageMapping;
  rotation?: number;
};

export function compute2DTransform(entry: LayerConfigEntry, stageSize: number): Layer2DTransform {
  const [sxPercent, syPercent] = normalizePair(entry.scale, 100, 100);
  const sx = clampedPercentToScale(sxPercent);
  const sy = clampedPercentToScale(syPercent);
  const defaultCenter = stageSize / 2;
  const [px, py] = normalizePair(entry.position, defaultCenter, defaultCenter);
  return {
    position: { x: px, y: py },
    scale: { x: sx, y: sy },
  };
}

export function computeImageMapping(
  imageDimensions: { width: number; height: number },
  tipAngle: number = 90,
): ImageMapping {
  const { width, height } = imageDimensions;

  // Image center is the geometric center
  const imageCenter = {
    x: width / 2,
    y: height / 2,
  };

  // Convert angle to radians
  // In image/screen coordinates: 0° is right, 90° is UP (top), 180° is left, 270° is down
  // Standard math has Y increasing upward, but screen Y increases downward
  // So we negate the angle to flip the Y-axis orientation
  const angleRad = (-tipAngle * Math.PI) / 180;

  // Calculate tip point at the edge of the actual image rectangle
  // Project from center to rectangle boundary at given angle
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  // Find intersection with rectangle by checking which edge we hit first
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Calculate scaling factor to reach rectangle edge
  const scaleX = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  const imageTip = {
    x: imageCenter.x + scale * dx,
    y: imageCenter.y + scale * dy,
  };

  // Base is 180° opposite from tip (rotate tip angle by 180°)
  const baseAngleRad = angleRad + Math.PI;
  const baseDx = Math.cos(baseAngleRad);
  const baseDy = Math.sin(baseAngleRad);

  const baseScaleX = baseDx !== 0 ? halfWidth / Math.abs(baseDx) : Infinity;
  const baseScaleY = baseDy !== 0 ? halfHeight / Math.abs(baseDy) : Infinity;
  const baseScale = Math.min(baseScaleX, baseScaleY);

  const imageBase = {
    x: imageCenter.x + baseScale * baseDx,
    y: imageCenter.y + baseScale * baseDy,
  };

  return {
    imageCenter,
    imageTip,
    imageBase,
    imageDimensions,
  };
}

export function resolveAssetPath(imageId: string): string | null {
  return pathMap.get(imageId) ?? null;
}

export function resolveAssetUrl(path: string): string {
  if (!path.toLowerCase().startsWith("shared/asset/")) {
    throw new Error(`Unsupported asset path: ${path}`);
  }
  const relative = path.replace(/^shared\/asset\//i, "../Asset/");
  return new URL(relative, import.meta.url).href;
}

export async function prepareLayer(
  entry: LayerConfigEntry,
  stageSize: number,
): Promise<UniversalLayerData | null> {
  const assetPath = resolveAssetPath(entry.imageId);
  if (!assetPath) {
    console.warn(`[LayerCore] Missing asset for imageId "${entry.imageId}"`);
    return null;
  }

  const imageUrl = resolveAssetUrl(assetPath);
  const { position, scale } = compute2DTransform(entry, stageSize);

  // Get image dimensions - we need to load the image to get actual dimensions
  const dimensions = await getImageDimensions(imageUrl);

  // Calculate image mapping with imageTip from config (default 90°)
  const tipAngle = typeof entry.imageTip === "number" ? entry.imageTip : 90;
  const imageMapping = computeImageMapping(dimensions, tipAngle);

  return {
    layerId: entry.layerId,
    imageId: entry.imageId,
    imageUrl,
    imagePath: assetPath,
    position,
    scale,
    imageMapping,
  };
}

async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
}

function clampedPercentToScale(percent: number): number {
  const clamped = Math.max(10, Math.min(500, percent));
  return clamped / 100;
}

function normalizePair(
  value: number[] | undefined,
  fallbackX: number,
  fallbackY: number,
): [number, number] {
  if (!Array.isArray(value) || value.length === 0) return [fallbackX, fallbackY];
  const [first, second] = value;
  const x = typeof first === "number" && Number.isFinite(first) ? first : fallbackX;
  const y = typeof second === "number" && Number.isFinite(second) ? second : fallbackY;
  return [x, y];
}

export function is2DLayer(entry: LayerConfigEntry): boolean {
  return entry.renderer === "2D";
}
