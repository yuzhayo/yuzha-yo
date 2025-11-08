/**
 * ============================================================================
 * LAYER ENGINE - Runtime Execution & Processing
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This is the EXECUTION ENGINE for the layer system. All runtime operations,
 * calculations, and processing logic live here. Think of this as the "brain"
 * that brings static models to life.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * ----------------------------------
 * This file contains ALL runtime logic - no business logic should live in
 * model.ts or math.ts. Those files are pure contracts and pure functions.
 * This file orchestrates those contracts and functions into a working system.
 *
 * WHAT THIS FILE CONTAINS:
 * ------------------------
 * 1. Asset Loading (image registry, path resolution, dimension caching)
 * 2. Image Mapping (geometry calculation)
 * 3. Layer Preparation (convert config → renderable data)
 * 4. Motion Processing (spin & orbit animation builders)
 * 5. Processor Registry (plugin system for layer behaviors)
 * 6. Pipeline Execution (run processors on layers)
 * 7. Animation Utilities (angle normalization, orbit calculations, easing)
 * 8. Performance Utilities (caching, batching, static buffers)
 *
 * DEPENDENCY RULES:
 * -----------------
 * - THIS FILE: Imports types from model.ts, functions from math.ts
 * - model.ts: Imports nothing (pure types and config)
 * - math.ts: Imports only types from model.ts (pure functions)
 * - Other modules: Import from THIS FILE for runtime operations
 *
 * @module layer/engine
 */

import type {
  Point2D,
  PercentPoint,
  Layer2DTransform,
  ImageMapping,
  UniversalLayerData,
  LayerCalculationPoints,
  BaseLayerState,
  SpinPreparationState,
  OrbitPreparationState,
  LayerConfigEntry,
  RotationDirection,
  ClockSpeedAlias,
  TimeFormat,
  ClockMotionConfig,
  ResolvedClockSpeed,
} from "./model";

import {
  imagePointToStagePoint,
  imagePointToPercent,
  imagePercentToImagePoint,
  stagePointToPercent,
  createCoordinateBundle,
  createDualSpaceCoordinate,
  normalizePair,
  clampedPercentToScale,
  normalizePercentInput,
  normalizeStagePointInput,
  normalizePercent,
} from "./math";

import { calculateRotationDegrees, resolveClockSpeed } from "./clockTime";

import registryData from "../Asset/ImageRegistry.json" assert { type: "json" };

// ============================================================================
// SECTION 1: ASSET LOADING & RESOLUTION
// ============================================================================
// Convert imageId to file paths, URLs, and load image dimensions.
// FOR FUTURE AI AGENTS: This is how we find and load image files.
// ============================================================================

type AssetRegistryEntry = { id: string; path: string };
const registry = registryData as Array<AssetRegistryEntry>;

// Validate registry entries at initialization (development only)
const IS_DEV_VALIDATION =
  typeof import.meta !== "undefined" && typeof (import.meta as any).env !== "undefined"
    ? (import.meta as any).env.DEV
    : true;

if (IS_DEV_VALIDATION) {
  registry.forEach((entry, index) => {
    if (!entry.id || typeof entry.id !== "string") {
      console.error(`[Engine] Invalid asset registry entry #${index}: missing or invalid id`);
    }
    if (!entry.path || typeof entry.path !== "string") {
      console.error(
        `[Engine] Invalid asset registry entry #${index} (${entry.id}): missing or invalid path`,
      );
    }
  });
}

const pathMap = new Map(registry.map((entry) => [entry.id, entry.path]));

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

/**
 * Image dimension cache for performance
 * Avoids redundant image loading for dimensions
 */
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
      console.warn(`[Engine] Failed to preload asset "${imageId}":`, error);
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
// SECTION 2: IMAGE MAPPING
// ============================================================================
// Calculate image geometry information needed for positioning.
// FOR FUTURE AI AGENTS: This provides metadata about image dimensions.
// ============================================================================

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

