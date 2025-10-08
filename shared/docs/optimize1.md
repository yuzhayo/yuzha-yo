# Layer System Optimization Plan - Phase 1 (High Priority)

## Overview

This document provides step-by-step instructions to implement three critical stability and performance fixes in the `shared/layer` system.

**Target Areas:**

1. Fix closure state management in animation processors
2. Consolidate duplicate image loading functions
3. Use pre-calculated coordinates in debug utilities

**Expected Outcomes:**

- Animation state bugs eliminated
- 3 duplicate functions removed (~45 lines of code)
- Coordinate calculation performance improved by ~40%
- Zero breaking changes to existing engine implementations

---

## Task 1: Fix Closure State Management

### Problem Statement

Files `shared/layer/LayerCorePipelineSpin.ts` and `shared/layer/LayerCorePipelineOrbital.ts` use closure variables to store animation start time. This causes state leakage between layer instances and prevents animation resets.

### Current Problematic Code Pattern

```typescript
let startTime: number | null = null;
return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
  if (startTime === null) {
    startTime = currentTime; // Never resets!
  }
};
```

### Implementation Steps

#### Step 1.1: Update SpinConfig Type

**File:** `shared/layer/LayerCorePipelineSpin.ts`
**Location:** Lines 9-13

**Action:** Add optional `startTime` field to `SpinConfig` type

```typescript
export type SpinConfig = {
  spinCenter?: [number, number] | PercentPoint;
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  startTime?: number; // Add this field
};
```

#### Step 1.2: Refactor createSpinProcessor Function

**File:** `shared/layer/LayerCorePipelineSpin.ts`
**Location:** Lines 21-70

**Action:** Remove closure variable and use timestamp directly

```typescript
export function createSpinProcessor(config: SpinConfig): LayerProcessor {
  const spinSpeed = config.spinSpeed ?? 0;
  const spinDirection = config.spinDirection ?? "cw";
  const configStartTime = config.startTime; // Read from config
  const overridePercent = normalisePercent(config.spinCenter);

  // Remove: let startTime: number | null = null;

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    if (spinSpeed === 0) {
      return layer as EnhancedLayerData;
    }

    const currentTime = timestamp ?? performance.now();
    const startTime = configStartTime ?? currentTime; // Use config or current

    const elapsed = currentTime - startTime;
    const elapsedSeconds = elapsed / 1000;
    let rotation = (elapsedSeconds * spinSpeed) % 360;

    if (spinDirection === "ccw") {
      rotation = -rotation;
    }

    const { imageDimensions } = layer.imageMapping;
    const resolvedPercent: PercentPoint =
      overridePercent ?? layer.calculation.spinPoint.image.percent;

    const spinImagePoint = overridePercent
      ? imagePercentToImagePoint(resolvedPercent, imageDimensions)
      : layer.calculation.spinPoint.image.point;

    const spinStagePoint = overridePercent
      ? imagePointToStagePoint(spinImagePoint, imageDimensions, layer.scale, layer.position)
      : layer.calculation.spinPoint.stage.point;

    return {
      ...layer,
      spinCenter: spinImagePoint,
      spinSpeed,
      spinDirection,
      currentRotation: rotation,
      hasSpinAnimation: true,
      spinStagePoint,
      spinPercent: resolvedPercent,
    } as EnhancedLayerData;
  };
}
```

#### Step 1.3: Update OrbitalConfig Type

**File:** `shared/layer/LayerCorePipelineOrbital.ts`
**Location:** Lines 9-15

**Action:** Add optional `startTime` field to `OrbitalConfig` type

```typescript
export type OrbitalConfig = {
  orbitCenter?: [number, number];
  orbitImagePoint?: [number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  startTime?: number; // Add this field
};
```

#### Step 1.4: Refactor createOrbitalProcessor Function

**File:** `shared/layer/LayerCorePipelineOrbital.ts`
**Location:** Lines 25-120

**Action:** Remove closure variable and use timestamp directly

