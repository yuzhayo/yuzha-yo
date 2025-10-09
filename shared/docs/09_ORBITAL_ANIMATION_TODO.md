# Orbital Animation Integration

## Current Status

✅ **Processor Ready** - `LayerCorePipelineOrbital.ts` is complete and tested

❌ **Not Wired to Stages** - Stages (DOM/Canvas/Three) don't create orbital processor yet

⚠️ **Config Override Logic Planned** - Need to define Orbital vs Spin priority

---

## What Exists

### Orbital Processor

**File:** `LayerCorePipelineOrbital.ts`

**Features:**
- Circular motion around center point
- Configurable radius and speed
- Clockwise/counter-clockwise direction
- Auto-rotation to face center (optional)
- Visibility culling (hide when off-stage)

**Usage:**
```typescript
const processor = createOrbitalProcessor({
  orbitCenter: [1024, 1024],      // Center of orbit
  orbitImagePoint: [50, 50],       // Image point that follows orbit
  orbitRadius: 200,                // Orbit radius in pixels
  orbitSpeed: 45,                  // Degrees per second
  orbitDirection: "cw",            // "cw" or "ccw"
  orbitAutoRotate: true            // Face orbit center
});
```

### Config Schema

**Already in ConfigYuzha.json:**

```json
{
  "Orbital Config": {
    "orbitCenter": [1024, 1024],
    "orbitImagePoint": [50, 50],
    "orbitRadius": 200,
    "orbitSpeed": 0,
    "orbitDirection": "cw",
    "orbitAutoRotate": false
  }
}
```

### Types Already Defined

**In `Config.ts`:**

```typescript
export type OrbitalConfigGroup = {
  orbitCenter?: [number, number];
  orbitImagePoint?: [number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  orbitAutoRotate?: boolean;
};
```

**In `LayerConfigEntry`:**

```typescript
export type LayerConfigEntry = {
  // ... other fields
  
  // Orbital Config
  orbitCenter?: [number, number];
  orbitImagePoint?: [number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  orbitAutoRotate?: boolean;
};
```

**In `EnhancedLayerData`:**

```typescript
export type EnhancedLayerData = UniversalLayerData & {
  // ... other properties
  
  // Orbital properties
  orbitCenter?: { x: number; y: number };
  orbitImagePoint?: { x: number; y: number };
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  orbitRotation?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;  // ← Hide when off-stage
};
```

---

## What's Missing

### 1. Wire Processor to Stages

**Need to add to:**
- `StageDOM.tsx`
- `StageCanvas.tsx`
- `StageThree.tsx`

**Code to add:**

```typescript
// After spin processor, before debug processor
if (entry.orbitSpeed && entry.orbitSpeed > 0) {
  processors.push(
    createOrbitalProcessor({
      orbitCenter: entry.orbitCenter || [1024, 1024],
      orbitImagePoint: entry.orbitImagePoint || [50, 50],
      orbitRadius: entry.orbitRadius || 200,
      orbitSpeed: entry.orbitSpeed,
      orbitDirection: entry.orbitDirection || "cw",
      orbitAutoRotate: entry.orbitAutoRotate ?? false
    })
  );
}
```

### 2. Define Override Priority

**Question:** What happens when both Spin AND Orbital are active?

**Option A: Orbital Overrides Spin (Position Only)**

```typescript
// In Config.ts transformConfig()
if (orbital.orbitSpeed && orbital.orbitSpeed > 0) {
  Object.assign(merged, orbital);
  
  // Orbital controls position
  if (orbital.orbitCenter) merged.BasicStagePoint = orbital.orbitCenter;
  if (orbital.orbitImagePoint) merged.BasicImagePoint = orbital.orbitImagePoint;
  
  // But Spin can still control rotation
  // (Don't reset spinSpeed)
}
```

**Result:**
- Layer orbits around center
- Layer spins while orbiting
- Double animation!

**Option B: Orbital Disables Spin**

```typescript
// In Config.ts transformConfig()
if (orbital.orbitSpeed && orbital.orbitSpeed > 0) {
  Object.assign(merged, orbital);
  
  // Orbital controls position
  if (orbital.orbitCenter) merged.BasicStagePoint = orbital.orbitCenter;
  if (orbital.orbitImagePoint) merged.BasicImagePoint = orbital.orbitImagePoint;
  
  // Disable spin when orbiting
  merged.spinSpeed = 0;
}
```

**Result:**
- Layer orbits around center
- No spin animation
- Simpler behavior

**Recommendation:** Use Option A (allow both)

### 3. Handle Visibility

**Orbital processor sets `visible: false` when layer is off-stage.**

**Need to add to renderers:**

**DOM Renderer:**
```typescript
if (enhancedData.visible === false) {
  layer.img.style.display = "none";
} else {
  layer.img.style.display = "block";
}
```

**Canvas Renderer:**
```typescript
if (enhancedData.visible === false) {
  continue;  // Skip rendering
}
```