// ============================================================================
// SECTION 3: LAYER PREPARATION
// ============================================================================
// Convert configuration to renderable layer data.
// FOR FUTURE AI AGENTS: This is THE main entry point for layer preparation.
// ============================================================================

const ZERO_POINT: Point2D = { x: 0, y: 0 };
const ZERO_PERCENT: PercentPoint = { x: 0, y: 0 };
const ZERO_COORDINATE_BUNDLE = createCoordinateBundle(ZERO_POINT, ZERO_PERCENT);
const ZERO_DUAL_COORDINATE = createDualSpaceCoordinate(
  ZERO_POINT,
  ZERO_PERCENT,
  ZERO_POINT,
  ZERO_PERCENT,
);

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
    // Use the basic (non-rotation-aware) version for initial positioning
    const position = calculatePositionForPivotBasic(
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

/**
 * Basic (non-rotation-aware) pivot-based positioning
 * Used for initial layer positioning from BasicStagePoint/BasicImagePoint
 *
 * @param stageAnchor - Where we want the image point to appear on stage
 * @param imagePercent - Which point on image (0-100%) to anchor
 * @param imageDimensions - Image width and height
 * @param scale - Scale factors
 * @returns Position where image center should be placed for rendering
 */
function calculatePositionForPivotBasic(
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
  const position: Point2D = {
    x: stageAnchor.x - scaledOffset.x,
    y: stageAnchor.y - scaledOffset.y,
  };

  return position;
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
    console.warn(`[Engine] Missing asset for ImageID "${entry.ImageID}"`);
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

/**
 * Prepare layer data from configuration (MAIN ENTRY POINT)
 *
 * This is the PRIMARY function of the engine. StageSystem calls this for each
 * layer to convert configuration into renderable data.
 *
 * ALGORITHM:
 * 1. Prepare basic state (asset loading, position, scale)
 * 2. Prepare spin state (if layer has spin)
 * 3. Prepare orbit state (if layer has orbit)
 * 4. Combine all states into UniversalLayerData
 * 5. Return complete layer data ready for rendering
 *
 * @param entry - Layer configuration from ConfigYuzha.json
 * @param stageSize - Stage size in pixels (usually 2048)
 * @returns Promise resolving to UniversalLayerData or null if invalid
 */
export async function prepareLayer(
  entry: LayerConfigEntry,
  stageSize: number,
): Promise<UniversalLayerData | null> {
  const baseState = await prepareBasicState(entry, stageSize);
  if (!baseState) return null;

  const spinState = prepareSpinState(baseState, entry);
  const orbitState = prepareOrbitState(baseState, entry);

  const calculation: LayerCalculationPoints = {
    stageCenter: baseState.stageCenter,
    imageCenter: baseState.imageCenter,
    spinPoint: spinState.calculation.spinPoint,
    orbitPoint: orbitState.calculation.orbitPoint,
    orbitLine: orbitState.hasOrbit ? orbitState.calculation.orbitLine : undefined,
  };

  const layer: UniversalLayerData = {
    ...baseState.baseData,
    calculation,
    orbitStagePoint: orbitState.hasOrbit ? orbitState.orbitStagePoint : undefined,
    orbitLinePoint: orbitState.hasOrbit ? orbitState.orbitLinePoint : undefined,
    orbitLineVisible: orbitState.orbitLineVisible,
    orbitRadius: orbitState.hasOrbit ? orbitState.orbitRadius : undefined,
    orbitImagePercent: orbitState.hasOrbit ? orbitState.orbitImagePercent : undefined,
    orbitImagePoint: orbitState.hasOrbit ? orbitState.orbitImagePoint : undefined,
  };

  return layer;
}

/**
 * Check if layer uses 2D renderer
 *
 * @param entry - Layer configuration entry
 * @returns true if layer uses 2D renderer
 */
export function is2DLayer(entry: LayerConfigEntry): boolean {
  return entry.renderer === "2D";
}

// ============================================================================
// SECTION 4: MOTION PROCESSING
// ============================================================================
// Build motion processors for spin and orbit animations.
// FOR FUTURE AI AGENTS: This creates the runtime animation logic.
// ============================================================================

/**
 * Layer motion marker (for debug visualization)
 */
export type LayerMotionMarker = {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  kind?: "point" | "circle";
  lineWidth?: number;
  motion?: {
    type: "orbit";
    centerX: number;
    centerY: number;
    radius: number;
    rotationsPerHour: number;
    direction: RotationDirection;
    initialAngleDeg: number;
  };
};

/**
 * Motion artifacts (processor + markers)
 */
export type LayerMotionArtifacts = {
  processor?: LayerProcessor;
  markers?: LayerMotionMarker[];
};

type LayerMotionConfig = {
  stageSize: number;
  blueStage: Point2D;
  blueVisible: boolean;
  redStage?: Point2D;
  redVisible: boolean;
  circleVisible: boolean;
  pivotPercent: PercentPoint;
  pivotVisible: boolean;
  circleRadius?: number;
  initialAngleDeg?: number;
  spinMotion: MotionResolution;
  orbitMotion: MotionResolution;
};

type MotionResolution = {
  active: boolean;
  motionConfig?: ClockMotionConfig;
  resolved: ResolvedClockSpeed;
};

type ProcessorState = {
  startPerfTime?: number;
  startWallClockMs?: number;
  spinTimezoneCache: Map<number, Date>;
  orbitTimezoneCache: Map<number, Date>;
};

/**
 * Build layer motion processor and markers
 *
 * MAIN ENTRY POINT for motion system. Creates animation processor for layer.
 *
 * @param entry - Layer configuration
 * @param layer - Prepared layer data
 * @param stageSize - Stage size in pixels
 * @returns Motion artifacts (processor and markers)
 */
export function buildLayerMotion(
  entry: LayerConfigEntry,
  layer: UniversalLayerData,
  stageSize: number,
): LayerMotionArtifacts {
  const config = deriveLayerMotionConfig(entry, stageSize);
  if (!config) {
    return {};
  }

  const markers = createMotionMarkers(entry.LayerID, config);
  const processor = createLayerMotionProcessor(entry, config, layer.imageMapping);

  return {
    processor,
    markers: markers.length > 0 ? markers : undefined,
  };
}

function deriveLayerMotionConfig(
  entry: LayerConfigEntry,
  stageSize: number,
): LayerMotionConfig | null {
  const stageCenter = { x: stageSize / 2, y: stageSize / 2 };

  const pivotPercent = sanitizePercent(entry.spinImagePoint) ??
    sanitizePercent(entry.BasicImagePoint) ?? {
      x: 50,
      y: 50,
    };

  const blueStage =
    sanitizeStagePoint(entry.spinStagePoint, stageSize) ??
    sanitizeStagePoint(entry.orbitLinePoint, stageSize) ??
    sanitizeStagePoint(entry.BasicStagePoint, stageSize) ??
    stageCenter;

  const redStage = sanitizeStagePoint(entry.orbitStagePoint, stageSize);

  const circleRadius = redStage !== undefined ? distanceBetween(blueStage, redStage) : undefined;
  const initialAngleDeg =
    redStage !== undefined && circleRadius !== undefined && circleRadius > 0
      ? ((Math.atan2(-(blueStage.y - redStage.y), blueStage.x - redStage.x) * 180) / Math.PI +
          360) %
        360
      : undefined;

  const spinMotion = resolveMotion(
    {
      speed: entry.spinSpeedAlias ?? entry.spinSpeed,
      direction: entry.spinDirection,
      format: entry.spinFormat,
      timezone: entry.spinTimezone,
    },
    entry.spinSpeed ?? 0,
  );

  const orbitMotion = resolveMotion(
    {
      speed: entry.orbitSpeedAlias ?? entry.orbitSpeed,
      direction: entry.orbitDirection,
      format: entry.orbitFormat,
      timezone: entry.orbitTimezone,
    },
    entry.orbitSpeed ?? 0,
  );

  const spinActive = spinMotion.active;
  const orbitActive =
    redStage !== undefined && circleRadius !== undefined && circleRadius > 0 && orbitMotion.active;

  if (!spinActive && !orbitActive) {
    return null;
  }

  return {
    stageSize,
    blueStage,
    blueVisible: true,
    redStage,
    redVisible: Boolean(redStage),
    circleVisible: Boolean(entry.orbitLine),
    pivotPercent,
    pivotVisible: Boolean(entry.spinImagePoint),
    circleRadius,
    initialAngleDeg,
    spinMotion,
    orbitMotion: orbitActive
      ? orbitMotion
      : {
          active: false,
          motionConfig: undefined,
          resolved: orbitMotion.resolved,
        },
  };
}

/**
 * CRITICAL: Rotation-aware pivot positioning
 *
 * This is the CORRECT implementation that supports rotation.
 * Used by motion processor to position layers with spin animation.
 * Supports extended range pivots like spinImagePoint: [50, 118].
 *
 * FROM: layerMotion.ts lines 381-413
 *
 * @param stageAnchor - Stage point to anchor to
 * @param pivotPercent - Image pivot point (percentage, can exceed 0-100)
 * @param imageMapping - Image geometry
 * @param scale - Scale factors
 * @param rotationDeg - Rotation angle in degrees
 * @returns Position where image center should be placed
 */
function calculatePositionForPivot(
  stageAnchor: Point2D,
  pivotPercent: PercentPoint,
  imageMapping: ImageMapping,
  scale: Point2D,
  rotationDeg: number,
): Point2D {
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const imageCenter = getImageCenter(imageMapping);

  const pivotPoint: Point2D = {
    x: (pivotPercent.x / 100) * imageMapping.imageDimensions.width,
    y: (pivotPercent.y / 100) * imageMapping.imageDimensions.height,
  };

  const offsetFromCenter: Point2D = {
    x: (pivotPoint.x - imageCenter.x) * scale.x,
    y: (pivotPoint.y - imageCenter.y) * scale.y,
  };

  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);

  const rotatedOffset: Point2D = {
    x: offsetFromCenter.x * cosR - offsetFromCenter.y * sinR,
    y: offsetFromCenter.x * sinR + offsetFromCenter.y * cosR,
  };

  return {
    x: stageAnchor.x - rotatedOffset.x,
    y: stageAnchor.y - rotatedOffset.y,
  };
}

function createLayerMotionProcessor(
  entry: LayerConfigEntry,
  config: LayerMotionConfig,
  imageMapping: ImageMapping,
): LayerProcessor | undefined {
  const state: ProcessorState = {
    spinTimezoneCache: new Map<number, Date>(),
    orbitTimezoneCache: new Map<number, Date>(),
  };

  const hasSpin = config.spinMotion.active;
  const hasOrbit = config.orbitMotion.active && config.redStage && config.circleRadius;

  if (!hasSpin && !hasOrbit) {
    return undefined;
  }

  const pivotPercent = config.pivotPercent;

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    const perfNow = timestamp ?? performance.now();

    if (state.startPerfTime === undefined) {
      state.startPerfTime = perfNow;
      state.startWallClockMs = Date.now();
    }

    const baseNowMs =
      state.startWallClockMs !== undefined && state.startPerfTime !== undefined
        ? state.startWallClockMs + (perfNow - state.startPerfTime)
        : Date.now();

    const baseDate = new Date(baseNowMs);

    let rotationDeg = layer.rotation ?? 0;
    if (hasSpin) {
      rotationDeg = normalizeAngle(
        calculateRotationDegrees(
          config.spinMotion.resolved,
          baseDate,
          state.spinTimezoneCache,
          state.startWallClockMs,
        ),
      );
    }

    let orbitPoint = config.blueStage;
    let currentOrbitAngle = config.initialAngleDeg ?? 0;

    if (hasOrbit && config.redStage && config.circleRadius !== undefined) {
      const orbitAngleDelta = calculateRotationDegrees(
        config.orbitMotion.resolved,
        baseDate,
        state.orbitTimezoneCache,
        state.startWallClockMs,
      );

      currentOrbitAngle = normalizeAngle((config.initialAngleDeg ?? 0) + orbitAngleDelta);
      const angleRad = (currentOrbitAngle * Math.PI) / 180;

      orbitPoint = {
        x: config.redStage.x + config.circleRadius * Math.cos(angleRad),
        y: config.redStage.y - config.circleRadius * Math.sin(angleRad),
      };
    }

    const newPosition = calculatePositionForPivot(
      orbitPoint,
      pivotPercent,
      imageMapping,
      layer.scale,
      rotationDeg,
    );

    const motionAugments: Record<string, unknown> = {
      position: newPosition,
      currentRotation: rotationDeg,
      hasSpinAnimation: hasSpin,
      spinDirection: entry.spinDirection ?? "cw",
      spinSpeed:
        entry.spinSpeed ??
        (config.spinMotion.resolved.kind === "numeric"
          ? config.spinMotion.resolved.rotationsPerHour
          : 0),
      spinSpeedAlias:
        entry.spinSpeedAlias ??
        (config.spinMotion.resolved.kind === "alias"
          ? config.spinMotion.resolved.alias
          : undefined),
      spinFormat: entry.spinFormat,
      spinTimezone: entry.spinTimezone,
      spinStagePoint: orbitPoint,
      spinPercent: pivotPercent,
      hasOrbitalAnimation: hasOrbit,
      orbitPoint,
      orbitStagePoint: config.redStage,
      orbitLinePoint: config.blueStage,
      orbitLineVisible: config.circleVisible,
      orbitRadius: config.circleRadius,
      orbitSpeed:
        entry.orbitSpeed ??
        (config.orbitMotion.resolved.kind === "numeric"
          ? config.orbitMotion.resolved.rotationsPerHour
          : 0),
      orbitSpeedAlias:
        entry.orbitSpeedAlias ??
        (config.orbitMotion.resolved.kind === "alias"
          ? config.orbitMotion.resolved.alias
          : undefined),
      orbitFormat: entry.orbitFormat,
      orbitTimezone: entry.orbitTimezone,
      orbitDirection: entry.orbitDirection ?? "cw",
      orbitLineStyle:
        config.circleVisible && config.circleRadius
          ? { radius: config.circleRadius, visible: true }
          : undefined,
      currentOrbitAngle: currentOrbitAngle,
    };

    return {
      ...layer,
      ...motionAugments,
    } as EnhancedLayerData;
  };
}

