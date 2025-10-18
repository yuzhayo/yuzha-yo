/**
 * ============================================================================
 * LAYER CORE - Foundation Layer System
 * ============================================================================
 *
 * This module is the FOUNDATION of the layer rendering system. It provides
 * the essential entry point for creating layer data from configuration.
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This is where layer data BEGINS. The StageSystem calls prepareLayer() from
 * this module to convert configuration entries into renderable layer data.
 *
 * RESPONSIBILITIES:
 * -----------------
 * 1. Asset Resolution
 *    - Map imageId strings to file paths
 *    - Convert paths to URLs for loading
 *
 * 2. Image Mapping
 *    - Calculate imageTip and imageBase points based on angles
 *    - Determine image orientation and axis
 *
 * 3. Layer Preparation (MAIN ENTRY POINT)
 *    - prepareLayer() - converts LayerConfigEntry → UniversalLayerData
 *    - Loads image dimensions
 *    - Calculates positions and scales
 *    - Performs lazy evaluation for performance
 *
 * 4. Type Definitions
 *    - UniversalLayerData - base layer data structure
 *    - LayerCalculationPoints - precomputed coordinate cache
 *    - ImageMapping - image geometry information
 *
 * ARCHITECTURE FLOW:
 * ------------------
 * Config.ts (loads ConfigYuzha.json)
 *   ↓
 * StageSystem.ts calls prepareLayer()
 *   ↓
 * layerCore.ts (THIS FILE) prepares base layer data
 *   ↓
 * Returns UniversalLayerData
 *   ↓
 * layer.ts attaches processors (spin, orbit, debug)
 *   ↓
 * Renderers execute processors and display
 *
 * DEPENDENCIES:
 * -------------
 * - layerBasic.ts - for coordinate transformations and math utilities
 * - Config.ts - for LayerConfigEntry type
 * - ImageRegistry.json - for asset path lookup
 *
 * USED BY:
 * --------
 * - StageSystem.ts (calls prepareLayer for each layer)
 * - layerSpin.ts (imports types)
 * - layerOrbit.ts (imports types)
 * - layerDebug.ts (imports types)
 *
 * @module layer/layerCore
 */

import type { LayerConfigEntry } from "../config/Config";
import registryData from "../config/ImageRegistry.json" assert { type: "json" };
import {
  type Point2D,
  type PercentPoint,
  type CoordinateBundle,
  type DualSpaceCoordinate,
  type OrbitCoordinate,
  type Layer2DTransform,
  calculatePositionForPivot,
  normalizePair,
  clampedPercentToScale,
  normalizePercentInput,
  normalizeStagePointInput,
  clampPercent,
  imagePointToStagePoint,
  imagePointToPercent,
  imagePercentToImagePoint,
  stagePointToPercent,
  createCoordinateBundle,
  createDualSpaceCoordinate,
  validatePoint,
} from "./layerBasic";

// ============================================================================
// ASSET REGISTRY SETUP
// ============================================================================
// Load and validate the image registry for asset resolution.
// FOR FUTURE AI AGENTS: This maps imageId → file path.
// ============================================================================

type AssetRegistryEntry = { id: string; path: string };
const registry = registryData as Array<AssetRegistryEntry>;

