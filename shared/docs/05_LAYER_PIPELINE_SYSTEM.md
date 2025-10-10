# Layer Pipeline System

## Overview

The **processor pipeline** is the core abstraction that makes the system extensible. It transforms layer data through a series of pure functions before rendering.

---

## Pipeline Architecture

```
UniversalLayerData (base)
    ↓
SpinProcessor (adds rotation)
    ↓
OrbitalProcessor (adds position)
    ↓
DebugProcessor (adds debug visuals)
    ↓
EnhancedLayerData (final)
    ↓
Renderer (draws to screen)
```

---

## Core Types

### LayerProcessor

**Definition:** `LayerCorePipeline.ts`

```typescript
export type LayerProcessor = (
  layer: UniversalLayerData,
  timestamp?: number
) => EnhancedLayerData;
```

**Key Points:**
- **Pure Function:** No side effects
- **Composable:** Chain multiple processors
- **Time-Aware:** Optional timestamp for animations
- **Additive:** Each processor adds properties

### UniversalLayerData

**Definition:** `LayerCore.ts`

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

**Definition:** `LayerCorePipeline.ts`

```typescript
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (added by SpinProcessor)
  spinCenter?: { x: number; y: number };
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;        // ← Used by renderers
  hasSpinAnimation?: boolean;
  spinStagePoint?: { x: number; y: number };
  spinPercent?: { x: number; y: number };

  // Orbital properties (added by OrbitalProcessor)
  orbitCenter?: { x: number; y: number };
  orbitImagePoint?: { x: number; y: number };
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

---

## runPipeline() Function

**Location:** `LayerCorePipeline.ts` lines 58-70

```typescript
export function runPipeline(
  baseLayer: UniversalLayerData,
  processors: LayerProcessor[],
  timestamp?: number
): EnhancedLayerData {
  let enhanced: EnhancedLayerData = { ...baseLayer };

  for (const processor of processors) {
    enhanced = processor(enhanced, timestamp);
  }

  return enhanced;
}
```

### How It Works

**1. Start with base data:**
```typescript
let enhanced = { ...baseLayer };  // Shallow copy
```

**2. Apply each processor:**
```typescript
for (const processor of processors) {
  enhanced = processor(enhanced, timestamp);
  // Each processor receives output of previous
}
```

**3. Return final result:**
```typescript
return enhanced;  // Contains all added properties
```

### Example Execution

**Input:**
```typescript
baseLayer = {
  layerId: "GEAR1",
  position: { x: 1024, y: 1024 },
  scale: { x: 1.0, y: 1.0 },
  rotation: 0,
  // ... other base properties
}

processors = [
  spinProcessor,
  debugProcessor
]

timestamp = 5000
```

**Step 1:** Run spinProcessor
```typescript
enhanced = spinProcessor(baseLayer, 5000);
// enhanced = {
//   ...baseLayer,
//   currentRotation: 150,
//   hasSpinAnimation: true,
//   spinSpeed: 30
// }
```

**Step 2:** Run debugProcessor
```typescript
enhanced = debugProcessor(enhanced, 5000);
// enhanced = {
//   ...previous,
//   imageMappingDebugVisuals: { centerMarker: {...}, ... }
// }
```

**Output:**
```typescript
{
  // Base properties
  layerId: "GEAR1",
  position: { x: 1024, y: 1024 },
  scale: { x: 1.0, y: 1.0 },
  rotation: 0,
  
  // Added by SpinProcessor
  currentRotation: 150,
  hasSpinAnimation: true,
  spinSpeed: 30,
  
  // Added by DebugProcessor
  imageMappingDebugVisuals: { ... }
}
```

---

## prepareLayer() Function

**Location:** `LayerCore.ts` lines 190-392

**Purpose:** Convert LayerConfigEntry → UniversalLayerData

### Process

**1. Resolve Asset Path:**
```typescript
const assetPath = resolveAssetPath(entry.imageId);
// "GEAR1" → "shared/asset/GEAR1.png"

