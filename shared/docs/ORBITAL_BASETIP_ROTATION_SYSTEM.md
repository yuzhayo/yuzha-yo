# Orbital Base-Tip Rotation System

## Overview

This document describes the **complete Base-Tip rotation calculation system** for the Yuzha Animation Framework, based on detailed design discussions in January 2025. This system provides intuitive control over image orientation during orbital motion using a radial alignment approach.

**Date:** January 2025  
**Status:** Design complete, awaiting implementation  
**Related Files:** 
- `/app/shared/layer/LayerCorePipelineOrbital.ts`
- `/app/shared/layer/LayerCorePipelineImageMapping.ts`
- `/app/shared/docs/ORBITAL_IMAGETIP_SYSTEM.md`
- `/app/shared/docs/09_ORBITAL_ANIMATION_TODO.md`

---

## Core Concept: Radial Clock Hand Alignment

### The Fundamental Rule

**Three points MUST be collinear (on one straight line):**

```
orbitStagePoint ———— midpoint(base,tip) ———— imageTip
   (center)          (on orbit circle)        (pointing OUTWARD)
      ★                     •                        •
```

### Key Principles

1. **imageTip** and **imageBase** are defined as **angles from imageCenter (50%, 50%)**
2. **Default values:** `imageTip = 90°` (top), `imageBase = 270°` (bottom)
3. The **MIDPOINT** between imageTip and imageBase positions sits **ON the orbit circle**
4. **imageTip** ALWAYS points **OUTWARD** from the center (like a clock hand)
5. This rotation is **SEPARATE** from orbital position calculation
6. This rotation **IGNORES** BasicImagePoint rotation (when orbital is active)
7. **Spin overrides everything:** When `spinSpeed > 0`, base-tip rotation is ignored

---

## Visual Examples

### Example 1: Default Configuration (Clock Hand Style)

**Config:**
```json
{
  "imageTip": 90,       // Top of image (default)
  "imageBase": 270,     // Bottom of image (default)
  "Orbital Config": {
    "orbitStagePoint": [1024, 1024],
    "orbitRadius": 300,
    "orbitSpeed": 30
  }
}
```

**Visual Result:**
```
                 orbitStagePoint ★ (center)
                        |
                        | radius line
                        |
                   midpoint • (on orbit circle)
                        |
                   [  IMAGE  ]
                   base     tip
                    •        •
                  (270°)   (90° - points OUT)
```

**Effect:** Image tip always points AWAY from center, like clock hands

---

### Example 2: Position at 3 O'Clock

When the orbit position is at 3 o'clock (east):

```
★ orbitStagePoint ————— midpoint ————→ imageTip (pointing east/outward)
                           |
                       [  IMAGE  ]
                       rotated to
                       face right
```

**Calculation:**
- `radiusAngle = 0°` (pointing east from center)
- Default: `imageTip = 90°`, `imageBase = 270°`
- `axisAngle = atan2(tipY - baseY, tipX - baseX)`
- `rotationNeeded = radiusAngle - axisAngle`

---

### Example 3: Custom Angles (Sideways Clock Hand)

**Config:**
```json
{
  "imageTip": 0,        // Right edge of image
  "imageBase": 180,     // Left edge of image
  "Orbital Config": {
    "orbitStagePoint": [1024, 1024],
    "orbitRadius": 300,
    "orbitSpeed": 30
  }
}
```

**Result:**
```
orbitStagePoint ★ ———— midpoint • ———→ [IMAGE] ———→ imageTip
                                        (horizontal orientation)
```

**Effect:** Image oriented horizontally, right edge always pointing outward

---

## Rotation Calculation Formula

### Step-by-Step Calculation

```typescript
// 1. Get imageTip and imageBase angles (from imageCenter)
const imageTipAngle = layer.imageTip ?? 90;      // Default: top
const imageBaseAngle = layer.imageBase ?? 270;   // Default: bottom

// 2. Calculate positions in image coordinate space
const imageTipPos = projectAngleToImageBoundary(imageTipAngle, imageCenter, imageDimensions);
const imageBasePos = projectAngleToImageBoundary(imageBaseAngle, imageCenter, imageDimensions);

// 3. Calculate midpoint between tip and base
const midpointPos = {
  x: (imageTipPos.x + imageBasePos.x) / 2,
  y: (imageTipPos.y + imageBasePos.y) / 2
};

// 4. Calculate the axis angle (base→tip direction)
const axisAngle = Math.atan2(
  imageTipPos.y - imageBasePos.y,
  imageTipPos.x - imageBasePos.x
) * (180 / Math.PI);

// 5. Calculate radius angle (center→orbit position)
const radiusAngle = Math.atan2(
  orbitPoint.y - orbitStagePoint.y,
  orbitPoint.x - orbitStagePoint.x
) * (180 / Math.PI);

// 6. Calculate rotation to align axis with radius
const baseTipRotation = radiusAngle - axisAngle;
```

### Important Notes

- **axisAngle:** The current direction of the base→tip line
- **radiusAngle:** The direction from orbit center to current orbit position
- **baseTipRotation:** The rotation needed to make imageTip point outward

---

## Override Hierarchy (Critical!)

### Rotation Priority (Highest → Lowest)

```typescript
// PRIORITY 1: Spin rotation (when active)
if (spinSpeed > 0) {
  finalRotation = spinRotation;  // Spin wins, ignore base-tip
}
// PRIORITY 2: Base-Tip alignment (when orbital active, spin inactive)
else if (orbitalActive && spinSpeed === 0) {
  finalRotation = baseTipRotation;  // Use base-tip, IGNORE BasicImagePoint
}
// PRIORITY 3: Basic rotation (fallback)
else {
  finalRotation = basicRotation;  // From Basic Config
}
```

