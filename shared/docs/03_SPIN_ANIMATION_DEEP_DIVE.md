# Spin Animation Deep Dive

## Overview

Spin animation provides **continuous rotation** around a configurable pivot point. This document explains the complete implementation from config to 60fps rendering.

---

## Spin Config Fields

### Complete Field Set

```typescript
{
  "Spin Config": {
    // Pivot point (where to spin from)
    "spinStagePoint": [1024, 1024],  // Stage pixels (0-2048)
    "spinImagePoint": [50, 50],      // Image percent (0-100)
    
    // Animation settings
    "spinSpeed": 30,                  // Degrees per second
    "spinDirection": "cw"             // "cw" or "ccw"
  }
}
```

### Field Details

#### spinStagePoint

**Type:** `[number, number]` (stage pixels)

**Default:** `[1024, 1024]` (stage center)

**Range:** X: 0-2048, Y: 0-2048

**Purpose:** Defines WHERE on the stage the spin pivot is located

**Examples:**
```json
[1024, 1024]  // Spin around stage center
[512, 512]    // Spin around top-left quadrant
[1536, 1024]  // Spin around right quadrant center
[0, 0]        // Spin around top-left corner (edge orbit)
```

#### spinImagePoint

**Type:** `[number, number]` (image percent)

**Default:** `[50, 50]` (image center)

**Range:** X: 0-100%, Y: 0-100%

**Purpose:** Defines WHICH point on the image is pinned to spinStagePoint

**Examples:**
```json
[50, 50]   // Image center (most common)
[0, 0]     // Image top-left corner
[100, 50]  // Image right edge center
[50, 100]  // Image bottom edge center
[25, 75]   // Quarter from left, three-quarters down
```

#### spinSpeed

**Type:** `number` (degrees per second)

**Default:** `0` (disabled)

**Range:** 0-360+ (no hard limit)

**Purpose:** Controls rotation rate

**Activation:** Spin is **ACTIVE** when `spinSpeed > 0`

**Common Values:**

| Speed | Rotation Time | Use Case |
|-------|---------------|----------|
| `360` | 1 second | Very fast gear |
| `180` | 2 seconds | Fast gear |
| `90` | 4 seconds | Medium gear |
| `45` | 8 seconds | Slow gear |
| `30` | 12 seconds | Very slow gear |
| `10` | 36 seconds | Ultra slow clock hand |
| `0` | ∞ (disabled) | Static image |

#### spinDirection

**Type:** `"cw"` | `"ccw"`

**Default:** `"cw"` (clockwise)

**Purpose:** Controls rotation direction

**Visual:**
```
Clockwise (cw):      Counter-Clockwise (ccw):
    ↑                        ↑
  ← • →                    → • ←
    ↓                        ↓
```

---

## Override Behavior

### Why Spin Overrides Basic Config

**Problem:** Spin and Basic both define position

```json
{
  "Basic Config": {
    "BasicStagePoint": [512, 512],   // Says: position here
    "BasicImagePoint": [50, 50]
  },
  "Spin Config": {
    "spinStagePoint": [1024, 1024],  // Says: spin around here!
    "spinImagePoint": [50, 50],
    "spinSpeed": 30
  }
}
```

**Question:** Which position wins?

**Answer:** Spin wins (when active)

### Override Logic (transformConfig)

**Location:** `Config.ts` lines 154-162

```typescript
if (spin.spinSpeed && spin.spinSpeed > 0) {
  // Merge all spin properties
  Object.assign(merged, spin);
  
  // OVERRIDE: Spin positioning replaces Basic positioning
  if (spin.spinStagePoint) merged.BasicStagePoint = spin.spinStagePoint;
  if (spin.spinImagePoint) merged.BasicImagePoint = spin.spinImagePoint;
  
  // RESET: Spin controls rotation, clear static rotation
  merged.BasicAngleImage = 0;
}
```

### Result

