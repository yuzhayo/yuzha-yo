# Animation System Implementation Guide

## Purpose
This document provides complete specifications for implementing a modular animation system for 2D images with spin, orbital motion, and effects. A new AI agent should be able to implement this system from scratch using only this document.

---

## 1. Architecture Overview

### File Structure
```
/app/yuzha/src/test/
├── core.ts          # Foundation: registry, layer management, time tracking, transform combining
├── basic.ts         # Static positioning and initial rotation
├── spin.ts          # Self-rotation around pivot point
├── orbit.ts         # Circular motion around center point
├── clock.ts         # Time-based animations (hour/minute hands)
├── effect.ts        # Visual effects (fade, pulse, scale)
├── test.json        # Layer configuration data
└── testscreen.tsx   # Renderer component
```

### Module Dependencies
```
testscreen.tsx
    ↓
core.ts (imports basic.ts, spin.ts, orbit.ts, clock.ts, effect.ts)
    ↓
StageSystem.ts (from /app/shared/stage/StageSystem.ts)
    ↓
ImageRegistry.json (from /app/shared/config/ImageRegistry.json)
```

---

## 2. Coordinate System

### Stage System (Fixed Virtual Canvas)
- **Stage Size**: 2048×2048 pixels (fixed, never changes)
- **All calculations**: Use stage coordinates (0-2048 range)
- **Center**: [1024, 1024]
- **Origin**: Top-left [0, 0]

### Viewport Conversion
- **Handled by**: `/app/shared/stage/StageSystem.ts` (already exists)
- **Behavior**: "Cover" mode (like CSS background-size: cover)
  - Stage scales to fill entire viewport
  - May overflow edges
  - Always centered
- **Your responsibility**: Work ONLY in stage coordinates
- **StageSystem responsibility**: Convert stage → screen pixels

### Key Principle
All positions, sizes, and calculations in your modules use 2048×2048 stage space. Never worry about actual screen size.

---

## 3. JSON Configuration Format

### Complete Layer Config Structure
```json
{
  "LayerID": "stars-background-middle",
  "ImageID": "STARBG",
  "renderer": "2D",
  "LayerOrder": 50,
  "ImageScale": [100, 100],
  
  "groups": {
    "Basic Config": {
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 50],
      "BasicImageAngle": 0
    },
    
    "Spin Config": {
      "spinStagePoint": [1024, 1024],
      "spinImagePoint": [50, 50],
      "spinSpeed": 1,
      "spinDirection": "cw"
    },
    
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitLinePoint": [1024, 1024],
      "orbitImagePoint": [50, 50],
      "orbitLine": false,
      "orbitOrient": true,
      "orbitSpeed": 0,
      "orbitDirection": "cw"
    }
  }
}
```

### Top-Level Config Fields

| Field | Type | Purpose | Usage |
|-------|------|---------|-------|
| `LayerID` | string | Unique identifier for this layer | React key / DOM ID |
| `ImageID` | string | Reference to ImageRegistry.json | Lookup image path |
| `renderer` | string | "2D" or "3D" (unused for now) | Skip this field |
| `LayerOrder` | number | Z-index stacking order | Higher = front, lower = back |
| `ImageScale` | [number, number] | [width%, height%] | 100 = original size, 200 = double |

### Basic Config Fields

| Field | Type | Purpose | Range |
|-------|------|---------|-------|
| `BasicStagePoint` | [x, y] | Where to place image on stage | 0-2048 |
| `BasicImagePoint` | [x, y] | Anchor point on image (%) | 0-100 |
| `BasicImageAngle` | number | Initial rotation in degrees | 0-360 |

**BasicImagePoint Explanation**:
- [0, 0] = top-left corner of image
- [50, 50] = center of image
- [100, 100] = bottom-right corner of image

### Spin Config Fields

| Field | Type | Purpose | Values |
|-------|------|---------|--------|
| `spinStagePoint` | [x, y] | Pivot location on stage | 0-2048 |
| `spinImagePoint` | [x, y] | Rotation center on image (%) | 0-100 |
| `spinSpeed` | number | Degrees per second | Any number |
| `spinDirection` | string | Rotation direction | "cw" or "ccw" |

