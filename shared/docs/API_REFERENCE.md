# API Reference

## Overview

Complete reference for all types, functions, and APIs in the 2D/3D Animation Engine.

---

## Table of Contents

1. [Configuration Types](#configuration-types)
2. [Layer Data Types](#layer-data-types)
3. [Core Functions](#core-functions)
4. [Processor Functions](#processor-functions)
5. [Coordinate Functions](#coordinate-functions)
6. [Utility Functions](#utility-functions)
7. [Renderer APIs](#renderer-apis)
8. [Constants & Enums](#constants--enums)

---

## Configuration Types

### ConfigYuzhaEntry

**Location:** `Config.ts`

```typescript
export type ConfigYuzhaEntry = {
  layerId: string;
  imageId: string;
  renderer: "2D" | "3D";
  order: number;
  groups: {
    "Basic Config": BasicConfigGroup;
    "Spin Config": SpinConfigGroup;
    "Orbital Config": OrbitalConfigGroup;
    "Image Mapping Debug": ImageMappingDebugConfigGroup;
  };
};
```

### LayerConfigEntry

**Location:** `Config.ts`

Flat structure after transformation.

```typescript
export type LayerConfigEntry = {
  // Identity
  layerId: string;
  imageId: string;
  renderer: "2D" | "3D";
  order: number;

  // Basic Config
  scale?: [number, number];
  BasicStagePoint?: [number, number];
  BasicImagePoint?: [number, number];
  BasicAngleImage?: number;
  imageTip?: number;
  imageBase?: number;

  // Spin Config
  spinStagePoint?: [number, number];
  spinImagePoint?: [number, number];
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";

  // Orbital Config
  orbitCenter?: [number, number];
  orbitImagePoint?: [number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  orbitAutoRotate?: boolean;

  // Debug Config
  showCenter?: boolean;
  showTip?: boolean;
  showBase?: boolean;
  showStageCenter?: boolean;
  showAxisLine?: boolean;
  showRotation?: boolean;
  showTipRay?: boolean;
  showBaseRay?: boolean;
  showBoundingBox?: boolean;
  centerStyle?: "crosshair" | "dot";
  tipStyle?: "circle" | "arrow";
  baseStyle?: "circle" | "square";
  stageCenterStyle?: "star" | "crosshair" | "dot";
  debugColors?: {
    center?: string;
    tip?: string;
    base?: string;
    stageCenter?: string;
    axisLine?: string;
    rotation?: string;
    tipRay?: string;
    baseRay?: string;
    boundingBox?: string;
  };
};
```

### BasicConfigGroup

```typescript
export type BasicConfigGroup = {
  scale?: [number, number];              // [10-500, 10-500] percent
  BasicStagePoint?: [number, number];    // [0-2048, 0-2048] stage pixels
  BasicImagePoint?: [number, number];    // [0-100, 0-100] percent
  BasicAngleImage?: number;              // 0-360 degrees
  imageTip?: number;                     // 0-360 degrees (default: 90)
  imageBase?: number;                    // 0-360 degrees (default: 270)
};
```

### SpinConfigGroup

```typescript
export type SpinConfigGroup = {
  spinStagePoint?: [number, number];     // [0-2048, 0-2048] stage pixels
  spinImagePoint?: [number, number];     // [0-100, 0-100] percent
  spinSpeed?: number;                    // 0-360+ degrees per second
  spinDirection?: "cw" | "ccw";          // clockwise or counter-clockwise
};
```

### OrbitalConfigGroup

```typescript
export type OrbitalConfigGroup = {
  orbitCenter?: [number, number];        // [0-2048, 0-2048] stage pixels
  orbitImagePoint?: [number, number];    // [0-100, 0-100] percent
  orbitRadius?: number;                  // 0-2048 pixels
  orbitSpeed?: number;                   // 0-360+ degrees per second
  orbitDirection?: "cw" | "ccw";         // clockwise or counter-clockwise
  orbitAutoRotate?: boolean;             // face orbit center
};
```

### ImageMappingDebugConfigGroup

```typescript
export type ImageMappingDebugConfigGroup = {
  showCenter?: boolean;
  showTip?: boolean;
  showBase?: boolean;
  showStageCenter?: boolean;
  showAxisLine?: boolean;
  showRotation?: boolean;
  showTipRay?: boolean;
  showBaseRay?: boolean;
  showBoundingBox?: boolean;
  centerStyle?: "crosshair" | "dot";
  tipStyle?: "circle" | "arrow";
  baseStyle?: "circle" | "square";
  stageCenterStyle?: "star" | "crosshair" | "dot";
  debugColors?: DebugColors;
};
```

---

## Layer Data Types

### Point2D

```typescript
export type Point2D = {
  x: number;
  y: number;
};
```

### PercentPoint

```typescript
export type PercentPoint = {
  x: number;  // 0-100
  y: number;  // 0-100
};
```

### UniversalLayerData

**Location:** `LayerCore.ts`

Base layer data structure after preparation.

```typescript
export type UniversalLayerData = {
  // Identity
  layerId: string;
  imageId: string;
  imageUrl: string;
  imagePath: string;

  // Transform
  position: Point2D;
  scale: Point2D;
  rotation?: number;

  // Geometry
  imageMapping: ImageMapping;
  imageTip: number;
  imageBase: number;

  // Pre-calculated coordinates
  calculation: LayerCalculationPoints;
};
```

### EnhancedLayerData

**Location:** `LayerCorePipeline.ts`

Layer data enhanced by processors.

```typescript
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (added by SpinProcessor)
  spinCenter?: Point2D;
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;
  hasSpinAnimation?: boolean;
  spinStagePoint?: Point2D;
  spinPercent?: PercentPoint;

  // Orbital properties (added by OrbitalProcessor)
  orbitCenter?: Point2D;
  orbitImagePoint?: Point2D;
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  orbitRotation?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;

  // Debug properties (added by DebugProcessor)
  imageMappingDebugVisuals?: ImageMappingDebugVisuals;
  imageMappingDebugConfig?: Partial<ImageMappingDebugConfig>;

  // Future properties
  opacity?: number;
  filters?: string[];
};
```

### ImageMapping

```typescript
export type ImageMapping = {
  imageCenter: Point2D;
  imageTip: Point2D;
  imageBase: Point2D;
  imageDimensions: { width: number; height: number };
  displayAxisAngle: number;
};
```

### LayerCalculationPoints

```typescript
export type LayerCalculationPoints = {
  imageCenter: {
    image: { point: Point2D; percent: PercentPoint };
    stage: { point: Point2D; percent: PercentPoint };
  };
  imageTip: {
    image: { point: Point2D; percent: PercentPoint };
    stage: { point: Point2D; percent: PercentPoint };
  };
  imageBase: {
    image: { point: Point2D; percent: PercentPoint };
    stage: { point: Point2D; percent: PercentPoint };
  };
  spinPoint: {
    image: { point: Point2D; percent: PercentPoint };
    stage: { point: Point2D; percent: PercentPoint };
  };
  orbitPoint: {
    image: { point: Point2D; percent: PercentPoint };
    stage: { point: Point2D; percent: PercentPoint };
  };
};
```

### LayerProcessor

**Location:** `LayerCorePipeline.ts`

```typescript
export type LayerProcessor = (
  layer: UniversalLayerData,
  timestamp?: number
) => EnhancedLayerData;
```

---

## Core Functions

### loadLayerConfig()

**Location:** `Config.ts`

Load and transform configuration from JSON.

```typescript
export function loadLayerConfig(): LayerConfig;
```

**Returns:** `LayerConfig` - Array of transformed and sorted layer configurations

**Example:**
```typescript
const config = loadLayerConfig();
console.log(config.length); // Number of layers
```

### transformConfig()

**Location:** `Config.ts`

Transform grouped config to flat structure with override logic.

```typescript
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig;
```

**Parameters:**
- `raw` - Array of grouped config entries

**Returns:** `LayerConfig` - Flat, merged, sorted configurations

**Override Priority:**
1. Orbital Config (highest)
2. Spin Config
3. Basic Config
4. Debug Config (additive only)

### prepareLayer()

**Location:** `LayerCore.ts`

Convert config entry to universal layer data with all calculations.

```typescript
export async function prepareLayer(
  entry: LayerConfigEntry,
  stageSize: number
): Promise<UniversalLayerData | null>;
```

**Parameters:**
- `entry` - Layer configuration
- `stageSize` - Stage dimensions (usually 2048)

**Returns:** `Promise<UniversalLayerData | null>` - Prepared layer or null if error

**Example:**
```typescript
const layer = await prepareLayer(configEntry, 2048);
if (layer) {
  console.log(layer.position); // { x: 1024, y: 1024 }
}
```

### runPipeline()

**Location:** `LayerCorePipeline.ts`

Execute processor pipeline on layer data.

```typescript
export function runPipeline(
  baseLayer: UniversalLayerData,
  processors: LayerProcessor[],
  timestamp?: number
): EnhancedLayerData;
```

**Parameters:**
- `baseLayer` - Base layer data
- `processors` - Array of processors to apply
- `timestamp` - Optional animation timestamp (ms)

**Returns:** `EnhancedLayerData` - Layer with all processor enhancements

**Example:**
```typescript
const enhanced = runPipeline(
  baseLayer,
  [spinProcessor, debugProcessor],
  5000
);
console.log(enhanced.currentRotation); // 150
```

### processBatch()

**Location:** `LayerCorePipeline.ts`

Process multiple layers through same pipeline.

```typescript
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
  timestamp?: number
): EnhancedLayerData[];
```

### validateLayerConfig()

**Location:** `Config.ts`

Validate layer configuration for errors.

```typescript
export function validateLayerConfig(entry: LayerConfigEntry): string[];
```

**Returns:** `string[]` - Array of error messages (empty if valid)

---

## Processor Functions

### createSpinProcessor()

**Location:** `LayerCorePipelineSpin.ts`

Create rotation animation processor.

```typescript
export function createSpinProcessor(config: SpinConfig): LayerProcessor;
```

**Config:**
```typescript
export type SpinConfig = {
  spinCenter?: [number, number] | PercentPoint; // Runtime override: 0-100% relative to image dimensions
  spinSpeed?: number;                           // Degrees per second (0 = disabled)
  spinDirection?: "cw" | "ccw";                 // Default: "cw"
};
```

**Adds to layer:**
- `currentRotation` - Current angle (0-360°)
- `hasSpinAnimation` - Animation flag
- `spinSpeed`, `spinDirection` - Config values
- `spinCenter` - Spin center point (image coordinates)
- `spinStagePoint` - Spin center (stage coordinates)
- `spinPercent` - Spin center (percent coordinates)

**Example:**
```typescript
const processor = createSpinProcessor({
  spinSpeed: 30,        // 12 seconds per rotation
  spinDirection: "cw",
  spinCenter: [50, 50]  // Optional: override spin center (50%, 50%)
});
```

### createOrbitalProcessor()

**Location:** `LayerCorePipelineOrbital.ts`

Create circular motion processor.

```typescript
export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor;
```

**Config:**
```typescript
export type OrbitalConfig = {
  orbitCenter: [number, number];
  orbitImagePoint: [number, number];
  orbitRadius: number;
  orbitSpeed: number;              // Degrees per second
  orbitDirection?: "cw" | "ccw";   // Default: "cw"
  orbitAutoRotate?: boolean;       // Default: false
};
```

**Adds to layer:**
- `position` - Updated position (overrides base)
- `currentOrbitAngle` - Current angle around center
- `orbitRotation` - Auto-rotation angle
- `visible` - Visibility flag (false if off-stage)
- `hasOrbitalAnimation` - Animation flag

**Example:**
```typescript
const processor = createOrbitalProcessor({
  orbitCenter: [1024, 1024],
  orbitImagePoint: [50, 50],
  orbitRadius: 200,
  orbitSpeed: 45,
  orbitDirection: "cw",
  orbitAutoRotate: true
});
```

### createImageMappingDebugProcessor()

**Location:** `LayerCorePipelineImageMappingDebug.ts`

Create debug visualization processor.

```typescript
export function createImageMappingDebugProcessor(
  config: Partial<ImageMappingDebugConfig>
): LayerProcessor;
```

**Config:**
```typescript
export type ImageMappingDebugConfig = {
  showCenter?: boolean;
  showTip?: boolean;
  showBase?: boolean;
  showStageCenter?: boolean;
  showAxisLine?: boolean;
  showRotation?: boolean;
  showTipRay?: boolean;
  showBaseRay?: boolean;
  showBoundingBox?: boolean;
  centerStyle?: "crosshair" | "dot";
  tipStyle?: "circle" | "arrow";
  baseStyle?: "circle" | "square";
  stageCenterStyle?: "star" | "crosshair" | "dot";
  debugColors?: DebugColors;
};
```

**Adds to layer:**
- `imageMappingDebugVisuals` - Visual marker data
- `imageMappingDebugConfig` - Config copy

**Example:**
```typescript
const processor = createImageMappingDebugProcessor({
  showCenter: true,
  showTip: true,
  showStageCenter: true
});
```

---

## Coordinate Functions

### imagePercentToImagePoint()

**Location:** `LayerCore.ts`

Convert percent coordinates to image pixel coordinates.

```typescript
function imagePercentToImagePoint(
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number }
): Point2D;
```

**Example:**
```typescript
const point = imagePercentToImagePoint(
  { x: 50, y: 50 },
  { width: 512, height: 512 }
);
// { x: 256, y: 256 }
```

### imagePointToPercent()

Convert image pixels to percent coordinates.

```typescript
function imagePointToPercent(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number }
): PercentPoint;
```

### imagePointToStagePoint()

**Location:** `LayerCore.ts`

Convert image pixels to stage pixels.

```typescript
function imagePointToStagePoint(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D
): Point2D;
```

**Parameters:**
- `imagePoint` - Point in image space
- `imageDimensions` - Image size
- `scale` - Layer scale
- `position` - Layer position (center)

**Returns:** Point in stage space

### stagePointToImagePoint()

Convert stage pixels to image pixels.

```typescript
function stagePointToImagePoint(
  stagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D
): Point2D;
```

### viewportToStageCoords()

**Location:** `stage2048.ts`

Convert browser viewport coordinates to stage coordinates.

```typescript
export function viewportToStageCoords(
  viewportX: number,
  viewportY: number,
  transform: StageTransform
): { x: number; y: number };
```

**Example:**
```typescript
const stageCoords = viewportToStageCoords(960, 540, transform);
// { x: 1024, y: 1024 } - stage center
```

### stageToViewportCoords()

Convert stage coordinates to browser viewport coordinates.

```typescript
export function stageToViewportCoords(
  stageX: number,
  stageY: number,
  transform: StageTransform
): { x: number; y: number };
```

### calculatePositionForPivot()

**Location:** `LayerCore.ts`

Calculate position to place image point at stage point.

```typescript
function calculatePositionForPivot(
  stageAnchor: Point2D,
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
  scale: Point2D
): Point2D;
```

**Example:**
```typescript
const position = calculatePositionForPivot(
  { x: 1024, y: 1024 },  // Place here
  { x: 0, y: 0 },        // Top-left corner
  { width: 512, height: 512 },
  { x: 1.0, y: 1.0 }
);
// Returns position where image top-left appears at stage center
```

---

## Utility Functions

### Animation Utils

**Location:** `LayerCoreAnimationUtils.ts`

#### normalizeAngle()

```typescript
export function normalizeAngle(angle: number): number;
```

Normalize angle to 0-360° range.

**Example:**
```typescript
normalizeAngle(370);  // 10
normalizeAngle(-10);  // 350
```

#### applyRotationDirection()

```typescript
export function applyRotationDirection(
  angle: number,
  direction: "cw" | "ccw"
): number;
```

**Example:**
```typescript
applyRotationDirection(90, "cw");   // 90
applyRotationDirection(90, "ccw");  // -90
```

#### degreesToRadians()

```typescript
export function degreesToRadians(degrees: number): number;
```

#### radiansToDegrees()

```typescript
export function radiansToDegrees(radians: number): number;
```

#### easeInOutQuad()

```typescript
export function easeInOutQuad(t: number): number;
```

Quadratic easing function (0-1 input/output).

#### calculateElapsedTime()

```typescript
export function calculateElapsedTime(
  timestamp: number,
  startTime?: number
): { elapsed: number; currentTime: number };
```

### Stage Utils

**Location:** `stage2048.ts`

#### computeCoverTransform()

Calculate scale/offset for cover mode.

```typescript
export function computeCoverTransform(
  viewportWidth: number,
  viewportHeight: number
): StageTransform;
```

**Returns:**
```typescript
type StageTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};
```

**Example:**
```typescript
const transform = computeCoverTransform(1920, 1080);
// {
//   scale: 0.9375,
//   offsetX: 0,
//   offsetY: -420,
//   width: 1920,
//   height: 1920
// }
```

#### createStageTransformer()

Auto-apply stage transform with resize handling.

```typescript
export function createStageTransformer(
  stageElement: HTMLElement,
  container: HTMLElement,
  options?: StageTransformerOptions
): () => void;
```

**Options:**
```typescript
type StageTransformerOptions = {
  resizeDebounce?: number;  // Default: 0 (no debounce)
};
```

**Returns:** Cleanup function

**Example:**
```typescript
const cleanup = createStageTransformer(stage, container, {
  resizeDebounce: 100
});

// Later: cleanup();
```

### Cache Utils

#### createPipelineCache()

**Location:** `LayerCoreAnimationUtils.ts`

Create processor pipeline cache.

```typescript
export function createPipelineCache(): PipelineCache;
```

**Usage:**
```typescript
const cache = createPipelineCache();

const result = cache.get("layer1", () => 
  runPipeline(baseLayer, processors, timestamp)
);

cache.nextFrame();  // Clear for next frame
```

#### FrameRateTracker

```typescript
export class FrameRateTracker {
  addFrame(timestamp: number): void;
  getCurrentFPS(): number;
  getAverageFPS(sampleSize?: number): number;
  reset(): void;
}
```

**Example:**
```typescript
const tracker = new FrameRateTracker();

requestAnimationFrame((timestamp) => {
  tracker.addFrame(timestamp);
  console.log(`FPS: ${tracker.getCurrentFPS()}`);
});
```

### Image Utils

#### getImageDimensions()

**Location:** `LayerCore.ts`

Get image dimensions (cached).

```typescript
async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }>;
```

#### resolveAssetPath()

```typescript
function resolveAssetPath(imageId: string): string;
```

Map imageId to asset path using ImageRegistry.json.

#### resolveAssetUrl()

```typescript
function resolveAssetUrl(assetPath: string): string;
```

Convert asset path to blob URL.

---

## Renderer APIs

### LayerEngineDOM

**Location:** `LayerEngineDOM.ts`

CSS transform-based renderer.

```typescript
export function mountLayersToDOM(
  layers: Array<{
    data: UniversalLayerData;
    processors: LayerProcessor[];
  }>,
  container: HTMLElement,
  stageSize: number
): () => void;
```

**Returns:** Cleanup function

### LayerEngineCanvas

**Location:** `LayerEngineCanvas.ts`

Canvas 2D renderer.

```typescript
export function renderLayersToCanvas(
  layers: Array<{
    data: UniversalLayerData;
    processors: LayerProcessor[];
  }>,
  canvas: HTMLCanvasElement,
  stageSize: number
): () => void;
```

### LayerEngineThree

**Location:** `LayerEngineThree.ts`

Three.js WebGL renderer.

```typescript
export function renderLayersWithThree(
  layers: Array<{
    data: UniversalLayerData;
    processors: LayerProcessor[];
  }>,
  canvas: HTMLCanvasElement,
  stageSize: number,
  THREE: typeof import("three")
): () => void;
```

### Stage Components

#### StageDOM

**Location:** `StageDOM.tsx`

```typescript
export default function StageDOM(): JSX.Element;
```

#### StageCanvas

**Location:** `StageCanvas.tsx`

```typescript
export default function StageCanvas(): JSX.Element;
```

#### StageThree

**Location:** `StageThree.tsx`

```typescript
export default function StageThree(): JSX.Element;
```

### Renderer Detection

**Location:** `RendererDetector.ts`

```typescript
export function getRendererType(): "three" | "canvas";
```

Auto-detect best renderer based on environment.

```typescript
export function isAIAgentEnvironment(): boolean;
```

Detect if running in headless/AI agent environment.

### Device Capability

**Location:** `DeviceCapability.ts`

```typescript
export function getDeviceCapability(): DeviceCapability;

type DeviceCapability = {
  performanceLevel: "low" | "medium" | "high";
  isMobile: boolean;
  isLowEndDevice: boolean;
  pixelRatio: number;
  enableAntialiasing: boolean;
  maxTextureSize: number;
};
```

---

## Constants & Enums

### Stage Constants

**Location:** `stage2048.ts`

```typescript
export const STAGE_SIZE = 2048;
```

### Animation Constants

**Location:** `LayerCoreAnimationUtils.ts`

```typescript
export const AnimationConstants = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
};
```

### Direction Enum

```typescript
type Direction = "cw" | "ccw";
```

- `"cw"` - Clockwise
- `"ccw"` - Counter-clockwise

### Renderer Types

```typescript
type RendererType = "dom" | "canvas" | "three";
type RendererMode = "auto" | "dom" | "canvas" | "three";
```

### Debug Marker Styles

```typescript
type CenterStyle = "crosshair" | "dot";
type TipStyle = "circle" | "arrow";
type BaseStyle = "circle" | "square";
type StageCenterStyle = "star" | "crosshair" | "dot";
```

### Default Debug Colors

```typescript
const DEFAULT_DEBUG_COLORS = {
  center: "#FF0000",       // Red
  tip: "#00FF00",          // Green
  base: "#0000FF",         // Blue
  stageCenter: "#00FFFF",  // Cyan
  axisLine: "#FFFF00",     // Yellow
  rotation: "#00FFFF",     // Cyan
  tipRay: "#FFA500",       // Orange
  baseRay: "#9370DB",      // Purple
  boundingBox: "#FF00FF"   // Magenta
};
```

---

## Field Ranges & Validation

### Config Field Ranges

| Field | Type | Range | Default |
|-------|------|-------|---------|
| `scale` | `[number, number]` | [10-500, 10-500] % | `[100, 100]` |
| `BasicStagePoint` | `[number, number]` | [0-2048, 0-2048] px | `[1024, 1024]` |
| `BasicImagePoint` | `[number, number]` | [0-100, 0-100] % | `[50, 50]` |
| `BasicAngleImage` | `number` | 0-360° | `0` |
| `imageTip` | `number` | 0-360° | `90` |
| `imageBase` | `number` | 0-360° | `270` |
| `spinSpeed` | `number` | 0-360+° per second | `0` |
| `orbitSpeed` | `number` | 0-360+° per second | `0` |
| `orbitRadius` | `number` | 0-2048 px | `0` |

### Speed to Rotation Time

| Speed (°/s) | Time per Rotation |
|-------------|-------------------|
| `360` | 1 second |
| `180` | 2 seconds |
| `90` | 4 seconds |
| `45` | 8 seconds |
| `30` | 12 seconds |
| `10` | 36 seconds |
| `6` | 60 seconds (1 minute) |

---

## Common Patterns

### Pattern: Create Animated Layer

```typescript
// 1. Load config
const config = loadLayerConfig();
const entry = config.find(c => c.layerId === "my-layer");

// 2. Prepare layer
const layer = await prepareLayer(entry, 2048);

// 3. Create processors
const processors: LayerProcessor[] = [];

if (entry.spinSpeed > 0) {
  processors.push(createSpinProcessor({
    spinSpeed: entry.spinSpeed,
    spinDirection: entry.spinDirection
  }));
}

// 4. Run pipeline in animation loop
requestAnimationFrame((timestamp) => {
  const enhanced = runPipeline(layer, processors, timestamp);
  // Render enhanced layer
});
```

### Pattern: Pivot-Based Positioning

```typescript
// Place top-left corner at stage center
{
  "BasicStagePoint": [1024, 1024],
  "BasicImagePoint": [0, 0]
}

// Place right edge at stage center
{
  "BasicStagePoint": [1024, 1024],
  "BasicImagePoint": [100, 50]
}
```

### Pattern: Spin Around Off-Center Pivot

```typescript
{
  "Spin Config": {
    "spinStagePoint": [1024, 1024],  // Spin around stage center
    "spinImagePoint": [0, 50],       // Using left edge as pivot
    "spinSpeed": 20
  }
}
```

### Pattern: Coordinate Conversion

```typescript
// Viewport to Stage
const transform = computeCoverTransform(window.innerWidth, window.innerHeight);
canvas.addEventListener("click", (e) => {
  const stageCoords = viewportToStageCoords(e.clientX, e.clientY, transform);
  console.log(`Clicked at stage: ${stageCoords.x}, ${stageCoords.y}`);
});

// Stage to Viewport (for UI overlay)
const viewportCoords = stageToViewportCoords(1024, 512, transform);
tooltip.style.left = `${viewportCoords.x}px`;
tooltip.style.top = `${viewportCoords.y}px`;
```

---

## Error Handling

### Configuration Errors

```typescript
const errors = validateLayerConfig(entry);
if (errors.length > 0) {
  console.error(`Layer ${entry.layerId} errors:`, errors);
  // ["Scale X out of range: 600", "Negative spinSpeed: -10"]
}
```

### Layer Preparation Errors

```typescript
const layer = await prepareLayer(entry, 2048);
if (!layer) {
  console.error("Failed to prepare layer");
  // Check console for specific error
}
```

### Renderer Fallback

```typescript
const rendererType = getRendererType();
if (rendererType === "canvas") {
  console.log("WebGL not available, using Canvas fallback");
}
```

---

## Performance Tips

### 1. Use Pipeline Caching

```typescript
const cache = createPipelineCache();
const result = cache.get(layerId, () => runPipeline(...));
cache.nextFrame();
```

### 2. Detect Static Scenes

```typescript
const hasAnimation = processors.length > 0;
if (!hasAnimation) {
  renderOnce();  // Don't start animation loop
}
```

### 3. Pre-Calculate Constants

```typescript
// ✅ Good
const speedPerMs = spinSpeed / 1000;
return (layer, timestamp) => {
  const rotation = timestamp * speedPerMs;
};

// ❌ Bad
return (layer, timestamp) => {
  const rotation = timestamp * (spinSpeed / 1000);
};
```

### 4. Early Exit for Disabled

```typescript
if (config.speed === 0) {
  return (layer) => layer;  // No-op processor
}
```

---

## Type Imports

```typescript
// Configuration
import type { 
  ConfigYuzhaEntry,
  LayerConfigEntry,
  LayerConfig 
} from "@shared/config/Config";

// Layer Data
import type {
  UniversalLayerData,
  Point2D,
  PercentPoint,
  ImageMapping,
  LayerCalculationPoints
} from "@shared/layer/LayerCore";

// Pipeline
import type {
  LayerProcessor,
  EnhancedLayerData
} from "@shared/layer/LayerCorePipeline";

// Stage
import type { StageTransform } from "@shared/utils/stage2048";
```

---

## Related Documentation

- **Architecture:** `00_ARCHITECTURE_OVERVIEW.md`
- **Config System:** `01_CONFIG_SYSTEM_GUIDE.md`
- **Coordinates:** `02_COORDINATE_SYSTEMS.md`
- **Spin Animation:** `03_SPIN_ANIMATION_DEEP_DIVE.md`
- **Renderers:** `04_RENDERING_ENGINES.md`
- **Pipeline:** `05_LAYER_PIPELINE_SYSTEM.md`
- **Stage/Viewport:** `06_STAGE_VIEWPORT_SYSTEM.md`
- **Debug:** `07_DEBUG_VISUALIZATION.md`
- **Adding Features:** `08_ADDING_NEW_FEATURES.md`
- **Orbital TODO:** `09_ORBITAL_ANIMATION_TODO.md`
- **Performance:** `10_PERFORMANCE_OPTIMIZATION.md`

---

**AI Agent Note:** This API reference provides complete type and function signatures. For conceptual understanding and usage patterns, refer to the specific topic documentation. Always validate configurations and handle async operations properly.
