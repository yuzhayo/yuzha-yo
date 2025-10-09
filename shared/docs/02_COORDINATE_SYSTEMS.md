# Coordinate Systems

## Overview

This system uses **4 different coordinate spaces** that must be converted between. Understanding these is critical for positioning layers correctly.

---

## 1. Stage Coordinates (Primary System)

### Definition

**Fixed 2048×2048 pixel canvas** that scales to fit viewport

- **Origin:** Top-left corner (0, 0)
- **Center:** (1024, 1024)
- **Bounds:** X: 0-2048, Y: 0-2048
- **Never Changes:** Stage size is always 2048×2048 regardless of viewport

### Visual Reference

```
(0, 0) ┌────────────────────────────────────┐ (2048, 0)
       │                                    │
       │         Stage (2048×2048)         │
       │                                    │
       │              (1024, 1024)          │
       │                  • Center          │
       │                                    │
       │                                    │
(0, 2048) └────────────────────────────────────┘ (2048, 2048)
```

### Common Stage Points

| Point | Coordinates | Description |
|-------|-------------|-------------|
| Center | `(1024, 1024)` | Dead center of stage |
| Top-Left | `(0, 0)` | Upper-left corner |
| Top-Right | `(2048, 0)` | Upper-right corner |
| Bottom-Left | `(0, 2048)` | Lower-left corner |
| Bottom-Right | `(2048, 2048)` | Lower-right corner |
| Top-Center | `(1024, 0)` | Top edge center |
| Bottom-Center | `(1024, 2048)` | Bottom edge center |
| Left-Center | `(0, 1024)` | Left edge center |
| Right-Center | `(2048, 1024)` | Right edge center |

### Usage in Config

```json
{
  "BasicStagePoint": [1024, 1024],  // Place at stage center
  "spinStagePoint": [512, 512],     // Spin around top-left quadrant
  "orbitCenter": [1536, 1024]       // Orbit around right quadrant
}
```

---

## 2. Image Coordinates (Natural Pixels)

### Definition

**Natural pixel dimensions of the loaded image**

- **Origin:** Top-left corner of image (0, 0)
- **Bounds:** X: 0-width, Y: 0-height
- **Varies:** Each image has different dimensions

### Visual Reference

```
(0, 0) ┌───────────────────┐ (512, 0)
       │                    │
       │   Image (512x512)  │
       │                    │
       │      (256, 256)    │
       │          • Center  │
       │                    │
(0, 512) └───────────────────┘ (512, 512)
```

### Key Points

| Point | Calculation | Example (512x512 image) |
|-------|-------------|-------------------------|
| Center | `(width/2, height/2)` | `(256, 256)` |
| Top-Left | `(0, 0)` | `(0, 0)` |
| Top-Right | `(width, 0)` | `(512, 0)` |
| Bottom-Left | `(0, height)` | `(0, 512)` |
| Bottom-Right | `(width, height)` | `(512, 512)` |

### Usage

**Internal calculations only** - not exposed in config

```typescript
const imageCenter = {
  x: imageDimensions.width / 2,
  y: imageDimensions.height / 2
};
```

---

## 3. Percent Coordinates (Relative)

### Definition

**Percentage-based coordinates relative to image dimensions**

- **Origin:** Top-left corner (0%, 0%)
- **Center:** (50%, 50%)
- **Bounds:** X: 0-100%, Y: 0-100%
- **Independent:** Same percent works for any image size

### Visual Reference

```
(0%, 0%) ┌───────────────────────┐ (100%, 0%)
         │                       │
         │   Image (any size)    │
         │                       │
         │      (50%, 50%)       │
         │          • Center     │
         │                       │
(0%, 100%) └───────────────────────┘ (100%, 100%)
```

### Common Percent Points

| Point | Coordinates | Description |
|-------|-------------|-------------|
| Center | `[50, 50]` | Image center (default) |
| Top-Left | `[0, 0]` | Upper-left corner |
| Top-Right | `[100, 0]` | Upper-right corner |
| Bottom-Left | `[0, 100]` | Lower-left corner |
| Bottom-Right | `[100, 100]` | Lower-right corner |
| Top-Center | `[50, 0]` | Top edge center |
| Bottom-Center | `[50, 100]` | Bottom edge center |
| Left-Center | `[0, 50]` | Left edge center |
| Right-Center | `[100, 50]` | Right edge center |

### Usage in Config

```json
{
  "BasicImagePoint": [50, 50],    // Image center
  "spinImagePoint": [25, 50],     // Left side, vertical center
  "orbitImagePoint": [100, 50]    // Right edge, vertical center
}
```

### Why Use Percent?

**Image size independence:**

```typescript
// Works for ANY image size!
BasicImagePoint: [50, 50]  // Always center

// 512x512 image → (256, 256) pixels
// 1024x1024 image → (512, 512) pixels
// 800x600 image → (400, 300) pixels
```

---

## 4. Viewport Coordinates (Browser Window)

### Definition

**Actual browser window pixels**