### Orbital Config Fields

| Field | Type | Purpose | Values |
|-------|------|---------|--------|
| `orbitStagePoint` | [x, y] | Center of orbit circle | 0-2048 |
| `orbitLinePoint` | [x, y] | Point on orbit path (defines radius) | 0-2048 |
| `orbitImagePoint` | [x, y] | Image anchor for orbit (%) | 0-100 |
| `orbitLine` | boolean | Show orbit path visualization | true/false |
| `orbitOrient` | boolean | Rotate image to face direction of motion | true/false |
| `orbitSpeed` | number | Degrees per second around orbit | Any number |
| `orbitDirection` | string | Orbit direction | "cw" or "ccw" |

**Radius Calculation**: Distance between `orbitStagePoint` and `orbitLinePoint`

---

## 4. Module Specifications

### 4.1 core.ts (Foundation)

**Responsibilities**:
1. Load ImageRegistry and resolve ImageID → image path
2. Manage layer system (LayerID, LayerOrder, ImageScale)
3. Track animation time and deltaTime
4. Combine transforms from all modules
5. Export final layer data for rendering

**Key Functions to Implement**:

```typescript
// Load image path from registry
export function getImagePath(imageID: string): string

// Calculate image dimensions after scaling
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  scale: [number, number]
): { width: number; height: number }

// Main animation loop - combines all transforms
export function updateLayer(
  layerConfig: LayerConfig,
  time: number,
  deltaTime: number
): LayerTransform

// Combine all module transforms into final result
export function combineTransforms(
  basic: BasicTransform,
  spin: SpinTransform,
  orbit: OrbitalTransform,
  clock: ClockTransform,
  effect: EffectTransform
): FinalTransform

// Initialize animation system
export function initializeAnimationSystem(
  layersConfig: LayerConfig[]
): AnimationSystem
```

**Types to Define**:
```typescript
export interface LayerConfig {
  LayerID: string;
  ImageID: string;
  LayerOrder: number;
  ImageScale: [number, number];
  groups: {
    "Basic Config"?: BasicConfig;
    "Spin Config"?: SpinConfig;
    "Orbital Config"?: OrbitalConfig;
  };
}

export interface LayerTransform {
  x: number;           // Final X position in stage coords
  y: number;           // Final Y position in stage coords
  rotation: number;    // Final rotation in degrees
  scaleX: number;      // Final X scale multiplier
  scaleY: number;      // Final Y scale multiplier
  opacity: number;     // Final opacity (0-1)
}

export interface FinalTransform extends LayerTransform {
  layerID: string;
  imagePath: string;
  zIndex: number;
}
```

**Transform Combination Logic**:
```typescript
// Position: Basic position + Orbital offset
finalX = basicX + orbitOffsetX

// Rotation: Sum all rotations
finalRotation = basicAngle + spinAngle + orbitAngle + clockAngle

// Scale: Multiply all scales
finalScaleX = imageScaleX * effectScaleX
finalScaleY = imageScaleY * effectScaleY

// Opacity: From effects
finalOpacity = effectOpacity
```

**Time Management**:
- Use `requestAnimationFrame` for smooth 60fps
- Track `time` = total elapsed milliseconds
- Track `deltaTime` = milliseconds since last frame
- Pass to all animation modules

---

### 4.2 basic.ts (Static Positioning)

**Responsibility**: Calculate base position and initial rotation (no animation)

**Key Function**:
```typescript
export interface BasicConfig {
  BasicStagePoint: [number, number];
  BasicImagePoint: [number, number];
  BasicImageAngle: number;
}

export interface BasicTransform {
  x: number;
  y: number;
  rotation: number;
}

export function calculateBasicTransform(
  config: BasicConfig,
  imageWidth: number,
  imageHeight: number
): BasicTransform
```

**Calculation Logic**:
```typescript
// Convert image point percentage to pixels
anchorX = imageWidth * (BasicImagePoint[0] / 100)
anchorY = imageHeight * (BasicImagePoint[1] / 100)

// Position = stage point - anchor offset
x = BasicStagePoint[0] - anchorX
y = BasicStagePoint[1] - anchorY

// Rotation
rotation = BasicImageAngle
```