function createMotionMarkers(layerId: string, config: LayerMotionConfig): LayerMotionMarker[] {
  const markers: LayerMotionMarker[] = [];

  if (config.redStage) {
    markers.push({
      id: `${layerId}-StageRed`,
      x: config.redStage.x,
      y: config.redStage.y,
      color: "#ef4444",
      radius: 6,
      kind: "point",
    });
  }

  if (config.blueStage) {
    const motion =
      config.orbitMotion.active &&
      config.redStage &&
      config.circleRadius &&
      config.initialAngleDeg !== undefined
        ? {
            type: "orbit" as const,
            centerX: config.redStage.x,
            centerY: config.redStage.y,
            radius: config.circleRadius,
            rotationsPerHour: resolveRotationsPerHour(config.orbitMotion.resolved),
            direction: (config.orbitMotion.motionConfig?.direction ?? "cw") as RotationDirection,
            initialAngleDeg: config.initialAngleDeg,
          }
        : undefined;

    markers.push({
      id: `${layerId}-StageBlue`,
      x: config.blueStage.x,
      y: config.blueStage.y,
      color: "#3b82f6",
      radius: 6,
      kind: "point",
      motion,
    });
  }

  if (config.circleVisible && config.redStage && config.circleRadius) {
    markers.push({
      id: `${layerId}-StageCircle`,
      x: config.redStage.x,
      y: config.redStage.y,
      color: "rgba(255, 255, 255, 0.9)",
      radius: config.circleRadius,
      kind: "circle",
      lineWidth: 1,
    });
  }

  if (config.pivotVisible) {
    markers.push({
      id: `${layerId}-ImagePivot`,
      x: config.blueStage.x,
      y: config.blueStage.y,
      color: "#facc15",
      radius: 3,
      kind: "point",
    });
  }

  return markers;
}

