# Example: Complete Opacity Logic Implementation

## Quick Reference Implementation

This is a ready-to-use example showing how to add Opacity logic that wraps Spin logic.

---

## File 1: LayerCorePipelineOpacity.ts

**Location:** `/app/shared/layer/LayerCorePipelineOpacity.ts`

```typescript
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";

export type OpacityConfig = {
  opacityStart?: number;      // 0-100 (default: 100 = fully visible)
  opacityEnd?: number;        // 0-100 (default: 100)
  opacityDuration?: number;   // Seconds (0 = no animation)
  opacityEasing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
};

/**
 * Create opacity processor for fade animations
 * 
 * Examples:
 * - Fade in: { opacityStart: 0, opacityEnd: 100, opacityDuration: 2 }
 * - Fade out: { opacityStart: 100, opacityEnd: 0, opacityDuration: 2 }
 * - Static: { opacityStart: 50 } // 50% opacity, no animation
 */
export function createOpacityProcessor(config: OpacityConfig): LayerProcessor {
  const opacityStart = config.opacityStart ?? 100;
  const opacityEnd = config.opacityEnd ?? 100;
  const opacityDuration = config.opacityDuration ?? 0;
  const opacityEasing = config.opacityEasing ?? "linear";

  // STATIC MODE: No animation
  if (opacityDuration === 0 || opacityStart === opacityEnd) {
    return (layer: EnhancedLayerData): EnhancedLayerData => ({
      ...layer,
      opacity: opacityStart / 100,
      hasOpacityAnimation: false,
    });
  }

  // ANIMATED MODE: Fade in/out
  let startTime: number | null = null;

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    const currentTime = timestamp ?? performance.now();
    
    if (startTime === null) {
      startTime = currentTime;
    }

    const elapsed = (currentTime - startTime) / 1000;
    let progress = Math.min(elapsed / opacityDuration, 1);
    
    // Apply easing function
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
      default: // linear
        break;
    }
    
    // Interpolate opacity from start to end
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

## File 2: Update LayerCorePipeline.ts

**Add to EnhancedLayerData type:**

```typescript
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties
  spinCenter?: { x: number; y: number };
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;
  hasSpinAnimation?: boolean;

  // Opacity properties (ADD THESE)
  opacity?: number;                    // 0 to 1 (0 = transparent, 1 = opaque)
  opacityProgress?: number;            // Animation progress 0 to 1
  hasOpacityAnimation?: boolean;

  // Future properties
  filters?: string[];
  orbitalCenter?: { x: number; y: number };
};
```

---

## File 3: Update Config.ts

**Add to LayerConfigEntry type:**

```typescript
export type LayerConfigEntry = {
  layerId: string;
  renderer: LayerRenderer;
  order: number;
  imageId: string;
  scale?: number[];
  position?: number[];

  // Image mapping
  imageTip?: number;
  imageBase?: number;

  // Spin config
  spinCenter?: number[];
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";

  // Opacity config (ADD THESE)
  opacityStart?: number;
  opacityEnd?: number;
  opacityDuration?: number;
  opacityEasing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
};
```

**Add to ConfigYuzhaEntry groups:**

```typescript
type ConfigYuzhaEntry = {
  layerId: string;
  groups: {
    [groupName: string]: {
      // ... existing properties ...
      
      // ADD THESE
      opacityStart?: number;
      opacityEnd?: number;
      opacityDuration?: number;
      opacityEasing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
    };
  };
};
```

---

## File 4: Update ConfigYuzha.json

**Example configuration:**

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
        "opacityDuration": 0,
        "opacityEasing": "linear"
      }
    }
  }
]
```

---

## File 5: Update StageCanvas.tsx

**Add import:**
```typescript
import { createOpacityProcessor } from "../layer/LayerCorePipelineOpacity";
```

**Update processor chain:**
```typescript
for (const entry of twoDLayers) {
  const layer = await prepareLayer(entry, STAGE_SIZE);
  if (!layer) {
    console.warn(`[StageCanvas] Skipping layer ${entry.layerId}`);
    continue;
  }

  const processors: LayerProcessor[] = [];

  // 1. Spin processor (if configured)
  if (entry.spinSpeed !== undefined || entry.spinCenter !== undefined) {
    processors.push(
      createSpinProcessor({
        spinCenter: entry.spinCenter as [number, number] | undefined,
        spinSpeed: entry.spinSpeed,
        spinDirection: entry.spinDirection,
      })
    );
  }

  // 2. Opacity processor (if configured) - WRAPS SPIN
  if (
    entry.opacityStart !== undefined ||
    entry.opacityEnd !== undefined ||
    entry.opacityDuration !== undefined
  ) {
    processors.push(
      createOpacityProcessor({
        opacityStart: entry.opacityStart,
        opacityEnd: entry.opacityEnd,
        opacityDuration: entry.opacityDuration,
        opacityEasing: entry.opacityEasing,
      })
    );
  }

  layersWithProcessors.push({
    data: layer,
    processors,
  });
}
```