**Before transformConfig:**
```json
{
  "Basic Config": { "BasicStagePoint": [512, 512], "BasicAngleImage": 45 },
  "Spin Config": { "spinStagePoint": [1024, 1024], "spinSpeed": 30 }
}
```

**After transformConfig:**
```json
{
  "BasicStagePoint": [1024, 1024],  // ← From Spin (overridden)
  "BasicImagePoint": [50, 50],
  "BasicAngleImage": 0,              // ← Reset by Spin
  "spinSpeed": 30,
  "spinDirection": "cw"
}
```

---

## Animation Formula

### Core Calculation

**Location:** `LayerCorePipelineSpin.ts` lines 41-56

```typescript
const currentTime = timestamp ?? performance.now();
const elapsed = currentTime;  // If no startTime, use timestamp directly

// Speed in degrees per millisecond
const speedPerMs = spinSpeed / 1000;

// Calculate rotation
let rotation = (elapsed * speedPerMs) % 360;

// Apply direction
rotation = spinDirection === "ccw" ? -rotation : rotation;

// Normalize to 0-360°
rotation = rotation < 0 ? rotation + 360 : rotation;
```

### Step-by-Step Example

**Given:**
- `spinSpeed = 30` (30°/second)
- `spinDirection = "cw"`
- `timestamp = 5000ms` (5 seconds elapsed)

**Calculate:**

```typescript
// 1. Speed per millisecond
speedPerMs = 30 / 1000 = 0.03 °/ms

// 2. Total rotation
rotation = 5000 * 0.03 = 150°

// 3. Modulo 360 (wrap around)
rotation = 150 % 360 = 150°

// 4. Apply direction (clockwise = positive)
rotation = 150°  (no change for cw)

// 5. Normalize (already in range)
rotation = 150°
```

**Result:** Image rotated 150° clockwise

### Animation Timeline

**spinSpeed = 30°/second, direction = cw:**

| Time | Rotation | Visual |
|------|----------|--------|
| 0s | 0° | ↑ (start) |
| 3s | 90° | → (quarter turn) |
| 6s | 180° | ↓ (half turn) |
| 9s | 270° | ← (three-quarter turn) |
| 12s | 0° | ↑ (full rotation) |

---

## Processor Implementation

### createSpinProcessor() Function

**Location:** `LayerCorePipelineSpin.ts` lines 30-82

```typescript
export function createSpinProcessor(config: SpinConfig): LayerProcessor {
  const spinSpeed = config.spinSpeed ?? 0;
  const spinDirection = config.spinDirection ?? "cw";
  
  // Early exit if disabled
  if (spinSpeed === 0) {
    return (layer: UniversalLayerData): EnhancedLayerData => 
      layer as EnhancedLayerData;
  }
  
  // Cache calculations
  const speedPerMs = spinSpeed / 1000;
  
  // Return processor function
  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    const currentTime = timestamp ?? performance.now();
    const elapsed = currentTime;
    
    // Calculate rotation
    let rotation = (elapsed * speedPerMs) % 360;
    rotation = applyRotationDirection(rotation, spinDirection);
    rotation = normalizeAngle(rotation);
    
    // Return enhanced data with spin properties
    return {
      ...layer,
      spinCenter: layer.calculation.spinPoint.image.point,
      spinSpeed,
      spinDirection,
      currentRotation: rotation,  // ← Key: Current rotation angle
      hasSpinAnimation: true,
      spinStagePoint: layer.calculation.spinPoint.stage.point,
      spinPercent: layer.calculation.spinPoint.image.percent,
    } as EnhancedLayerData;
  };
}
```

### What Gets Added

**Input:** `UniversalLayerData`

```typescript
{
  layerId: "GEAR1",
  position: { x: 1024, y: 1024 },
  scale: { x: 1.0, y: 1.0 },
  rotation: 0,
  // ... other base properties
}
```

**Output:** `EnhancedLayerData` (after spin processor)