const imageUrl = resolveAssetUrl(assetPath);
// "shared/asset/GEAR1.png" → "blob:http://..."
```

**2. Get Image Dimensions:**
```typescript
const dimensions = await getImageDimensions(imageUrl);
// { width: 512, height: 512 }
```

**3. Compute Transform:**
```typescript
const { position, scale } = compute2DTransform(entry, stageSize, dimensions);
// Uses pivot-based positioning system
```

**4. Calculate Image Mapping:**
```typescript
const imageMapping = computeImageMapping(dimensions, tipAngle, baseAngle);
// Calculates center, tip, base points
```

**5. Pre-Calculate Coordinates:**
```typescript
const needsFullCalculation = 
  entry.spinSpeed !== 0 || 
  entry.orbitSpeed !== 0 ||
  entry.showCenter ||  // Debug enabled
  // ... other conditions

if (needsFullCalculation) {
  // Calculate all coordinate transformations
  imageTipStage = imagePointToStagePoint(imageMapping.imageTip, ...);
  imageBaseStage = imagePointToStagePoint(imageMapping.imageBase, ...);
  spinStagePoint = normalizeStagePointInput(entry.spinStagePoint, ...);
  // ... etc.
} else {
  // Skip expensive calculations for static layers
  imageTipStage = { x: 0, y: 0 };
  // ... etc.
}
```

**6. Assemble Result:**
```typescript
const result: UniversalLayerData = {
  layerId: entry.layerId,
  imageId: entry.imageId,
  imageUrl,
  imagePath: assetPath,
  position,
  scale,
  imageMapping,
  imageTip: tipAngle,
  imageBase: baseAngle,
  calculation: { /* all pre-calculated points */ },
  rotation,
};

return result;
```

### Performance Optimizations

**1. Image Dimension Caching:**
```typescript
const IMAGE_DIMENSION_CACHE = new Map<string, { width: number; height: number }>();

if (IMAGE_DIMENSION_CACHE.has(url)) {
  return IMAGE_DIMENSION_CACHE.get(url)!;  // Instant
}
```

**2. Lazy Calculation:**
```typescript
if (needsFullCalculation) {
  // Do expensive work
} else {
  // Use zero values (cheap)
}
```

**3. Standard Mapping Cache:**
```typescript
const STANDARD_MAPPING_CACHE = new Map<string, ImageMapping>();

if (tipAngle === 90 && baseAngle === 270) {
  const key = `${width}x${height}`;
  if (STANDARD_MAPPING_CACHE.has(key)) {
    return STANDARD_MAPPING_CACHE.get(key)!;
  }
}
```

---

## Existing Processors

### 1. SpinProcessor

**File:** `LayerCorePipelineSpin.ts`

**Purpose:** Add rotation animation

**Creates:**
```typescript
createSpinProcessor({
  spinSpeed: 30,
  spinDirection: "cw"
})
```

**Adds:**
- `currentRotation` - Current angle (0-360°)
- `hasSpinAnimation` - Flag for renderers
- `spinSpeed`, `spinDirection` - Config values

**See:** `03_SPIN_ANIMATION_DEEP_DIVE.md` for details

### 2. OrbitalProcessor

**File:** `LayerCorePipelineOrbital.ts`

**Purpose:** Add circular motion animation

**Status:** ⚠️ Ready but not wired to stages

**Creates:**
```typescript
createOrbitalProcessor({
  orbitCenter: [1024, 1024],
  orbitImagePoint: [50, 50],
  orbitRadius: 200,
  orbitSpeed: 45,
  orbitDirection: "cw"
})
```

**Adds:**
- `position` - Updated position on orbit path (overrides base)
- `currentOrbitAngle` - Current angle around center
- `orbitRotation` - Auto-rotation to face center
- `visible` - Hide when off-stage
- `hasOrbitalAnimation` - Flag for renderers

**See:** `09_ORBITAL_ANIMATION_TODO.md` for integration

### 3. ImageMappingDebugProcessor

**File:** `LayerCorePipelineImageMappingDebug.ts`

**Purpose:** Generate debug visual markers

**Creates:**
```typescript
createImageMappingDebugProcessor({
  showCenter: true,
  showTip: true,
  showBase: true,
  showStageCenter: true,
  showAxisLine: true
})
```

**Adds:**
- `imageMappingDebugVisuals` - Marker data for rendering
- `imageMappingDebugConfig` - Config copy

**See:** `07_DEBUG_VISUALIZATION.md` for details

---

## Creating Custom Processors

### Template

```typescript
export type MyCustomConfig = {
  customValue: number;
  customFlag: boolean;
};