- **Origin:** Top-left corner of browser window
- **Bounds:** Varies by device/window size
- **Dynamic:** Changes on resize

### Stage ↔ Viewport Transformation

**The stage scales to fill viewport using "cover" mode:**

```typescript
// Calculate scale to fill viewport
const scaleX = viewportWidth / 2048;
const scaleY = viewportHeight / 2048;
const scale = Math.max(scaleX, scaleY);  // Use larger for "cover"

// Calculate offset to center stage in viewport
const offsetX = (viewportWidth - 2048 * scale) / 2;
const offsetY = (viewportHeight - 2048 * scale) / 2;
```

### Examples

**1920x1080 viewport:**
```
scaleX = 1920 / 2048 = 0.9375
scaleY = 1080 / 2048 = 0.527
scale = max(0.9375, 0.527) = 0.9375  ← Use this

Stage appears: 1920px wide × 1920px tall
Offset: (0, -420)  ← Stage extends above/below viewport
```

**1024x768 viewport:**
```
scaleX = 1024 / 2048 = 0.5
scaleY = 768 / 2048 = 0.375
scale = max(0.5, 0.375) = 0.5

Stage appears: 1024px wide × 1024px tall
Offset: (0, -128)
```

---

## Conversion Functions

### Percent → Image Pixels

**Location:** `LayerCore.ts`

```typescript
function imagePercentToImagePoint(
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number }
): Point2D {
  return {
    x: (imagePercent.x / 100) * imageDimensions.width,
    y: (imagePercent.y / 100) * imageDimensions.height
  };
}

// Example:
imagePercentToImagePoint({ x: 50, y: 50 }, { width: 512, height: 512 })
// → { x: 256, y: 256 }

imagePercentToImagePoint({ x: 25, y: 75 }, { width: 512, height: 512 })
// → { x: 128, y: 384 }
```

### Image Pixels → Percent

```typescript
function imagePointToPercent(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number }
): PercentPoint {
  return {
    x: (imagePoint.x / imageDimensions.width) * 100,
    y: (imagePoint.y / imageDimensions.height) * 100
  };
}

// Example:
imagePointToPercent({ x: 256, y: 256 }, { width: 512, height: 512 })
// → { x: 50, y: 50 }
```

### Image Pixels → Stage Pixels

```typescript
function imagePointToStagePoint(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D
): Point2D {
  const halfWidth = imageDimensions.width / 2;
  const halfHeight = imageDimensions.height / 2;

  return {
    x: position.x + (imagePoint.x - halfWidth) * scale.x,
    y: position.y + (imagePoint.y - halfHeight) * scale.y
  };
}

// Example: Image center (256, 256) at stage (1024, 1024), scale 1.0
imagePointToStagePoint(
  { x: 256, y: 256 },
  { width: 512, height: 512 },
  { x: 1.0, y: 1.0 },
  { x: 1024, y: 1024 }
)
// → { x: 1024, y: 1024 }  (center → center)
```

### Stage Pixels → Image Pixels

```typescript
function stagePointToImagePoint(
  stagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D
): Point2D {
  const halfWidth = imageDimensions.width / 2;
  const halfHeight = imageDimensions.height / 2;

  const safeScaleX = scale.x !== 0 ? scale.x : 1;
  const safeScaleY = scale.y !== 0 ? scale.y : 1;

  return {
    x: (stagePoint.x - position.x) / safeScaleX + halfWidth,
    y: (stagePoint.y - position.y) / safeScaleY + halfHeight
  };
}
```

### Stage Pixels → Percent (of Stage)

```typescript
function stagePointToPercent(
  stagePoint: Point2D,
  stageSize: number
): PercentPoint {
  return {
    x: (stagePoint.x / stageSize) * 100,
    y: (stagePoint.y / stageSize) * 100
  };
}

// Example:
stagePointToPercent({ x: 1024, y: 1024 }, 2048)
// → { x: 50, y: 50 }  (stage center)
```

### Stage Percent → Stage Pixels

```typescript
function stagePercentToStagePoint(
  stagePercent: PercentPoint,
  stageSize: number
): Point2D {
  return {
    x: (stagePercent.x / 100) * stageSize,
    y: (stagePercent.y / 100) * stageSize
  };
}
```

### Viewport → Stage

**Location:** `stage2048.ts`

```typescript
function viewportToStageCoords(
  viewportX: number,
  viewportY: number,
  transform: StageTransform
): { x: number; y: number } {
  return {
    x: (viewportX - transform.offsetX) / transform.scale,
    y: (viewportY - transform.offsetY) / transform.scale
  };
}
```

### Stage → Viewport

```typescript
function stageToViewportCoords(
  stageX: number,
  stageY: number,
  transform: StageTransform
): { x: number; y: number } {
  return {
    x: stageX * transform.scale + transform.offsetX,
    y: stageY * transform.scale + transform.offsetY
  };
}
```

---

## Pivot-Based Positioning System

### Concept

**Place ANY image point at ANY stage point**