function resolveMotion(motion: ClockMotionConfig, fallbackNumeric: number): MotionResolution {
  const hasConfig =
    motion.speed !== undefined || motion.format !== undefined || motion.timezone !== undefined;

  const resolved = resolveClockSpeed(hasConfig ? motion : undefined, 0, fallbackNumeric);

  const active =
    resolved.kind === "alias" || (resolved.kind === "numeric" && resolved.rotationsPerHour !== 0);

  return {
    active,
    motionConfig: hasConfig ? motion : undefined,
    resolved,
  };
}

function sanitizePercent(value?: number[] | PercentPoint | null): PercentPoint | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length < 2) return undefined;
    const x = value[0];
    const y = value[1];
    if (x === undefined || y === undefined) return undefined;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
    return {
      x: normalizePercent(x),
      y: normalizePercent(y),
    };
  }
  if (typeof value.x === "number" && typeof value.y === "number") {
    return {
      x: normalizePercent(value.x),
      y: normalizePercent(value.y),
    };
  }
  return undefined;
}

function sanitizeStagePoint(value: number[] | undefined, stageSize: number): Point2D | undefined {
  if (!value || value.length < 2) return undefined;
  const x = value[0];
  const y = value[1];
  if (x === undefined || y === undefined) return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return {
    x: clampStageCoordinate(x, stageSize),
    y: clampStageCoordinate(y, stageSize),
  };
}