---

## File 6: Update LayerEngineCanvas.ts

**Add opacity rendering:**

```typescript
const render = (timestamp: number) => {
  ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

  for (const layer of layers) {
    const { image, baseData, processors } = layer;

    const layerData: EnhancedLayerData =
      processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

    const width = image.width * layerData.scale.x;
    const height = image.height * layerData.scale.y;

    // ✅ APPLY OPACITY (NEW)
    const opacity = layerData.opacity ?? 1;
    ctx.globalAlpha = opacity;

    ctx.save();

    // Rotation logic (same as before)
    const isSpinning = layerData.hasSpinAnimation === true;
    const rotation = isSpinning
      ? (layerData.currentRotation ?? 0)
      : (layerData.imageMapping.displayRotation ?? 0);

    const pivot = isSpinning
      ? (layerData.spinCenter ?? layerData.imageMapping.imageCenter)
      : layerData.imageMapping.imageCenter;

    if (rotation !== 0) {
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
    
    // ✅ RESET OPACITY (NEW)
    ctx.globalAlpha = 1.0;
  }
};
```

---

## File 7: Update LayerEngineThree.ts

**Add opacity rendering:**

```typescript
const animate = (timestamp: number) => {
  for (const item of meshData) {
    const { mesh, group, baseData, processors } = item;

    const layerData: EnhancedLayerData =
      processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

    // ✅ APPLY OPACITY (NEW)
    const opacity = layerData.opacity ?? 1;
    if (mesh.material instanceof THREE.MeshBasicMaterial) {
      mesh.material.opacity = opacity;
      // Ensure material is set to transparent if opacity < 1
      mesh.material.transparent = true;
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

## File 8: Update StageThree.tsx (same as StageCanvas)

Apply the same processor chain logic.

---

## Testing Examples

### Test 1: Fade In Background
```json
"Opacity Config": {
  "opacityStart": 0,
  "opacityEnd": 100,
  "opacityDuration": 3,
  "opacityEasing": "ease-in"
}
```
**Result:** Background fades in from transparent to opaque over 3 seconds.

### Test 2: Spinning Gear with Constant Opacity
```json
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
```
**Result:** Gear spins normally at full opacity (no fade).

### Test 3: Spinning Gear that Fades Out
```json
"Spin Config": {
  "spinCenter": [50, 50],
  "spinSpeed": 15,
  "spinDirection": "cw"
},
"Opacity Config": {
  "opacityStart": 100,
  "opacityEnd": 0,
  "opacityDuration": 5,
  "opacityEasing": "ease-out"
}
```
**Result:** Gear spins while gradually fading out over 5 seconds.

---

## Flow Visualization

```
Basic Layer Data (prepareLayer)
      ↓
UniversalLayerData {
  imageUrl, position, scale,
  imageMapping { imageCenter, imageTip, imageBase, displayRotation }
}
      ↓ [Spin Processor wraps it]
EnhancedLayerData {
  ...UniversalLayerData,
  spinCenter, currentRotation, hasSpinAnimation
}
      ↓ [Opacity Processor wraps it]
EnhancedLayerData {
  ...Previous properties,
  opacity, opacityProgress, hasOpacityAnimation
}
      ↓
Rendering Engine
- Apply opacity (globalAlpha or material.opacity)
- Apply rotation (with off-center pivot)
- Draw image
```

---

## Key Points

✅ **Opacity wraps Spin** - Processor order matters
✅ **Non-destructive** - Each processor spreads `...layer`
✅ **Time-based** - Uses timestamp for smooth animation
✅ **Easing support** - Multiple easing functions
✅ **Works with both engines** - Canvas and Three.js

This architecture allows unlimited combinations:
- Static image (no spin, no opacity animation)
- Spinning with fade in
- Spinning with fade out
- Wobble effect (off-center spin) with fade
- Future: Add more processors (filters, orbital, etc.)

🚀 The pipeline is infinitely extensible!
