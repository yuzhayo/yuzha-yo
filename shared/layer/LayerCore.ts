import type { LayerConfigEntry } from "../config/Config";
import registryData from "../config/ImageRegistry.json" assert { type: "json" };
import { computeImageMapping, type ImageMapping } from "./LayerCorePipelineImageMapping";

// Type-safe registry with compile-time validation
type AssetRegistryEntry = { id: string; path: string };
const registry = registryData as Array<AssetRegistryEntry>;

// Validate registry entries at initialization
if (import.meta.env.DEV) {
  registry.forEach((entry, index) => {
    if (!entry.id || typeof entry.id !== "string") {
      console.error(`[LayerCore] Invalid asset registry entry #${index}: missing or invalid id`);
    }
    if (!entry.path || typeof entry.path !== "string") {
      console.error(
        `[LayerCore] Invalid asset registry entry #${index} (${entry.id}): missing or invalid path`,
      );
    }
  });
}

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

/**
 * Calculate layer position such that a specific image point appears at a stage point.
 * This enables pivot-based positioning where any point on the image can be anchored
 * to any point on the stage.
 *
 * @param stageAnchor - Where on stage we want the image point to appear
 * @param imagePercent - Which point on image (0-100%)
 * @param imageDimensions - Image width and height
 * @param scale - Scale factors
 * @returns Final position (where image center should be placed for rendering)
 */
function calculatePositionForPivot(
  stageAnchor: Point2D,
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
): Point2D {
  // Convert percent to image pixels
  const imagePointPixels: Point2D = {
    x: (imagePercent.x / 100) * imageDimensions.width,
    y: (imagePercent.y / 100) * imageDimensions.height,
  };

  // Image center in pixels
  const imageCenter: Point2D = {
    x: imageDimensions.width / 2,
    y: imageDimensions.height / 2,
  };

  // Offset from center to desired point (in pixels)
  const offsetFromCenter: Point2D = {
    x: imagePointPixels.x - imageCenter.x,
    y: imagePointPixels.y - imageCenter.y,
  };

  // Apply scale to offset
  const scaledOffset: Point2D = {
    x: offsetFromCenter.x * scale.x,
    y: offsetFromCenter.y * scale.y,
  };

  // Calculate position: stageAnchor - scaledOffset
  // This ensures when rendering engines place image center at position,
  // the desired image point ends up at the stage anchor
  const position: Point2D = {
    x: stageAnchor.x - scaledOffset.x,
    y: stageAnchor.y - scaledOffset.y,
  };

  return validatePoint(position);
}

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

export function compute2DTransform(
  entry: LayerConfigEntry,
  stageSize: number,
  imageDimensions: { width: number; height: number },
): Layer2DTransform {
  const [sxPercent, syPercent] = normalizePair(entry.scale, 100, 100);
  const sx = clampedPercentToScale(sxPercent);
  const sy = clampedPercentToScale(syPercent);

  const defaultCenter = stageSize / 2;
  const scale: Point2D = { x: sx, y: sy };

  // Check for new BasicStagePoint/BasicImagePoint system
  if (entry.BasicStagePoint !== undefined) {
    // New pivot-based positioning system
    const [stageX, stageY] = normalizePair(entry.BasicStagePoint, defaultCenter, defaultCenter);
    const basicStagePoint: Point2D = { x: stageX, y: stageY };

    // Default BasicImagePoint to [50, 50] (center) if not specified
    const [imgPercentX, imgPercentY] = normalizePair(entry.BasicImagePoint, 50, 50);
    const basicImagePercent: PercentPoint = {
      x: clampPercent(imgPercentX),
      y: clampPercent(imgPercentY),
    };

    // Calculate position that places BasicImagePoint at BasicStagePoint
    const position = calculatePositionForPivot(
      basicStagePoint,
      basicImagePercent,
      imageDimensions,
      scale,
    );

    return { position, scale };
  } else {
    // Legacy position system (backward compatibility)
    const [px, py] = normalizePair(entry.position, defaultCenter, defaultCenter);
    return {
      position: { x: px, y: py },
      scale,
    };
  }
}

export function resolveAssetPath(imageId: string): string | null {
  const path = pathMap.get(imageId);
  // Type guard: ensure path is a valid string
  if (path && typeof path === "string" && path.length > 0) {
    return path;
  }
  return null;
}

