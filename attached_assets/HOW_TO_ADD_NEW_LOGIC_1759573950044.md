# How to Add New Logic to Wrap Spin

## Architecture with New Logic Layer

```
Logic Basic (LayerCore)
      ↓
UniversalLayerData
      ↓ [wrapped by]
Logic Spin (LayerCorePipelineSpin)
      ↓
EnhancedLayerData (Basic + Spin)
      ↓ [wrapped by]
Logic NEW (e.g., Opacity, Orbital, Filter)
      ↓
EnhancedLayerData (Basic + Spin + New)
      ↓
Rendering
```

---

## Step-by-Step Guide

### Example: Adding **Opacity Logic** (Fade In/Out)

---

## Step 1: Create New Processor File

**File:** `/app/shared/layer/LayerCorePipelineOpacity.ts`

```typescript
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";

export type OpacityConfig = {
  opacityStart?: number;      // 0-100 (default: 100)
  opacityEnd?: number;        // 0-100 (default: 100)
  opacityDuration?: number;   // Duration in seconds (0 = static)
  opacityEasing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
};

/**
 * Create an opacity processor with the given configuration
 * Animates opacity from opacityStart to opacityEnd over opacityDuration
 */
export function createOpacityProcessor(config: OpacityConfig): LayerProcessor {
  const opacityStart = config.opacityStart ?? 100;
  const opacityEnd = config.opacityEnd ?? 100;
  const opacityDuration = config.opacityDuration ?? 0;
  const opacityEasing = config.opacityEasing ?? "linear";

  // Static opacity (no animation)
  if (opacityDuration === 0) {
    return (layer: EnhancedLayerData): EnhancedLayerData => ({
      ...layer,
      opacity: opacityStart / 100,
      hasOpacityAnimation: false,
    });
  }

  // Track start time for this processor instance
  let startTime: number | null = null;

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    const currentTime = timestamp ?? performance.now();
    
    // Initialize start time on first call
    if (startTime === null) {
      startTime = currentTime;
    }

    // Calculate elapsed time in seconds
    const elapsed = (currentTime - startTime) / 1000;
    
    // Calculate progress (0 to 1)
    let progress = Math.min(elapsed / opacityDuration, 1);
    
    // Apply easing
    switch (opacityEasing) {
      case "ease-in":
        progress = progress * progress;
        break;
      case "ease-out":
        progress = 1 - (1 - progress) * (1 - progress);
        break;
      case "ease-in-out":
        progress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        break;
      // "linear" - no change
    }
    
    // Interpolate opacity
    const opacity = (opacityStart + (opacityEnd - opacityStart) * progress) / 100;

    return {
      ...layer,
      opacity,
      opacityProgress: progress,
      hasOpacityAnimation: true,
    };
  };
}
```

---

## Step 2: Update EnhancedLayerData Type

**File:** `/app/shared/layer/LayerCorePipeline.ts`

```typescript
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (from LayerCorePipelineSpin)
  spinCenter?: { x: number; y: number };
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;
  hasSpinAnimation?: boolean;

  // Opacity properties (NEW - from LayerCorePipelineOpacity)
  opacity?: number;                    // 0 to 1
  opacityProgress?: number;            // 0 to 1
  hasOpacityAnimation?: boolean;

  // Future properties
  filters?: string[];
  orbitalCenter?: { x: number; y: number };
  orbitalRadius?: number;
};
```

---

## Step 3: Update Config Type

**File:** `/app/shared/config/Config.ts`

```typescript
export type LayerConfigEntry = {
  layerId: string;
  renderer: LayerRenderer;
  order: number;
  imageId: string;
  scale?: number[];
  position?: number[];

  // Image mapping config
  imageTip?: number;
  imageBase?: number;

  // Spin config
  spinCenter?: number[];
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";

  // Opacity config (NEW)
  opacityStart?: number;
  opacityEnd?: number;
  opacityDuration?: number;
  opacityEasing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
};
```

Update the grouped config type:

```typescript
type ConfigYuzhaEntry = {
  layerId: string;
  groups: {
    [groupName: string]: {
      renderer?: string;
      order?: number;
      imageId?: string;
      scale?: number[];
      position?: number[];
      imageTip?: number;
      imageBase?: number;
      spinCenter?: number[];
      spinSpeed?: number;
      spinDirection?: "cw" | "ccw";
      // NEW
      opacityStart?: number;
      opacityEnd?: number;
      opacityDuration?: number;
      opacityEasing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
    };
  };
};
```

---

## Step 4: Update JSON Config

**File:** `/app/shared/config/ConfigYuzha.json`