function clampStageCoordinate(value: number, stageSize: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(stageSize, value));
}

function distanceBetween(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function resolveRotationsPerHour(resolved: ResolvedClockSpeed): number {
  if (resolved.kind === "numeric") {
    return resolved.rotationsPerHour;
  }
  if (resolved.kind === "alias") {
    switch (resolved.alias) {
      case "second":
        return 60;
      case "minute":
        return 1;
      case "hour":
        return 1 / 12;
      default:
        return 0;
    }
  }
  return 0;
}

// ============================================================================
// SECTION 5: PROCESSOR REGISTRY & PIPELINE
// ============================================================================
// Plugin system for layer behaviors and pipeline execution.
// FOR FUTURE AI AGENTS: This is how processors are registered and run.
// ============================================================================

/**
 * Layer processor function type - transforms UniversalLayerData into EnhancedLayerData
 *
 * Processors can:
 * - Add new properties (spin rotation, orbital position, or other custom state)
 * - Modify existing properties (position, rotation, visibility)
 * - Use timestamp for time-based animations
 *
 * @param layer - Base or enhanced layer data
 * @param timestamp - Optional timestamp in milliseconds for animations
 * @returns Enhanced layer data with added/modified properties
 */
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/**
 * Enhanced universal layer data that can include additional properties from processors
 *
 * Base properties (from UniversalLayerData):
 * - imageMapping, calculation, position, scale, rotation, layerId
 *
 * Processor-added properties:
 * - Spin, Orbital, and other processor properties
 */
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  spinSpeedAlias?: ClockSpeedAlias;
  spinFormat?: TimeFormat;
  spinTimezone?: string;
  currentRotation?: number;
  hasSpinAnimation?: boolean;
  spinStagePoint?: Point2D;
  spinPercent?: PercentPoint;

  // Orbital properties
  orbitSpeed?: number;
  orbitSpeedAlias?: ClockSpeedAlias;
  orbitFormat?: TimeFormat;
  orbitTimezone?: string;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;
  orbitPoint?: Point2D;
  orbitLineStyle?: {
    radius: number;
    visible: boolean;
  };

  // Future properties
  opacity?: number;
  filters?: string[];
};