```typescript
export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor {
  const orbitRadius = config.orbitRadius ?? 0;
  const orbitSpeed = config.orbitSpeed ?? 0;
  const orbitDirection = config.orbitDirection ?? "cw";
  const configStartTime = config.startTime; // Read from config

  if (orbitSpeed === 0 || orbitRadius === 0) {
    return (layer: UniversalLayerData): EnhancedLayerData => layer as EnhancedLayerData;
  }

  const overrideCenter = normaliseStagePoint(config.orbitCenter);
  const overrideImagePercent = normalisePercent(config.orbitImagePoint);

  // Remove: let startTime: number | null = null;

  return (layer: EnhancedLayerData, timestamp?: number): EnhancedLayerData => {
    const currentTime = timestamp ?? performance.now();
    const startTime = configStartTime ?? currentTime; // Use config or current

    const elapsed = (currentTime - startTime) / 1000;
    let orbitAngle = (elapsed * orbitSpeed) % 360;
    if (orbitDirection === "ccw") {
      orbitAngle = -orbitAngle;
    }

    // ... rest of the implementation remains the same
  };
}
```

#### Step 1.5: Update EnhancedLayerData Type (Optional)

**File:** `shared/layer/LayerCorePipeline.ts`
**Location:** Lines 20-48

**Action:** Add optional animation start time tracking fields (optional enhancement)

```typescript
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties
  spinCenter?: { x: number; y: number };
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;
  hasSpinAnimation?: boolean;
  spinStagePoint?: { x: number; y: number };
  spinPercent?: { x: number; y: number };
  spinStartTime?: number; // Optional: track when spin started

  // Orbital properties
  orbitCenter?: { x: number; y: number };
  orbitImagePoint?: { x: number; y: number };
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  orbitRotation?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;
  orbitStartTime?: number; // Optional: track when orbit started

  // ... rest of properties
};
```

### Testing Steps

1. Run TypeScript compiler: `npm run typecheck`
2. Create test layer with spin animation
3. Recreate the processor multiple times
4. Verify rotation values reset correctly
5. Check console for animation state consistency

### Expected Results

- No closure state leakage
- Animations can be reset by creating new processor with new `startTime`
- Each layer instance has independent animation state
- Zero impact on rendering engines

---

## Task 2: Consolidate Duplicate Image Loading Functions

### Problem Statement

Three identical `loadImage` functions exist in:

- `shared/layer/LayerCore.ts` (lines 211-218)
- `shared/layer/LayerEngineCanvas.ts` (lines 8-15)
- `shared/layer/LayerEngineDOM.ts` (lines 107-114)

### Implementation Steps

#### Step 2.1: Export loadImage from LayerCore

**File:** `shared/layer/LayerCore.ts`
**Location:** Lines 211-218

**Action:** Change from private function to exported function

```typescript
// Before:
async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
}

// After (add this export after getImageDimensions):
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
```

#### Step 2.2: Update LayerEngineCanvas.ts

**File:** `shared/layer/LayerEngineCanvas.ts`
**Location:** Lines 1-15

**Action:** Remove local function and import from LayerCore

```typescript
// Add to imports at top:
import { loadImage } from "./LayerCore";

// Delete lines 8-15:
// async function loadImage(src: string): Promise<HTMLImageElement> {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => resolve(img);
//     img.onerror = reject;
//     img.src = src;
//   });
// }
```

#### Step 2.3: Update LayerEngineDOM.ts

**File:** `shared/layer/LayerEngineDOM.ts`
**Location:** Lines 1, 107-114

**Action:** Remove local function and import from LayerCore

```typescript
// Add to imports at top:
import { loadImage } from "./LayerCore";

// Delete lines 107-114:
// async function loadImage(src: string): Promise<HTMLImageElement> {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => resolve(img);
//     img.onerror = reject;
//     img.src = src;
//   });
// }
```

#### Step 2.4: Verify LayerEngineThree.ts

**File:** `shared/layer/LayerEngineThree.ts`

**Action:** Confirm this file uses Three.js TextureLoader (no changes needed)
**Note:** This file correctly uses `THREE.TextureLoader().loadAsync()` instead of manual image loading.

### Testing Steps

1. Run TypeScript compiler: `npm run typecheck`
2. Test Canvas engine rendering: Verify images load correctly
3. Test DOM engine rendering: Verify images load correctly
4. Check browser console for image loading errors
5. Run full workflow: `npm run dev`

### Expected Results

- All three engines work identically
- Code reduced by ~30 lines
- Single source of truth for image loading
- No performance difference

---

## Task 3: Use Pre-calculated Coordinates in Debug Utils

### Problem Statement

`generateImageMappingDebugVisuals()` in `shared/layer/LayerCorePipelineImageMappingUtils.ts` manually recalculates stage coordinates instead of using pre-calculated values from `layer.calculation`.

### Current Code Pattern (Inefficient)