### Key Points

1. **Spin overrides everything:** `spinSpeed > 0` → base-tip is ignored
2. **Base-tip ignores Basic:** When orbital is active, BasicImagePoint rotation is ignored
3. **Clean separation:** Each rotation source is independent
4. **No mixing:** Use ONE rotation source per frame

---

## Configuration Schema

### Type Definitions

```typescript
// Add to BasicGroupConfig in Config.ts
type BasicGroupConfig = {
  // Existing fields...
  imageTip?: number;         // Angle from imageCenter (0-360°, default: 90)
  imageBase?: number;        // Angle from imageCenter (0-360°, default: 270)
  // ...
};

// Add to EnhancedLayerData
type EnhancedLayerData = {
  // Existing fields...
  baseTipRotation?: number;  // Calculated rotation from base-tip alignment
  // ...
};
```

### Complete Example Config

```json
{
  "layerId": "clock-hand-01",
  "imageId": "hand",
  "groups": {
    "Basic Config": {
      "imageTip": 90,              // Top of image
      "imageBase": 270,            // Bottom of image
      "scale": [100, 100],
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 50]
    },
    "Spin Config": {
      "spinSpeed": 0               // Must be 0 for base-tip to work
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 400,
      "orbitSpeed": 6,
      "orbitDirection": "cw"
    }
  }
}
```

---

## Implementation Workflow

### Phase 1: Add Configuration Fields

**File:** `shared/config/Config.ts`

```typescript
// 1. Add to BasicGroupConfig type
type BasicGroupConfig = {
  // ... existing fields
  imageTip?: number;         // NEW: Default 90°
  imageBase?: number;        // NEW: Default 270°
};

// 2. Add to EnhancedLayerData
export type EnhancedLayerData = LayerCoreData & {
  // ... existing fields
  baseTipRotation?: number;  // NEW: Calculated rotation
};
```

---

### Phase 2: Create Base-Tip Rotation Processor

**File:** `shared/layer/LayerCorePipelineBaseTipRotation.ts` (NEW FILE)

```typescript
import * as THREE from 'three';
import { EnhancedLayerData } from '../config/Config';
import { LayerProcessor } from './LayerCorePipeline';
import { normalizeAngle } from '../utils/mathUtils';

export const BaseTipRotationProcessor: LayerProcessor = (
  layer: EnhancedLayerData,
  frameState: { elapsedSeconds: number }
): EnhancedLayerData => {
  
  // Skip if spin is active
  if (layer.spinSpeed && layer.spinSpeed > 0) {
    return layer; // Spin overrides base-tip
  }

  // Skip if orbital not active
  if (!layer.orbitRadius || layer.orbitRadius === 0) {
    return layer; // No orbital, no base-tip rotation
  }

  // Get imageTip and imageBase angles (defaults: 90°, 270°)
  const imageTipAngle = layer.imageTip ?? 90;
  const imageBaseAngle = layer.imageBase ?? 270;

  // Get image dimensions and center
  const { width, height } = layer.imageMapping.imageDimensions;
  const imageCenter = layer.imageMapping.imageCenter;

  // Calculate tip and base positions
  const tipPos = projectAngleToImageBoundary(imageTipAngle, imageCenter, { width, height });
  const basePos = projectAngleToImageBoundary(imageBaseAngle, imageCenter, { width, height });

  // Calculate midpoint
  const midpoint = {
    x: (tipPos.x + basePos.x) / 2,
    y: (tipPos.y + basePos.y) / 2
  };

  // Calculate axis angle (base→tip direction)
  const axisAngle = Math.atan2(
    tipPos.y - basePos.y,
    tipPos.x - basePos.x
  ) * (180 / Math.PI);

  // Calculate radius angle (center→orbit position)
  // This comes from orbital processor's orbitPoint
  const orbitStagePoint = layer.orbitStagePoint || [1024, 1024];
  const orbitPoint = layer.orbitPoint || orbitStagePoint; // Fallback

  const radiusAngle = Math.atan2(
    orbitPoint[1] - orbitStagePoint[1],
    orbitPoint[0] - orbitStagePoint[0]
  ) * (180 / Math.PI);

  // Calculate rotation to align axis with radius
  const baseTipRotation = normalizeAngle(radiusAngle - axisAngle);

  return {
    ...layer,
    baseTipRotation,
    rotation: baseTipRotation  // Override rotation field
  };
};

// Helper function
function projectAngleToImageBoundary(
  angle: number,
  center: { x: number; y: number },
  dimensions: { width: number; height: number }
): { x: number; y: number } {
  const angleRad = angle * (Math.PI / 180);
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  // Project to image boundary (simplified - use existing implementation)
  // This should match LayerCorePipelineImageMapping.ts logic
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  const t = Math.min(
    Math.abs(halfWidth / dx),
    Math.abs(halfHeight / dy)
  );

  return {
    x: center.x + dx * t,
    y: center.y + dy * t
  };
}
```

---

### Phase 3: Wire to Pipeline

**File:** `shared/stages/StageDOM.tsx`, `StageCanvas.tsx`, `StageThree.tsx`