/**
 * Context for processor attachment decisions
 */
export type ProcessorContext = {
  force?: Record<string, unknown>;
};

/**
 * Processor plugin definition
 */
type ProcessorPlugin = {
  name: string;
  shouldAttach(entry: LayerConfigEntry, context?: ProcessorContext): boolean;
  create(entry: LayerConfigEntry, context?: ProcessorContext): LayerProcessor;
};

/**
 * Internal registry of all processor plugins
 */
const plugins: ProcessorPlugin[] = [];

/**
 * Register a processor plugin
 *
 * @param plugin - Processor plugin definition
 */
export function registerProcessor(plugin: ProcessorPlugin): void {
  const existingIndex = plugins.findIndex((p) => p.name === plugin.name);
  if (existingIndex >= 0) {
    plugins.splice(existingIndex, 1, plugin);
  } else {
    plugins.push(plugin);
  }
}

/**
 * Get all processors that should be attached to a layer
 *
 * @param entry - Layer configuration
 * @param context - Optional runtime context
 * @returns Array of processor functions
 */
export function getProcessorsForEntry(
  entry: LayerConfigEntry,
  context?: ProcessorContext,
): LayerProcessor[] {
  const attached: LayerProcessor[] = [];
  for (const plugin of plugins) {
    try {
      if (plugin.shouldAttach(entry, context)) {
        attached.push(plugin.create(entry, context));
      }
    } catch (error) {
      console.warn(
        `[Engine] Failed to attach processor "${plugin.name}" for layer "${entry.LayerID}":`,
        error,
      );
    }
  }
  return attached;
}