**Example**:
- Image: 200×200 pixels
- BasicStagePoint: [1024, 1024] (center of stage)
- BasicImagePoint: [50, 50] (center of image)
- Result: x = 1024 - 100 = 924, y = 1024 - 100 = 924
- Image center is now at stage center

---

### 4.3 spin.ts (Self-Rotation)

**Responsibility**: Calculate rotation around image's own axis (animated)

**Key Function**:
```typescript
export interface SpinConfig {
  spinStagePoint: [number, number];
  spinImagePoint: [number, number];
  spinSpeed: number;
  spinDirection: "cw" | "ccw";
}

export interface SpinTransform {
  x: number;        // Pivot offset X
  y: number;        // Pivot offset Y
  rotation: number; // Current spin angle
}

export function calculateSpinTransform(
  config: SpinConfig,
  time: number,
  imageWidth: number,
  imageHeight: number
): SpinTransform
```

**Calculation Logic**:
```typescript
// Direction multiplier
directionMultiplier = (spinDirection === "cw") ? 1 : -1

// Spin angle (accumulates over time)
spinAngle = (spinSpeed * directionMultiplier * time / 1000) % 360

// Pivot offset (if spin pivot != basic anchor)
spinPivotX = imageWidth * (spinImagePoint[0] / 100)
spinPivotY = imageHeight * (spinImagePoint[1] / 100)

// Return transform
return {
  x: spinStagePoint[0] - spinPivotX,
  y: spinStagePoint[1] - spinPivotY,
  rotation: spinAngle
}
```

**Notes**:
- `time` is in milliseconds
- Divide by 1000 to convert to seconds
- Modulo 360 to keep angle in range
- Positive rotation = clockwise

---

### 4.4 orbit.ts (Circular Motion)

**Responsibility**: Calculate position moving in circle around center point (animated)

**Key Function**:
```typescript
export interface OrbitalConfig {
  orbitStagePoint: [number, number];
  orbitLinePoint: [number, number];
  orbitImagePoint: [number, number];
  orbitLine: boolean;
  orbitOrient: boolean;
  orbitSpeed: number;
  orbitDirection: "cw" | "ccw";
}

export interface OrbitalTransform {
  x: number;           // Orbital position offset X
  y: number;           // Orbital position offset Y
  rotation: number;    // Orient-to-path rotation
  radius: number;      // Orbit radius (for visualization)
  centerX: number;     // Orbit center X
  centerY: number;     // Orbit center Y
  angle: number;       // Current orbital angle
}

export function calculateOrbitalTransform(
  config: OrbitalConfig,
  time: number,
  imageWidth: number,
  imageHeight: number
): OrbitalTransform
```

**Calculation Logic**:
```typescript
// 1. Calculate orbit radius
centerX = orbitStagePoint[0]
centerY = orbitStagePoint[1]
radius = distance(orbitStagePoint, orbitLinePoint)
       = sqrt((orbitLinePoint[0] - centerX)² + (orbitLinePoint[1] - centerY)²)

// 2. Calculate current orbital angle
directionMultiplier = (orbitDirection === "cw") ? 1 : -1
orbitAngle = (orbitSpeed * directionMultiplier * time / 1000) % 360

// 3. Convert angle to radians for trig functions
angleRad = orbitAngle * (Math.PI / 180)

// 4. Calculate position on circle
orbitX = centerX + radius * Math.cos(angleRad)
orbitY = centerY + radius * Math.sin(angleRad)

// 5. Apply image anchor offset
anchorX = imageWidth * (orbitImagePoint[0] / 100)
anchorY = imageHeight * (orbitImagePoint[1] / 100)

x = orbitX - anchorX
y = orbitY - anchorY

// 6. Calculate orient-to-path rotation
orientRotation = orbitOrient ? (orbitAngle + 90) : 0

// 7. Return transform
return {
  x,
  y,
  rotation: orientRotation,
  radius,
  centerX,
  centerY,
  angle: orbitAngle
}
```

**Important Notes**:
- **Coordinate System**: In standard math, 0° is right, 90° is up
- **Canvas/Screen**: 0° is right, 90° is DOWN (Y-axis inverted)
- **Orient rotation**: Add 90° so image "points forward" along path
- If `orbitSpeed = 0`, image doesn't orbit (static on circle)
- If radius = 0, image stays at center

