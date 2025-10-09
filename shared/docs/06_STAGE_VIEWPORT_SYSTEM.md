# Stage & Viewport System

## Overview

The **stage2048 system** provides a fixed 2048×2048 coordinate space that automatically scales to fit any viewport size using "cover" mode (like CSS `background-size: cover`).

---

## Core Concept

### Fixed Stage, Flexible Viewport

**Stage (Internal):**
- Always 2048×2048 pixels
- Never changes
- All coordinates in stage space

**Viewport (External):**
- Browser window size
- Changes on resize
- Automatically scales stage

```
              ┌──────────────────────────┐
              │    Stage (2048×2048)    │
              │    Fixed coordinate     │
              │        system           │
              │                          │
              │       (1024, 1024)      │
              │           • Center      │
              │                          │
              └──────────────────────────┘
                       ↓
                   Scales to
                       ↓
┌───────────────────────────────────────────────┐
│         Viewport (1920×1080)                │
│         Browser window                       │
│                                              │
│    ┌──────────────────────────────┐    │
│    │ Stage scaled to 1920×1920 │    │
│    │ (extends above/below)      │    │
│    │                            │    │
│    │         Visible            │    │
│    │          area              │    │
│    │                            │    │
│    └──────────────────────────────┘    │
│                                              │
└───────────────────────────────────────────────┘
```

---

## File: stage2048.ts

**Location:** `/app/shared/utils/stage2048.ts`

**Purpose:** Utilities for managing 2048×2048 stage in any viewport

### Exports

```typescript
export const STAGE_SIZE = 2048;

export type StageTransform = {
  scale: number;      // Scale factor
  offsetX: number;    // X offset to center
  offsetY: number;    // Y offset to center
  width: number;      // Scaled width
  height: number;     // Scaled height
};

export function computeCoverTransform(
  viewportWidth: number,
  viewportHeight: number
): StageTransform;

export function createStageTransformer(
  stageElement: HTMLElement,
  container: HTMLElement,
  options?: StageTransformerOptions
): () => void;

export function viewportToStageCoords(
  viewportX: number,
  viewportY: number,
  transform: StageTransform
): { x: number; y: number };

export function stageToViewportCoords(
  stageX: number,
  stageY: number,
  transform: StageTransform
): { x: number; y: number };
```

---

## computeCoverTransform()

### Purpose

Calculate scale and offset to display 2048×2048 stage in viewport using "cover" behavior.

### Algorithm

```typescript
export function computeCoverTransform(
  viewportWidth: number,
  viewportHeight: number
): StageTransform {
  // Calculate scale for each axis
  const scaleX = viewportWidth / STAGE_SIZE;
  const scaleY = viewportHeight / STAGE_SIZE;
  
  // Use LARGER scale (cover mode - fills viewport, may overflow)
  const scale = Math.max(scaleX, scaleY);
  
  // Calculate scaled dimensions
  const width = STAGE_SIZE * scale;
  const height = STAGE_SIZE * scale;
  
  // Calculate offset to center stage in viewport
  return {
    scale,
    offsetX: (viewportWidth - width) / 2,
    offsetY: (viewportHeight - height) / 2,
    width,
    height,
  };
}
```

### Cover vs Contain

**Cover (Current):**
```typescript
const scale = Math.max(scaleX, scaleY);  // Fills viewport
```
- Stage fills entire viewport
- Parts may extend beyond viewport
- No empty space

**Contain (Alternative):**
```typescript
const scale = Math.min(scaleX, scaleY);  // Fits in viewport
```
- Entire stage visible
- May have empty space around edges
- Letterbox/pillarbox effect

### Examples

#### Example 1: 1920x1080 Viewport (16:9)

```typescript
computeCoverTransform(1920, 1080)

// Step 1: Calculate scales
scaleX = 1920 / 2048 = 0.9375
scaleY = 1080 / 2048 = 0.527

// Step 2: Use larger (cover)
scale = Math.max(0.9375, 0.527) = 0.9375

// Step 3: Scaled dimensions
width = 2048 * 0.9375 = 1920px
height = 2048 * 0.9375 = 1920px

// Step 4: Offsets to center
offsetX = (1920 - 1920) / 2 = 0
offsetY = (1080 - 1920) / 2 = -420

// Result:
{
  scale: 0.9375,
  offsetX: 0,
  offsetY: -420,     // Stage extends 420px above and below
  width: 1920,
  height: 1920
}
```

**Visual:**
```
  │<--- 1920px --->|
  |─────────────────|  ← 420px above viewport
──┴─────────────────┴──  ← Viewport top
  │                 │  ↑
  │                 │  |
  │  Stage (scaled) │  1080px
  │                 │  |
  │                 │  ↓
──┴─────────────────┴──  ← Viewport bottom
  |─────────────────|  ← 420px below viewport
```

#### Example 2: 1024x768 Viewport (4:3)