**Three.js Renderer:**
```typescript
if (enhancedData.visible !== undefined) {
  item.mesh.visible = enhancedData.visible;
}
```

---

## Integration Steps

### Step 1: Choose Override Strategy

Decide: Option A (both) or Option B (orbital only)

### Step 2: Update transformConfig()

**File:** `Config.ts`

**Add after Spin override logic:**

```typescript
// Phase 3: Orbital Config (overrides positioning)
if (orbital.orbitSpeed && orbital.orbitSpeed > 0) {
  Object.assign(merged, orbital);
  
  // Override positioning
  if (orbital.orbitCenter) merged.BasicStagePoint = orbital.orbitCenter;
  if (orbital.orbitImagePoint) merged.BasicImagePoint = orbital.orbitImagePoint;
  merged.BasicAngleImage = 0;  // Reset static rotation
  
  // Option A: Keep spin (allow both)
  // (No change to spinSpeed)
  
  // Option B: Disable spin
  // merged.spinSpeed = 0;
}
```

### Step 3: Wire to Stages

**Files:** `StageDOM.tsx`, `StageCanvas.tsx`, `StageThree.tsx`

**Add import:**
```typescript
import { createOrbitalProcessor } from "../layer/LayerCorePipelineOrbital";
```

**Add processor creation:**
```typescript
// After spin, before debug
if (entry.orbitSpeed && entry.orbitSpeed > 0) {
  processors.push(
    createOrbitalProcessor({
      orbitCenter: entry.orbitCenter || [1024, 1024],
      orbitImagePoint: entry.orbitImagePoint || [50, 50],
      orbitRadius: entry.orbitRadius || 200,
      orbitSpeed: entry.orbitSpeed,
      orbitDirection: entry.orbitDirection || "cw",
      orbitAutoRotate: entry.orbitAutoRotate ?? false
    })
  );
}
```

### Step 4: Handle Visibility

**LayerEngineDOM.ts:**
```typescript
if (enhancedData.visible === false) {
  layer.img.style.display = "none";
  continue;
}
layer.img.style.display = "block";
```

**LayerEngineCanvas.ts:**
```typescript
if (enhancedData.visible === false) {
  continue;  // Skip rendering this layer
}
```

**LayerEngineThree.ts:**
```typescript
if (enhancedData.visible !== undefined) {
  item.mesh.visible = enhancedData.visible;
}
```

### Step 5: Test

**Add test layer:**

```json
[
  {
    "layerId": "orbital-test",
    "imageId": "GEAR1",
    "renderer": "2D",
    "order": 100,
    "groups": {
      "Basic Config": {
        "scale": [50, 50]
      },
      "Orbital Config": {
        "orbitCenter": [1024, 1024],
        "orbitImagePoint": [50, 50],
        "orbitRadius": 300,
        "orbitSpeed": 30,
        "orbitDirection": "cw",
        "orbitAutoRotate": true
      }
    }
  }
]
```

**Verify:**
1. Layer appears
2. Orbits around stage center (1024, 1024)
3. Radius is 300px
4. 30° per second (12 seconds per orbit)
5. Auto-rotates to face center
6. Hides when off-stage

### Step 6: Test Spin + Orbital

**If using Option A (both animations):**

```json
{
  "Spin Config": {
    "spinSpeed": 60,
    "spinDirection": "cw"
  },
  "Orbital Config": {
    "orbitCenter": [1024, 1024],
    "orbitRadius": 300,
    "orbitSpeed": 30,
    "orbitDirection": "cw",
    "orbitAutoRotate": false
  }
}
```

**Verify:**
- Layer orbits around center
- Layer also spins in place
- Both animations work together

---

## Orbital Animation Details

### Animation Formula

**Location:** `LayerCorePipelineOrbital.ts` lines 50-75

```typescript
const elapsed = currentTime;
const speedPerMs = orbitSpeed / 1000;

// Calculate current angle
let angle = (elapsed * speedPerMs) % 360;
angle = applyRotationDirection(angle, orbitDirection);

// Calculate position on circle
const angleRad = degreesToRadians(angle);
const orbitX = orbitCenter.x + orbitRadius * Math.cos(angleRad);
const orbitY = orbitCenter.y + orbitRadius * Math.sin(angleRad);

// Calculate position for image point
const newPosition = calculatePositionForPivot(
  { x: orbitX, y: orbitY },  // Pivot moves around orbit
  orbitImagePoint,
  layer.imageMapping.imageDimensions,
  layer.scale
);
```

### Auto-Rotation

**If `orbitAutoRotate: true`:**

```typescript
const rotationAngle = normalizeAngle(angle + 90);  // Face inward
```

**Result:** Layer always faces orbit center

### Visibility Culling

```typescript
const visible = calculateOrbitalVisibility(
  newPosition,
  {
    width: layer.imageMapping.imageDimensions.width * layer.scale.x,
    height: layer.imageMapping.imageDimensions.height * layer.scale.y
  },
  { min: 0, max: stageSize }
);
```