---

### 4.5 clock.ts (Time-Based Animations)

**Responsibility**: Calculate transformations based on real-world time (hour/minute hands)

**Key Function**:
```typescript
export interface ClockConfig {
  clockMode: "hour" | "minute" | "second";
  clockScale: number; // Speed multiplier (1 = real time)
}

export interface ClockTransform {
  rotation: number; // Clock hand rotation
}

export function calculateClockTransform(
  config: ClockConfig,
  realTime: Date
): ClockTransform
```

**Calculation Logic**:
```typescript
// Get current time components
hours = realTime.getHours() % 12
minutes = realTime.getMinutes()
seconds = realTime.getSeconds()

// Calculate rotation based on mode
if (clockMode === "hour") {
  rotation = (hours * 30) + (minutes * 0.5) // 30° per hour, 0.5° per minute
} else if (clockMode === "minute") {
  rotation = (minutes * 6) + (seconds * 0.1) // 6° per minute, 0.1° per second
} else if (clockMode === "second") {
  rotation = seconds * 6 // 6° per second
}

rotation *= clockScale

return { rotation }
```

**Notes**:
- 12-hour clock: 360° / 12 hours = 30° per hour
- 60 minutes: 360° / 60 = 6° per minute
- Hour hand also moves with minutes
- `clockScale` can speed up/slow down animation

---

### 4.6 effect.ts (Visual Effects)

**Responsibility**: Calculate visual properties like opacity, scale pulsing, glow

**Key Function**:
```typescript
export interface EffectConfig {
  fadeIn?: { duration: number }; // Fade in over duration (ms)
  pulse?: { speed: number; min: number; max: number }; // Scale pulsing
  opacity?: number; // Fixed opacity override
}

export interface EffectTransform {
  opacity: number;
  scaleX: number;
  scaleY: number;
}

export function calculateEffectTransform(
  config: EffectConfig,
  time: number
): EffectTransform
```

**Calculation Logic**:
```typescript
let opacity = 1.0
let scaleX = 1.0
let scaleY = 1.0

// Fade in effect
if (config.fadeIn) {
  opacity = Math.min(time / config.fadeIn.duration, 1.0)
}

// Pulse effect (sine wave)
if (config.pulse) {
  const phase = (time / 1000) * config.pulse.speed
  const sine = Math.sin(phase * Math.PI * 2)
  const normalized = (sine + 1) / 2 // Convert -1..1 to 0..1
  const scale = config.pulse.min + (normalized * (config.pulse.max - config.pulse.min))
  scaleX = scale
  scaleY = scale
}

// Fixed opacity override
if (config.opacity !== undefined) {
  opacity = config.opacity
}

return { opacity, scaleX, scaleY }
```

---

## 5. Integration with StageSystem

### Importing StageSystem
```typescript
import {
  STAGE_SIZE,
  createStageTransformer,
} from "@shared/stage/StageSystem";
```

### Usage in testscreen.tsx
```typescript
useEffect(() => {
  const stageElement = canvasRef.current;
  const container = containerRef.current;
  
  if (!stageElement || !container) return;
  
  // Auto-scaling setup
  const cleanup = createStageTransformer(stageElement, container);
  
  return cleanup; // Remove listeners on unmount
}, []);
```

### What StageSystem Provides
- `STAGE_SIZE` = 2048 (the fixed stage size)
- `createStageTransformer()` = Auto-scales stage to viewport
- Handles window resize automatically
- Centers stage using CSS transforms

### What You Don't Need to Do
- Don't calculate viewport sizes
- Don't handle window resize
- Don't convert to screen pixels
- Just work in 2048×2048 space

---

## 6. ImageRegistry Integration

### Location
`/app/shared/config/ImageRegistry.json`

### Format
```json
[
  {
    "id": "STARBG",
    "path": "shared/asset/STARBG.png"
  }
]
```