export function createMyCustomProcessor(config: MyCustomConfig): LayerProcessor {
  // Early exit if disabled
  if (!config.customFlag) {
    return (layer: UniversalLayerData): EnhancedLayerData => 
      layer as EnhancedLayerData;
  }
  
  // Pre-calculate constants (outside processor function)
  const cachedValue = config.customValue * 2;
  
  // Return processor function
  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    // Calculate frame-specific values
    const currentTime = timestamp ?? performance.now();
    const computed = cachedValue + (currentTime % 1000);
    
    // Return enhanced data
    return {
      ...layer,
      customProperty: computed,
      hasCustomAnimation: true,
    } as EnhancedLayerData;
  };
}
```

### Best Practices

**1. Early Exit for Disabled State:**
```typescript
if (config.speed === 0) {
  return (layer) => layer;  // No-op processor
}
```

**2. Cache Expensive Calculations:**
```typescript
// ✅ Good: Calculate once
const speedPerMs = config.speed / 1000;
return (layer, timestamp) => {
  const rotation = timestamp * speedPerMs;
  // ...
};

// ❌ Bad: Calculate every frame
return (layer, timestamp) => {
  const speedPerMs = config.speed / 1000;  // Wasteful!
  const rotation = timestamp * speedPerMs;
  // ...
};
```

**3. Use Utility Functions:**
```typescript
import { 
  normalizeAngle, 
  applyRotationDirection
} from "./LayerCoreAnimationUtils";

const currentTime = timestamp ?? performance.now();
let angle = (currentTime * speed) % 360;
angle = applyRotationDirection(angle, direction);
angle = normalizeAngle(angle);
```

**4. Reuse Pre-Calculated Values:**
```typescript
// ✅ Good: Use pre-calculated from layer.calculation
const spinPoint = layer.calculation.spinPoint.stage.point;

// ❌ Bad: Recalculate every frame
const spinPoint = imagePointToStagePoint(...);
```

**5. Add Type-Safe Properties:**
```typescript
// Add to EnhancedLayerData type definition
export type EnhancedLayerData = UniversalLayerData & {
  // ... existing properties
  
  // My custom properties
  myCustomValue?: number;
  hasMyCustomAnimation?: boolean;
};
```

---

## Pipeline Caching

### Why Cache?

**Problem:** Same layer processed multiple times per frame

```typescript
// Render loop
for (const layer of layers) {
  const enhanced = runPipeline(layer.baseData, layer.processors, timestamp);
  // ...
}

// Debug rendering (same frame)
for (const layer of layers) {
  const enhanced = runPipeline(layer.baseData, layer.processors, timestamp);
  // Duplicate work! ↑
}
```

**Solution:** Cache results per frame

### PipelineCache Implementation

**Location:** `LayerCoreAnimationUtils.ts` lines 180-207

```typescript
export class PipelineCache {
  private cache = new Map<string, unknown>();
  private frameId: number = 0;

  get<T>(key: string, computeFn: () => T): T {
    if (!this.cache.has(key)) {
      this.cache.set(key, computeFn());
    }
    return this.cache.get(key) as T;
  }

  clear(): void {
    this.cache.clear();
  }

  nextFrame(): void {
    this.clear();
    this.frameId++;
  }
}

export function createPipelineCache(): PipelineCache {
  return new PipelineCache();
}
```

### Usage in Renderers

**Location:** `LayerEngineDOM.ts` lines 123-160

```typescript
const pipelineCache = createPipelineCache();