```typescript
// Add BaseTipRotationProcessor AFTER ImageMapping, BEFORE or AFTER Orbital
import { BaseTipRotationProcessor } from '../layer/LayerCorePipelineBaseTipRotation';

// In pipeline array:
const processors: LayerProcessor[] = [
  SpinProcessor,
  OrbitalProcessor,
  BaseTipRotationProcessor,  // NEW: Add here
  ImageMappingDebugProcessor,
];
```

**Order matters:** Run AFTER orbital calculates position, but rotation logic is independent.

---

### Phase 4: Update Existing Files

**File:** `shared/layer/LayerCorePipelineOrbital.ts`

```typescript
// IMPORTANT: Remove old rotation calculation
// OLD (DELETE THIS):
// if (!layer.hasSpinAnimation) {
//   orbitRotation = calculateAngleToPoint(resolvedOrbitCenter, orbitPoint) - 90;
// }

// NEW (Keep positioning only):
return {
  ...layer,
  orbitPoint,  // Expose for BaseTipRotationProcessor
  position: [orbitPoint.x, orbitPoint.y],
  isVisible,
  // Do NOT calculate rotation here - let BaseTipRotationProcessor handle it
};
```

---

## Edge Cases & Solutions (Comprehensive)

### Problem 1: Angle Wrap-Around (CRITICAL!)

**Issue:** When imageTip and imageBase cross the 0°/360° boundary, naive calculations fail.

**Examples:**
- `imageTip = 350°`, `imageBase = 10°` → Actual difference is 20°, NOT 340°
- `imageTip = 5°`, `imageBase = 355°` → Actual difference is 10°, NOT -350°

**Root Cause:** Angles need to be normalized to -180° to +180° range for correct calculations.

**Complete Solution:**
```typescript
/**
 * Normalize angle to -180° to +180° range
 * Ensures correct angle difference calculations across 0°/360° boundary
 */
function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}

/**
 * Calculate shortest angular difference between two angles
 * Handles wrap-around correctly
 */
function angleDifference(angle1: number, angle2: number): number {
  let diff = angle2 - angle1;
  return normalizeAngle(diff);
}

// Apply in processor:
const axisAngle = normalizeAngle(
  Math.atan2(tipPos.y - basePos.y, tipPos.x - basePos.x) * (180 / Math.PI)
);

const radiusAngle = normalizeAngle(
  Math.atan2(orbitPoint[1] - orbitStagePoint[1], orbitPoint[0] - orbitStagePoint[0]) * (180 / Math.PI)
);

const baseTipRotation = normalizeAngle(radiusAngle - axisAngle);
```

**Test Cases:**
```typescript
// Test 1: Cross 0° boundary
normalizeAngle(350 - 10);  // Should return -20, not 340

// Test 2: Large positive angle
normalizeAngle(720);  // Should return 0

// Test 3: Large negative angle
normalizeAngle(-450);  // Should return -90
```

**Fallback Behavior:** If normalization fails (edge case), default to 0° rotation and log warning.

---

### Problem 2: Identical Tip and Base Angles

**Issue:** If `imageTip === imageBase`, axis direction is mathematically undefined (divide by zero).

**Examples:**
- `imageTip = 90°`, `imageBase = 90°` → No axis exists
- `imageTip = 0°`, `imageBase = 0°` → Both point to same location

**Detection Threshold:** Use 1° tolerance to account for floating-point errors.

**Complete Solution:**
```typescript
// Check if angles are too close (within 1° tolerance)
const angleDiff = Math.abs(normalizeAngle(imageTipAngle - imageBaseAngle));

if (angleDiff < 1) {
  console.warn(
    `[BaseTipRotation] Layer "${layer.layerId}": imageTip (${imageTipAngle}°) ` +
    `and imageBase (${imageBaseAngle}°) are too close. ` +
    `Axis direction undefined. Using zero rotation.`
  );
  
  return {
    ...layer,
    baseTipRotation: 0,
    rotation: layer.rotation || 0  // Keep existing rotation or 0
  };
}

// Also check opposite angles (180° apart exactly)
if (Math.abs(angleDiff - 180) < 1) {
  console.warn(
    `[BaseTipRotation] Layer "${layer.layerId}": imageTip and imageBase ` +
    `are exactly opposite (180° apart). Midpoint at image center.`
  );
  // This is actually valid, midpoint will be at imageCenter
}
```

**Fallback Behavior:** Return 0° rotation, preserve any existing rotation from Basic Config.

**Test Cases:**
- Same angle: `tip=90, base=90` → 0° rotation
- Opposite angles: `tip=90, base=270` → Valid (default case)
- Near-same: `tip=90, base=90.5` → 0° rotation (within tolerance)

---

### Problem 3: Midpoint Calculation with Wrap-Around

**Issue:** When tip and base are on opposite sides of 0°/360°, midpoint calculation can be wrong.

**Example:**
- `imageTip = 10°`, `imageBase = 350°`
- Naive midpoint: `(10 + 350) / 2 = 180°` ❌ WRONG!
- Correct midpoint: `0°` (average across boundary)

**Complete Solution:**
```typescript
/**
 * Calculate midpoint angle accounting for wrap-around
 */
function calculateMidpointAngle(angle1: number, angle2: number): number {
  const diff = angleDifference(angle1, angle2);
  const midpoint = normalizeAngle(angle1 + diff / 2);
  return midpoint;
}

// Usage:
const midpointAngle = calculateMidpointAngle(imageTipAngle, imageBaseAngle);
const tipPos = projectAngleToImageBoundary(imageTipAngle, imageCenter, imageDimensions);
const basePos = projectAngleToImageBoundary(imageBaseAngle, imageCenter, imageDimensions);
const midpointPos = projectAngleToImageBoundary(midpointAngle, imageCenter, imageDimensions);
```