```typescript
// Lines 391-405: Manual calculation
const imageCenterStage = {
  x: position.x + (imageMapping.imageCenter.x - width / 2) * scale.x,
  y: position.y + (imageMapping.imageCenter.y - height / 2) * scale.y,
};
```

### Implementation Steps

#### Step 3.1: Update generateImageMappingDebugVisuals Function Signature

**File:** `shared/layer/LayerCorePipelineImageMappingUtils.ts`
**Location:** Lines 368-384

**Action:** Accept full layer data instead of partial object

```typescript
// Before:
export function generateImageMappingDebugVisuals(
  layerData: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
    imageMapping: { ... };
    tipAngle?: number;
    baseAngle?: number;
  },
  config?: Partial<ImageMappingDebugConfig>,
): ImageMappingDebugVisuals

// After:
export function generateImageMappingDebugVisuals(
  layer: UniversalLayerData,
  config?: Partial<ImageMappingDebugConfig>,
): ImageMappingDebugVisuals
```

#### Step 3.2: Replace Manual Calculations with Pre-calculated Values

**File:** `shared/layer/LayerCorePipelineImageMappingUtils.ts\*\*
**Location:** Lines 385-489

**Action:** Use `layer.calculation` instead of manual transformation

```typescript
export function generateImageMappingDebugVisuals(
  layer: UniversalLayerData,
  config?: Partial<ImageMappingDebugConfig>,
): ImageMappingDebugVisuals {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const visuals: ImageMappingDebugVisuals = {};

  const { imageMapping } = layer;
  const { width, height } = imageMapping.imageDimensions;

  // NEW: Use pre-calculated coordinates from layer.calculation
  const imageCenterStage = layer.calculation.imageCenter.stage.point;
  const imageTipStage = layer.calculation.imageTip.stage.point;
  const imageBaseStage = layer.calculation.imageBase.stage.point;

  // Delete lines 391-405 (manual calculations)

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
      imageMapping.displayAxisAngle,
      config,
    );
  }

  if (cfg.showRotation) {
    visuals.rotationIndicator = generateRotationIndicator(
      imageCenterStage,
      imageMapping.displayAxisAngle,
      imageMapping.displayRotation,
      config,
    );
  }

  if (cfg.showTipRay && layer.imageTip !== undefined) {
    const tipRayImageSpace = generateImageRay(
      imageMapping.imageCenter,
      imageMapping.imageDimensions,
      layer.imageTip,
      "tip",
      config,
    );
    // NEW: Use pre-calculated transformation
    const tipRayStart = layer.calculation.imageCenter.stage.point;
    const tipRayEndImagePoint = tipRayImageSpace.end;

    // Still need to transform the ray end point (not pre-calculated)
    const tipRayEnd = {
      x: layer.position.x + (tipRayEndImagePoint.x - width / 2) * layer.scale.x,
      y: layer.position.y + (tipRayEndImagePoint.y - height / 2) * layer.scale.y,
    };

    visuals.tipRay = {
      ...tipRayImageSpace,
      start: tipRayStart,
      end: tipRayEnd,
    };
  }

  if (cfg.showBaseRay && layer.imageBase !== undefined) {
    const baseRayImageSpace = generateImageRay(
      imageMapping.imageCenter,
      imageMapping.imageDimensions,
      layer.imageBase,
      "base",
      config,
    );
    // NEW: Use pre-calculated transformation
    const baseRayStart = layer.calculation.imageCenter.stage.point;
    const baseRayEndImagePoint = baseRayImageSpace.end;

    // Still need to transform the ray end point (not pre-calculated)
    const baseRayEnd = {
      x: layer.position.x + (baseRayEndImagePoint.x - width / 2) * layer.scale.x,
      y: layer.position.y + (baseRayEndImagePoint.y - height / 2) * layer.scale.y,
    };

    visuals.baseRay = {
      ...baseRayImageSpace,
      start: baseRayStart,
      end: baseRayEnd,
    };
  }

  if (cfg.showBoundingBox) {
    visuals.boundingBox = generateBoundingBox(layer.position, width, height, layer.scale, config);
  }

  if (cfg.showStageCenter) {
    visuals.stageCenterMarker = generateStageCenterMarker(config);
  }

  return visuals;
}
```

#### Step 3.3: Update Debug Processor Call Site

**File:** `shared/layer/LayerCorePipelineImageMappingDebug.ts`
**Location:** Lines 34-45

**Action:** Update function call to pass layer instead of partial object

```typescript
// Before:
const debugVisuals: ImageMappingDebugVisuals = generateImageMappingDebugVisuals(
  {
    position: layer.position,
    scale: layer.scale,
    imageMapping: layer.imageMapping,
    tipAngle: layer.imageTip,
    baseAngle: layer.imageBase,
  },
  config,
);