export function resolveAssetUrl(path: string): string {
  // Type guard: ensure path is valid string
  if (!path || typeof path !== "string") {
    throw new Error(`Invalid asset path: ${path}`);
  }
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
  // Performance tracking (development only)
  const IS_DEV = import.meta.env.DEV;
  const perfStart = IS_DEV ? performance.now() : 0;

  const assetPath = resolveAssetPath(entry.imageId);
  if (!assetPath) {
    console.warn(`[LayerCore] Missing asset for imageId "${entry.imageId}"`);
    return null;
  }

  const imageUrl = resolveAssetUrl(assetPath);

  // Get image dimensions FIRST - needed for new pivot-based positioning
  const dimensions = await getImageDimensions(imageUrl);

  // Now compute transform with dimensions
  const { position, scale } = compute2DTransform(entry, stageSize, dimensions);

  // Calculate image mapping with imageTip and imageBase from config
  const tipAngle = typeof entry.imageTip === "number" ? entry.imageTip : 90;
  const baseAngle = typeof entry.imageBase === "number" ? entry.imageBase : 270;
  const imageMapping = computeImageMapping(dimensions, tipAngle, baseAngle);

  // Determine if we need full calculations (lazy evaluation for performance)
  const needsFullCalculation =
    entry.spinSpeed !== 0 ||
    entry.orbitSpeed !== 0 ||
    entry.showCenter ||
    entry.showTip ||
    entry.showBase ||
    entry.showAxisLine ||
    entry.showRotation ||
    entry.showTipRay ||
    entry.showBaseRay ||
    entry.showBoundingBox;

  const stageCenterValue = stageSize / 2;
  const stageCenterPoint: Point2D = { x: stageCenterValue, y: stageCenterValue };
  const stageCenterPercent = stagePointToPercent(stageCenterPoint, stageSize);

  // Always compute image center (needed for basic rendering)
  const imageCenterStage = imagePointToStagePoint(
    imageMapping.imageCenter,
    imageMapping.imageDimensions,
    scale,
    position,
  );
  const imageCenterPercent = imagePointToPercent(
    imageMapping.imageCenter,
    imageMapping.imageDimensions,
  );
  const imageCenterStagePercent = stagePointToPercent(imageCenterStage, stageSize);

  // Lazy calculation: only compute tip/base/spin/orbit if actually needed
  let imageTipStage: Point2D;
  let imageBaseStage: Point2D;
  let imageTipPercent: PercentPoint;
  let imageBasePercent: PercentPoint;
  let imageTipStagePercent: PercentPoint;
  let imageBaseStagePercent: PercentPoint;
  let spinStagePoint: Point2D;
  let spinStagePercent: PercentPoint;
  let spinImagePercent: PercentPoint;
  let spinImagePoint: Point2D;
  let orbitStagePoint: Point2D;
  let orbitStagePercent: PercentPoint;
  let orbitImagePercent: PercentPoint;
  let orbitImagePoint: Point2D;
  let orbitImageStagePoint: Point2D;
  let orbitImageStagePercent: PercentPoint;

  if (needsFullCalculation) {
    // Full calculation for animated or debug layers
    imageTipStage = imagePointToStagePoint(
      imageMapping.imageTip,
      imageMapping.imageDimensions,
      scale,
      position,
    );
    imageBaseStage = imagePointToStagePoint(
      imageMapping.imageBase,
      imageMapping.imageDimensions,
      scale,
      position,
    );
    imageTipPercent = imagePointToPercent(imageMapping.imageTip, imageMapping.imageDimensions);
    imageBasePercent = imagePointToPercent(imageMapping.imageBase, imageMapping.imageDimensions);
    imageTipStagePercent = stagePointToPercent(imageTipStage, stageSize);
    imageBaseStagePercent = stagePointToPercent(imageBaseStage, stageSize);

    spinStagePoint = normalizeStagePointInput(entry.spinStagePoint, position, stageSize);
    spinStagePercent = stagePointToPercent(spinStagePoint, stageSize);
    spinImagePercent = normalizePercentInput(entry.spinImagePoint, 50, 50);
    spinImagePoint = imagePercentToImagePoint(spinImagePercent, imageMapping.imageDimensions);

    orbitStagePoint = normalizeStagePointInput(entry.orbitCenter, stageCenterPoint, stageSize);
    orbitStagePercent = stagePointToPercent(orbitStagePoint, stageSize);
    orbitImagePercent = normalizePercentInput(entry.orbitImagePoint, 50, 50);
    orbitImagePoint = imagePercentToImagePoint(orbitImagePercent, imageMapping.imageDimensions);
    orbitImageStagePoint = imagePointToStagePoint(
      orbitImagePoint,
      imageMapping.imageDimensions,
      scale,
      position,
    );
    orbitImageStagePercent = stagePointToPercent(orbitImageStagePoint, stageSize);
  } else {
    // Minimal calculation for static layers (use defaults/zero values)
    const zeroPoint: Point2D = { x: 0, y: 0 };
    const zeroPercent: PercentPoint = { x: 0, y: 0 };
    imageTipStage = zeroPoint;
    imageBaseStage = zeroPoint;
    imageTipPercent = zeroPercent;
    imageBasePercent = zeroPercent;
    imageTipStagePercent = zeroPercent;
    imageBaseStagePercent = zeroPercent;
    spinStagePoint = zeroPoint;
    spinStagePercent = zeroPercent;
    spinImagePercent = zeroPercent;
    spinImagePoint = zeroPoint;
    orbitStagePoint = zeroPoint;
    orbitStagePercent = zeroPercent;
    orbitImagePercent = zeroPercent;
    orbitImagePoint = zeroPoint;
    orbitImageStagePoint = zeroPoint;
    orbitImageStagePercent = zeroPercent;
  }

  // Calculate rotation from BasicAngleImage (degrees)
  // Default: 0° (original image orientation, no rotation)
  // Direct use: rotation = BasicAngleImage
  const basicAngleImage = typeof entry.BasicAngleImage === "number" ? entry.BasicAngleImage : 0;
  const rotation = basicAngleImage;

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

  const result = {
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
    rotation,
  };

  // Log performance metrics in development
  if (IS_DEV) {
    const perfEnd = performance.now();
    const duration = perfEnd - perfStart;
    if (duration > 10) {
      // Only log if > 10ms
      console.log(
        `[LayerCore] prepareLayer "${entry.layerId}" took ${duration.toFixed(2)}ms (lazy: ${!needsFullCalculation})`,
      );
    }
  }

  return result;
}