```typescript
{
  // All base properties
  ...layer,
  
  // Added by SpinProcessor
  spinCenter: { x: 256, y: 256 },         // Image space
  spinSpeed: 30,
  spinDirection: "cw",
  currentRotation: 45.5,                  // ← Calculated from timestamp
  hasSpinAnimation: true,
  spinStagePoint: { x: 1024, y: 1024 },
  spinPercent: { x: 50, y: 50 }
}
```

---

## Renderer Integration

### Stage Component

**Location:** `StageDOM.tsx` lines 72-79

```typescript
// Conditionally create spin processor
if (entry.spinSpeed && entry.spinSpeed > 0) {
  processors.push(
    createSpinProcessor({
      spinSpeed: entry.spinSpeed,
      spinDirection: entry.spinDirection,
    })
  );
}
```

### Engine Rendering Loop

#### DOM Renderer

**Location:** `LayerEngineDOM.ts` lines 136-139

```typescript
const rotation = enhancedData.currentRotation ?? enhancedData.rotation ?? 0;
if (rotation !== 0) {
  transforms.push(`rotate(${rotation}deg)`);
}
```

#### Canvas Renderer

**Location:** `LayerEngineCanvas.ts` lines 143-154

```typescript
if (enhancedData.currentRotation !== undefined) {
  ctx.save();
  ctx.translate(enhancedData.position.x, enhancedData.position.y);
  ctx.rotate(enhancedData.currentRotation * AnimationConstants.DEG_TO_RAD);
  ctx.drawImage(
    layer.image,
    -layer.transformCache.centerX,
    -layer.transformCache.centerY,
    layer.transformCache.scaledWidth,
    layer.transformCache.scaledHeight
  );
  ctx.restore();
}
```

#### Three.js Renderer

**Location:** `LayerEngineThree.ts` lines 197-199

```typescript
if (enhancedData.currentRotation !== undefined) {
  item.group.rotation.z = -(enhancedData.currentRotation * AnimationConstants.DEG_TO_RAD);
}
```

---

## Complete Flow Diagram

```
1. CONFIG LOADING
   ConfigYuzha.json
   ↓
   transformConfig()
   ↓
   Spin overrides Basic (if spinSpeed > 0)
   ↓
   LayerConfigEntry

2. LAYER PREPARATION
   LayerCore.prepareLayer()
   ↓
   Calculate spin points
   ↓
   UniversalLayerData

3. PROCESSOR CREATION
   StageDOM.tsx
   ↓
   if (spinSpeed > 0)
   ↓
   createSpinProcessor()
   ↓
   LayerProcessor

4. ANIMATION LOOP (60fps)
   requestAnimationFrame(timestamp)
   ↓
   runPipeline(layer, [spinProcessor], timestamp)
   ↓
   SpinProcessor calculates rotation
   ↓
   EnhancedLayerData { currentRotation: 45.5 }
   ↓
   Renderer applies rotation transform
   ↓
   Screen update
```

---

## Common Patterns

### Pattern 1: Simple Center Spin

**Use Case:** Gear spinning in place

```json
{
  "Spin Config": {
    "spinStagePoint": [1024, 1024],  // Spin at stage center
    "spinImagePoint": [50, 50],      // Using image center
    "spinSpeed": 30,
    "spinDirection": "cw"
  }
}
```

### Pattern 2: Off-Center Pivot

**Use Case:** Clock hand spinning from base

```json
{
  "Spin Config": {
    "spinStagePoint": [1024, 1024],  // Spin around stage center
    "spinImagePoint": [50, 100],     // But use image bottom as pivot
    "spinSpeed": 6,                   // Slow (60 seconds per rotation)
    "spinDirection": "cw"
  }
}
```

### Pattern 3: Edge Orbit

**Use Case:** Small gear orbiting large gear

```json
{
  "Spin Config": {
    "spinStagePoint": [1024, 1024],  // Spin around stage center
    "spinImagePoint": [0, 50],       // But use left edge as pivot
    "spinSpeed": 20,
    "spinDirection": "ccw"
  }
}
```