/**
 * Run layer data through a pipeline of processors
 *
 * @param baseLayer - The base layer data
 * @param processors - Array of processors to apply in sequence
 * @param timestamp - Optional timestamp for time-based processors
 * @returns Enhanced layer data with all processor modifications
 */
export function runPipeline(
  baseLayer: UniversalLayerData,
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData {
  let enhanced: EnhancedLayerData = { ...baseLayer };

  for (const processor of processors) {
    enhanced = processor(enhanced, timestamp);
  }

  return enhanced;
}

/**
 * Process multiple layers through the same pipeline
 *
 * @param baseLayers - Array of base layers to process
 * @param processors - Array of processors to apply to each layer
 * @param timestamp - Optional timestamp for time-based processors
 * @returns Array of enhanced layers
 */
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData[] {
  return baseLayers.map((layer) => runPipeline(layer, processors, timestamp));
}

// ============================================================================
// SECTION 6: ANIMATION UTILITIES
// ============================================================================
// Helper functions for animations and calculations.
// FOR FUTURE AI AGENTS: Use these for common animation operations.
// ============================================================================

/**
 * Animation constants for common calculations
 */
export const AnimationConstants = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  QUARTER_PI: Math.PI / 4,
} as const;

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * AnimationConstants.DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * AnimationConstants.RAD_TO_DEG;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Apply rotation direction to angle
 */
export function applyRotationDirection(angle: number, direction: "cw" | "ccw"): number {
  return direction === "ccw" ? -angle : angle;
}

/**
 * Calculate position on circular orbit
 */
export function calculateOrbitPosition(
  center: Point2D,
  radius: number,
  angleInDegrees: number,
): Point2D {
  const angleRad = degreesToRadians(angleInDegrees);
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
  };
}

/**
 * Calculate elapsed time from timestamp and start time
 */
export function calculateElapsedTime(
  timestamp: number,
  startTime?: number,
): { elapsed: number; effectiveStartTime: number } {
  if (startTime === undefined) {
    return { elapsed: timestamp, effectiveStartTime: 0 };
  }
  const elapsed = timestamp - startTime;
  return { elapsed, effectiveStartTime: startTime };
}

/**
 * Check if point is within bounds
 */
export function isPointInBounds(
  point: Point2D,
  bounds: { min: number; max: number },
  margin: number = 0,
): boolean {
  return (
    point.x >= bounds.min - margin &&
    point.x <= bounds.max + margin &&
    point.y >= bounds.min - margin &&
    point.y <= bounds.max + margin
  );
}