```
BasicStagePoint: [x, y]      ← Where to place (stage space)
BasicImagePoint: [x%, y%]    ← What to place there (image space)
```

### Implementation

**Location:** `LayerCore.ts` lines 70-109

```typescript
function calculatePositionForPivot(
  stageAnchor: Point2D,
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
  scale: Point2D
): Point2D {
  // 1. Convert percent to image pixels
  const imagePointPixels: Point2D = {
    x: (imagePercent.x / 100) * imageDimensions.width,
    y: (imagePercent.y / 100) * imageDimensions.height
  };

  // 2. Image center in pixels
  const imageCenter: Point2D = {
    x: imageDimensions.width / 2,
    y: imageDimensions.height / 2
  };

  // 3. Offset from center to desired point
  const offsetFromCenter: Point2D = {
    x: imagePointPixels.x - imageCenter.x,
    y: imagePointPixels.y - imageCenter.y
  };

  // 4. Apply scale to offset
  const scaledOffset: Point2D = {
    x: offsetFromCenter.x * scale.x,
    y: offsetFromCenter.y * scale.y
  };

  // 5. Calculate final position
  // Position = where we want the pivot - scaled offset to pivot
  const position: Point2D = {
    x: stageAnchor.x - scaledOffset.x,
    y: stageAnchor.y - scaledOffset.y
  };

  return position;
}
```

### Examples

**Example 1: Center image at stage center (default)**

```json
{
  "BasicStagePoint": [1024, 1024],  // Stage center
  "BasicImagePoint": [50, 50]       // Image center
}
```

**Result:** Image center appears at stage center

**Example 2: Top-left corner at stage center**

```json
{
  "BasicStagePoint": [1024, 1024],  // Stage center
  "BasicImagePoint": [0, 0]         // Image top-left
}
```

**Result:** Image top-left corner appears at stage center

**Example 3: Right edge at stage center**

```json
{
  "BasicStagePoint": [1024, 1024],  // Stage center
  "BasicImagePoint": [100, 50]      // Image right edge center
}
```

**Result:** Right edge of image appears at stage center

---

## Common Positioning Patterns

### Pattern 1: Centered Layer

```json
{
  "BasicStagePoint": [1024, 1024],
  "BasicImagePoint": [50, 50]
}
```

### Pattern 2: Top-Left Aligned

```json
{
  "BasicStagePoint": [0, 0],
  "BasicImagePoint": [0, 0]
}
```

### Pattern 3: Bottom-Right Aligned

```json
{
  "BasicStagePoint": [2048, 2048],
  "BasicImagePoint": [100, 100]
}
```

### Pattern 4: Edge-Anchored (Left)

```json
{
  "BasicStagePoint": [0, 1024],   // Left edge center
  "BasicImagePoint": [0, 50]      // Image left edge center
}
```

### Pattern 5: Spinning Around Corner

```json
{
  "Spin Config": {
    "spinStagePoint": [1024, 1024],  // Spin around stage center
    "spinImagePoint": [0, 0],        // Using image top-left as pivot
    "spinSpeed": 20
  }
}
```

---

## Coordinate Debugging

### Visual Markers

Enable debug to see all coordinate systems:

```json
{
  "Image Mapping Debug": {
    "showCenter": true,        // Red: Image center in stage space
    "showStageCenter": true    // Cyan: Stage center (1024, 1024)
  }
}
```

### Console Logging

In development mode, prepareLayer() logs all coordinates:

```javascript
[LayerCore] prepareLayer "my-layer":
  position: { x: 1024, y: 1024 }
  scale: { x: 1.0, y: 1.0 }
  imageCenter (image space): { x: 256, y: 256 }
  imageCenter (stage space): { x: 1024, y: 1024 }
```

---

## Quick Reference

### Coordinate Space Comparison

| Space | Origin | Bounds | Config Usage |
|-------|--------|--------|-------------|
| **Stage** | (0, 0) | 0-2048 | BasicStagePoint, spinStagePoint, orbitCenter |
| **Image** | (0, 0) | 0-width, 0-height | Internal only |
| **Percent** | (0%, 0%) | 0-100% | BasicImagePoint, spinImagePoint, orbitImagePoint |
| **Viewport** | (0, 0) | Device-dependent | Auto-scaled, not in config |

### Conversion Chain

```
Config (Percent) → Image Pixels → Stage Pixels → Viewport Pixels
     [50, 50]    →   (256, 256)  →  (1024, 1024) →   (960, 540)
```

---

## Next Steps

- **🔄 Spin System:** Read `03_SPIN_ANIMATION_DEEP_DIVE.md`
- **🐛 Debug Tools:** Read `07_DEBUG_VISUALIZATION.md`
- **📚 Stage System:** Read `06_STAGE_VIEWPORT_SYSTEM.md`

---

**AI Agent Note:** Always work in the appropriate coordinate space for the task. Config uses percent for portability, calculations use image pixels for accuracy, and rendering uses stage pixels for final output.