```json
[
  {
    "layerId": "stars-background",
    "groups": {
      "Basic Config": {
        "renderer": "2D",
        "order": 50,
        "imageId": "STARBG",
        "scale": [100, 100],
        "position": [1024, 1024],
        "imageTip": 90,
        "imageBase": 270
      },
      "Spin Config": {
        "spinCenter": [50, 50],
        "spinSpeed": 0,
        "spinDirection": "cw"
      },
      "Opacity Config": {
        "opacityStart": 0,
        "opacityEnd": 100,
        "opacityDuration": 3,
        "opacityEasing": "ease-in"
      }
    }
  },
  {
    "layerId": "clock-GEARMOON",
    "groups": {
      "Basic Config": {
        "renderer": "2D",
        "order": 150,
        "imageId": "GEARMOON",
        "scale": [100, 100],
        "position": [1024, 1024],
        "imageTip": 90,
        "imageBase": 270
      },
      "Spin Config": {
        "spinCenter": [50, 50],
        "spinSpeed": 15,
        "spinDirection": "cw"
      },
      "Opacity Config": {
        "opacityStart": 100,
        "opacityEnd": 100,
        "opacityDuration": 0
      }
    }
  }
]
```

---

## Step 5: Update Stage Component (Chain Processors)

**File:** `/app/shared/stages/StageCanvas.tsx`

```typescript
import { createSpinProcessor } from "../layer/LayerCorePipelineSpin";
import { createOpacityProcessor } from "../layer/LayerCorePipelineOpacity"; // NEW

// Inside the run() function:
for (const entry of twoDLayers) {
  const layer = await prepareLayer(entry, STAGE_SIZE);
  if (!layer) continue;

  // Create processors for this layer
  const processors: LayerProcessor[] = [];

  // 1. Add spin processor if configured
  if (entry.spinSpeed !== undefined || entry.spinCenter !== undefined) {
    processors.push(
      createSpinProcessor({
        spinCenter: entry.spinCenter as [number, number] | undefined,
        spinSpeed: entry.spinSpeed,
        spinDirection: entry.spinDirection,
      })
    );
  }

  // 2. Add opacity processor if configured (NEW - wraps spin)
  if (entry.opacityStart !== undefined || entry.opacityDuration !== undefined) {
    processors.push(
      createOpacityProcessor({
        opacityStart: entry.opacityStart,
        opacityEnd: entry.opacityEnd,
        opacityDuration: entry.opacityDuration,
        opacityEasing: entry.opacityEasing,
      })
    );
  }

  // Future processors can be added here...
  // if (entry.orbitalConfig) { processors.push(createOrbitalProcessor(...)); }

  layersWithProcessors.push({
    data: layer,
    processors, // Array of processors applied in order
  });
}
```

---

## Step 6: Update Rendering Engine

**File:** `/app/shared/layer/LayerEngineCanvas.ts`

```typescript
const render = (timestamp: number) => {
  ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

  for (const layer of layers) {
    const { image, baseData, processors } = layer;

    // Run pipeline to get enhanced data
    const layerData: EnhancedLayerData =
      processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

    const width = image.width * layerData.scale.x;
    const height = image.height * layerData.scale.y;

    // Apply opacity (NEW)
    const opacity = layerData.opacity ?? 1;
    ctx.globalAlpha = opacity;

    ctx.save();

    // Determine rotation mode
    const isSpinning = layerData.hasSpinAnimation === true;
    const rotation = isSpinning
      ? (layerData.currentRotation ?? 0)
      : (layerData.imageMapping.displayRotation ?? 0);

    const pivot = isSpinning
      ? (layerData.spinCenter ?? layerData.imageMapping.imageCenter)
      : layerData.imageMapping.imageCenter;

    if (rotation !== 0) {
      // Rotation logic (same as before)
      const centerX = (image.width / 2) * layerData.scale.x;
      const centerY = (image.height / 2) * layerData.scale.y;
      const pivotX = pivot.x * layerData.scale.x;
      const pivotY = pivot.y * layerData.scale.y;
      const dx = centerX - pivotX;
      const dy = centerY - pivotY;

      ctx.translate(layerData.position.x, layerData.position.y);
      ctx.translate(-dx, -dy);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(dx, dy);
      ctx.drawImage(image, -centerX, -centerY, width, height);
    } else {
      const x = layerData.position.x - width / 2;
      const y = layerData.position.y - height / 2;
      ctx.drawImage(image, x, y, width, height);
    }

    ctx.restore();
    
    // Reset global alpha (NEW)
    ctx.globalAlpha = 1.0;
  }
};
```

**File:** `/app/shared/layer/LayerEngineThree.ts`