### Usage in core.ts
```typescript
import imageRegistry from "@shared/config/ImageRegistry.json";

export function getImagePath(imageID: string): string | null {
  const entry = imageRegistry.find(img => img.id === imageID);
  return entry ? entry.path : null;
}

export function loadImage(imageID: string): Promise<HTMLImageElement> {
  const path = getImagePath(imageID);
  if (!path) {
    return Promise.reject(new Error(`Image not found: ${imageID}`));
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `/${path}`; // Leading slash for absolute path
  });
}
```

---

## 7. Rendering Flow

### Complete Flow
```
1. testscreen.tsx mounts
   ↓
2. Load test.json configuration
   ↓
3. Initialize core.ts animation system
   - Load all images from ImageRegistry
   - Sort layers by LayerOrder
   - Setup animation loop
   ↓
4. Animation loop (requestAnimationFrame):
   - Update time and deltaTime
   - For each layer:
     a. basic.ts → base position & rotation
     b. spin.ts → spin rotation
     c. orbit.ts → orbital position & rotation
     d. clock.ts → time-based rotation
     e. effect.ts → opacity & scale effects
     f. core.ts → combine all transforms
   ↓
5. Render to canvas/DOM:
   - Apply LayerOrder (z-index)
   - Draw at calculated position
   - Apply rotation transform
   - Apply scale
   - Apply opacity
   ↓
6. StageSystem handles viewport scaling automatically
```

### testscreen.tsx Structure
```typescript
export default function TestScreen(props: TestScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationSystem, setAnimationSystem] = useState(null);
  
  // Load config and initialize
  useEffect(() => {
    const loadConfig = async () => {
      const config = await import("./test.json");
      const system = await initializeAnimationSystem(config.default);
      setAnimationSystem(system);
    };
    loadConfig();
  }, []);
  
  // Setup stage transformer
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    return createStageTransformer(canvasRef.current, containerRef.current);
  }, []);
  
  // Animation loop
  useEffect(() => {
    if (!animationSystem || !canvasRef.current) return;
    
    let animationId: number;
    let lastTime = 0;
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Update and render all layers
      updateAndRender(animationSystem, currentTime, deltaTime, canvasRef.current);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [animationSystem]);
  
  return (
    <div ref={containerRef} className="relative overflow-hidden w-screen h-screen bg-slate-950">
      <canvas
        ref={canvasRef}
        width={STAGE_SIZE}
        height={STAGE_SIZE}
        className="absolute"
      />
      {props.onBack && (
        <button onClick={props.onBack} className="absolute right-6 top-6 z-50">
          Back
        </button>
      )}
    </div>
  );
}
```

---

## 8. Canvas Rendering Example

### Rendering a Single Layer
```typescript
function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: LayerData,
  transform: FinalTransform,
  image: HTMLImageElement
) {
  ctx.save();
  
  // Apply opacity
  ctx.globalAlpha = transform.opacity;
  
  // Move to position
  ctx.translate(transform.x, transform.y);
  
  // Apply rotation (around anchor point)
  const anchorX = image.width * 0.5; // Assuming center anchor
  const anchorY = image.height * 0.5;
  ctx.translate(anchorX, anchorY);
  ctx.rotate(transform.rotation * Math.PI / 180);
  ctx.translate(-anchorX, -anchorY);
  
  // Apply scale
  ctx.scale(transform.scaleX, transform.scaleY);
  
  // Draw image
  ctx.drawImage(image, 0, 0);
  
  ctx.restore();
}
```

### Rendering All Layers
```typescript
function renderAllLayers(
  ctx: CanvasRenderingContext2D,
  layers: LayerData[],
  time: number,
  deltaTime: number
) {
  // Clear canvas
  ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);
  
  // Sort by LayerOrder (lower first = back)
  const sorted = [...layers].sort((a, b) => a.layerOrder - b.layerOrder);
  
  // Render each layer
  for (const layer of sorted) {
    const transform = updateLayer(layer.config, time, deltaTime);
    renderLayer(ctx, layer, transform, layer.image);
  }
}
```

---

## 9. Edge Cases and Validation

