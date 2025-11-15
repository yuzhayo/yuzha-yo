/// <reference types="vite/client" />

/** LAYER ENGINE - Runtime Execution & Processing. */

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
  getImageCenter,
  createCoordinateBundle,
  createDualSpaceCoordinate,
  normalizePair,
  clampedPercentToScale,
  normalizePercentInput,
  normalizeStagePointInput,
  normalizePercent,
  normalizeAngle,
  calculatePositionForPivot,
  calculateRotationDegrees,
  resolveClockSpeed,
} from "./math";

import registryData from "../asset/ImageRegistry.json" assert { type: "json" };

// Convert imageId to file paths, URLs, and load image dimensions.
// CRITICAL FOR PRODUCTION BUILDS:
// We use import.meta.glob to statically import all assets. This allows Vite
// to analyze and bundle assets at build time, preventing 404s in production.
// Dynamic URL construction with new URL(variable, import.meta.url) breaks builds!

/** Static asset manifest using import.meta.glob. */
const assetManifest = import.meta.glob("../asset/*.{png,jpg,jpeg,gif,svg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

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

/** Resolve asset path from imageId. */
export function resolveAssetPath(imageId: string): string | null {
  const path = pathMap.get(imageId);
  if (path && typeof path === "string" && path.length > 0) {
    return path;
  }
  return null;
}

/** Convert asset path to URL for loading. */
export function resolveAssetUrl(path: string): string {
  if (!path || typeof path !== "string") {
    throw new Error(`Invalid asset path: ${path}`);
  }

  // Validate path format (case-insensitive check)
  if (!path.toLowerCase().startsWith("shared/asset/")) {
    throw new Error(`Unsupported asset path: ${path}`);
  }

  // Extract filename: "shared/asset/file.png" → "file.png"
  const filename = path.replace(/^shared\/asset\//i, "");

  // Build manifest key (relative to THIS file: shared/layer/engine.ts)
  const manifestKey = `../asset/${filename}`;

  // Look up in static asset manifest (populated by import.meta.glob)
  const url = assetManifest[manifestKey];

  if (!url) {
    throw new Error(
      `Asset not found in manifest: ${manifestKey} (from registry path: ${path}). ` +
        `Available assets: ${Object.keys(assetManifest).join(", ")}`,
    );
  }

  return url;
}

/** Image dimension cache for performance. */
const IMAGE_DIMENSION_CACHE = new Map<string, { width: number; height: number }>();

/** Get image dimensions (with caching). */
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

/** Preload critical assets in parallel. */
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

/** Load image from URL. */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Calculate image geometry information needed for positioning.

/** Compute image mapping from dimensions. */
export function computeImageMapping(imageDimensions: {
  width: number;
  height: number;
}): ImageMapping {
  const { width, height } = imageDimensions;
  return {
    imageDimensions: { width, height },
  };
}

// Convert configuration to renderable layer data.

const ZERO_POINT: Point2D = { x: 0, y: 0 };
const ZERO_PERCENT: PercentPoint = { x: 0, y: 0 };
const ZERO_COORDINATE_BUNDLE = createCoordinateBundle(ZERO_POINT, ZERO_PERCENT);
const ZERO_DUAL_COORDINATE = createDualSpaceCoordinate(
  ZERO_POINT,
  ZERO_PERCENT,
  ZERO_POINT,
  ZERO_PERCENT,
);

/** Compute 2D transform (position + scale) from configuration. */
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
    const minimalMapping: ImageMapping = { imageDimensions };
    const position = calculatePositionForPivot(
      basicStagePoint,
      basicImagePercent,
      minimalMapping,
      scale,
      0,
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

/** Prepare the basic, renderer-agnostic layer state. */
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

/** Prepare spin-specific coordinates and metadata. */
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

/** Prepare orbit-specific coordinates and metadata. */
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

/** Prepare layer data from configuration (MAIN ENTRY POINT). */
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
    spinStagePoint: spinState.hasSpin ? spinState.spinStagePoint : undefined,
    spinStagePercent: spinState.hasSpin ? spinState.spinStagePercent : undefined,
    spinPercent: spinState.hasSpin ? spinState.spinImagePercent : undefined,
    spinImagePoint: spinState.hasSpin ? spinState.spinImagePoint : undefined,
    orbitStagePoint: orbitState.hasOrbit ? orbitState.orbitStagePoint : undefined,
    orbitLinePoint: orbitState.hasOrbit ? orbitState.orbitLinePoint : undefined,
    orbitLineVisible: orbitState.orbitLineVisible,
    orbitRadius: orbitState.hasOrbit ? orbitState.orbitRadius : undefined,
    orbitImagePercent: orbitState.hasOrbit ? orbitState.orbitImagePercent : undefined,
    orbitImagePoint: orbitState.hasOrbit ? orbitState.orbitImagePoint : undefined,
  };

  return layer;
}

/** Check if layer uses 2D renderer. */
export function is2DLayer(entry: LayerConfigEntry): boolean {
  return entry.renderer === "2D";
}

// Build motion processors for spin and orbit animations.

/** Layer motion marker (for debug visualization). */
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

/** Motion artifacts (processor + markers). */
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

/** Build layer motion processor and markers. */
export function buildLayerMotion(
  entry: LayerConfigEntry,
  layer: UniversalLayerData,
  stageSize: number,
): LayerMotionArtifacts {
  const config = deriveLayerMotionConfig(entry, layer, stageSize);
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
  layer: UniversalLayerData,
  stageSize: number,
): LayerMotionConfig | null {
  const stageCenter = { x: stageSize / 2, y: stageSize / 2 };

  const computedSpinPercent = layer.spinStagePoint
    ? layer.calculation.spinPoint.image.percent
    : undefined;

  const pivotPercent = layer.spinPercent ??
    sanitizePercent(entry.spinImagePoint) ??
    sanitizePercent(entry.BasicImagePoint) ??
    computedSpinPercent ?? {
      x: 50,
      y: 50,
    };

  const sanitizedSpinStage = sanitizeStagePoint(entry.spinStagePoint, stageSize);
  const sanitizedOrbitLine = sanitizeStagePoint(entry.orbitLinePoint, stageSize);
  const sanitizedBasicStage = sanitizeStagePoint(entry.BasicStagePoint, stageSize);

  const blueStage =
    layer.spinStagePoint ??
    layer.orbitLinePoint ??
    sanitizedSpinStage ??
    sanitizedOrbitLine ??
    sanitizedBasicStage ??
    layer.calculation.stageCenter.point ??
    stageCenter;

  const redStage = layer.orbitStagePoint ?? sanitizeStagePoint(entry.orbitStagePoint, stageSize);

  const circleRadius =
    layer.orbitRadius ??
    (redStage !== undefined ? distanceBetween(blueStage, redStage) : undefined);
  const initialAngleDeg =
    layer.orbitRadius && layer.orbitLinePoint && layer.orbitStagePoint
      ? ((Math.atan2(
          -(layer.orbitLinePoint.y - layer.orbitStagePoint.y),
          layer.orbitLinePoint.x - layer.orbitStagePoint.x,
        ) *
          180) /
          Math.PI +
          360) %
        360
      : redStage !== undefined && circleRadius !== undefined && circleRadius > 0
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
    circleVisible: layer.orbitLineVisible ?? Boolean(entry.orbitLine),
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

// Plugin system for layer behaviors and pipeline execution.

/** Layer processor function type - transforms UniversalLayerData into EnhancedLayerData. */
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/** Enhanced universal layer data that can include additional properties from processors. */
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

/** Context for processor attachment decisions. */
export type ProcessorContext = {
  force?: Record<string, unknown>;
};

/** Processor plugin definition. */
type ProcessorPlugin = {
  name: string;
  shouldAttach(entry: LayerConfigEntry, context?: ProcessorContext): boolean;
  create(entry: LayerConfigEntry, context?: ProcessorContext): LayerProcessor;
};

/** Internal registry of all processor plugins. */
const plugins: ProcessorPlugin[] = [];

/** Register a processor plugin. */
export function registerProcessor(plugin: ProcessorPlugin): void {
  const existingIndex = plugins.findIndex((p) => p.name === plugin.name);
  if (existingIndex >= 0) {
    plugins.splice(existingIndex, 1, plugin);
  } else {
    plugins.push(plugin);
  }
}

/** Get all processors that should be attached to a layer. */
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

/** Run layer data through a pipeline of processors. */
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

/** Process multiple layers through the same pipeline. */
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData[] {
  return baseLayers.map((layer) => runPipeline(layer, processors, timestamp));
}

// Helper functions for animations and calculations.

/** Calculate elapsed time from timestamp and start time. */
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

// Utilities for optimizing layer rendering performance.

/** Frame-based cache for pipeline results. */
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

/** Create a new pipeline cache. */
export function createPipelineCache<T = EnhancedLayerData>(): PipelineCache<T> {
  return new PipelineCache<T>();
}

/** Offscreen canvas buffer for static layers. */
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

/** Batched layers by animation type. */
export type LayerBatch<T> = {
  static: T[];
  spinOnly: T[];
  orbital: T[];
  complex: T[];
};

/** Batch layers by animation type. */
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
