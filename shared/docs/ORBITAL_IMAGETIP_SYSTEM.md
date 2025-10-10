# Orbital ImageTip/ImageBase Alignment System

## Overview

This document describes the **radial/spoke-based orbital rotation system** that aligns the imageBase→imageTip axis with the orbit radius, creating intuitive spoke-like patterns.

**Date:** January 2025  
**Status:** Design approved, awaiting implementation  
**Related Files:** 
- `/app/shared/layer/LayerCorePipelineOrbital.ts`
- `/app/shared/layer/LayerCorePipelineImageMapping.ts`
- `/app/shared/docs/09_ORBITAL_ANIMATION_TODO.md`

---

## Problem Statement

**Original Issue:**
The orbital processor had arbitrary rotation logic that didn't give users intuitive control over how images face when orbiting. The rotation was calculated as:

```typescript
orbitRotation = calculateAngleToPoint(center, orbitPoint) - 90
```

This made images face tangent to the orbit circle, but users had no control over which part of the image pointed where.

---

## Solution: Radial Alignment System

### Core Concept

**Three points must be collinear (on one straight line):**

```
orbitStagePoint ———— imageBase ———— imageTip
   (center)           (middle)        (outer)
      ★                 •                •
```

**Key Principles:**

1. **imageBase** sits ON the orbit circle path
2. **imageTip** extends outward from center through imageBase
3. The **base→tip axis** aligns with the **orbit radius**
4. User controls orientation by defining imageTip and imageBase angles

---

## Visual Examples

### Example 1: Default Configuration (Outward Pointing)

**Config:**
```json
{
  "imageTip": 90,      // Top of image
  "imageBase": 270,    // Bottom of image
  "Orbital Config": {
    "orbitStagePoint": [1024, 1024],
    "orbitRadius": 300,
    "orbitSpeed": 30
  }
}
```

**Result:**
```
                 orbitStagePoint ★ (center)
                        |
                        | radius line
                        |
                   imageBase • (BOTTOM of image on orbit circle)
                        |
                   [  IMAGE  ]
                        |
                   imageTip • (TOP of image points OUTWARD)
```

**Effect:** Image points OUTWARD like rays from the sun

---

### Example 2: Inverted Configuration (Inward Pointing)

**Config:**
```json
{
  "imageTip": 270,     // Bottom of image
  "imageBase": 90,     // Top of image
  "Orbital Config": {
    "orbitStagePoint": [1024, 1024],
    "orbitRadius": 300,
    "orbitSpeed": 30
  }
}
```

**Result:**
```
                 orbitStagePoint ★
                        |
                   imageTip • (BOTTOM pointing toward center)
                        |
                   [  IMAGE  ]
                        |
                   imageBase • (TOP on orbit circle)
```

**Effect:** Image points INWARD toward the center (like moon facing Earth)

---

### Example 3: Sideways Configuration

**Config:**
```json
{
  "imageTip": 0,       // Right edge
  "imageBase": 180,    // Left edge
  "Orbital Config": {
    "orbitStagePoint": [1024, 1024],
    "orbitRadius": 300,
    "orbitSpeed": 30
  }
}
```

**Result:**
```
orbitStagePoint ★ ———— imageBase • [IMAGE] • imageTip
                       (left edge)         (right edge)
```

**Effect:** Image oriented sideways, right edge pointing outward

---

## Circular Pattern Example

Multiple images orbiting with radial alignment creates spoke/petal patterns:

```
              ↑ image
              |
              |
    image →   ★   ← image (orbitStagePoint in center)
              |
              |
              ↓ image
```

**Use Cases:**
- Flower petals
- Wheel spokes
- Sun rays
- Clock hands
- Radar sweep
- Orbital satellites

---

## Implementation Details

### Current ImageBase/ImageTip System

**Location:** `/app/shared/layer/LayerCorePipelineImageMapping.ts`

The system calculates image orientation:

```typescript
export type ImageMapping = {
  imageCenter: { x: number; y: number };
  imageTip: { x: number; y: number };      // "Front" of image
  imageBase: { x: number; y: number };     // "Back" of image
  imageDimensions: { width: number; height: number };
  displayAxisAngle: number;                 // Angle of base→tip line
  displayRotation: number;                  // Rotation to make axis point up
  axisCenterOffset: { x: number; y: number };
};
```