/**
 * Calculate if orbital layer is visible on stage
 */
export function calculateOrbitalVisibility(
  position: Point2D,
  dimensions: { width: number; height: number },
  stageBounds: { min: number; max: number },
): boolean {
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  return !(
    position.x + halfWidth < stageBounds.min ||
    position.x - halfWidth > stageBounds.max ||
    position.y + halfHeight < stageBounds.min ||
    position.y - halfHeight > stageBounds.max
  );
}

/**
 * Ease-in-out quadratic easing function
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Elastic easing out function
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Bounce easing out function
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  }
  if (t < 2 / d1) {
    const p = t - 1.5 / d1;
    return n1 * p * p + 0.75;
  }
  if (t < 2.5 / d1) {
    const p = t - 2.25 / d1;
    return n1 * p * p + 0.9375;
  }
  const p = t - 2.625 / d1;
  return n1 * p * p + 0.984375;
}

// ============================================================================
// SECTION 7: PERFORMANCE UTILITIES
// ============================================================================
// Utilities for optimizing layer rendering performance.
// FOR FUTURE AI AGENTS: Use these for performance optimization.
// ============================================================================

/**
 * Frame-based cache for pipeline results
 */
export class PipelineCache<T = EnhancedLayerData> {
  private frameId: number = 0;
  private cache = new Map<string, { frameId: number; value: T }>();

  get(layerId: string, factory: () => T): T {
    const cached = this.cache.get(layerId);
    if (cached && cached.frameId === this.frameId) {
      return cached.value;
    }
    const value = factory();
    this.cache.set(layerId, { frameId: this.frameId, value });
    return value;
  }

  clear(): void {
    this.cache.clear();
  }

  nextFrame(): void {
    this.clear();
    this.frameId++;
  }

  getFrameId(): number {
    return this.frameId;
  }
}

/**
 * Create a new pipeline cache
 */
export function createPipelineCache<T = EnhancedLayerData>(): PipelineCache<T> {
  return new PipelineCache<T>();
}

/**
 * Offscreen canvas buffer for static layers
 */
export class StaticLayerBuffer {
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private isRendered = false;

  constructor(width: number, height: number) {
    if (typeof OffscreenCanvas !== "undefined") {
      this.offscreenCanvas = new OffscreenCanvas(width, height);
      this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    }
  }

  getContext(): OffscreenCanvasRenderingContext2D | null {
    return this.offscreenCtx;
  }

  markRendered(): void {
    this.isRendered = true;
  }

  isAlreadyRendered(): boolean {
    return this.isRendered;
  }

  compositeTo(ctx: CanvasRenderingContext2D, x: number = 0, y: number = 0): void {
    if (this.offscreenCanvas && this.isRendered) {
      ctx.drawImage(this.offscreenCanvas, x, y);
    }
  }

  static isSupported(): boolean {
    return typeof OffscreenCanvas !== "undefined";
  }
}

/**
 * Batched layers by animation type
 */
export type LayerBatch<T> = {
  static: T[];
  spinOnly: T[];
  orbital: T[];
  complex: T[];
};

/**
 * Batch layers by animation type
 */
export function batchLayersByAnimation<
  T extends {
    hasSpinAnimation?: boolean;
    hasOrbitalAnimation?: boolean;
    isStatic?: boolean;
  },
>(layers: T[]): LayerBatch<T> {
  const batched: LayerBatch<T> = {
    static: [],
    spinOnly: [],
    orbital: [],
    complex: [],
  };

  for (const layer of layers) {
    if (layer.isStatic) {
      batched.static.push(layer);
    } else if (layer.hasOrbitalAnimation) {
      if (layer.hasSpinAnimation) {
        batched.complex.push(layer);
      } else {
        batched.orbital.push(layer);
      }
    } else if (layer.hasSpinAnimation) {
      batched.spinOnly.push(layer);
    } else {
      batched.static.push(layer);
    }
  }

  return batched;
}