// Validate registry entries at initialization (development only)
if (import.meta.env?.DEV) {
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
// Core types for layer data structure.
// FOR FUTURE AI AGENTS: These define the shape of layer data after preparation.
// ============================================================================

/**
 * Image mapping information
 * Defines the geometry and orientation of an image
 */
export type ImageMapping = {
  imageCenter: { x: number; y: number };
  imageTip: { x: number; y: number };
  imageBase: { x: number; y: number };
  imageDimensions: { width: number; height: number };
  displayAxisAngle: number;
  displayRotation: number;
  axisCenterOffset: { x: number; y: number };
};

/**
 * Re-export types from layerBasic for convenience
 */
export type { Point2D, PercentPoint, CoordinateBundle, DualSpaceCoordinate, OrbitCoordinate };

/**
 * Precomputed calculation points for a layer
 *
 * This structure caches commonly used coordinate transformations to avoid
 * recalculating them in processors and renderers.
 *
 * FOR FUTURE AI AGENTS: All these coordinates are calculated during prepareLayer()
 * and stored here for efficient access. Use these instead of recalculating.
 */
export type LayerCalculationPoints = {
  stageCenter: CoordinateBundle;
  imageCenter: DualSpaceCoordinate;
  imageTip: DualSpaceCoordinate;
  imageBase: DualSpaceCoordinate;
  spinPoint: DualSpaceCoordinate;
  orbitPoint: OrbitCoordinate;
  orbitLine?: CoordinateBundle;
};

/**
 * Universal layer data structure (base layer data before processors)
 *
 * This is the output of prepareLayer() and input to the processor pipeline.
 * Contains everything needed to render a static layer.
 *
 * IMPORTANT FOR FUTURE AI AGENTS:
 * - This is the BASE layer data (no animations yet)
 * - Processors enhance this with additional properties
 * - All coordinate calculations are precomputed in `calculation`
 * - Image mapping provides geometry information
 */
export type UniversalLayerData = {
  LayerID: string;
  ImageID: string;
  imageUrl: string;
  imagePath: string;
  position: Point2D;
  scale: Point2D;
  imageMapping: ImageMapping;
  imageTip: number;
  imageBase: number;
  calculation: LayerCalculationPoints;
  rotation?: number;
  orbitStagePoint?: Point2D;
  orbitLinePoint?: Point2D;
  orbitLineVisible?: boolean;
  orbitRadius?: number;
  orbitImagePercent?: PercentPoint;
  orbitImagePoint?: Point2D;
  orbitOrient?: boolean;
};

// ============================================================================
// IMAGE MAPPING
// ============================================================================
// Calculate image orientation and geometry.
// FOR FUTURE AI AGENTS: This determines imageTip and imageBase points.
// ============================================================================

const STANDARD_MAPPING_CACHE = new Map<string, ImageMapping>();

/**
 * Compute image mapping (orientation and geometry)
 *
 * ALGORITHM:
 * 1. Calculate tip point: ray from center at tipAngle to image edge
 * 2. Calculate base point: ray from center at baseAngle to image edge
 * 3. Calculate axis angle and rotation based on tip-base line
 *
 * USAGE: Called by prepareLayer() to determine image orientation
 *
 * CACHING: Standard mappings (90°/270°) are cached for performance
 *
 * @param imageDimensions - Image width and height
 * @param tipAngle - Angle defining image "tip" direction (default 90° = top)
 * @param baseAngle - Angle defining image "base" direction (default 270° = bottom)
 * @returns Image mapping with center, tip, base, and axis information
 */
export function computeImageMapping(
  imageDimensions: { width: number; height: number },
  tipAngle: number = 90,
  baseAngle: number = 270,
): ImageMapping {
  // Use cache for standard mapping (performance optimization)
  if (tipAngle === 90 && baseAngle === 270) {
    const key = `${imageDimensions.width}x${imageDimensions.height}`;
    const cached = STANDARD_MAPPING_CACHE.get(key);
    if (cached) return cached;
    const result = computeImageMappingInternal(imageDimensions, tipAngle, baseAngle);
    STANDARD_MAPPING_CACHE.set(key, result);
    return result;
  }

  return computeImageMappingInternal(imageDimensions, tipAngle, baseAngle);
}

/**
 * Internal image mapping calculation
 * Separated from computeImageMapping for caching logic
 */
function computeImageMappingInternal(
  imageDimensions: { width: number; height: number },
  tipAngle: number,
  baseAngle: number,
): ImageMapping {
  const { width, height } = imageDimensions;

  const imageCenter = {
    x: width / 2,
    y: height / 2,
  };

  // Convert angles to radians (negate for screen coordinates)
  const tipAngleRad = (-tipAngle * Math.PI) / 180;
  const baseAngleRad = (-baseAngle * Math.PI) / 180;

  // Calculate tip point: ray from center to edge at tipAngle
  const tipDx = Math.cos(tipAngleRad);
  const tipDy = Math.sin(tipAngleRad);

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const tipScaleX = tipDx !== 0 ? halfWidth / Math.abs(tipDx) : Infinity;
  const tipScaleY = tipDy !== 0 ? halfHeight / Math.abs(tipDy) : Infinity;
  const tipScale = Math.min(tipScaleX, tipScaleY);

  const tipOffsetX = Number.isFinite(tipScale) ? tipScale * tipDx : 0;
  const tipOffsetY = Number.isFinite(tipScale) ? tipScale * tipDy : 0;

  const imageTip = {
    x: imageCenter.x + tipOffsetX,
    y: imageCenter.y + tipOffsetY,
  };

  // Calculate base point: ray from center to edge at baseAngle
  const baseDx = Math.cos(baseAngleRad);
  const baseDy = Math.sin(baseAngleRad);

  const baseScaleX = baseDx !== 0 ? halfWidth / Math.abs(baseDx) : Infinity;
  const baseScaleY = baseDy !== 0 ? halfHeight / Math.abs(baseDy) : Infinity;
  const baseScale = Math.min(baseScaleX, baseScaleY);

  const baseOffsetX = Number.isFinite(baseScale) ? baseScale * baseDx : 0;
  const baseOffsetY = Number.isFinite(baseScale) ? baseScale * baseDy : 0;

  const imageBase = {
    x: imageCenter.x + baseOffsetX,
    y: imageCenter.y + baseOffsetY,
  };

  // Calculate axis angle from tip-base line
  const axisDx = imageTip.x - imageBase.x;
  const axisDy = imageTip.y - imageBase.y;

  const displayAxisAngle = (Math.atan2(-axisDy, axisDx) * 180) / Math.PI;
  const displayRotation = Number.isFinite(displayAxisAngle) ? 90 - displayAxisAngle : 0;

  const axisMidpoint = {
    x: (imageBase.x + imageTip.x) / 2,
    y: (imageBase.y + imageTip.y) / 2,
  };

  const axisCenterOffset = {
    x: imageCenter.x - axisMidpoint.x,
    y: imageCenter.y - axisMidpoint.y,
  };

  return {
    imageCenter,
    imageTip,
    imageBase,
    imageDimensions,
    displayAxisAngle,
    displayRotation,
    axisCenterOffset,
  };
}

// ============================================================================
// ASSET RESOLUTION
// ============================================================================
// Convert imageId to file paths and URLs.
// FOR FUTURE AI AGENTS: This is how we find image files.
// ============================================================================

/**
 * Resolve asset path from imageId
 *
 * Looks up imageId in the registry and returns the file path
 *
 * @param imageId - Image identifier from config
 * @returns File path or null if not found
 */
export function resolveAssetPath(imageId: string): string | null {
  const path = pathMap.get(imageId);
  if (path && typeof path === "string" && path.length > 0) {
    return path;
  }
  return null;
}

/**
 * Convert asset path to URL for loading
 *
 * Transforms registry path to URL that can be loaded by browser
 *
 * @param path - Asset path from registry (e.g., "shared/asset/image.png")
 * @returns URL for loading the asset
 */
export function resolveAssetUrl(path: string): string {
  if (!path || typeof path !== "string") {
    throw new Error(`Invalid asset path: ${path}`);
  }
  if (!path.toLowerCase().startsWith("shared/asset/")) {
    throw new Error(`Unsupported asset path: ${path}`);
  }
  const relative = path.replace(/^shared\/asset\//i, "../Asset/");
  return new URL(relative, import.meta.url).href;
}

// ============================================================================
// 2D TRANSFORM CALCULATION
// ============================================================================
// Calculate position and scale from configuration.
// FOR FUTURE AI AGENTS: This implements the BasicStagePoint/BasicImagePoint system.
// ============================================================================

/**
 * Compute 2D transform (position + scale) from configuration
 *
 * ALGORITHM:
 * 1. Parse and clamp scale from config (10-500% → 0.1-5.0 scale factor)
 * 2. Check for new BasicStagePoint/BasicImagePoint system
 *    - If present: use pivot-based positioning
 *    - If absent: use legacy position system
 * 3. Return position and scale
 *
 * PIVOT-BASED POSITIONING:
 * BasicStagePoint: Where on stage to place the anchor (pixels)
 * BasicImagePoint: Which point on image to anchor (0-100%)
 * Result: calculatePositionForPivot ensures the image point appears at stage point
 *
 * @param entry - Layer configuration entry
 * @param stageSize - Stage size in pixels (usually 2048)
 * @param imageDimensions - Image width and height
 * @returns Transform with position and scale
 */
export function compute2DTransform(
  entry: LayerConfigEntry,
  stageSize: number,
  imageDimensions: { width: number; height: number },
): Layer2DTransform {
  const [sxPercent, syPercent] = normalizePair(entry.ImageScale, 100, 100);
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

// ============================================================================
// IMAGE DIMENSION CACHING
// ============================================================================
// Cache image dimensions to avoid redundant loading.
// FOR FUTURE AI AGENTS: This improves performance significantly.
// ============================================================================

const IMAGE_DIMENSION_CACHE = new Map<string, { width: number; height: number }>();

/**
 * Get image dimensions (with caching)
 *
 * Loads an image to get its dimensions, caches result for future use
 *
 * @param url - Image URL
 * @returns Promise resolving to { width, height }
 */
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
 * Preload critical assets in parallel
 *
 * Call early in app initialization to populate dimension cache
 *
 * @param imageIds - Array of imageIds to preload
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

/**
 * Load image from URL
 *
 * @param src - Image source URL
 * @returns Promise resolving to loaded HTMLImageElement
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ============================================================================
// LAYER PREPARATION (MAIN ENTRY POINT)
// ============================================================================
// Convert configuration to renderable layer data.
// FOR FUTURE AI AGENTS: This is THE function that StageSystem calls.
// ============================================================================

/**
 * Prepare layer data from configuration (MAIN ENTRY POINT)
 *
 * This is the PRIMARY function of layerCore. StageSystem calls this for each
 * layer to convert configuration into base layer data.
 *
 * ALGORITHM:
 * 1. Resolve asset path and URL from imageId
 * 2. Load image dimensions
 * 3. Calculate 2D transform (position + scale)
 * 4. Compute image mapping (tip, base, axis)
 * 5. Lazy evaluation: only calculate full coordinates if needed
 * 6. Return UniversalLayerData
 *
 * LAZY EVALUATION:
 * If a layer has no animations or debug flags, we skip calculating
 * tip/base/spin/orbit coordinates to improve performance.
 *
 * USAGE:
 * ```typescript
 * const layerData = await prepareLayer(configEntry, 2048);
 * ```
 *
 * @param entry - Layer configuration from ConfigYuzha.json
 * @param stageSize - Stage size in pixels (usually 2048)
 * @returns UniversalLayerData or null if asset not found
 */
export async function prepareLayer(
  entry: LayerConfigEntry,
  stageSize: number,
): Promise<UniversalLayerData | null> {
  // Performance tracking (development only)
  const IS_DEV = import.meta.env?.DEV ?? false;
  const perfStart = IS_DEV ? performance.now() : 0;

  const assetPath = resolveAssetPath(entry.ImageID);
  if (!assetPath) {
    console.warn(`[LayerCore] Missing asset for ImageID "${entry.ImageID}"`);
    return null;
  }

  const imageUrl = resolveAssetUrl(assetPath);

  // Get image dimensions FIRST - needed for pivot-based positioning
  const dimensions = await getImageDimensions(imageUrl);

  // Calculate transform with dimensions
  const { position, scale } = compute2DTransform(entry, stageSize, dimensions);

  // Calculate image mapping with imageTip and imageBase from config
  const tipAngle = typeof entry.imageTip === "number" ? entry.imageTip : 90;
  const baseAngle = typeof entry.imageBase === "number" ? entry.imageBase : 270;
  const imageMapping = computeImageMapping(dimensions, tipAngle, baseAngle);

  // Determine if we need full calculations (lazy evaluation for performance)
  const needsFullCalculation =
    entry.spinSpeed !== 0 ||
    entry.orbitSpeed !== 0 ||
    entry.orbitStagePoint !== undefined ||
    entry.orbitLinePoint !== undefined ||
    entry.orbitLine === true ||
    entry.orbitOrient === true ||
    entry.orbitImagePoint !== undefined ||
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
  let orbitLinePoint: Point2D;
  let orbitLinePercent: PercentPoint;
  let orbitLineVisible: boolean;
  let orbitRadius: number;
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

    orbitStagePoint = normalizeStagePointInput(entry.orbitStagePoint, stageCenterPoint, stageSize);
    orbitStagePercent = stagePointToPercent(orbitStagePoint, stageSize);
    orbitLinePoint = normalizeStagePointInput(entry.orbitLinePoint, orbitStagePoint, stageSize);
    orbitLinePercent = stagePointToPercent(orbitLinePoint, stageSize);
    orbitLineVisible = Boolean(entry.orbitLine);
    const radiusDx = orbitLinePoint.x - orbitStagePoint.x;
    const radiusDy = orbitLinePoint.y - orbitStagePoint.y;
    orbitRadius = Math.sqrt(radiusDx * radiusDx + radiusDy * radiusDy);
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
    orbitLinePoint = zeroPoint;
    orbitLinePercent = zeroPercent;
    orbitLineVisible = false;
    orbitRadius = 0;
    orbitImagePercent = zeroPercent;
    orbitImagePoint = zeroPoint;
    orbitImageStagePoint = zeroPoint;
    orbitImageStagePercent = zeroPercent;
  }

  // Calculate rotation from BasicImageAngle (degrees)
  const basicImageAngle = typeof entry.BasicImageAngle === "number" ? entry.BasicImageAngle : 0;
  const rotation = basicImageAngle;

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
    orbitLine: createCoordinateBundle(orbitLinePoint, orbitLinePercent),
  };

  const result = {
    LayerID: entry.LayerID,
    ImageID: entry.ImageID,
    imageUrl,
    imagePath: assetPath,
    position,
    scale,
    imageMapping,
    imageTip: tipAngle,
    imageBase: baseAngle,
    calculation,
    rotation,
    orbitStagePoint,
    orbitLinePoint,
    orbitLineVisible,
    orbitRadius,
    orbitImagePercent,
    orbitImagePoint,
    orbitOrient: Boolean(entry.orbitOrient),
  };

  // Log performance metrics in development
  if (IS_DEV) {
    const perfEnd = performance.now();
    const duration = perfEnd - perfStart;
    if (duration > 10) {
      console.log(
        `[LayerCore] prepareLayer "${entry.LayerID}" took ${duration.toFixed(2)}ms (lazy: ${!needsFullCalculation})`,
      );
    }
  }

  return result;
}

// ============================================================================
// UTILITIES
// ============================================================================
// Helper functions for layer system.
// FOR FUTURE AI AGENTS: Use these for layer filtering and checks.
// ============================================================================

/**
 * Check if layer config is for 2D rendering
 *
 * @param entry - Layer configuration entry
 * @returns true if layer uses 2D renderer
 */
export function is2DLayer(entry: LayerConfigEntry): boolean {
  return entry.renderer === "2D";
}