**Result:** Image orbits around stage center with left edge as pivot

### Pattern 4: Counter-Rotating Gears

```json
[
  {
    "layerId": "gear1",
    "order": 100,
    "groups": {
      "Spin Config": {
        "spinSpeed": 30,
        "spinDirection": "cw"  // → Clockwise
      }
    }
  },
  {
    "layerId": "gear2",
    "order": 101,
    "groups": {
      "Spin Config": {
        "spinSpeed": 30,
        "spinDirection": "ccw"  // ← Counter-clockwise
      }
    }
  }
]
```

---

## Performance Optimizations

### 1. Early Exit for Disabled Spin

```typescript
if (spinSpeed === 0) {
  return (layer) => layer;  // No-op processor
}
```

### 2. Cached Speed Calculation

```typescript
// Calculate once
const speedPerMs = spinSpeed / 1000;

// Reuse every frame
rotation = elapsed * speedPerMs;
```

### 3. Static Layer Detection

```typescript
const isStatic = processors.length === 0;
if (isStatic) {
  // Render once, skip animation loop
}
```

### 4. Pre-Calculated Spin Points

```typescript
// Calculated once in prepareLayer()
layer.calculation.spinPoint = {
  image: { point: {...}, percent: {...} },
  stage: { point: {...}, percent: {...} }
};

// Reused every frame
const spinImagePoint = layer.calculation.spinPoint.image.point;
```

---

## Debugging Spin

### Issue: Spin Not Working

**Checklist:**

1. **Check spinSpeed:**
   ```json
   "spinSpeed": 30  // Must be > 0
   ```

2. **Check console:**
   ```
   [LayerEngineDOM] Starting 60fps animation loop
   ```

3. **Check processor creation:**
   ```javascript
   console.log(processors);  // Should include SpinProcessor
   ```

4. **Check enhanced data:**
   ```javascript
   console.log(enhancedData.currentRotation);  // Should change
   ```

### Issue: Wrong Pivot Point

**Enable Debug:**

```json
{
  "Image Mapping Debug": {
    "showCenter": true,
    "showStageCenter": true
  }
}
```

**Visual Check:**
- Red crosshair = image center (should match spinImagePoint)
- Cyan star = stage center
- If misaligned, adjust `spinStagePoint` or `spinImagePoint`

### Issue: Wrong Direction

**Swap direction:**

```json
"spinDirection": "ccw"  // Was "cw"
```

### Issue: Too Fast/Slow

**Adjust speed:**

```json
// Too fast? Reduce speed
"spinSpeed": 10  // Was 30

// Too slow? Increase speed
"spinSpeed": 60  // Was 30
```

---

## Advanced Topics

### Custom Start Time

**Currently:** Animation starts when app loads

**Future:** Support custom start time

```typescript
{
  "Spin Config": {
    "spinSpeed": 30,
    "startTime": 1000  // Start after 1 second
  }
}
```

### Spin + Orbital (Planned)

**Question:** What happens when both are active?

**Option 1:** Orbital overrides Spin (position only)

```typescript
if (orbitSpeed > 0) {
  position = calculateOrbitPosition(...);
  rotation = spinProcessor(...);
}
```

**Option 2:** Spin disabled when orbiting

```typescript
if (orbitSpeed > 0) {
  spinSpeed = 0;  // Turn off spin
}
```

---

## Next Steps

- **🎨 Renderers:** Read `04_RENDERING_ENGINES.md`
- **🔧 Pipeline:** Read `05_LAYER_PIPELINE_SYSTEM.md`
- **🐛 Debug:** Read `07_DEBUG_VISUALIZATION.md`
- **🔄 Orbital:** Read `09_ORBITAL_ANIMATION_TODO.md`

---

**AI Agent Note:** Spin is the first animation system. Orbital will follow the same pattern (config → override → processor → render). The processor pattern makes adding new animation types straightforward.