```typescript
const animate = (timestamp: number) => {
  for (const item of meshData) {
    const { mesh, group, baseData, processors } = item;

    // Run pipeline
    const layerData: EnhancedLayerData =
      processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

    // Apply opacity (NEW)
    const opacity = layerData.opacity ?? 1;
    if (mesh.material instanceof THREE.MeshBasicMaterial) {
      mesh.material.opacity = opacity;
    }

    // Rotation logic (same as before)
    const isSpinning = layerData.hasSpinAnimation === true;
    const rotation = isSpinning
      ? (layerData.currentRotation ?? 0)
      : (layerData.imageMapping.displayRotation ?? 0);

    const pivot = isSpinning
      ? (layerData.spinCenter ?? layerData.imageMapping.imageCenter)
      : layerData.imageMapping.imageCenter;

    const imageCenter = layerData.imageMapping.imageCenter;
    const centerX = imageCenter.x * layerData.scale.x;
    const centerY = imageCenter.y * layerData.scale.y;
    const pivotX = pivot.x * layerData.scale.x;
    const pivotY = pivot.y * layerData.scale.y;
    const dx = centerX - pivotX;
    const dy = -(centerY - pivotY);

    mesh.position.set(dx, dy, 0);
    group.rotation.z = (rotation * Math.PI) / 180;
  }

  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
};
```

---

## Step 7: Update StageThree.tsx (Same as StageCanvas)

Apply the same processor chain logic to `StageThree.tsx`.

---

## Pipeline Execution Flow

```typescript
// In rendering engine:
const layerData = runPipeline(baseData, processors, timestamp);

// Pipeline processes in order:
// 1. baseData (UniversalLayerData)
//      ↓
// 2. Spin Processor wraps it
//      ↓ EnhancedLayerData (Basic + Spin)
// 3. Opacity Processor wraps it
//      ↓ EnhancedLayerData (Basic + Spin + Opacity)
// 4. [Future processors...]
//      ↓
// Final EnhancedLayerData with all properties
```

---

## More Examples of New Logic

### Example 2: Orbital Motion Logic

```typescript
export type OrbitalConfig = {
  orbitalCenter?: [number, number];  // Stage coordinates
  orbitalRadius?: number;             // Pixels
  orbitalSpeed?: number;              // Degrees per second
  orbitalDirection?: "cw" | "ccw";
};

export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor {
  // Calculate position offset based on time
  // Modify layer.position to create circular motion
  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    // Calculate orbital position...
    const angle = (elapsedSeconds * orbitalSpeed) % 360;
    const offsetX = Math.cos(angle * Math.PI / 180) * orbitalRadius;
    const offsetY = Math.sin(angle * Math.PI / 180) * orbitalRadius;
    
    return {
      ...layer,
      position: {
        x: orbitalCenter.x + offsetX,
        y: orbitalCenter.y + offsetY
      },
      orbitalAngle: angle,
      hasOrbitalAnimation: true,
    };
  };
}
```

### Example 3: Filter Logic

```typescript
export type FilterConfig = {
  blur?: number;           // 0-100
  brightness?: number;     // 0-200
  contrast?: number;       // 0-200
  saturate?: number;       // 0-200
};

export function createFilterProcessor(config: FilterConfig): LayerProcessor {
  return (layer: EnhancedLayerData): EnhancedLayerData => {
    const filters: string[] = [];
    
    if (config.blur) filters.push(`blur(${config.blur}px)`);
    if (config.brightness) filters.push(`brightness(${config.brightness}%)`);
    if (config.contrast) filters.push(`contrast(${config.contrast}%)`);
    if (config.saturate) filters.push(`saturate(${config.saturate}%)`);
    
    return {
      ...layer,
      filters,
      hasFilters: filters.length > 0,
    };
  };
}
```

---

## Key Principles

### ✅ Do's:
1. **Non-destructive wrapping** - Always spread `...layer` to preserve previous data
2. **Return EnhancedLayerData** - Type must be compatible with pipeline
3. **Add new properties** - Extend EnhancedLayerData type definition
4. **Process in order** - Processors execute sequentially, each wraps the previous
5. **Optional timestamp** - Accept timestamp parameter for time-based logic

### ❌ Don'ts:
1. Don't modify UniversalLayerData type directly
2. Don't create circular dependencies between processors
3. Don't assume processor execution order (make each independent)
4. Don't directly modify base layer data (always return new object)

---

## Summary

### To add new logic that wraps spin:

1. ✅ Create new processor file (e.g., `LayerCorePipelineOpacity.ts`)
2. ✅ Define config type (e.g., `OpacityConfig`)
3. ✅ Implement processor factory (e.g., `createOpacityProcessor()`)
4. ✅ Update `EnhancedLayerData` type with new properties
5. ✅ Update `LayerConfigEntry` type
6. ✅ Update JSON config structure
7. ✅ Add processor to stage components (after spin processor)
8. ✅ Update rendering engines to use new properties

The pipeline pattern allows unlimited chaining:
```
Basic → Spin → Opacity → Orbital → Filter → ... → Rendering
```

Each layer wraps the previous, creating a powerful and extensible architecture! 🚀