**How it works:**
1. User defines `imageTip` angle (default 90° = top of image)
2. User defines `imageBase` angle (default 270° = bottom of image)
3. System projects from image center to rectangle boundary at those angles
4. Creates an axis line from base→tip showing image orientation

---

### Modified Orbital Processor Logic

**File:** `/app/shared/layer/LayerCorePipelineOrbital.ts`

**Current (incorrect):**
```typescript
let orbitRotation = 0;
if (!layer.hasSpinAnimation) {
  orbitRotation = calculateAngleToPoint(resolvedOrbitCenter, orbitPoint) - 90;
}
```

**Proposed (correct):**
```typescript
let orbitRotation = 0;
if (!layer.hasSpinAnimation) {
  // Calculate the radius angle (from center to orbit point)
  const radiusAngle = calculateAngleToPoint(resolvedOrbitCenter, orbitPoint);
  
  // Get the current axis angle (base→tip direction in image)
  const axisAngle = layer.imageMapping.displayAxisAngle;
  
  // Align axis with radius
  orbitRotation = radiusAngle - axisAngle;
}
```

**Explanation:**
- `radiusAngle`: Direction from center to current orbit position
- `axisAngle`: Current direction of base→tip axis
- `orbitRotation`: Rotation needed to align them

---

### Position Calculation

The orbit position (where imageBase sits) is calculated as:

```typescript
// 1. Calculate angle based on time
let orbitAngle = (elapsedSeconds × orbitSpeed) % 360;
orbitAngle = applyRotationDirection(orbitAngle, orbitDirection);

// 2. Calculate position on orbit circle
const orbitPoint = {
  x: orbitStagePoint.x + orbitRadius × Math.cos(angleRadians),
  y: orbitStagePoint.y + orbitRadius × Math.sin(angleRadians)
};

// 3. This orbitPoint is where imageBase should be positioned
// Use orbitImagePoint config to define which image point is the "base"
```

---

## Configuration Schema

### Renamed Field

**Old name:** `orbitCenter`  
**New name:** `orbitStagePoint`  
**Reason:** Consistency with `spinStagePoint` and `BasicStagePoint`

### Complete Orbital Config

```typescript
{
  "Basic Config": {
    "imageTip": 90,        // Where "front/tip" is (0-360°)
    "imageBase": 270       // Where "back/base" is (0-360°)
  },
  "Orbital Config": {
    "orbitStagePoint": [1024, 1024],   // Center of orbit (stage pixels)
    "orbitImagePoint": [50, 50],        // Which image point follows orbit (%)
    "orbitRadius": 200,                 // Orbit radius (pixels)
    "orbitSpeed": 45,                   // Degrees per second
    "orbitDirection": "cw"              // "cw" or "ccw"
  }
}
```

---

## Usage Examples

### Sun Rays Pattern

```json
[
  {
    "layerId": "ray-1",
    "imageId": "arrow",
    "groups": {
      "Basic Config": {
        "imageTip": 90,      // Top points outward
        "imageBase": 270
      },
      "Orbital Config": {
        "orbitStagePoint": [1024, 1024],
        "orbitRadius": 300,
        "orbitSpeed": 0      // Static (no rotation)
      }
    }
  },
  {
    "layerId": "ray-2",
    "imageId": "arrow",
    "groups": {
      "Basic Config": {
        "imageTip": 90,
        "imageBase": 270
      },
      "Orbital Config": {
        "orbitStagePoint": [1024, 1024],
        "orbitRadius": 300,
        "orbitSpeed": 0
      }
    }
  }
  // ... more rays at different starting angles
]
```

### Rotating Clock Hand

```json
{
  "layerId": "clock-hand",
  "imageId": "hand",
  "groups": {
    "Basic Config": {
      "imageTip": 270,     // Bottom points toward center
      "imageBase": 90      // Top on orbit
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 400,
      "orbitSpeed": 6      // 60 seconds per rotation
    }
  }
}
```

### Orbiting Planet (with spin)

