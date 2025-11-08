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
 *    - Provide image center and native dimension metadata for positioning
 *    - Supply normalized coordinates used by spin and orbital processors
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
 * - Debug tooling archived (restore layerDebug.ts if overlays return)
 *
 * @module layer/layerCore
 */

import type { LayerConfigEntry } from "./Config";
import registryData from "../asset/ImageRegistry.json" assert { type: "json" };
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
  normalizePercent,
  imagePointToStagePoint,
  imagePointToPercent,
  imagePercentToImagePoint,
  stagePointToPercent,
  createCoordinateBundle,
  createDualSpaceCoordinate,
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
const IS_DEV_VALIDATION = typeof import.meta !== 'undefined' && 
                          typeof (import.meta as any).env !== 'undefined' ? 
                          (import.meta as any).env.DEV : true;

if (IS_DEV_VALIDATION) {
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
 * Defines the core geometry of an image needed for positioning
 *
 * FOR FUTURE AI AGENTS: This type was simplified to remove redundant imageCenter.
 * The image center is always calculable as (width/2, height/2).
 * Use getImageCenter() helper function to retrieve the center when needed.
 */
export type ImageMapping = {
  imageDimensions: { width: number; height: number };
};

/**
 * Get image center from ImageMapping
 *
 * FOR FUTURE AI AGENTS: Use this helper instead of accessing a cached center.
 * The center is always the geometric center of the image (width/2, height/2).
 *
 * @param mapping - ImageMapping containing dimensions
 * @returns Point2D representing image center in pixels
 */
export function getImageCenter(mapping: ImageMapping): Point2D {
  return {
    x: mapping.imageDimensions.width / 2,
    y: mapping.imageDimensions.height / 2,
  };
}

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
 * FOR FUTURE AI AGENTS: These bundles are calculated during prepareLayer()
 * and stored here for efficient access. Use them instead of recalculating.
 */
export type LayerCalculationPoints = {
  stageCenter: CoordinateBundle;
  imageCenter: DualSpaceCoordinate;
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

/**
 * Modular preparation states
 *
 * These break the legacy monolithic prepareLayer() into composable pieces.
 * Future AI agents can evolve each module independently without hidden coupling.
 */
export type BaseLayerState = {
  baseData: {
    LayerID: string;
    ImageID: string;
    imageUrl: string;
    imagePath: string;
    position: Point2D;
    scale: Point2D;
    imageMapping: ImageMapping;
    rotation: number;
    orbitOrient: boolean;
  };
  stageSize: number;
  stageCenter: CoordinateBundle;
  imageCenter: DualSpaceCoordinate;
};

export type SpinPreparationState = {
  hasSpin: boolean;
  calculation: {
    spinPoint: DualSpaceCoordinate;
  };
  spinStagePoint: Point2D;
  spinStagePercent: PercentPoint;
  spinImagePercent: PercentPoint;
  spinImagePoint: Point2D;
};

export type OrbitPreparationState = {
  hasOrbit: boolean;
  calculation: {
    orbitPoint: OrbitCoordinate;
    orbitLine: CoordinateBundle;
  };
  orbitStagePoint: Point2D;
  orbitLinePoint: Point2D;
  orbitLineVisible: boolean;
  orbitRadius: number;
  orbitImagePercent: PercentPoint;
  orbitImagePoint: Point2D;
};

const ZERO_POINT: Point2D = { x: 0, y: 0 };
const ZERO_PERCENT: PercentPoint = { x: 0, y: 0 };
const ZERO_COORDINATE_BUNDLE = createCoordinateBundle(ZERO_POINT, ZERO_PERCENT);
const ZERO_DUAL_COORDINATE = createDualSpaceCoordinate(
  ZERO_POINT,
  ZERO_PERCENT,
  ZERO_POINT,
  ZERO_PERCENT,
);

// ============================================================================
// IMAGE MAPPING
// ============================================================================
// With debug visuals removed, the mapping only needs image center and size.
// FOR FUTURE AI AGENTS: Extend this if you reintroduce directional metadata.
// ============================================================================

/**
 * Compute image mapping from dimensions
 *
 * FOR FUTURE AI AGENTS: Simplified to only store dimensions.
 * Image center is calculated on-demand using getImageCenter() helper.
 * This keeps the pipeline lightweight while still supporting pivot-based
 * positioning and spin/orbit calculations.
 *
 * @param imageDimensions - Image width and height
 * @returns ImageMapping with dimensions only
 */
export function computeImageMapping(imageDimensions: {
  width: number;
  height: number;
}): ImageMapping {
  const { width, height } = imageDimensions;
  return {
    imageDimensions: { width, height },
  };
}

/**
 * Prepare the basic, renderer-agnostic layer state.
 * This module resolves assets, calculates base transforms, and supplies
 * the dual-space image center the other modules rely on.
 */
export async function prepareBasicState(
  entry: LayerConfigEntry,
  stageSize: number,
): Promise<BaseLayerState | null> {
  const assetPath = resolveAssetPath(entry.ImageID);
  if (!assetPath) {
    console.warn(`[LayerCore] Missing asset for ImageID "${entry.ImageID}"`);
    return null;
  }

  const imageUrl = resolveAssetUrl(assetPath);
  const imageDimensions = await getImageDimensions(imageUrl);

  const { position, scale } = compute2DTransform(entry, stageSize, imageDimensions);
  const imageMapping = computeImageMapping(imageDimensions);

  const stageCenterValue = stageSize / 2;
  const stageCenterPoint: Point2D = { x: stageCenterValue, y: stageCenterValue };
  const stageCenterPercent = stagePointToPercent(stageCenterPoint, stageSize);

  const imageCenter = getImageCenter(imageMapping);
  const imageCenterStage = imagePointToStagePoint(
    imageCenter,
    imageMapping.imageDimensions,
    scale,
    position,
  );
  const imageCenterPercent = imagePointToPercent(imageCenter, imageMapping.imageDimensions);
  const imageCenterStagePercent = stagePointToPercent(imageCenterStage, stageSize);

  const rotation = typeof entry.BasicImageAngle === "number" ? entry.BasicImageAngle : 0;

  return {
    baseData: {
      LayerID: entry.LayerID,
      ImageID: entry.ImageID,
      imageUrl,
      imagePath: assetPath,
      position,
      scale,
      imageMapping,
      rotation,
      orbitOrient: Boolean(entry.orbitOrient),
    },
    stageSize,
    stageCenter: createCoordinateBundle(stageCenterPoint, stageCenterPercent),
    imageCenter: createDualSpaceCoordinate(
      imageCenter,
      imageCenterPercent,
      imageCenterStage,
      imageCenterStagePercent,
    ),
  };
}

/**
 * Prepare spin-specific coordinates and metadata.
 * Accepts only BaseLayerState so it has no hidden dependency on orbit math.
 */
export function prepareSpinState(
  baseState: BaseLayerState,
  entry: LayerConfigEntry,
): SpinPreparationState {
  const { baseData, stageSize } = baseState;
  const hasSpinConfig =
    entry.spinStagePoint !== undefined ||
    entry.spinImagePoint !== undefined ||
    (typeof entry.spinSpeed === "number" && entry.spinSpeed !== 0);

  if (!hasSpinConfig) {
    return {
      hasSpin: false,
      calculation: { spinPoint: ZERO_DUAL_COORDINATE },
      spinStagePoint: ZERO_POINT,
      spinStagePercent: ZERO_PERCENT,
      spinImagePercent: ZERO_PERCENT,
      spinImagePoint: ZERO_POINT,
    };
  }

  const spinStagePoint = normalizeStagePointInput(
    entry.spinStagePoint,
    baseData.position,
    stageSize,
  );
  const spinStagePercent = stagePointToPercent(spinStagePoint, stageSize);
  const spinImagePercent = normalizePercentInput(entry.spinImagePoint, 50, 50);
  const spinImagePoint = imagePercentToImagePoint(
    spinImagePercent,
    baseData.imageMapping.imageDimensions,
  );

  const spinPoint = createDualSpaceCoordinate(
    spinImagePoint,
    spinImagePercent,
    spinStagePoint,
    spinStagePercent,
  );

  return {
    hasSpin: true,
    calculation: { spinPoint },
    spinStagePoint,
    spinStagePercent,
    spinImagePercent,
    spinImagePoint,
  };
}

/**
 * Prepare orbit-specific coordinates and metadata.
 * Consumes only BaseLayerState to stay independent from spin logic.
 */
export function prepareOrbitState(
  baseState: BaseLayerState,
  entry: LayerConfigEntry,
): OrbitPreparationState {
  const { baseData, stageCenter, stageSize } = baseState;

  const orbitConfigured =
    entry.orbitStagePoint !== undefined ||
    entry.orbitLinePoint !== undefined ||
    entry.orbitImagePoint !== undefined ||
    entry.orbitLine === true ||
    entry.orbitOrient === true ||
    (typeof entry.orbitSpeed === "number" && entry.orbitSpeed !== 0);

  if (!orbitConfigured) {
    return {
      hasOrbit: false,
      calculation: {
        orbitPoint: {
          ...ZERO_DUAL_COORDINATE,
          stageAnchor: ZERO_COORDINATE_BUNDLE,
        },
        orbitLine: ZERO_COORDINATE_BUNDLE,
      },
      orbitStagePoint: ZERO_POINT,
      orbitLinePoint: ZERO_POINT,
      orbitLineVisible: false,
      orbitRadius: 0,
      orbitImagePercent: ZERO_PERCENT,
      orbitImagePoint: ZERO_POINT,
    };
  }

  const orbitStagePoint = normalizeStagePointInput(
    entry.orbitStagePoint,
    stageCenter.point,
    stageSize,
  );
  const orbitStagePercent = stagePointToPercent(orbitStagePoint, stageSize);

  const orbitLinePoint = normalizeStagePointInput(entry.orbitLinePoint, orbitStagePoint, stageSize);
  const orbitLinePercent = stagePointToPercent(orbitLinePoint, stageSize);
  const orbitLineVisible = Boolean(entry.orbitLine);

  const radiusDx = orbitLinePoint.x - orbitStagePoint.x;
  const radiusDy = orbitLinePoint.y - orbitStagePoint.y;
  const orbitRadius = Math.sqrt(radiusDx * radiusDx + radiusDy * radiusDy);

  const orbitImagePercent = normalizePercentInput(entry.orbitImagePoint, 50, 50);
  const orbitImagePoint = imagePercentToImagePoint(
    orbitImagePercent,
    baseData.imageMapping.imageDimensions,
  );
  const orbitImageStagePoint = imagePointToStagePoint(
    orbitImagePoint,
    baseData.imageMapping.imageDimensions,
    baseData.scale,
    baseData.position,
  );
  const orbitImageStagePercent = stagePointToPercent(orbitImageStagePoint, stageSize);

  const orbitPoint = {
    ...createDualSpaceCoordinate(
      orbitImagePoint,
      orbitImagePercent,
      orbitStagePoint,
      orbitStagePercent,
    ),
    stageAnchor: createCoordinateBundle(orbitImageStagePoint, orbitImageStagePercent),
  };

  return {
    hasOrbit: true,
    calculation: {
      orbitPoint,
      orbitLine: createCoordinateBundle(orbitLinePoint, orbitLinePercent),
    },
    orbitStagePoint,
    orbitLinePoint,
    orbitLineVisible,
    orbitRadius,
    orbitImagePercent,
    orbitImagePoint,
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
      x: normalizePercent(imgPercentX),
      y: normalizePercent(imgPercentY),
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
 * 1. `prepareBasicState` resolves assets and calculates base transforms.
 * 2. `prepareSpinState` derives pivot coordinates when spin config exists.
 * 3. `prepareOrbitState` derives orbit geometry when orbit config exists.
 * 4. Merge the modular results into `UniversalLayerData`.
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
  const IS_DEV = typeof import.meta !== 'undefined' && 
                 typeof (import.meta as any).env !== 'undefined' ? 
                 (import.meta as any).env.DEV : false;
  const perfStart = IS_DEV ? performance.now() : 0;

  const baseState = await prepareBasicState(entry, stageSize);
  if (!baseState) return null;

  const spinState = prepareSpinState(baseState, entry);
  const orbitState = prepareOrbitState(baseState, entry);

  const calculation: LayerCalculationPoints = {
    stageCenter: baseState.stageCenter,
    imageCenter: baseState.imageCenter,
    spinPoint: spinState.calculation.spinPoint,
    orbitPoint: orbitState.calculation.orbitPoint,
    orbitLine: orbitState.calculation.orbitLine,
  };

  const result: UniversalLayerData = {
    ...baseState.baseData,
    calculation,
    orbitStagePoint: orbitState.orbitStagePoint,
    orbitLinePoint: orbitState.orbitLinePoint,
    orbitLineVisible: orbitState.orbitLineVisible,
    orbitRadius: orbitState.orbitRadius,
    orbitImagePercent: orbitState.orbitImagePercent,
    orbitImagePoint: orbitState.orbitImagePoint,
  };

  if (IS_DEV) {
    const perfEnd = performance.now();
    const duration = perfEnd - perfStart;
    if (duration > 10) {
      console.log(
        `[LayerCore] prepareLayer "${entry.LayerID}" took ${duration.toFixed(2)}ms (modules: spin=${spinState.hasSpin}, orbit=${orbitState.hasOrbit})`,
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