### Config Validation
```typescript
// Check if config group exists
if (!config.groups["Basic Config"]) {
  // Use default values
  basicConfig = {
    BasicStagePoint: [1024, 1024],
    BasicImagePoint: [50, 50],
    BasicImageAngle: 0
  };
}

// Validate ranges
if (spinSpeed < 0) {
  console.warn("spinSpeed should be positive, use spinDirection instead");
  spinSpeed = Math.abs(spinSpeed);
}

// Handle missing image
if (!imageFound) {
  console.error(`Image not found: ${imageID}`);
  // Skip rendering or use placeholder
}
```

### Math Edge Cases
```typescript
// Prevent division by zero
if (radius === 0) {
  // No orbit, stay at center
  return { x: centerX, y: centerY, rotation: 0 };
}

// Keep angles in range
angle = angle % 360;
if (angle < 0) angle += 360;

// Handle NaN/Infinity
if (!isFinite(x) || !isFinite(y)) {
  console.error("Invalid position calculated");
  return defaultTransform;
}
```

---

## 10. Step-by-Step Implementation Order

### Phase 1: Foundation
1. **core.ts**
   - Import ImageRegistry.json
   - Implement `getImagePath()`
   - Implement `loadImage()`
   - Define all TypeScript interfaces

2. **Test core.ts**
   - Load test.json
   - Verify image paths resolve correctly
   - Console.log layer configs

### Phase 2: Basic Module
3. **basic.ts**
   - Implement `calculateBasicTransform()`
   - Test with sample config
   - Verify position calculations

4. **Integrate basic.ts in core.ts**
   - Call basic.ts from core
   - Render static images to canvas
   - Verify positions on stage

### Phase 3: Spin Module
5. **spin.ts**
   - Implement `calculateSpinTransform()`
   - Test rotation math
   - Verify clockwise/counterclockwise

6. **Integrate spin.ts**
   - Add spin to animation loop
   - Combine basic + spin transforms
   - Test rotation animation

### Phase 4: Orbit Module
7. **orbit.ts**
   - Implement radius calculation
   - Implement circular motion math
   - Implement orient-to-path
   - Add orbit visualization (optional)

8. **Integrate orbit.ts**
   - Add orbit to animation loop
   - Combine basic + spin + orbit
   - Test circular motion

### Phase 5: Additional Modules
9. **clock.ts**
   - Implement time-based rotation
   - Test with real Date/Time

10. **effect.ts**
    - Implement fade/pulse effects
    - Test opacity and scale

### Phase 6: Final Integration
11. **testscreen.tsx**
    - Setup canvas rendering
    - Integrate StageSystem
    - Create animation loop
    - Handle component lifecycle

12. **Testing & Polish**
    - Test all config combinations
    - Verify performance (60fps)
    - Handle edge cases
    - Add debug visualization

---

## 11. Testing Checklist

### Visual Tests
- [ ] Image loads and displays at correct position
- [ ] Image scales correctly (50%, 100%, 200%)
- [ ] LayerOrder creates correct z-index stacking
- [ ] Center image [1024, 1024] appears at screen center
- [ ] Corner image [0, 0] appears at top-left
- [ ] Image anchor points work correctly (0%, 50%, 100%)

### Animation Tests
- [ ] Spin clockwise rotates correctly
- [ ] Spin counterclockwise rotates correctly
- [ ] Orbit motion is smooth circular path
- [ ] Orbit radius calculated correctly
- [ ] Orient-to-path faces correct direction
- [ ] Combined spin + orbit works correctly
- [ ] Animations run at 60fps

### Responsive Tests
- [ ] Works on desktop (1920×1080)
- [ ] Works on tablet (768×1024)
- [ ] Works on mobile (375×667)
- [ ] Stage scales correctly on window resize
- [ ] Center stays centered on all sizes

### Edge Case Tests
- [ ] Speed = 0 (no animation)
- [ ] Radius = 0 (orbit at center)
- [ ] Missing config groups (use defaults)
- [ ] Invalid ImageID (graceful error)
- [ ] Very large/small images
- [ ] Multiple layers with same LayerOrder

---

## 12. Performance Optimization

### Image Loading
```typescript
// Preload all images before starting animation
const imagePromises = layers.map(layer => loadImage(layer.ImageID));
const images = await Promise.all(imagePromises);
```

### Calculation Caching
```typescript
// Cache static calculations
const anchorX = imageWidth * (anchorPoint[0] / 100); // Calculate once
const anchorY = imageHeight * (anchorPoint[1] / 100);

// Don't recalculate every frame if config doesn't change
```