**Test Cases:**
```typescript
// Test 1: Boundary crossing
calculateMidpointAngle(350, 10);  // Should return 0

// Test 2: Normal case
calculateMidpointAngle(90, 270);  // Should return 180

// Test 3: Reverse boundary
calculateMidpointAngle(10, 350);  // Should return 0
```

---

### Problem 3: Performance - Recalculation Every Frame

**Issue:** Calculating midpoint, arctangent every frame is expensive

**Solution:**
```typescript
// Cache axis angle if tip/base don't change
const cacheKey = `${layer.layerId}-${imageTipAngle}-${imageBaseAngle}`;
if (axisAngleCache.has(cacheKey)) {
  axisAngle = axisAngleCache.get(cacheKey);
} else {
  axisAngle = calculateAxisAngle(tipPos, basePos);
  axisAngleCache.set(cacheKey, axisAngle);
}

// Only recalculate radiusAngle (orbital position changes)
```

---

### Problem 4: Spin Override Timing

**Issue:** What if `spinSpeed` changes from 0 → 30 mid-animation?

**Solution:**
```typescript
// Check at START of processor
if (layer.spinSpeed && layer.spinSpeed > 0) {
  return layer; // Early exit, don't calculate base-tip
}

// Accept rotation jump (OR implement smooth transition if needed)
```

---

### Problem 5: Multi-Renderer Consistency (CRITICAL!)

**Issue:** Three different rendering engines interpret rotation differently.

**Renderers:**
1. **DOM (CSS):** Uses `transform: rotate(deg)` - expects degrees, rotates clockwise
2. **Canvas 2D:** Uses `ctx.rotate(radians)` - expects radians, rotates clockwise
3. **Three.js:** Uses `mesh.rotation.z` - expects radians, rotates counter-clockwise (different coordinate system!)

**Complete Solution:**

**Step 1: BaseTipRotationProcessor outputs in DEGREES (standard)**
```typescript
// LayerCorePipelineBaseTipRotation.ts
const baseTipRotation = normalizeAngle(radiusAngle - axisAngle);  // In degrees

return {
  ...layer,
  baseTipRotation,  // Store in degrees
  rotation: baseTipRotation  // Override rotation in degrees
};
```

**Step 2: Each renderer converts appropriately**

**DOM Renderer (StageDOM.tsx):**
```typescript
const LayerEngineDOM = ({ layer }: { layer: EnhancedLayerData }) => {
  const rotation = layer.rotation || 0;  // Already in degrees
  
  return (
    <div
      style={{
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        // CSS expects degrees, no conversion needed
      }}
    >
      <img src={layer.imageSrc} alt={layer.layerId} />
    </div>
  );
};
```

**Canvas Renderer (StageCanvas.tsx):**
```typescript
const LayerEngineCanvas = (
  ctx: CanvasRenderingContext2D,
  layer: EnhancedLayerData
) => {
  const rotation = layer.rotation || 0;  // In degrees
  const rotationRadians = rotation * (Math.PI / 180);  // Convert to radians
  
  ctx.save();
  ctx.translate(layer.position[0], layer.position[1]);
  ctx.rotate(rotationRadians);  // Canvas expects radians
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
};
```

**Three.js Renderer (StageThree.tsx):**
```typescript
const LayerEngineThree = ({ layer }: { layer: EnhancedLayerData }) => {
  const rotation = layer.rotation || 0;  // In degrees
  const rotationRadians = rotation * (Math.PI / 180);  // Convert to radians
  
  // Three.js coordinate system: Y-up, Z-forward
  // Rotation around Z-axis for 2D rotation
  return (
    <mesh
      position={[layer.position[0], layer.position[1], 0]}
      rotation={[0, 0, rotationRadians]}  // Three.js expects radians
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};
```

**Step 3: Validation - All Renderers Must Match**

Create test config:
```json
{
  "layerId": "test-rotation",
  "imageId": "arrow",
  "groups": {
    "Basic Config": {
      "imageTip": 0,
      "imageBase": 180,
      "scale": [200, 200]
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 300,
      "orbitSpeed": 0,
      "orbitStartAngle": 90
    }
  }
}
```

**Expected Result:** Arrow points RIGHT (toward east) in ALL three renderers

**Validation Steps:**
1. Run with DOM renderer → Screenshot
2. Run with Canvas renderer → Screenshot
3. Run with Three.js renderer → Screenshot
4. Compare: All three should be visually identical

**Common Pitfalls:**
- ❌ Forgetting to convert degrees → radians for Canvas/Three.js
- ❌ Not accounting for Three.js coordinate system differences
- ❌ Mixing clockwise/counter-clockwise rotation conventions
- ❌ Using `rotation.y` instead of `rotation.z` in Three.js

**Fallback Behavior:** If renderer-specific conversion fails, log error and default to 0° rotation

---

### Problem 6: Debug Visualization

**Issue:** How to verify base-tip alignment is working?

**Solution:** Add debug markers to `LayerCorePipelineImageMappingDebug.ts`

