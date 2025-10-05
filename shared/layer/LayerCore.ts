import type { LayerConfigEntry } from "../config/Config";
import registryData from "../config/ImageRegistry.json" assert { type: "json" };
import { computeImageMapping, type ImageMapping } from "./LayerCorePipelineImageMapping";

const registry = registryData as Array<{ id: string; path: string }>;
const pathMap = new Map(registry.map((entry) => [entry.id, entry.path]));

export type Point2D = { x: number; y: number };

export type PercentPoint = { x: number; y: number };

export type CoordinateBundle = {
  point: Point2D;
  percent: PercentPoint;
};

export type DualSpaceCoordinate = {
  image: CoordinateBundle;
  stage: CoordinateBundle;
};

export type OrbitCoordinate = DualSpaceCoordinate & {
  stageAnchor: CoordinateBundle;
};

export type LayerCalculationPoints = {
  stageCenter: CoordinateBundle;
  imageCenter: DualSpaceCoordinate;
  imageTip: DualSpaceCoordinate;
  imageBase: DualSpaceCoordinate;
  spinPoint: DualSpaceCoordinate;
  orbitPoint: OrbitCoordinate;
};

export type Layer2DTransform = {
  position: Point2D;
  scale: Point2D;
};

export type { ImageMapping };

export type UniversalLayerData = {
  layerId: string;
  imageId: string;
  imageUrl: string;
  imagePath: string;
  position: Point2D;
  scale: Point2D;
  imageMapping: ImageMapping;
  imageTip: number;
  imageBase: number;
  calculation: LayerCalculationPoints;
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

  // Calculate image mapping with imageTip and imageBase from config
  const tipAngle = typeof entry.imageTip === "number" ? entry.imageTip : 90;
  const baseAngle = typeof entry.imageBase === "number" ? entry.imageBase : 270;
  const imageMapping = computeImageMapping(dimensions, tipAngle, baseAngle);

  const stageCenterValue = stageSize / 2;
  const stageCenterPoint: Point2D = { x: stageCenterValue, y: stageCenterValue };
  const stageCenterPercent = stagePointToPercent(stageCenterPoint, stageSize);

  const imageCenterStage = imagePointToStagePoint(
    imageMapping.imageCenter,
    imageMapping.imageDimensions,
    scale,
    position,
  );
  const imageTipStage = imagePointToStagePoint(
    imageMapping.imageTip,
    imageMapping.imageDimensions,
    scale,
    position,
  );
  const imageBaseStage = imagePointToStagePoint(
    imageMapping.imageBase,
    imageMapping.imageDimensions,
    scale,
    position,
  );

  const imageCenterPercent = imagePointToPercent(
    imageMapping.imageCenter,
    imageMapping.imageDimensions,
  );
  const imageTipPercent = imagePointToPercent(imageMapping.imageTip, imageMapping.imageDimensions);
  const imageBasePercent = imagePointToPercent(
    imageMapping.imageBase,
    imageMapping.imageDimensions,
  );

  const imageCenterStagePercent = stagePointToPercent(imageCenterStage, stageSize);
  const imageTipStagePercent = stagePointToPercent(imageTipStage, stageSize);
  const imageBaseStagePercent = stagePointToPercent(imageBaseStage, stageSize);

  const spinImagePercent = normalizePercentInput(entry.spinCenter, 50, 50);
  const spinImagePoint = imagePercentToImagePoint(spinImagePercent, imageMapping.imageDimensions);
  const spinStagePoint = imagePointToStagePoint(
    spinImagePoint,
    imageMapping.imageDimensions,
    scale,
    position,
  );
  const spinStagePercent = stagePointToPercent(spinStagePoint, stageSize);

  const orbitStagePoint = normalizeStagePointInput(entry.orbitCenter, stageCenterPoint, stageSize);
  const orbitStagePercent = stagePointToPercent(orbitStagePoint, stageSize);
  const orbitImagePercent = normalizePercentInput(entry.orbitImagePoint, 50, 50);
  const orbitImagePoint = imagePercentToImagePoint(orbitImagePercent, imageMapping.imageDimensions);
  const orbitImageStagePoint = imagePointToStagePoint(
    orbitImagePoint,
    imageMapping.imageDimensions,
    scale,
    position,
  );
  const orbitImageStagePercent = stagePointToPercent(orbitImageStagePoint, stageSize);

  const calculation: LayerCalculationPoints = {
    stageCenter: createCoordinateBundle(stageCenterPoint, stageCenterPercent),
    imageCenter: createDualSpaceCoordinate(
      imageMapping.imageCenter,
      imageCenterPercent,
      imageCenterStage,
      imageCenterStagePercent,
    ),
    imageTip: createDualSpaceCoordinate(
      imageMapping.imageTip,
      imageTipPercent,
      imageTipStage,
      imageTipStagePercent,
    ),
    imageBase: createDualSpaceCoordinate(
      imageMapping.imageBase,
      imageBasePercent,
      imageBaseStage,
      imageBaseStagePercent,
    ),
    spinPoint: createDualSpaceCoordinate(
      spinImagePoint,
      spinImagePercent,
      spinStagePoint,
      spinStagePercent,
    ),
    orbitPoint: {
      ...createDualSpaceCoordinate(
        orbitImagePoint,
        orbitImagePercent,
        orbitStagePoint,
        orbitStagePercent,
      ),
      stageAnchor: createCoordinateBundle(orbitImageStagePoint, orbitImageStagePercent),
    },
  };

  return {
    layerId: entry.layerId,
    imageId: entry.imageId,
    imageUrl,
    imagePath: assetPath,
    position,
    scale,
    imageMapping,
    imageTip: tipAngle,
    imageBase: baseAngle,
    calculation,
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

export function imagePointToStagePoint(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D,
): Point2D {
  const halfWidth = imageDimensions.width / 2;
  const halfHeight = imageDimensions.height / 2;
  return {
    x: position.x + (imagePoint.x - halfWidth) * scale.x,
    y: position.y + (imagePoint.y - halfHeight) * scale.y,
  };
}

export function stagePointToImagePoint(
  stagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D,
): Point2D {
  const halfWidth = imageDimensions.width / 2;
  const halfHeight = imageDimensions.height / 2;
  return {
    x: (stagePoint.x - position.x) / scale.x + halfWidth,
    y: (stagePoint.y - position.y) / scale.y + halfHeight,
  };
}

export function imagePointToPercent(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
): PercentPoint {
  return {
    x: (imagePoint.x / imageDimensions.width) * 100,
    y: (imagePoint.y / imageDimensions.height) * 100,
  };
}

export function imagePercentToImagePoint(
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
): Point2D {
  return {
    x: (imagePercent.x / 100) * imageDimensions.width,
    y: (imagePercent.y / 100) * imageDimensions.height,
  };
}

export function stagePointToPercent(stagePoint: Point2D, stageSize: number): PercentPoint {
  return {
    x: (stagePoint.x / stageSize) * 100,
    y: (stagePoint.y / stageSize) * 100,
  };
}

export function stagePercentToStagePoint(stagePercent: PercentPoint, stageSize: number): Point2D {
  return {
    x: (stagePercent.x / 100) * stageSize,
    y: (stagePercent.y / 100) * stageSize,
  };
}

function createCoordinateBundle(point: Point2D, percent: PercentPoint): CoordinateBundle {
  return { point, percent };
}

function createDualSpaceCoordinate(
  imagePoint: Point2D,
  imagePercent: PercentPoint,
  stagePoint: Point2D,
  stagePercent: PercentPoint,
): DualSpaceCoordinate {
  return {
    image: createCoordinateBundle(imagePoint, imagePercent),
    stage: createCoordinateBundle(stagePoint, stagePercent),
  };
}

function normalizePercentInput(
  value: number[] | PercentPoint | undefined,
  fallbackX: number,
  fallbackY: number,
): PercentPoint {
  if (Array.isArray(value) && value.length >= 2) {
    return {
      x: clampPercent(value[0] ?? fallbackX),
      y: clampPercent(value[1] ?? fallbackY),
    };
  }
  if (value && typeof value === "object" && "x" in value && "y" in value) {
    const { x, y } = value as PercentPoint;
    return {
      x: clampPercent(x),
      y: clampPercent(y),
    };
  }
  return {
    x: clampPercent(fallbackX),
    y: clampPercent(fallbackY),
  };
}

function normalizeStagePointInput(
  value: number[] | undefined,
  fallback: Point2D,
  stageSize: number,
): Point2D {
  if (Array.isArray(value) && value.length >= 2) {
    return {
      x: clampStage(value[0] ?? fallback.x, stageSize),
      y: clampStage(value[1] ?? fallback.y, stageSize),
    };
  }
  return fallback;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clampStage(value: number, stageSize: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(stageSize, value));
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