// Cache for image dimensions to avoid redundant loading
const IMAGE_DIMENSION_CACHE = new Map<string, { width: number; height: number }>();

async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  // Return cached dimensions if available
  if (IMAGE_DIMENSION_CACHE.has(url)) {
    return IMAGE_DIMENSION_CACHE.get(url)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };
      IMAGE_DIMENSION_CACHE.set(url, dimensions);
      resolve(dimensions);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Preload critical assets in parallel to populate dimension cache
 * Call this early in app initialization for faster layer preparation
 */
export async function preloadCriticalAssets(imageIds: string[]): Promise<void> {
  const preloadPromises = imageIds.map(async (imageId) => {
    const assetPath = resolveAssetPath(imageId);
    if (!assetPath) return;

    const imageUrl = resolveAssetUrl(assetPath);
    try {
      await getImageDimensions(imageUrl);
    } catch (error) {
      console.warn(`[LayerCore] Failed to preload asset "${imageId}":`, error);
    }
  });

  await Promise.all(preloadPromises);
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function imagePointToStagePoint(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D,
): Point2D {
  // Validate inputs
  const validImagePoint = validatePoint(imagePoint);
  const validDimensions = validateDimensions(imageDimensions);
  const validScale = validateScale(scale);
  const validPosition = validatePoint(position);

  const halfWidth = validDimensions.width / 2;
  const halfHeight = validDimensions.height / 2;

  const result = {
    x: validPosition.x + (validImagePoint.x - halfWidth) * validScale.x,
    y: validPosition.y + (validImagePoint.y - halfHeight) * validScale.y,
  };

  return validatePoint(result); // Validate output
}

export function stagePointToImagePoint(
  stagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D,
): Point2D {
  // Validate inputs
  const validStagePoint = validatePoint(stagePoint);
  const validDimensions = validateDimensions(imageDimensions);
  const validScale = validateScale(scale);
  const validPosition = validatePoint(position);

  const halfWidth = validDimensions.width / 2;
  const halfHeight = validDimensions.height / 2;

  // Prevent division by zero
  const safeScaleX = validScale.x !== 0 ? validScale.x : 1;
  const safeScaleY = validScale.y !== 0 ? validScale.y : 1;

  const result = {
    x: (validStagePoint.x - validPosition.x) / safeScaleX + halfWidth,
    y: (validStagePoint.y - validPosition.y) / safeScaleY + halfHeight,
  };

  return validatePoint(result); // Validate output
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
  // Validate inputs
  const validPercent = {
    x: clampPercent(imagePercent.x),
    y: clampPercent(imagePercent.y),
  };
  const validDimensions = validateDimensions(imageDimensions);

  const result = {
    x: (validPercent.x / 100) * validDimensions.width,
    y: (validPercent.y / 100) * validDimensions.height,
  };

  return validatePoint(result);
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

/**
 * Validate and sanitize a 2D point
 * Returns a safe point with finite coordinates
 */
export function validatePoint(point: Point2D, fallback: Point2D = { x: 0, y: 0 }): Point2D {
  const x = Number.isFinite(point.x) ? point.x : fallback.x;
  const y = Number.isFinite(point.y) ? point.y : fallback.y;
  return { x, y };
}

/**
 * Validate and sanitize scale values
 * Ensures scale is positive and finite
 */
export function validateScale(scale: Point2D, fallback: Point2D = { x: 1, y: 1 }): Point2D {
  let x = Number.isFinite(scale.x) && scale.x > 0 ? scale.x : fallback.x;
  let y = Number.isFinite(scale.y) && scale.y > 0 ? scale.y : fallback.y;

  // Clamp to reasonable range (0.01 to 10)
  x = Math.max(0.01, Math.min(10, x));
  y = Math.max(0.01, Math.min(10, y));

  return { x, y };
}

/**
 * Validate dimensions object
 */
export function validateDimensions(
  dimensions: { width: number; height: number },
  fallback: { width: number; height: number } = { width: 100, height: 100 },
): { width: number; height: number } {
  const width =
    Number.isFinite(dimensions.width) && dimensions.width > 0 ? dimensions.width : fallback.width;
  const height =
    Number.isFinite(dimensions.height) && dimensions.height > 0
      ? dimensions.height
      : fallback.height;
  return { width, height };
}

export function is2DLayer(entry: LayerConfigEntry): boolean {
  return entry.renderer === "2D";
}