```typescript
// Show midpoint on orbit circle
if (debugConfig.showMidpoint) {
  debugShapes.push({
    type: 'circle',
    position: midpointPos,
    radius: 10,
    color: 'orange',
    label: 'Midpoint (on orbit)'
  });
}

// Show radius line from center to midpoint
if (debugConfig.showRadiusLine) {
  debugShapes.push({
    type: 'line',
    from: orbitStagePoint,
    to: midpointPos,
    color: 'cyan',
    label: 'Radius Line'
  });
}

// Show axis line from base to tip
if (debugConfig.showAxisLine) {
  debugShapes.push({
    type: 'line',
    from: basePos,
    to: tipPos,
    color: 'yellow',
    label: 'Axis Line (base→tip)'
  });
}
```

---

## Comprehensive Test Plan

### Test Strategy

**Objective:** Validate that base-tip rotation works correctly across all edge cases, renderers, and integration scenarios.

**Test Layers:**
1. **Unit Tests** - Test individual functions (normalizeAngle, calculateMidpoint)
2. **Integration Tests** - Test processor integration with pipeline
3. **Visual Tests** - Test rendering across DOM, Canvas, Three.js
4. **Regression Tests** - Ensure existing features still work

---

### Unit Test Suite

**File:** `shared/layer/__tests__/LayerCorePipelineBaseTipRotation.test.ts`

```typescript
describe('BaseTipRotationProcessor', () => {
  describe('normalizeAngle', () => {
    test('handles wrap-around: 350° to 10°', () => {
      expect(normalizeAngle(350 - 10)).toBe(-20);
    });
    
    test('handles large angles: 720°', () => {
      expect(normalizeAngle(720)).toBe(0);
    });
    
    test('handles negative angles: -450°', () => {
      expect(normalizeAngle(-450)).toBe(-90);
    });
  });

  describe('calculateMidpointAngle', () => {
    test('boundary crossing: 350° and 10°', () => {
      expect(calculateMidpointAngle(350, 10)).toBe(0);
    });
    
    test('normal case: 90° and 270°', () => {
      expect(calculateMidpointAngle(90, 270)).toBe(180);
    });
    
    test('reverse boundary: 10° and 350°', () => {
      expect(calculateMidpointAngle(10, 350)).toBe(0);
    });
  });

  describe('rotation calculation', () => {
    test('default config (90/270) at 0° orbit position', () => {
      const layer = createTestLayer({
        imageTip: 90,
        imageBase: 270,
        orbitAngle: 0
      });
      const result = BaseTipRotationProcessor(layer, { elapsedSeconds: 0 });
      // imageTip should point right (east)
      expect(result.baseTipRotation).toBeCloseTo(0, 1);
    });
    
    test('inverted config (270/90) at 0° orbit position', () => {
      const layer = createTestLayer({
        imageTip: 270,
        imageBase: 90,
        orbitAngle: 0
      });
      const result = BaseTipRotationProcessor(layer, { elapsedSeconds: 0 });
      // imageTip should point left (west)
      expect(result.baseTipRotation).toBeCloseTo(180, 1);
    });
  });

  describe('edge cases', () => {
    test('same tip and base angles', () => {
      const layer = createTestLayer({
        imageTip: 90,
        imageBase: 90
      });
      const result = BaseTipRotationProcessor(layer, { elapsedSeconds: 0 });
      expect(result.baseTipRotation).toBe(0);
      // Should log warning
    });
    
    test('spin override (spinSpeed > 0)', () => {
      const layer = createTestLayer({
        imageTip: 90,
        imageBase: 270,
        spinSpeed: 30
      });
      const result = BaseTipRotationProcessor(layer, { elapsedSeconds: 0 });
      // Should return layer unchanged (spin overrides)
      expect(result).toBe(layer);
    });
  });
});
```

---

### Integration Test Suite

**File:** `shared/layer/__tests__/LayerPipelineIntegration.test.ts`

```typescript
describe('Base-Tip + Orbital Integration', () => {
  test('orbital processor exposes orbitPoint', () => {
    const layer = createTestLayer({ orbitRadius: 300 });
    const result = OrbitalProcessor(layer, { elapsedSeconds: 1 });
    expect(result.orbitPoint).toBeDefined();
    expect(result.orbitPoint).toHaveLength(2);
  });
  
  test('base-tip processor uses orbitPoint from orbital', () => {
    let layer = createTestLayer({
      orbitRadius: 300,
      orbitSpeed: 0,
      orbitStartAngle: 90
    });
    
    // Run orbital first
    layer = OrbitalProcessor(layer, { elapsedSeconds: 0 });
    
    // Then base-tip
    layer = BaseTipRotationProcessor(layer, { elapsedSeconds: 0 });
    
    expect(layer.baseTipRotation).toBeDefined();
  });
  
  test('override hierarchy: spin > base-tip > basic', () => {
    // Test 1: Only basic
    let layer = createTestLayer({ rotation: 45 });
    expect(layer.rotation).toBe(45);
    
    // Test 2: Basic + orbital (base-tip overrides)
    layer = createTestLayer({
      rotation: 45,
      orbitRadius: 300,
      imageTip: 0,
      imageBase: 180
    });
    layer = BaseTipRotationProcessor(layer, { elapsedSeconds: 0 });
    expect(layer.rotation).not.toBe(45); // Overridden
    
    // Test 3: All (spin overrides)
    layer = createTestLayer({
      rotation: 45,
      orbitRadius: 300,
      spinSpeed: 30
    });
    layer = SpinProcessor(layer, { elapsedSeconds: 1 });
    const spinRotation = layer.rotation;
    
    layer = BaseTipRotationProcessor(layer, { elapsedSeconds: 1 });
    expect(layer.rotation).toBe(spinRotation); // Spin preserved
  });
});
```

---

### Visual Validation Test Suite

