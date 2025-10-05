# Image Mapping Debug Utilities - Usage Guide

## Overview

The `LayerCorePipelineImageMappingUtils.ts` file provides visual debugging tools to understand and verify image mapping behavior, specifically for `imageTip`, `imageBase`, and `imageCenter` points.

## Purpose

These utilities help you:

- ✅ Visualize where imageTip and imageBase points are located
- ✅ Understand the axis line between base and tip
- ✅ Debug image orientation and rotation issues
- ✅ Verify displayRotation calculations
- ✅ Validate image positioning

## Visual Markers

### Color Coding

- 🔴 **Red** - imageCenter (crosshair)
- 🟢 **Green** - imageTip point (circle with "TIP" label)
- 🔵 **Blue** - imageBase point (circle with "BASE" label)
- 🟡 **Yellow** - Axis line (dashed line from base to tip)
- 🔷 **Cyan** - Rotation indicator (optional arc)
- 🟣 **Magenta** - Bounding box (optional)

## How to Use

### Step 1: Import the Utilities

```typescript
import {
  generateImageMappingDebugVisuals,
  CanvasDebugRenderer,
  type ImageMappingDebugConfig,
} from "../layer/LayerCorePipelineImageMappingUtils";
```

### Step 2: Generate Debug Visuals

```typescript
// Inside your rendering loop, after processing a layer:
const debugVisuals = generateImageMappingDebugVisuals(layerData, {
  showCenter: true,
  showTip: true,
  showBase: true,
  showAxisLine: true,
  showRotation: false, // Optional
  showBoundingBox: false, // Optional
});
```

### Step 3: Render Debug Visuals (Canvas 2D)

```typescript
// After rendering the layer image, render debug visuals on top:
CanvasDebugRenderer.drawAll(ctx, debugVisuals);
```

## Integration Example (Canvas Renderer)

### Basic Integration

```typescript
// In LayerEngineCanvas.ts, add debug rendering after layer rendering:

const render = (timestamp: number) => {
  ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

  for (const layer of layers) {
    const { image, baseData, processors } = layer;
    const layerData: EnhancedLayerData =
      processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

    // ... existing rendering code ...

    // ADD: Debug visualization for imageTip/imageBase
    if (DEBUG_IMAGE_MAPPING_ENABLED) {
      const debugVisuals = generateImageMappingDebugVisuals(layerData, {
        showCenter: true,
        showTip: true,
        showBase: true,
        showAxisLine: true,
      });
      CanvasDebugRenderer.drawAll(ctx, debugVisuals);
    }

    ctx.restore();
  }
};
```

### Toggle Debug Mode

```typescript
// At the top of your renderer file:
const DEBUG_IMAGE_MAPPING_ENABLED = true; // Toggle this to enable/disable

// Or make it configurable per layer:
const DEBUG_CONFIG = {
  showCenter: true,
  showTip: true,
  showBase: true,
  showAxisLine: true,
  showRotation: false,
  showBoundingBox: false,
  colors: {
    center: "#FF0000",
    tip: "#00FF00",
    base: "#0000FF",
    axisLine: "#FFFF00",
  },
};
```

## Configuration Options

### ImageMappingDebugConfig

```typescript
type ImageMappingDebugConfig = {
  showCenter?: boolean; // Show imageCenter marker (default: true)
  showTip?: boolean; // Show imageTip marker (default: true)
  showBase?: boolean; // Show imageBase marker (default: true)
  showAxisLine?: boolean; // Show axis line base→tip (default: true)
  showRotation?: boolean; // Show rotation arc (default: false)
  showBoundingBox?: boolean; // Show image bounds (default: false)
  centerStyle?: "dot" | "crosshair"; // Center marker style
  tipStyle?: "circle" | "arrow"; // Tip marker style
  baseStyle?: "circle" | "square"; // Base marker style
  colors?: {
    center?: string;
    tip?: string;
    base?: string;
    axisLine?: string;
    rotation?: string;
    boundingBox?: string;
  };
};
```

## What You'll See

### For a Clock Hand with imageTip: 90°, imageBase: 270°

When you render the debug visuals, you'll see:

1. **Red Crosshair** at the geometric center of the image
2. **Green Circle** labeled "TIP" at the top edge (90°)
3. **Blue Circle** labeled "BASE" at the bottom edge (270°)
4. **Yellow Dashed Line** connecting BASE → TIP (with angle label)

This helps you verify:

- ✅ Is the imageTip pointing in the expected direction?
- ✅ Is the imageBase opposite to the tip?
- ✅ Is the axis line aligned correctly?
- ✅ Does the displayRotation make sense?

## Common Use Cases

### Debug Case 1: Verify Default Orientation

```typescript
// Layer with default imageTip: 90° (up), imageBase: 270° (down)
// You should see tip at top, base at bottom
```

### Debug Case 2: Custom Tip/Base Angles

```typescript
// Layer with imageTip: 45°, imageBase: 225°
// You should see tip at top-right, base at bottom-left
```

### Debug Case 3: After Rotation

```typescript
// Layer with spin or orbital rotation applied
// The markers show where tip/base are in CURRENT rotated state
```

## Advanced Features

### Show Rotation Indicator

```typescript
const debugVisuals = generateImageMappingDebugVisuals(layerData, {
  showRotation: true, // Shows arc indicating displayRotation
});
```

### Show Bounding Box

```typescript
const debugVisuals = generateImageMappingDebugVisuals(layerData, {
  showBoundingBox: true, // Shows image boundary rectangle
});
```

### Custom Colors

```typescript
const debugVisuals = generateImageMappingDebugVisuals(layerData, {
  colors: {
    center: "#FF69B4", // Hot pink center
    tip: "#32CD32", // Lime green tip
    base: "#4169E1", // Royal blue base
  },
});
```

## Troubleshooting

### Problem: Markers not showing

**Solution:** Ensure debug visuals are rendered AFTER the layer image:

```typescript
// 1. Render layer image
ctx.drawImage(image, x, y, width, height);
ctx.restore();

// 2. THEN render debug visuals
CanvasDebugRenderer.drawAll(ctx, debugVisuals);
```

### Problem: Markers in wrong position

**Possible Causes:**

1. Position calculation issue in LayerCore
2. Scale not applied correctly
3. Coordinate system mismatch

**Use this tool to identify the issue!** That's the whole point! 🎯

### Problem: Axis line doesn't match rotation

This indicates a potential bug in:

- `computeImageMapping()` calculation
- `displayAxisAngle` or `displayRotation` logic
- Renderer rotation application

## Next Steps

After using these debug utilities to understand the current behavior:

1. ✅ Identify any issues with imageTip/imageBase calculations
2. ✅ Verify displayRotation is correct
3. ✅ Document any bugs found
4. Then (if needed) create `LayerCorePipelineImageMapping.ts` processor for dynamic animation

## Example Output

When debugging is enabled, you'll see visual overlays like:

```
    🟢 TIP (labeled)
        |
        | (yellow dashed line)
        |
    🔴 CENTER (red crosshair)
        |
        | (yellow dashed line)
        |
    🔵 BASE (labeled)
```

This makes it crystal clear:

- Where each point is located
- How they relate to each other
- Whether the calculations are correct

---

**Created:** 2025-01-06  
**Version:** 1.0  
**Status:** Ready to Use 🚀