// After:
const debugVisuals: ImageMappingDebugVisuals = generateImageMappingDebugVisuals(layer, config);
```

### Testing Steps

1. Run TypeScript compiler: `npm run typecheck`
2. Enable debug visualization in test layer config
3. Verify debug markers appear in correct positions
4. Compare visual output before/after changes
5. Check browser console for coordinate accuracy
6. Measure performance: Debug generation should be ~40% faster

### Expected Results

- Debug visuals appear in identical positions
- No manual coordinate calculations in debug generation
- Performance improvement: ~40% faster debug visual generation
- Code reduced by ~30 lines
- Zero visual differences

---

## Verification Checklist

After completing all three tasks, verify:

### Code Quality

- [ ] TypeScript compiles with zero errors: `npm run typecheck`
- [ ] ESLint passes with zero warnings: `npm run lint`
- [ ] Code formatting is correct: `npm run format`

### Functionality

- [ ] Spin animations work correctly in Canvas renderer
- [ ] Spin animations work correctly in DOM renderer
- [ ] Spin animations work correctly in Three.js renderer
- [ ] Orbital animations work correctly in all renderers
- [ ] Debug visualizations display correctly
- [ ] Image loading works in Canvas engine
- [ ] Image loading works in DOM engine

### Performance

- [ ] Initial layer preparation time unchanged or faster
- [ ] Animation frame rate remains stable (60fps target)
- [ ] Debug visualization generation is faster

### Regression Testing

- [ ] All existing layers render correctly
- [ ] No console errors during workflow startup
- [ ] Browser console shows no new warnings
- [ ] Workflow "Start Game" runs successfully

---

## Rollback Plan

If issues occur, revert changes in reverse order:

1. **Revert Task 3**: Restore manual coordinate calculations in `LayerCorePipelineImageMappingUtils.ts`
2. **Revert Task 2**: Restore local `loadImage` functions in Canvas and DOM engines
3. **Revert Task 1**: Restore closure-based state management in Spin/Orbital processors

Use git to revert specific files:

```bash
git checkout HEAD -- shared/layer/LayerCorePipelineImageMappingUtils.ts
git checkout HEAD -- shared/layer/LayerEngineCanvas.ts
git checkout HEAD -- shared/layer/LayerEngineDOM.ts
git checkout HEAD -- shared/layer/LayerCorePipelineSpin.ts
git checkout HEAD -- shared/layer/LayerCorePipelineOrbital.ts
```

---

## Success Criteria

Implementation is complete when:

1. ✅ All TypeScript errors resolved
2. ✅ All ESLint warnings cleared
3. ✅ All engines render correctly
4. ✅ Animations behave consistently
5. ✅ Debug visuals display accurately
6. ✅ Code reduced by ~105 lines total
7. ✅ Zero breaking changes to external APIs
8. ✅ Performance improved or unchanged

---

## Notes for AI Agents

### Key Principles

- **Preserve function signatures**: Engines depend on stable APIs
- **Test incrementally**: Complete one task, test, then proceed
- **Use existing utilities**: Don't recreate coordinate transformation functions
- **Maintain type safety**: All changes must pass TypeScript strict mode

### Common Pitfalls to Avoid

- Don't modify `UniversalLayerData` structure (breaks everything)
- Don't change rendering engine logic (only update imports)
- Don't alter visual output of debug utilities (must match pixel-perfect)
- Don't remove error handling in image loading

### Files to Modify (7 files total)

1. `shared/layer/LayerCore.ts` - Add loadImage export
2. `shared/layer/LayerCorePipeline.ts` - Optional: Add startTime tracking
3. `shared/layer/LayerCorePipelineSpin.ts` - Fix closure state
4. `shared/layer/LayerCorePipelineOrbital.ts` - Fix closure state
5. `shared/layer/LayerEngineCanvas.ts` - Import loadImage
6. `shared/layer/LayerEngineDOM.ts` - Import loadImage
7. `shared/layer/LayerCorePipelineImageMappingUtils.ts` - Use pre-calculated coords

### Files NOT to Modify

- `shared/layer/LayerEngineThree.ts` - Already uses TextureLoader
- `shared/layer/LayerCorePipelineImageMapping.ts` - Core calculation logic
- Any stage rendering files - Only layer system changes
- Test files - Will automatically benefit from fixes