**Result:** `visible = false` when entire image is off-stage

---

## Expected Behavior

### Simple Orbit

**Config:**
```json
{
  "orbitCenter": [1024, 1024],
  "orbitRadius": 200,
  "orbitSpeed": 45
}
```

**Result:**
- Layer orbits around stage center
- Maintains orientation (no auto-rotation)
- Radius 200px
- 45°/sec = 8 seconds per orbit

### Orbit with Auto-Rotate

**Config:**
```json
{
  "orbitCenter": [1024, 1024],
  "orbitRadius": 300,
  "orbitSpeed": 30,
  "orbitAutoRotate": true
}
```

**Result:**
- Layer orbits around stage center
- Always faces center (like moon facing Earth)
- Radius 300px
- 30°/sec = 12 seconds per orbit

### Orbit + Spin

**Config:**
```json
{
  "Spin Config": {
    "spinSpeed": 60
  },
  "Orbital Config": {
    "orbitCenter": [1024, 1024],
    "orbitRadius": 200,
    "orbitSpeed": 30,
    "orbitAutoRotate": false
  }
}
```

**Result:**
- Layer orbits around stage center (30°/sec)
- Layer spins in place (60°/sec)
- Complex motion!

---

## Testing Checklist

### Basic Tests

- [ ] Orbit appears at correct radius
- [ ] Orbit speed is correct
- [ ] Clockwise direction works
- [ ] Counter-clockwise direction works
- [ ] Auto-rotation faces center
- [ ] Visibility culling works

### Edge Cases

- [ ] orbitSpeed = 0 (disabled)
- [ ] orbitRadius = 0 (no movement)
- [ ] orbitRadius > 2048 (large orbit)
- [ ] orbitCenter outside stage
- [ ] Very fast speed (360°/sec+)

### Integration Tests

- [ ] Works in DOM renderer
- [ ] Works in Canvas renderer
- [ ] Works in Three.js renderer
- [ ] Works with Spin active
- [ ] Works with Debug enabled
- [ ] Multiple layers orbiting

### Performance Tests

- [ ] 10 orbiting layers at 60fps
- [ ] 50 orbiting layers performance
- [ ] No jank during orbit
- [ ] Smooth visibility transitions

---

## Potential Issues

### Issue 1: Orbit + Spin Conflict

**Problem:** Both try to set rotation

**Solution:** Processor order matters

```typescript
processors = [
  spinProcessor,    // Adds currentRotation
  orbitalProcessor  // Adds orbitRotation
];

// In renderer:
const rotation = enhancedData.orbitRotation ?? enhancedData.currentRotation ?? 0;
```

### Issue 2: Visibility Flicker

**Problem:** Layer appears/disappears rapidly at edge

**Solution:** Add hysteresis (margin)

```typescript
// In orbital processor
const margin = 50;  // 50px margin
const visible = calculateOrbitalVisibility(position, dimensions, stageBounds, margin);
```

### Issue 3: Large Orbits Off-Stage

**Problem:** Orbit center outside stage, layer never visible

**Solution:** Allow negative positions, don't cull orbit center

---

## Future Enhancements

### 1. Elliptical Orbits

```typescript
{
  "orbitRadiusX": 200,  // Horizontal radius
  "orbitRadiusY": 100   // Vertical radius (ellipse)
}
```

### 2. Orbit Start Angle

```typescript
{
  "orbitStartAngle": 90  // Start at top (90°)
}
```

### 3. Orbit Path Shapes

```typescript
{
  "orbitPath": "circle" | "ellipse" | "square" | "figure-8"
}
```

### 4. Follow Path

```typescript
{
  "followPath": [
    [0, 0],
    [1024, 512],
    [2048, 1024],
    [1024, 1536]
  ]
}
```

---

## Documentation TODO

Once integrated:

- [ ] Update `03_SPIN_ANIMATION_DEEP_DIVE.md` with orbital section
- [ ] Create `ORBITAL_ANIMATION.md` dedicated guide
- [ ] Update `API_REFERENCE.md` with orbital fields
- [ ] Add examples to `01_CONFIG_SYSTEM_GUIDE.md`
- [ ] Update `08_ADDING_NEW_FEATURES.md` with orbital as example

---

## Next Steps

1. **Choose Strategy:** Option A (both) or Option B (orbital only)
2. **Update Config:** Add override logic to `transformConfig()`
3. **Wire Stages:** Add processor creation to all 3 stages
4. **Add Visibility:** Handle `visible` property in renderers
5. **Test:** Verify basic orbit, orbit + spin, visibility
6. **Document:** Update all relevant docs

---

**AI Agent Note:** The orbital processor is complete and ready to use. Integration is straightforward - just wire it to the stages following the pattern used for spin. The main decision is whether to allow orbit + spin together (recommended) or make them mutually exclusive.