```json
{
  "layerId": "planet",
  "imageId": "earth",
  "groups": {
    "Basic Config": {
      "imageTip": 90,
      "imageBase": 270
    },
    "Spin Config": {
      "spinSpeed": 360     // 1 rotation per second
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitRadius": 500,
      "orbitSpeed": 30     // Orbit + Spin together
    }
  }
}
```

---

## Benefits

### 1. **Intuitive Control**
User defines "this is my front" (imageTip) and "this is my back" (imageBase), and the system aligns them radially.

### 2. **Flexible**
Any angle 0-360° for both tip and base, allowing any orientation.

### 3. **Consistent**
Uses existing imageBase/imageTip system, no new concepts.

### 4. **Visual Debugging**
Can see the axis line in debug mode to verify alignment.

### 5. **Natural Patterns**
Creates radial/spoke patterns that look natural and geometric.

---

## Implementation Checklist

**Phase 1: Renaming**
- [ ] Rename `orbitCenter` → `orbitStagePoint` in all files
- [ ] Update TypeScript types
- [ ] Update documentation
- [ ] Update config schema
- [ ] Update examples

**Phase 2: Rotation Logic**
- [ ] Modify orbital processor rotation calculation
- [ ] Use `displayAxisAngle` from imageMapping
- [ ] Calculate `radiusAngle` from center to orbit point
- [ ] Align axis with radius: `orbitRotation = radiusAngle - axisAngle`
- [ ] Test with different imageTip/imageBase values

**Phase 3: Testing**
- [ ] Test outward pointing (imageTip=90, imageBase=270)
- [ ] Test inward pointing (imageTip=270, imageBase=90)
- [ ] Test sideways (imageTip=0, imageBase=180)
- [ ] Test diagonal orientations
- [ ] Test with spin animation active
- [ ] Test visibility culling

**Phase 4: Documentation**
- [ ] Update `09_ORBITAL_ANIMATION_TODO.md`
- [ ] Update `API_REFERENCE.md`
- [ ] Add examples to config guide
- [ ] Create visual diagrams

---

## Edge Cases

### 1. Spin + Orbital
When both animations are active, spin rotation takes precedence:
```typescript
if (!layer.hasSpinAnimation) {
  // Only apply orbital rotation if not spinning
  orbitRotation = radiusAngle - axisAngle;
}
```

### 2. Non-Standard ImageTip/ImageBase
If user sets custom angles (not 90°/270°), the system still aligns correctly:
```json
{
  "imageTip": 45,      // Diagonal
  "imageBase": 225     // Opposite diagonal
}
```

### 3. Off-Stage Orbits
If orbit center is outside stage bounds, the system continues to work but may need adjusted visibility culling.

---

## Future Enhancements

### 1. Auto-Calculate Radius
Calculate radius to keep imageBase exactly on orbit circle, accounting for image size.

### 2. imageBase Anchor
Make orbitImagePoint automatically use imageBase position (currently independent).

### 3. imageTip Distance Config
Allow configuring how far imageTip extends beyond orbit circle.

### 4. Elliptical Orbits
Extend to ellipses while maintaining radial alignment.

---

## Related Discussions

**Original Issue:** Orbital processor had arbitrary -90° rotation without user control

**Solution Evolution:**
1. First thought: Make imageTip face center (inward)
2. Misunderstood as base-tip being axis between them
3. **Correct understanding:** Three collinear points (center, base, tip) creating radial alignment

**Key Insight:** The imageBase/imageTip system naturally describes orientation, perfect for radial patterns.

---

## Contact & History

**Discussion Date:** January 2025  
**Participants:** Development team discussion  
**Decision:** Approved radial alignment approach  
**Next Steps:** Implementation in LayerCorePipelineOrbital.ts

---

## References

- `/app/shared/docs/09_ORBITAL_ANIMATION_TODO.md` - Orbital integration guide
- `/app/shared/docs/02_COORDINATE_SYSTEMS.md` - Coordinate system documentation
- `/app/shared/layer/LayerCorePipelineImageMapping.ts` - ImageMapping implementation
- `/app/shared/layer/LayerCorePipelineOrbital.ts` - Orbital processor
