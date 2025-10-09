# Debug Visualization

## Overview

The **Image Mapping Debug** system provides visual markers to help understand layer positioning, rotation, and image orientation. Essential for debugging positioning issues.

---

## Debug Config Group

### Configuration

**Location:** ConfigYuzha.json

```json
{
  "Image Mapping Debug": {
    "showCenter": false,
    "showTip": false,
    "showBase": false,
    "showStageCenter": false,
    "showAxisLine": false,
    "showRotation": false,
    "showTipRay": false,
    "showBaseRay": false,
    "showBoundingBox": false,
    "centerStyle": "crosshair",
    "tipStyle": "circle",
    "baseStyle": "circle",
    "stageCenterStyle": "star",
    "debugColors": {
      "center": "#FF0000",
      "tip": "#00FF00",
      "base": "#0000FF",
      "stageCenter": "#00FFFF",
      "axisLine": "#FFFF00",
      "rotation": "#00FFFF",
      "tipRay": "#FFA500",
      "baseRay": "#9370DB",
      "boundingBox": "#FF00FF"
    }
  }
}
```

---

## Visual Markers

### 1. Image Center (showCenter)

**Color:** Red (#FF0000)

**Purpose:** Shows where the image center is located in stage space

**Styles:**
- `"crosshair"` - Crosshair lines (default)
- `"dot"` - Small circle

**When to Use:**
- Verify image is centered correctly
- Check pivot point for rotations

**Example:**
```json
{
  "showCenter": true,
  "centerStyle": "crosshair"
}
```

**Visual:**
```
      │
─────┼─────  Red crosshair
      │
```

### 2. Image Tip (showTip)

**Color:** Green (#00FF00)

**Purpose:** Shows the "tip" or "front" of the image

**Styles:**
- `"circle"` - Circle marker (default)
- `"arrow"` - Arrow shape

**When to Use:**
- Verify image orientation
- Check which direction image "points"

**Default Angle:** 90° (top of image)

**Example:**
```json
{
  "showTip": true,
  "tipStyle": "circle",
  "imageTip": 90
}
```

### 3. Image Base (showBase)

**Color:** Blue (#0000FF)

**Purpose:** Shows the "base" or "back" of the image

**Styles:**
- `"circle"` - Circle marker (default)
- `"square"` - Square marker

**When to Use:**
- Verify image orientation (opposite of tip)
- Check axis alignment

**Default Angle:** 270° (bottom of image)

**Example:**
```json
{
  "showBase": true,
  "baseStyle": "circle",
  "imageBase": 270
}
```

### 4. Stage Center (showStageCenter)

**Color:** Cyan (#00FFFF)

**Purpose:** Shows the stage center at (1024, 1024)

**Styles:**
- `"star"` - 5-point star (default)
- `"crosshair"` - Full-screen crosshair
- `"dot"` - Small circle

**When to Use:**
- Verify stage coordinates
- Reference point for all layers

**Example:**
```json
{
  "showStageCenter": true,
  "stageCenterStyle": "star"
}
```

**Visual:**
```
       *        5-point star
      * *       at stage center
    * * * *
      * *
      * *
```

### 5. Axis Line (showAxisLine)

**Color:** Yellow (#FFFF00)

**Purpose:** Shows the image's main axis from base to tip

**Style:** Dashed yellow line

**When to Use:**
- Verify image orientation
- Check rotation alignment
- Visualize base-to-tip direction

**Example:**
```json
{
  "showAxisLine": true
}
```

**Visual:**
```
  ● Base (blue)
  |
  | Yellow dashed line
  |
  ● Tip (green)
```

### 6. Rotation Indicator (showRotation)

**Color:** Cyan (#00FFFF)

**Purpose:** Shows rotation arc from current axis angle to upright (90°)

**Style:** Arc with arrow

**When to Use:**
- Visualize rotation amount
- Check displayRotation calculation

**Example:**
```json
{
  "showRotation": true
}
```

### 7. Tip Ray (showTipRay)

**Color:** Orange (#FFA500)

**Purpose:** Shows calculation ray from center to tip

**Style:** Dotted orange line

**When to Use:**
- Debug tip calculation
- Verify imageTip angle
- Advanced debugging only

**Example:**
```json
{
  "showTipRay": true,
  "imageTip": 90
}
```

### 8. Base Ray (showBaseRay)

**Color:** Purple (#9370DB)

**Purpose:** Shows calculation ray from center to base

**Style:** Dotted purple line

**When to Use:**
- Debug base calculation
- Verify imageBase angle
- Advanced debugging only

**Example:**
```json
{
  "showBaseRay": true,
  "imageBase": 270
}
```

### 9. Bounding Box (showBoundingBox)

**Color:** Magenta (#FF00FF)

**Purpose:** Shows the image's bounding box

**Style:** Dashed magenta rectangle

**When to Use:**
- Verify image dimensions
- Check scale calculations
- Debug overlap issues

**Example:**
```json
{
  "showBoundingBox": true
}
```

---

## Complete Visual Reference

```
┌────────────────────────────────────────────────────┐
│                      STAGE (2048×2048)                   │
│                                                          │
│                                                          │
│                        *  ← Stage Center (cyan)        │
│                       * *                                │
│                     * * * *                              │
│                       * *                                │
│      ┌ - - - - - - - * - - - - - - - ┐               │
│      :               * *              :               │
│      :                                :               │
│      :           ●  ← Tip (green)     : Bounding     │
│      :           |                   : Box           │
│      :           | Axis Line         : (magenta)     │
│      :           |                   :               │
│      :       ───┼─── ← Center (red)  :               │
│      :           |                   :               │
│      :           |                   :               │
│      :           |                   :               │
│      :           ●  ← Base (blue)      :               │
│      :                                :               │
│      └ - - - - - - - - - - - - - - - ┘               │
│                                                          │
│                                                          │
└────────────────────────────────────────────────────┘
```

---

## Processor: ImageMappingDebugProcessor

### Creation

**Location:** `LayerCorePipelineImageMappingDebug.ts`

```typescript
export function createImageMappingDebugProcessor(
  config: Partial<ImageMappingDebugConfig>
): LayerProcessor {
  // Early exit if nothing to show
  const hasAnyDebug =
    config.showCenter ||
    config.showTip ||
    config.showBase ||
    config.showStageCenter ||
    config.showAxisLine ||
    config.showRotation ||
    config.showTipRay ||
    config.showBaseRay ||
    config.showBoundingBox;

  if (!hasAnyDebug) {
    return (layer) => layer as EnhancedLayerData;
  }

  return (layer: UniversalLayerData): EnhancedLayerData => {
    const debugVisuals = generateImageMappingDebugVisuals(layer, config);

    return {
      ...layer,
      imageMappingDebugVisuals: debugVisuals,
      imageMappingDebugConfig: config,
    };
  };
}
```

### generateImageMappingDebugVisuals()

**Location:** `LayerCorePipelineImageMappingUtils.ts` lines 370-474

```typescript
export function generateImageMappingDebugVisuals(
  layer: UniversalLayerData,
  config?: Partial<ImageMappingDebugConfig>
): ImageMappingDebugVisuals {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const visuals: ImageMappingDebugVisuals = {};

  // Get pre-calculated coordinates from layer
  const imageCenterStage = layer.calculation.imageCenter.stage.point;
  const imageTipStage = layer.calculation.imageTip.stage.point;
  const imageBaseStage = layer.calculation.imageBase.stage.point;

  // Generate markers based on config
  if (cfg.showCenter) {
    visuals.centerMarker = generateImageCenterMarker(imageCenterStage, config);
  }

  if (cfg.showTip) {
    visuals.tipMarker = generateImageTipMarker(imageTipStage, config);
  }

  if (cfg.showBase) {
    visuals.baseMarker = generateImageBaseMarker(imageBaseStage, config);
  }

  if (cfg.showAxisLine) {
    visuals.axisLine = generateAxisLine(
      imageBaseStage,
      imageTipStage,
      layer.imageMapping.displayAxisAngle,
      config
    );
  }

  // ... more markers

  return visuals;
}
```

---

## Rendering Debug Visuals

### Canvas Renderer

**Location:** `LayerEngineCanvas.ts` lines 219-228

```typescript
// Render debug visuals after all layers
for (const layer of layers) {
  if (layer.hasAnimation) {
    const enhancedData = pipelineCache.get(layer.baseData.layerId, () =>
      runPipeline(layer.baseData, layer.processors, timestamp)
    );
    if (enhancedData.imageMappingDebugVisuals) {
      CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals, STAGE_SIZE);
    }
  }
}
```

**CanvasDebugRenderer Methods:**

```typescript
CanvasDebugRenderer.drawImageCenter(ctx, marker);    // Crosshair or dot
CanvasDebugRenderer.drawImageTip(ctx, marker);       // Circle or arrow
CanvasDebugRenderer.drawImageBase(ctx, marker);      // Circle or square
CanvasDebugRenderer.drawStageCenter(ctx, marker);    // Star, crosshair, or dot
CanvasDebugRenderer.drawAxisLine(ctx, line);         // Dashed line
CanvasDebugRenderer.drawRotationIndicator(ctx, ind); // Arc with arrow
CanvasDebugRenderer.drawImageRay(ctx, ray);          // Dotted line
CanvasDebugRenderer.drawBoundingBox(ctx, box);       // Dashed rectangle
CanvasDebugRenderer.drawAll(ctx, visuals);           // All enabled markers
```

### Three.js Renderer

**Location:** `LayerEngineThree.ts` lines 154-169

```typescript
// Add debug visuals to scene
const debugMeshes: THREE.Object3D[] = [];
for (const item of meshData) {
  const enhancedData =
    item.processors.length > 0 ? runPipeline(item.baseData, item.processors) : item.baseData;

  if (enhancedData.imageMappingDebugVisuals) {
    const meshes = ThreeDebugRenderer.addAllToScene(
      enhancedData.imageMappingDebugVisuals,
      scene,
      STAGE_SIZE,
      THREE
    );
    debugMeshes.push(...meshes);
  }
}
```

**ThreeDebugRenderer Methods:**

```typescript
ThreeDebugRenderer.createImageCenterMesh(marker, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.createImageTipMesh(marker, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.createImageBaseMesh(marker, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.createStageCenterMesh(marker, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.createAxisLineMesh(line, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.createBoundingBoxMesh(box, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.createImageRayMesh(ray, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.addAllToScene(visuals, scene, STAGE_SIZE, THREE);
```

---

## Common Debug Scenarios

### Scenario 1: Layer Not Appearing

**Enable:**
```json
{
  "showCenter": true,
  "showStageCenter": true,
  "showBoundingBox": true
}
```

**Check:**
- Is center marker visible? → Layer is loaded
- Is center marker on screen? → Position is correct
- Is bounding box visible? → Scale is correct
- Distance from stage center? → Check coordinates

### Scenario 2: Wrong Rotation

**Enable:**
```json
{
  "showCenter": true,
  "showTip": true,
  "showBase": true,
  "showAxisLine": true
}
```

**Check:**
- Tip (green) should point in intended direction
- Base (blue) should be opposite
- Axis line shows current orientation
- Adjust `BasicAngleImage` to fix

### Scenario 3: Spin Pivot Wrong

**Enable:**
```json
{
  "showCenter": true,
  "Spin Config": {
    "spinSpeed": 10
  }
}
```

**Check:**
- Center marker (red) shows spin pivot
- Should match intended spin point
- Adjust `spinImagePoint` if wrong

### Scenario 4: Image Upside Down

**Enable:**
```json
{
  "showTip": true,
  "showBase": true,
  "imageTip": 90,
  "imageBase": 270
}
```

**Check:**
- Tip (green) should be at "front" of image
- Base (blue) should be at "back"
- If reversed, swap `imageTip` and `imageBase` values

### Scenario 5: Positioning Issues

**Enable:**
```json
{
  "showCenter": true,
  "showStageCenter": true
}
```

**Measure:**
- Distance from image center (red) to stage center (cyan)
- Should match intended offset
- Adjust `BasicStagePoint` or `BasicImagePoint`

---

## Default Colors

```typescript
const DEFAULT_COLORS = {
  center: "#FF0000",       // Red
  tip: "#00FF00",          // Green
  base: "#0000FF",         // Blue
  stageCenter: "#00FFFF", // Cyan
  axisLine: "#FFFF00",    // Yellow
  rotation: "#00FFFF",    // Cyan
  tipRay: "#FFA500",      // Orange
  baseRay: "#9370DB",     // Purple
  boundingBox: "#FF00FF"  // Magenta
};
```

### Color Customization

```json
{
  "debugColors": {
    "center": "#FF0000",      // Keep red
    "tip": "#00FFFF",        // Change to cyan
    "base": "#FFFF00",       // Change to yellow
    "stageCenter": "#FFFFFF" // Change to white
  }
}
```

---

## Performance Impact

### Minimal Impact

**Debug OFF:**
- Processor not created
- No overhead

**Debug ON (showCenter only):**
- Processor adds ~0.1ms per layer
- Rendering adds ~0.5ms per frame
- Negligible impact

**Debug ON (all markers):**
- Processor adds ~0.3ms per layer
- Rendering adds ~2ms per frame
- Still acceptable for debugging

### Recommendation

**Development:** Enable all needed markers

**Production:** Disable all debug markers

```json
{
  "Image Mapping Debug": {
    "showCenter": false,
    "showTip": false,
    "showBase": false,
    "showStageCenter": false
  }
}
```

---

## Tips & Tricks

### Tip 1: Start Simple

Enable only what you need:

```json
// Start with basics
{
  "showCenter": true,
  "showStageCenter": true
}

// Add more as needed
{
  "showCenter": true,
  "showStageCenter": true,
  "showTip": true,
  "showBase": true
}
```

### Tip 2: Use Stage Center as Reference

**Always enable:**
```json
{
  "showStageCenter": true,
  "stageCenterStyle": "star"
}
```

**Why:** Cyan star at (1024, 1024) is reference point for all layers

### Tip 3: Verify Scale with Bounding Box

```json
{
  "showBoundingBox": true
}
```

**Check:** Box should match image size × scale

### Tip 4: Debug Rays for Advanced Issues

```json
{
  "showTipRay": true,
  "showBaseRay": true
}
```

**Only use when:** Debugging `imageTip`/`imageBase` calculation

---

## Troubleshooting

### Issue: Markers Not Appearing

**Check:**

1. **Processor created?**
   ```javascript
   console.log(processors);  // Should include DebugProcessor
   ```

2. **Markers in viewport?**
   ```javascript
   console.log(enhancedData.imageMappingDebugVisuals);
   ```

3. **Renderer supports debug?**
   - Canvas: ✅ Full support
   - Three.js: ✅ Full support
   - DOM: ⚠️ Partial support

### Issue: Wrong Marker Position

**Verify coordinates:**

```javascript
console.log(layer.calculation.imageCenter.stage.point);  // Where marker should be
```

### Issue: Colors Too Dim

**Increase opacity or change colors:**

```json
{
  "debugColors": {
    "center": "#FF0000",  // Bright red
    "tip": "#00FF00"     // Bright green
  }
}
```

---

## Next Steps

- **📐 Coordinates:** Read `02_COORDINATE_SYSTEMS.md`
- **🔄 Spin:** Read `03_SPIN_ANIMATION_DEEP_DIVE.md`
- **📖 Config:** Read `01_CONFIG_SYSTEM_GUIDE.md`

---

**AI Agent Note:** Debug markers are essential for understanding positioning. Always enable `showCenter` and `showStageCenter` when debugging layout issues. The color-coded system makes it easy to identify which marker is which.