```typescript
computeCoverTransform(1024, 768)

// Calculate
scaleX = 1024 / 2048 = 0.5
scaleY = 768 / 2048 = 0.375
scale = Math.max(0.5, 0.375) = 0.5

width = 2048 * 0.5 = 1024px
height = 2048 * 0.5 = 1024px

offsetX = (1024 - 1024) / 2 = 0
offsetY = (768 - 1024) / 2 = -128

// Result:
{
  scale: 0.5,
  offsetX: 0,
  offsetY: -128,
  width: 1024,
  height: 1024
}
```

#### Example 3: 800x600 Viewport (4:3 Small)

```typescript
computeCoverTransform(800, 600)

// Calculate
scaleX = 800 / 2048 = 0.390625
scaleY = 600 / 2048 = 0.29296875
scale = Math.max(0.390625, 0.29296875) = 0.390625

width = 2048 * 0.390625 = 800px
height = 2048 * 0.390625 = 800px

offsetX = (800 - 800) / 2 = 0
offsetY = (600 - 800) / 2 = -100

// Result:
{
  scale: 0.390625,
  offsetX: 0,
  offsetY: -100,
  width: 800,
  height: 800
}
```

---

## createStageTransformer()

### Purpose

Automatic stage sizing and positioning with resize handling.

### Usage

```typescript
const cleanup = createStageTransformer(stageElement, containerElement, {
  resizeDebounce: 100  // Optional: debounce resize events
});

// Later: cleanup()
```

### Implementation

**Location:** `stage2048.ts` lines 85-142

```typescript
export function createStageTransformer(
  stageElement: HTMLElement,
  container: HTMLElement,
  options: StageTransformerOptions = {}
): () => void {
  const { resizeDebounce = 0 } = options;
  let timeoutId: number | undefined;

  const applyTransform = () => {
    // Get current viewport size
    const { innerWidth, innerHeight } = window;
    const { scale, offsetX, offsetY } = computeCoverTransform(innerWidth, innerHeight);

    // Set stage element size (always 2048x2048)
    stageElement.style.width = `${STAGE_SIZE}px`;
    stageElement.style.height = `${STAGE_SIZE}px`;

    // Set container size and transform
    container.style.width = `${STAGE_SIZE}px`;
    container.style.height = `${STAGE_SIZE}px`;
    container.style.position = "absolute";
    container.style.left = "0";
    container.style.top = "0";
    container.style.transformOrigin = "top left";
    container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  };

  const handleResize = () => {
    if (resizeDebounce > 0) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(applyTransform, resizeDebounce);
    } else {
      applyTransform();
    }
  };

  // Initial application
  applyTransform();

  // Setup resize listener
  window.addEventListener("resize", handleResize);

  // Return cleanup function
  return () => {
    window.removeEventListener("resize", handleResize);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };
}
```

### CSS Applied

**Stage Element:**
```css
width: 2048px;
height: 2048px;
```

**Container:**
```css
width: 2048px;
height: 2048px;
position: absolute;
left: 0;
top: 0;
transform-origin: top left;
transform: translate(0px, -420px) scale(0.9375);
```

### Resize Debouncing

**Without Debounce (resizeDebounce: 0):**
- Transform applied on every resize event
- Can be 100+ events during drag
- May cause performance issues

**With Debounce (resizeDebounce: 100):**
- Transform applied 100ms after last resize event
- Reduces number of transformations
- Smoother performance during resize

---

## Coordinate Conversion

### viewportToStageCoords()

**Purpose:** Convert browser coordinates → stage coordinates

**Use Case:** Mouse events, touch events

```typescript
export function viewportToStageCoords(
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

**Example:**

```typescript
// Viewport: 1920x1080
// Transform: { scale: 0.9375, offsetX: 0, offsetY: -420 }

// Click at viewport (960, 540) - center of viewport
viewportToStageCoords(960, 540, transform)

// Calculate:
x = (960 - 0) / 0.9375 = 1024
y = (540 - (-420)) / 0.9375 = 960 / 0.9375 = 1024