const animate = (timestamp: number) => {
  for (const layer of layers) {
    if (layer.hasAnimation) {
      // Cache result by layerId
      const enhancedData = pipelineCache.get(layer.baseData.layerId, () =>
        runPipeline(layer.baseData, layer.processors, timestamp)
      );
      
      // Use cached result
      updateRenderer(enhancedData);
    }
  }
  
  // Clear cache for next frame
  pipelineCache.nextFrame();
  
  requestAnimationFrame(animate);
};
```

### Performance Impact

**Without Cache:**
- 100 layers × 2 render passes = **200 pipeline runs/frame**
- 200 × 3 processors = **600 function calls/frame**

**With Cache:**
- 100 layers × 1 pipeline run = **100 pipeline runs/frame**
- 100 × 3 processors = **300 function calls/frame**

**Result:** **50% reduction** in pipeline overhead

---

## Processor Order

### Does Order Matter?

**Yes!** Processors run sequentially and can override previous values.

### Example: Spin + Orbital

**Order 1:** `[spinProcessor, orbitalProcessor]`

```typescript
// Step 1: Spin adds rotation
enhanced = { ...layer, currentRotation: 45 };

// Step 2: Orbital overrides position
enhanced = { ...enhanced, position: {...}, currentRotation: 45 };

// Result: Orbiting + spinning
```

**Order 2:** `[orbitalProcessor, spinProcessor]`

```typescript
// Step 1: Orbital sets position
enhanced = { ...layer, position: {...} };

// Step 2: Spin adds rotation (doesn't change position)
enhanced = { ...enhanced, currentRotation: 45 };

// Result: Same as Order 1 (for these processors)
```

**For Spin + Orbital:** Order doesn't matter (they modify different properties)

**For Future Processors:** Order may matter if they override same properties

### Current Order in Stages

**Location:** `StageDOM.tsx` lines 38-79

```typescript
const processors: LayerProcessor[] = [];

// 1. Debug (if enabled)
if (hasDebugConfig) {
  processors.push(createImageMappingDebugProcessor({...}));
}

// 2. Spin (if enabled)
if (entry.spinSpeed && entry.spinSpeed > 0) {
  processors.push(createSpinProcessor({...}));
}

// 3. Orbital (planned, not yet added)
if (entry.orbitSpeed && entry.orbitSpeed > 0) {
  processors.push(createOrbitalProcessor({...}));
}
```

---

## processBatch() Function

**Location:** `LayerCorePipeline.ts` lines 75-81

**Purpose:** Process multiple layers through same pipeline

```typescript
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
  timestamp?: number
): EnhancedLayerData[] {
  return baseLayers.map((layer) => runPipeline(layer, processors, timestamp));
}
```

**Usage:**
```typescript
const allLayers = [...]; // UniversalLayerData[]
const processors = [spinProcessor, debugProcessor];

const enhanced = processBatch(allLayers, processors, timestamp);
// All layers processed with same processors
```

**Note:** Currently not used (each layer has unique processors)

---

## Testing Processors

### Unit Test Template

```typescript
import { createSpinProcessor } from "./LayerCorePipelineSpin";
import type { UniversalLayerData } from "./LayerCore";

describe("SpinProcessor", () => {
  const baseLayer: UniversalLayerData = {
    layerId: "test",
    position: { x: 1024, y: 1024 },
    scale: { x: 1.0, y: 1.0 },
    rotation: 0,
    // ... minimal required fields
  };

  it("should add currentRotation", () => {
    const processor = createSpinProcessor({
      spinSpeed: 360,  // 1 rotation/second
      spinDirection: "cw"
    });

    const result = processor(baseLayer, 500);  // 0.5 seconds

    expect(result.currentRotation).toBe(180);  // Half rotation
    expect(result.hasSpinAnimation).toBe(true);
  });

  it("should return unmodified for spinSpeed = 0", () => {
    const processor = createSpinProcessor({
      spinSpeed: 0,
      spinDirection: "cw"
    });

    const result = processor(baseLayer, 1000);

    expect(result).toEqual(baseLayer);  // No changes
  });
});
```

---

## Next Steps

- **🎨 Renderers:** Read `04_RENDERING_ENGINES.md`
- **📊 Performance:** Read `10_PERFORMANCE_OPTIMIZATION.md`
- **🔧 Custom Features:** Read `08_ADDING_NEW_FEATURES.md`
- **🔄 Orbital:** Read `09_ORBITAL_ANIMATION_TODO.md`

---

**AI Agent Note:** The processor pipeline is the key to extensibility. When adding new animation types, create a new processor following the template above. Keep processors pure and composable.