**File:** `shared/__tests__/VisualRegression.test.ts`

```typescript
describe('Visual Regression - Base-Tip Rotation', () => {
  const testConfig = {
    layerId: 'visual-test',
    imageId: 'arrow',
    groups: {
      'Basic Config': {
        imageTip: 0,
        imageBase: 180,
        scale: [200, 200]
      },
      'Orbital Config': {
        orbitStagePoint: [1024, 1024],
        orbitRadius: 300,
        orbitSpeed: 0,
        orbitStartAngle: 90
      }
    }
  };

  test('DOM renderer matches baseline', async () => {
    const screenshot = await captureDOM(testConfig);
    expect(screenshot).toMatchImageSnapshot();
  });
  
  test('Canvas renderer matches baseline', async () => {
    const screenshot = await captureCanvas(testConfig);
    expect(screenshot).toMatchImageSnapshot();
  });
  
  test('Three.js renderer matches baseline', async () => {
    const screenshot = await captureThree(testConfig);
    expect(screenshot).toMatchImageSnapshot();
  });
  
  test('All renderers produce identical output', async () => {
    const [dom, canvas, three] = await Promise.all([
      captureDOM(testConfig),
      captureCanvas(testConfig),
      captureThree(testConfig)
    ]);
    
    // Compare pixel-by-pixel
    expect(compareImages(dom, canvas)).toBeLessThan(0.01); // < 1% difference
    expect(compareImages(canvas, three)).toBeLessThan(0.01);
  });
});
```

---

### Manual Testing Checklist

**Prerequisites:**
- [ ] BaseTipRotationProcessor created
- [ ] Wired to all three stages
- [ ] Debug visualization enabled

**Test Procedure:**

**1. Basic Functionality**
- [ ] Create layer with default config (tip=90, base=270)
- [ ] Verify tip points outward at 0° (east)
- [ ] Verify tip points outward at 90° (south)
- [ ] Verify tip points outward at 180° (west)
- [ ] Verify tip points outward at 270° (north)

**2. Custom Angles**
- [ ] Test horizontal (tip=0, base=180)
- [ ] Test diagonal (tip=45, base=225)
- [ ] Test inverted (tip=270, base=90)

**3. Edge Cases**
- [ ] Same angles (tip=90, base=90) → No crash, 0° rotation
- [ ] Boundary crossing (tip=350, base=10) → Correct midpoint
- [ ] Opposite angles (tip=0, base=180) → Valid

**4. Override Hierarchy**
- [ ] Orbital only → Base-tip rotation active
- [ ] Orbital + Spin (speed > 0) → Spin wins
- [ ] Basic only → Basic rotation preserved

**5. Multi-Renderer**
- [ ] Same config on DOM → Screenshot
- [ ] Same config on Canvas → Screenshot
- [ ] Same config on Three.js → Screenshot
- [ ] Visual comparison → All identical

**6. Debug Visualization**
- [ ] showMidpoint → Orange circle on orbit
- [ ] showRadiusLine → Cyan line from center
- [ ] showAxisLine → Yellow line base→tip
- [ ] All collinear → Aligned correctly

**7. Performance**
- [ ] 60 FPS with 10 orbital layers
- [ ] No memory leaks over 5 minutes
- [ ] Caching reduces calculations (measure)

---

## Integration with Existing Orbital System

### Cross-Reference with ORBITAL_IMAGETIP_SYSTEM.md

**Key Differences:**

| Aspect | ORBITAL_IMAGETIP_SYSTEM.md | ORBITAL_BASETIP_ROTATION_SYSTEM.md (This Doc) |
|--------|---------------------------|-----------------------------------------------|
| **What sits on circle** | imageBase | **MIDPOINT** between tip and base |
| **Tip direction** | Extends outward through base | **ALWAYS** points outward (clock hand) |
| **Rotation calculation** | Basic formula | **Separate** from orbital positioning |
| **Override behavior** | Not specified | **Spin > BaseTip > Basic** |
| **Edge cases** | Not covered | **Comprehensive** (wrap-around, same angles, etc.) |
| **Implementation status** | Design only | **Complete** with code examples |

**This document SUPERSEDES ORBITAL_IMAGETIP_SYSTEM.md** for implementation purposes.

---

### Integration with 09_ORBITAL_ANIMATION_TODO.md

**Wiring Steps (from TODO doc):**

1. ✅ **Create Processor** → `LayerCorePipelineBaseTipRotation.ts` (this doc provides complete code)
2. ✅ **Wire to Stages** → Add to processor arrays in StageDOM/Canvas/Three.tsx
3. ✅ **Update Orbital** → Remove old rotation logic, expose orbitPoint
4. ✅ **Test** → Comprehensive test plan provided above

**Additional Steps (from this doc):**

5. ✅ **Add Config Fields** → imageTip, imageBase to BasicGroupConfig
6. ✅ **Handle Edge Cases** → Angle normalization, same angles, etc.
7. ✅ **Debug Visualization** → Add midpoint, radius line, axis line markers
8. ✅ **Multi-Renderer** → Ensure consistent output across DOM/Canvas/Three.js

---

### Compatibility with Existing Features

**Spin Animation (LayerCorePipelineSpin.ts):**
- ✅ **Compatible:** Spin overrides base-tip rotation when `spinSpeed > 0`
- ✅ **No conflicts:** Early exit in BaseTipRotationProcessor if spin active
- ✅ **Test:** Layer with both spin and orbital → Spin wins