// Result: { x: 1024, y: 1024 }  ← Stage center!
```

### stageToViewportCoords()

**Purpose:** Convert stage coordinates → browser coordinates

**Use Case:** Position UI elements over stage features

```typescript
export function stageToViewportCoords(
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

**Example:**

```typescript
// Stage center at (1024, 1024)
// Transform: { scale: 0.9375, offsetX: 0, offsetY: -420 }

stageToViewportCoords(1024, 1024, transform)

// Calculate:
x = 1024 * 0.9375 + 0 = 960
y = 1024 * 0.9375 + (-420) = 960 - 420 = 540

// Result: { x: 960, y: 540 }  ← Viewport center!
```

---

## Usage in Stages

### StageDOM.tsx

**Location:** Lines 94-96

```typescript
cleanupTransform = createStageTransformer(stage, container, {
  resizeDebounce: 100,
});
```

**HTML Structure:**

```jsx
<div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
  <div ref={stageRef} className="block" />
</div>
```

**Result:**
- `containerRef` = Outer div (fills viewport)
- `stageRef` = Inner div (2048×2048, scaled to fit)

### StageCanvas.tsx

**Location:** Lines 103-105

```typescript
cleanupTransform = createStageTransformer(canvas, container, {
  resizeDebounce: 100,
});
```

**Canvas Setup:**

```typescript
canvas.width = STAGE_SIZE;   // 2048 internal pixels
canvas.height = STAGE_SIZE;  // 2048 internal pixels
```

### StageThree.tsx

**Location:** Lines 125-127

```typescript
cleanupTransform = createStageTransformer(canvas, container, {
  resizeDebounce: 100,
});
```

**Three.js Setup:**

```typescript
canvas.width = STAGE_SIZE;
canvas.height = STAGE_SIZE;
renderer.setSize(STAGE_SIZE, STAGE_SIZE, false);
```

---

## Responsive Behavior

### Desktop Landscape (1920x1080)

```
Scale: 0.9375
Stage appears: 1920×1920
Overflow: 420px top & bottom hidden
```

### Tablet Portrait (768x1024)

```
scaleX = 768 / 2048 = 0.375
scaleY = 1024 / 2048 = 0.5
scale = Math.max(0.375, 0.5) = 0.5

Stage appears: 1024×1024
Overflow: 128px left & right hidden
```

### Mobile Portrait (375x667)

```
scaleX = 375 / 2048 = 0.183
scaleY = 667 / 2048 = 0.326
scale = Math.max(0.183, 0.326) = 0.326

Stage appears: 667×667
Overflow: 146px left & right hidden
```

### Ultra-Wide (3440x1440)

```
scaleX = 3440 / 2048 = 1.68
scaleY = 1440 / 2048 = 0.703
scale = Math.max(1.68, 0.703) = 1.68

Stage appears: 3440×3440
Overflow: 1000px top & bottom hidden
```

---

## Performance Considerations

### Transform Performance

**CSS Transform (Fast):**
```css
transform: translate(...) scale(...);
```
- GPU-accelerated
- No layout recalculation
- Smooth 60fps

**Avoid (Slow):**
```css
width: ${calculatedWidth}px;  /* Triggers layout */
height: ${calculatedHeight}px;
```

### Resize Optimization

**Good:**
```typescript
createStageTransformer(stage, container, {
  resizeDebounce: 100  // Wait 100ms after last resize
});
```

**Bad:**
```typescript
createStageTransformer(stage, container, {
  resizeDebounce: 0  // Update on every event (100+ times)
});
```

---

## Common Patterns

### Pattern 1: Fullscreen Stage

```typescript
const container = document.getElementById("stage-container");
const stage = document.getElementById("stage");

const cleanup = createStageTransformer(stage, container, {
  resizeDebounce: 100
});
```

### Pattern 2: Mouse Tracking

```typescript
const transform = computeCoverTransform(window.innerWidth, window.innerHeight);

canvas.addEventListener("mousemove", (e) => {
  const stageCoords = viewportToStageCoords(e.clientX, e.clientY, transform);
  console.log(`Stage: (${stageCoords.x}, ${stageCoords.y})`);
});
```

### Pattern 3: Position UI Over Stage Feature

```typescript
const transform = computeCoverTransform(window.innerWidth, window.innerHeight);

// Layer at stage (1024, 512)
const viewportCoords = stageToViewportCoords(1024, 512, transform);

// Position tooltip
tooltip.style.left = `${viewportCoords.x}px`;
tooltip.style.top = `${viewportCoords.y}px`;
```

---

## Troubleshooting

### Issue: Stage Not Centered

**Check:**

```typescript
console.log(computeCoverTransform(window.innerWidth, window.innerHeight));
```

**Verify:**
- `offsetX` and `offsetY` are calculated
- `transform` CSS is applied

### Issue: Stage Too Small/Large

**Check scale:**

```typescript
const { scale } = computeCoverTransform(window.innerWidth, window.innerHeight);
console.log(`Scale: ${scale}`);
```

**Verify:**
- Using `Math.max()` for cover behavior
- Not accidentally using `Math.min()` (contain)

### Issue: Resize Not Working

**Check cleanup:**

```typescript
const cleanup = createStageTransformer(...);

// Did you forget to call cleanup on unmount?
return () => {
  cleanup();  // ← Important!
};
```

---

## Advanced: Custom Resize Handler

```typescript
const cleanup = createStageTransformer(stage, container, {
  resizeDebounce: 100,
  onResize: (callback) => {
    // Custom resize logic
    const observer = new ResizeObserver(() => {
      callback();
    });
    observer.observe(document.body);
    
    return () => observer.disconnect();
  }
});
```

---

## Next Steps

- **📐 Coordinates:** Read `02_COORDINATE_SYSTEMS.md`
- **🎨 Renderers:** Read `04_RENDERING_ENGINES.md`
- **🔧 Features:** Read `08_ADDING_NEW_FEATURES.md`

---

**AI Agent Note:** The stage2048 system ensures consistent coordinates across all devices. Always work in stage coordinates (0-2048) and let the system handle viewport scaling automatically.