### Canvas Optimization
```typescript
// Use will-change CSS for hardware acceleration
container.style.willChange = "transform";

// Round positions to avoid sub-pixel rendering
x = Math.round(x);
y = Math.round(y);
```

---

## 13. Debug Visualization

### Orbit Path
```typescript
if (config.orbitLine) {
  ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
}
```

### Anchor Points
```typescript
// Draw red dot at anchor point
ctx.fillStyle = "red";
ctx.fillRect(anchorX - 2, anchorY - 2, 4, 4);
```

### Stage Boundaries
```typescript
// Draw stage border
ctx.strokeStyle = "cyan";
ctx.strokeRect(0, 0, STAGE_SIZE, STAGE_SIZE);
```

---

## 14. Common Mistakes to Avoid

1. **Don't mix stage and screen coordinates** - Always work in stage space (0-2048)
2. **Don't forget to convert degrees to radians** - Use `angle * Math.PI / 180`
3. **Don't mutate config objects** - Treat them as immutable
4. **Don't skip deltaTime** - Use for frame-independent animation
5. **Don't ignore LayerOrder** - Sort before rendering
6. **Don't hardcode stage size** - Use `STAGE_SIZE` constant
7. **Don't forget cleanup** - Remove event listeners on unmount

---

## 15. Example Usage Scenarios

### Static Background
```json
{
  "LayerID": "background",
  "ImageID": "MAINBG",
  "LayerOrder": 0,
  "ImageScale": [100, 100],
  "groups": {
    "Basic Config": {
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 50],
      "BasicImageAngle": 0
    }
  }
}
```

### Spinning Gear
```json
{
  "LayerID": "gear",
  "ImageID": "GEAR1",
  "LayerOrder": 10,
  "ImageScale": [100, 100],
  "groups": {
    "Basic Config": {
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 50],
      "BasicImageAngle": 0
    },
    "Spin Config": {
      "spinStagePoint": [1024, 1024],
      "spinImagePoint": [50, 50],
      "spinSpeed": 30,
      "spinDirection": "cw"
    }
  }
}
```

### Orbiting Moon with Orient
```json
{
  "LayerID": "moon",
  "ImageID": "GEARMOON",
  "LayerOrder": 20,
  "ImageScale": [50, 50],
  "groups": {
    "Basic Config": {
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 50],
      "BasicImageAngle": 0
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitLinePoint": [1024, 624],
      "orbitImagePoint": [50, 50],
      "orbitLine": true,
      "orbitOrient": true,
      "orbitSpeed": 15,
      "orbitDirection": "cw"
    }
  }
}
```

### Clock Hour Hand
```json
{
  "LayerID": "hour-hand",
  "ImageID": "UI_Clock_HourHand",
  "LayerOrder": 30,
  "ImageScale": [100, 100],
  "groups": {
    "Basic Config": {
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 100],
      "BasicImageAngle": 0
    }
  }
}
```

---

## 16. Success Criteria

Your implementation is complete when:

1. ✅ All layers from test.json render correctly
2. ✅ Static images stay in correct positions
3. ✅ Spin animations rotate smoothly
4. ✅ Orbital animations move in perfect circles
5. ✅ Combined spin + orbit works together
6. ✅ Orient-to-path faces correct direction
7. ✅ LayerOrder creates correct stacking
8. ✅ Works on all screen sizes (responsive)
9. ✅ Runs at 60fps without performance issues
10. ✅ Code is modular (each file independent)
11. ✅ No errors in console
12. ✅ Gracefully handles missing/invalid config

---

## 17. Final Notes

- **Modularity is key**: Each .ts file should work independently
- **Stage coordinates only**: Never think about screen pixels in calculation modules
- **Immutable configs**: Never modify the input config objects
- **Performance matters**: Aim for 60fps even with many layers
- **Test incrementally**: Don't implement everything at once
- **Use existing code**: Leverage StageSystem.ts and ImageRegistry.json
- **Document as you go**: Add comments explaining complex math

---

**This document contains everything needed to implement the animation system without additional questions. Good luck!**