**Image Mapping (LayerCorePipelineImageMapping.ts):**
- ✅ **Dependency:** Base-tip requires imageMapping to be calculated first
- ✅ **Integration:** Run BaseTipRotationProcessor AFTER ImageMappingProcessor
- ✅ **No modifications needed:** imageMapping provides displayAxisAngle

**Debug Visualization (LayerCorePipelineImageMappingDebug.ts):**
- ✅ **Extension:** Add new debug markers (midpoint, radius line, axis line)
- ✅ **No conflicts:** Additive only, doesn't affect other debug features

**Static Layer Detection (LayerCore.ts):**
- ✅ **Compatible:** Base-tip respects static detection
- ✅ **Performance:** No calculations for static layers (orbital inactive)

---

## Test Cases (Essential!)

### Test 1: Default Alignment (Outward Pointing)

**Input:**
```json
{
  "imageTip": 90,
  "imageBase": 270,
  "orbitStagePoint": [1024, 1024],
  "orbitRadius": 300
}
```

**Expected:** Image tip points outward at all orbit positions

---

### Test 2: Inverted Alignment (Inward Pointing)

**Input:**
```json
{
  "imageTip": 270,
  "imageBase": 90,
  "orbitStagePoint": [1024, 1024],
  "orbitRadius": 300
}
```

**Expected:** Image tip points inward toward center

---

### Test 3: Horizontal Alignment

**Input:**
```json
{
  "imageTip": 0,
  "imageBase": 180,
  "orbitStagePoint": [1024, 1024],
  "orbitRadius": 300
}
```

**Expected:** Image right edge points outward

---

### Test 4: Angle Wrap-Around

**Input:**
```json
{
  "imageTip": 350,
  "imageBase": 10,
  "orbitStagePoint": [1024, 1024],
  "orbitRadius": 300
}
```

**Expected:** Midpoint calculated correctly (0° not 180°)

---

### Test 5: Spin Override

**Input:**
```json
{
  "imageTip": 90,
  "imageBase": 270,
  "spinSpeed": 30,
  "orbitStagePoint": [1024, 1024],
  "orbitRadius": 300
}
```

**Expected:** Spin rotation used, base-tip ignored

---

### Test 6: All Three Renderers

**Test:** Same config on DOM, Canvas, Three.js

**Expected:** Identical visual result (rotation applied correctly in each)

---

## Usage Examples

### Clock Hand (Minute Hand)

```json
{
  "layerId": "minute-hand",
  "imageId": "hand-long",
  "groups": {
    "Basic Config": {
      "imageTip": 270,        // Bottom points to center (pivot)
      "imageBase": 90,        // Top on orbit
      "scale": [80, 80]
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 350,
      "orbitSpeed": 6         // 60 seconds per rotation
    }
  }
}
```

---

### Sun Rays (Static Radial Pattern)

```json
{
  "layerId": "ray-01",
  "imageId": "ray",
  "groups": {
    "Basic Config": {
      "imageTip": 90,         // Top points outward
      "imageBase": 270,
      "scale": [100, 100]
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 400,
      "orbitSpeed": 0,        // Static (no rotation)
      "orbitStartAngle": 0    // Starting position
    }
  }
}
// Add more rays at different orbitStartAngle values: 45, 90, 135, 180, etc.
```

---

### Wheel Spokes

```json
{
  "layerId": "spoke-01",
  "imageId": "spoke",
  "groups": {
    "Basic Config": {
      "imageTip": 0,          // Right edge outward
      "imageBase": 180,       // Left edge toward center
      "scale": [120, 120]
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 300,
      "orbitSpeed": 180       // 2 seconds per rotation
    },
    "Spin Config": {
      "spinSpeed": 0          // No spin, use base-tip
    }
  }
}
```

---

### Planet with Separate Spin

```json
{
  "layerId": "planet",
  "imageId": "earth",
  "groups": {
    "Basic Config": {
      "imageTip": 90,
      "imageBase": 270,
      "scale": [150, 150]
    },
    "Spin Config": {
      "spinSpeed": 360        // 1 rotation per second (overrides base-tip)
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 500,
      "orbitSpeed": 30        // Orbit speed separate from spin
    }
  }
}
```

---

## Benefits

### 1. **Clock Hand Behavior**
Perfect for clock hands, arrows, indicators that should always point outward/inward

### 2. **Intuitive Control**
Users define "front" and "back" of image via angles, system handles rotation automatically

### 3. **Separation of Concerns**
Base-tip rotation is separate from:
- Orbital positioning (where on circle)
- Spin animation (independent rotation)
- Basic rotation (fallback)

### 4. **Flexible**
Any angles 0-360° for tip/base, allowing any orientation

### 5. **Consistent**
Uses existing imageTip/imageBase concept from ImageMapping processor

### 6. **Override Hierarchy**
Clear priority: Spin > BaseTip > Basic (no confusion)

### 7. **Visual Debugging**
Can see midpoint, radius line, axis line in debug mode

---

## Implementation Checklist

### Phase 1: Type Definitions ✓
- [ ] Add `imageTip?: number` to BasicGroupConfig
- [ ] Add `imageBase?: number` to BasicGroupConfig
- [ ] Add `baseTipRotation?: number` to EnhancedLayerData
- [ ] Add default values (90°, 270°) to documentation

### Phase 2: Processor Creation ✓
- [ ] Create `LayerCorePipelineBaseTipRotation.ts`
- [ ] Implement midpoint calculation
- [ ] Implement axis angle calculation
- [ ] Implement radius angle calculation
- [ ] Implement rotation formula: `radiusAngle - axisAngle`
- [ ] Add spin override check (`spinSpeed > 0`)
- [ ] Add orbital active check
- [ ] Add edge case handling (same angles, wrap-around)

### Phase 3: Pipeline Integration ✓
- [ ] Wire BaseTipRotationProcessor to StageDOM.tsx
- [ ] Wire BaseTipRotationProcessor to StageCanvas.tsx
- [ ] Wire BaseTipRotationProcessor to StageThree.tsx
- [ ] Verify processor order (after ImageMapping, after Orbital)

### Phase 4: Orbital Processor Update ✓
- [ ] Remove old rotation calculation in LayerCorePipelineOrbital.ts
- [ ] Expose `orbitPoint` in return data
- [ ] Keep only position calculation in orbital processor

### Phase 5: Testing ✓
- [ ] Test default alignment (tip=90, base=270)
- [ ] Test inverted alignment (tip=270, base=90)
- [ ] Test horizontal alignment (tip=0, base=180)
- [ ] Test angle wrap-around (tip=350, base=10)
- [ ] Test spin override (spinSpeed > 0)
- [ ] Test all three renderers (DOM, Canvas, Three.js)
- [ ] Test performance (caching)
- [ ] Test edge cases (same angles, undefined values)

### Phase 6: Debug Visualization ✓
- [ ] Add showMidpoint debug marker
- [ ] Add showRadiusLine debug line
- [ ] Add showAxisLine debug line (base→tip)
- [ ] Color code alignment status (aligned vs misaligned)
- [ ] Update ImageMappingDebugProcessor

### Phase 7: Documentation ✓
- [ ] Update API_REFERENCE.md
- [ ] Update 09_ORBITAL_ANIMATION_TODO.md
- [ ] Create usage examples
- [ ] Document override hierarchy
- [ ] Document edge cases and solutions

---

## Key Decisions & Rationale

### Decision 1: Midpoint on Orbit Circle (Not imageBase)

**Rationale:** This allows imageTip to extend outward naturally, creating clock hand effect

**Alternative Rejected:** Placing imageBase on circle would make tip position inconsistent

---

### Decision 2: Separate Calculation from Orbital Position

**Rationale:** Clean separation of concerns - orbital handles "where", base-tip handles "how rotated"

**Benefit:** Each processor has single responsibility

---

### Decision 3: Spin Overrides Base-Tip

**Rationale:** Spin is explicit animation, should take priority over automatic alignment

**Implementation:** Early exit in BaseTipRotationProcessor if `spinSpeed > 0`

---

### Decision 4: Ignore BasicImagePoint Rotation

**Rationale:** Base-tip provides complete rotation control, BasicImagePoint would conflict

**Benefit:** Clear, non-ambiguous rotation source

---

### Decision 5: Default Values (90°, 270°)

**Rationale:** Most common use case is vertical axis (top/bottom)

**Benefit:** Zero config for standard clock hand orientation

---

## Related Documentation

- **`ORBITAL_IMAGETIP_SYSTEM.md`** - Original radial alignment design (predecessor to this doc)
- **`09_ORBITAL_ANIMATION_TODO.md`** - Orbital integration guide
- **`03_SPIN_ANIMATION_DEEP_DIVE.md`** - Spin animation details (for override hierarchy)
- **`05_LAYER_PIPELINE_SYSTEM.md`** - Processor pattern explanation
- **`02_COORDINATE_SYSTEMS.md`** - Coordinate system reference
- **`API_REFERENCE.md`** - Complete API documentation

---

## Contact & History

**Discussion Date:** January 2025  
**Participants:** Development team + AI agent collaborative design  
**Key Insights:**
1. Initial confusion: imageBase on circle
2. Clarification: MIDPOINT on circle
3. Key requirement: imageTip ALWAYS points outward (clock hand)
4. Critical: Separate calculation from orbital positioning
5. Override hierarchy: Spin > BaseTip > Basic

**Decision:** Approved complete base-tip rotation system as documented above

**Next Steps:** Implementation following checklist

---

## Summary for AI Agents

**If you're an AI agent reading this document, here's what you need to know:**

1. **What:** A rotation system that makes imageTip point outward like clock hands during orbital motion

2. **How:** 
   - Calculate MIDPOINT between imageTip and imageBase positions
   - Place midpoint ON orbit circle
   - Calculate rotation so imageTip points outward from center
   - Formula: `rotation = radiusAngle - axisAngle`

3. **When Active:**
   - Orbital Config is active (orbitRadius > 0)
   - Spin is NOT active (spinSpeed = 0)
   - Overrides BasicImagePoint rotation

4. **Key Files:**
   - NEW: `LayerCorePipelineBaseTipRotation.ts` (create this)
   - MODIFY: `Config.ts` (add imageTip, imageBase, baseTipRotation)
   - MODIFY: `StageDOM/Canvas/Three.tsx` (wire processor)
   - MODIFY: `LayerCorePipelineOrbital.ts` (remove old rotation, expose orbitPoint)

5. **Critical Edge Cases:**
   - Angle wrap-around (350° to 10°) - use normalizeAngle()
   - Same tip/base angles - fallback to 0° rotation
   - Spin override - early exit if spinSpeed > 0
   - Multi-renderer - output rotation in degrees, each renderer converts

6. **Testing Priority:**
   - Default (90/270), inverted (270/90), horizontal (0/180)
   - Angle wrap-around
   - Spin override
   - All three renderers

**You now have complete understanding. Implement following the checklist above.** ✅
