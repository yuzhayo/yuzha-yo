# 🎯 Variant Layer System - Complete Technical Analysis

## 📐 Pure Functional Architecture Foundation

### 1. Design Philosophy
```typescript
// Pure Functions - No Side Effects
export function computeBasicState(cfg: BasicConfig, canvasSizePx: Vec2): BasicState
export function getSpinAngleDeg(cfg: SpinConfig, options?: { nowMs?: number }): number | null
export function computeOrbitState(cfg: OrbitConfig, basePositionPx: Vec2): OrbitState
```

**Why Pure Functions?**
- **Deterministic**: Same inputs always produce same outputs
- **Testable**: Easy to unit test and debug
- **Composable**: Can be combined in any order
- **Time-Travel**: Supports replay and debugging
- **Renderer Agnostic**: Works with any graphics system

### 2. Coordinate System Mathematical Foundation
```typescript
// Universal angle convention: 0-360°, up=90°, clockwise positive
export function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

// Screen coordinate conversion (Y-axis downward)
function polarToScreen(center: Vec2, radius: number, angleDegCW: number): Vec2 {
  const th = (angleDegCW * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(th),
    y: center.y - radius * Math.sin(th), // minus for screen coordinates
  };
}
```

**Coordinate Conventions:**
- **Origin**: 0° = Right (East), 90° = Up (North)
- **Direction**: Clockwise rotation = positive degrees
- **Range**: Always normalized to 0-360°
- **Screen Mapping**: Y-axis inverted for screen coordinates

## 🏗️ Pipeline Architecture Deep Dive

### 1. Sequential Processing Chain
```typescript
export function produceFrame(input: ProduceInput): ProduceOutput {
  // 1) Foundation: Basic transforms
  const basic = computeBasicState(input.basic, input.canvasSizePx);
  
  // 2) Behavioral: Spin angle calculation  
  const spinAngle = getSpinAngleDeg(input.spin);
  
  // 3) Spatial: Orbit position + orientation suggestions
  const orbit = computeOrbitState(input.orbit, basic.positionPx, { spinAngleDeg: spinAngle });
  
  // 4) Temporal: Clock angle with spin inheritance
  const clockAngle = getClockDrivenImageAngle(input.clock, { inheritSpinDeg: spinAngle });
  
  // 5) Priority: Final angle resolution
  const finalAngle = resolveFinalAngle(basic.baseAngleDeg, {
    clockAngleDeg: clockAngle ?? orbit.orientationDeg,
    spinAngleDeg: spinAngle,
  });
  
  // 6) Post-processing: Visual effects
  const effects = computeEffectState(input.effect);
  const rendered = applyEffectToRenderable({...}, effects, allowAngleNudge);
  
  return { renderable: rendered, meta: {...} };
}
```

### 2. Priority Resolution System
```typescript
// Angle Override Hierarchy: CLOCK > SPIN > MANUAL > ORBIT_SUGGESTION
export function resolveFinalAngle(
  baseAngleDeg: number,
  overrides: {
    clockAngleDeg?: number | null;
    spinAngleDeg?: number | null;
  }
): FinalAngleDecision {
  // Highest Priority: Clock overrides everything
  if (typeof overrides.clockAngleDeg === "number") {
    return { angleDeg: normalize360(overrides.clockAngleDeg), source: "clock" };
  }
  
  // Medium Priority: Spin overrides manual
  if (typeof overrides.spinAngleDeg === "number") {
    return { angleDeg: normalize360(overrides.spinAngleDeg), source: "spin" };
  }
  
  // Lowest Priority: Manual/default angle
  return { angleDeg: normalize360(baseAngleDeg), source: "manual" };
}
```

**Why This Priority System?**
- **Clock**: Time-based behavior is most specific/intentional
- **Spin**: Active rotation behavior overrides static positioning  
- **Manual**: Fallback when no active behaviors
- **Orbit**: Provides suggestions but doesn't force override

## 🎯 Foundation Layer System (LayerLogicBasic)

### 1. Multi-Mode Position Resolution
```typescript
export function resolvePositionPx(cfg: BasicConfig, canvasSizePx: Vec2): Vec2 {
  const mode = cfg.positionMode ?? "absolute";
  const p = cfg.position;
  
  if (mode === "fraction") {
    // 0-1 normalized coordinates → pixel coordinates
    return {
      x: p.x * canvasSizePx.x,  // 0.5 → center horizontally
      y: p.y * canvasSizePx.y,  // 0.5 → center vertically
    };
  }
  
  // Direct pixel coordinates
  return p;
}
```

**Position Mode Benefits:**
- **Fraction Mode**: Resolution-independent layouts (responsive design)
- **Absolute Mode**: Pixel-perfect positioning
- **Designer Friendly**: Familiar 0-1 coordinate system
- **Canvas Adaptive**: Automatically scales to any canvas size

### 2. Flexible Scale Management
```typescript
export function resolveScale(cfg: BasicConfig): Vec2 {
  const mode = cfg.scaleMode ?? "uniform";
  
  if (mode === "xy") {
    // Independent X/Y scaling for aspect ratio control
    const s = cfg.scaleXY ?? { x: 1, y: 1 };
    return { x: s.x, y: s.y };
  }
  
  // Uniform scaling maintains aspect ratio
  const k = cfg.scaleUniform ?? 1;
  return { x: k, y: k };
}
```

**Scale Mode Applications:**
- **Uniform**: Proportional scaling (maintain aspect ratio)
- **XY Split**: Independent control (stretch/squash effects)
- **UI Elements**: Responsive button/icon sizing
- **Aspect Correction**: Adapt to different screen ratios

### 3. Advanced Anchor System
```typescript
export function resolveAnchor01(cfg: BasicConfig): Vec2 {
  const mode = cfg.anchorMode ?? "center";
  
  switch (mode) {
    case "top-left":
      return { x: 0, y: 0 };           // Standard UI positioning
    case "custom":
      const a = cfg.anchorCustom ?? { x: 0.5, y: 0.5 };
      return { x: clamp01(a.x), y: clamp01(a.y) };  // User-defined pivot
    default:
      return { x: 0.5, y: 0.5 };       // Center pivot (default)
  }
}
```

**Anchor Applications:**
- **Center**: Balanced rotation and scaling
- **Top-Left**: UI element alignment
- **Custom**: Specialized pivot points (e.g., clock hands from base)

## 🔄 Rotation System (LayerLogicSpin)

### 1. Time-Based Angular Velocity
```typescript
export function computeSpinState(cfg: SpinConfig): SpinState {
  const speed = resolveSpeedDps(cfg) * signForDir(cfg.direction);
  const delay = cfg.startDelayMs ?? 0;
  const elapsed = Math.max(0, nowMs - epoch - delay);
  
  if (!isWithinActiveWindow(cfg, nowMs, epoch)) {
    return { active: false, angleDeg: null, ... };
  }
  
  const raw = speed * (elapsed / 1000);  // Convert ms to seconds
  const withOffset = raw + (cfg.offsetDeg ?? 0);
  const angleDeg = normalize360(withOffset);
  
  return { active: true, angleDeg, angularVelocityDps: speed, ... };
}
```

**Speed Control Methods:**
```typescript
function resolveSpeedDps(cfg: SpinConfig): number {
  // Priority 1: Direct speed specification
  if (typeof cfg.speedDegPerSec === "number") {
    return cfg.speedDegPerSec;
  }
  
  // Priority 2: Period-based calculation  
  if (typeof cfg.periodSec === "number" && cfg.periodSec > 0) {
    return 360 / cfg.periodSec;  // Full rotation per period
  }
  
  return 0; // Stationary
}
```

### 2. Windowed Motion Control
```typescript
function isWithinActiveWindow(cfg: SpinConfig, nowMs: number, epochMs: number): boolean {
  const delay = cfg.startDelayMs ?? 0;
  const duration = cfg.durationMs ?? Number.POSITIVE_INFINITY;
  const elapsed = nowMs - epochMs;
  
  if (elapsed < delay) return false;           // Not started yet
  return elapsed < (delay + duration);         // Within active window
}
```

**Practical Applications:**
- **Delayed Start**: `startDelayMs` for sequenced animations
- **Limited Duration**: `durationMs` for timed behaviors  
- **Continuous Motion**: Infinite duration for persistent rotation
- **Complex Timing**: Combine multiple spin configs for phases

### 3. Direction and Offset System
```typescript
function signForDir(dir?: SpinDirection): 1 | -1 {
  return dir === "ccw" ? -1 : 1;  // CCW = negative, CW = positive
}

// Final angle calculation with offset
const finalAngle = normalize360(
  (speed * timeElapsed) +     // Time-based rotation
  (cfg.offsetDeg ?? 0)        // Static angular offset
);
```

## 🌍 Orbital Motion System (LayerLogicOrbit)

### 1. Auto-Inference Mathematics
```typescript
export function computeOrbitState(cfg: OrbitConfig, basePositionPx: Vec2): OrbitState {
  // Smart defaults based on current position
  const center: Vec2 = cfg.orbitCenter ?? basePositionPx;
  
  const radiusPx = typeof cfg.radiusPx === "number" 
    ? cfg.radiusPx
    : euclideanDistance(center, basePositionPx);  // Auto-calculate radius
  
  const startAngleDeg = typeof cfg.startAngleDeg === "number"
    ? cfg.startAngleDeg  
    : screenVectorToAngleCW(center, basePositionPx);  // Auto-calculate start angle
}
```

**Auto-Inference Benefits:**
- **Designer Friendly**: Place object visually, system calculates path
- **Rapid Prototyping**: Minimal configuration required
- **Consistent Behavior**: Predictable orbital motion from any starting position

### 2. Coordinate Conversion System
```typescript
// Screen coordinates (Y down) → Angle (CW positive, up=90°)
function screenVecToAngleCW(center: Vec2, point: Vec2): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const mathAngle = Math.atan2(dy, dx);        // Standard math (CCW, right=0)
  const cwAngle = -mathAngle;                  // Convert to CW system
  return normalize360((cwAngle * 180) / Math.PI);
}

// Angle (CW positive, up=90°) → Screen coordinates (Y down)  
function polarToScreen(center: Vec2, radius: number, angleDegCW: number): Vec2 {
  const radians = (angleDegCW * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(radians),
    y: center.y - radius * Math.sin(radians),    // Negative for screen Y
  };
}
```

### 3. Orientation Mode System
```typescript
export function resolveImageOrientation(
  cfg: OrbitConfig,
  orbitAngleDeg: number,
  spinAngleDeg?: number | null
): { orientationDeg: number | null; source: string } {
  
  switch (cfg.orientationMode ?? "inheritSpin") {
    case "inheritSpin":
      // Use spin if available, fallback to radial
      return typeof spinAngleDeg === "number"
        ? { orientationDeg: spinAngleDeg, source: "spin" }
        : { orientationDeg: orbitAngleDeg, source: "radial" };
        
    case "radial-out":
      // Face away from center (natural orbital orientation)
      return { orientationDeg: orbitAngleDeg, source: "radial" };
      
    case "radial-in":  
      // Face toward center (reverse orientation)
      return { orientationDeg: normalize360(orbitAngleDeg + 180), source: "radial" };
      
    case "tangent":
      // Face along path direction (perpendicular to radial)
      const dirSign = cfg.direction === "ccw" ? -1 : 1;
      const tangentAngle = normalize360(orbitAngleDeg - (90 * dirSign));
      return { orientationDeg: tangentAngle, source: "tangent" };
  }
}
```

**Orientation Applications:**
- **inheritSpin**: Character movement (spin controls facing, orbit controls path)
- **radial-out**: Satellite dishes, solar panels (face away from center)
- **radial-in**: Defensive turrets, spotlights (face toward center)
- **tangent**: Vehicles on track, particles along curve (face forward along path)

## 🕐 Clock Integration System (LayerLogicClock)

### 1. Timezone-Aware Time Calculation
```typescript
function getZonedHMS(now: Date, timeZone?: string): TimeComponents {
  // Use Intl API for accurate timezone handling
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    timeZone: timeZone,
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit",
  });
  
  const parts = formatter.formatToParts(now);
  const getValue = (type: string) => 
    Number(parts.find(p => p.type === type)?.value ?? "0");
  
  return {
    h: getValue("hour"),
    m: getValue("minute"), 
    s: getValue("second"),
    ms: now.getMilliseconds()  // Approximate for smooth motion
  };
}
```

**Timezone Support Benefits:**
- **Global Applications**: Accurate time across regions
- **DST Handling**: Automatic daylight savings transitions  
- **Standard Compliance**: IANA timezone database support
- **Precision**: Millisecond accuracy for smooth animations

### 2. Clock Hand Mathematics
```typescript
export function computeClockAngles(
  time: { h: number; m: number; s: number; ms: number },
  tickMode: TickMode = "smooth"
): ClockAngles {
  
  // Smooth vs discrete second handling
  const secondsFraction = tickMode === "smooth" 
    ? time.s + (time.ms / 1000)    // Continuous motion
    : time.s;                       // Discrete jumps
  
  // Cascading calculations (each hand affects the next)
  const minutesTotal = time.m + (secondsFraction / 60);
  const hoursTotal = (time.h % 12) + (minutesTotal / 60);
  
  // Convert to our angle system (up=90°, CW+)
  return {
    sec:  normalize360(90 + (6 * secondsFraction)),    // 6°/second
    min:  normalize360(90 + (6 * minutesTotal)),       // 6°/minute 
    hour: normalize360(90 + (30 * hoursTotal))         // 30°/hour
  };
}
```

**Angle Calculation Rationale:**
- **Base Offset**: +90° converts "right=0°" to "up=0°" (12 o'clock)
- **Second Hand**: 360°/60s = 6°/second
- **Minute Hand**: 360°/60m = 6°/minute (plus second fraction)
- **Hour Hand**: 360°/12h = 30°/hour (plus minute fraction)

### 3. Spin Integration Modes
```typescript
export function resolveImageOrientation(
  cfg: ClockConfig,
  angles: ClockAngles, 
  inheritSpinDeg?: number | null
): ImageOrientation {
  
  switch (cfg.imageSpin ?? "none") {
    case "none":
      return { deg: null, source: "none" };
      
    case "true":
      // Inherit from external spin system
      return typeof inheritSpinDeg === "number"
        ? { deg: inheritSpinDeg, source: "inherit" }
        : { deg: null, source: "inherit" };
        
    case "sec":  return { deg: angles.sec, source: "sec" };
    case "min":  return { deg: angles.min, source: "min" };  
    case "hour": return { deg: angles.hour, source: "hour" };
  }
}
```

**Integration Strategy:**
- **Clock Priority**: Clock angles can override spin when active
- **Spin Inheritance**: `imageSpin: "true"` uses existing spin behavior
- **Hand Binding**: Direct binding to specific clock hands
- **Fallback Chain**: Graceful degradation when systems unavailable

## ✨ Effect System Architecture (LayerLogicEffect)

### 1. Accumulative Effect Processing
```typescript
export function computeEffectState(cfg: EffectConfig): EffectState {
  const accumulator = initEffectAccumulator();
  
  for (const unit of (cfg.units ?? [])) {
    if (unit.enable === false) continue;
    if (!isWithinTimeWindow(unit, currentTime)) continue;
    
    // Each effect modifies the accumulator
    applyEffectUnit(accumulator, unit, currentTime);
  }
  
  return accumulator;
}
```

**Accumulative Benefits:**
- **Composable**: Multiple effects combine naturally
- **Order Independent**: Multiplicative operations commute
- **Mix Control**: Each effect has blend strength (0-1)
- **Predictable**: Mathematical combination vs complex state machines

### 2. Waveform Mathematics System
```typescript
function generateWaveform(waveType: Waveform, phase: number): number {
  // phase in radians, returns -1 to 1
  switch (waveType) {
    case "sine":
      return Math.sin(phase);
      
    case "triangle":
      // Convert sine-based phase to triangle wave
      const normalized = (phase / Math.PI) % 2;
      const folded = normalized < 0 ? normalized + 2 : normalized;
      return folded < 1 ? (2 * folded - 1) : (1 - 2 * (folded - 1));
      
    case "square":
      return Math.sign(Math.sin(phase)) || 1;
      
    case "saw":
      // Rising sawtooth -1 to 1
      const sawNorm = (phase / (2 * Math.PI)) % 1;
      return 2 * (sawNorm < 0 ? sawNorm + 1 : sawNorm) - 1;
      
    case "noise":
      return (Math.random() * 2) - 1;
  }
}
```

### 3. Effect Type Implementations

#### **Pulse Effect (Scale/Opacity Breathing)**
```typescript
function applyPulse(acc: EffectState, cfg: PulseUnit, timeMs: number) {
  const frequency = cfg.freqHz ?? (1 / (cfg.periodSec ?? 1));
  const phase = 2 * Math.PI * frequency * (timeMs / 1000);
  const waveValue = generateWaveform(cfg.waveform ?? "sine", phase);
  
  // Scale modulation
  const scaleValue = (cfg.scaleCenter ?? 1) + (cfg.scaleAmp ?? 0) * waveValue;
  acc.scaleMul.x *= lerp(1, scaleValue, cfg.mix ?? 1);
  acc.scaleMul.y *= lerp(1, scaleValue, cfg.mix ?? 1);
  
  // Opacity modulation  
  const opacityValue = (cfg.opacityCenter ?? 1) + (cfg.opacityAmp ?? 0) * waveValue;
  acc.opacityMul *= lerp(1, clamp01(opacityValue), cfg.mix ?? 1);
}
```

#### **Shake Effect (Controlled Random Jitter)**
```typescript
function applyShake(acc: EffectState, cfg: ShakeUnit, timeMs: number) {
  const frequency = cfg.freqHz ?? 20;
  const timeBucket = Math.floor(timeMs / (1000 / frequency));
  
  // Deterministic pseudo-random based on time bucket
  const pseudoRandom = (seed: number) => {
    let x = (seed ^ 0x6D2B79F5) >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0xffffffff;  // 0-1 range
  };
  
  const randX = (pseudoRandom(timeBucket) * 2 - 1) * (cfg.posAmp?.x ?? 2);
  const randY = (pseudoRandom(timeBucket + 911) * 2 - 1) * (cfg.posAmp?.y ?? 2);
  
  acc.positionAddPx.x += (cfg.mix ?? 1) * randX;
  acc.positionAddPx.y += (cfg.mix ?? 1) * randY;
}
```

### 4. Effect Combination Mathematics
```typescript
export function applyEffectToRenderable(
  input: RenderableInput,
  effects: EffectState,
  allowAngleNudge: boolean
): RenderableOutput {
  
  // Multiplicative combination (order independent)
  const finalScale = {
    x: input.scale.x * effects.scaleMul.x,
    y: input.scale.y * effects.scaleMul.y,
  };
  
  const finalOpacity = input.opacity * effects.opacityMul;
  
  // Additive combination for position
  const finalPosition = {
    x: input.positionPx.x + effects.positionAddPx.x,
    y: input.positionPx.y + effects.positionAddPx.y,
  };
  
  // Conditional angle modification
  const finalAngle = allowAngleNudge
    ? normalize360(input.finalAngleDeg + effects.angleAddDeg)
    : input.finalAngleDeg;
  
  return { finalPosition, finalScale, finalOpacity, finalAngle };
}
```

## 🎨 Configuration System Deep Dive

### 1. JSON Schema Flexibility
```json
{
  "basic": {
    "positionMode": "fraction",     // "absolute" | "fraction"  
    "position": { "x": 0.5, "y": 0.5 },
    "scaleMode": "uniform",         // "uniform" | "xy"
    "scaleUniform": 1.2,
    "anchorMode": "center"          // "center" | "top-left" | "custom"
  },
  "spin": {
    "speedDegPerSec": 60,          // Direct: degrees per second
    "periodSec": 10,               // Alternative: seconds per full rotation
    "direction": "cw",             // "cw" | "ccw" 
    "startDelayMs": 2000,          // Delayed start
    "durationMs": 5000             // Limited duration
  },
  "orbit": {
    "orbitCenter": { "x": 256, "y": 256 },  // Explicit center
    "radiusPx": 120,                          // Or auto-infer from position
    "orientationMode": "inheritSpin"          // Complex orientation rules
  }
}
```

### 2. Preset System for Rapid Development
```json
{
  "presets": [
    {
      "name": "breathing-icon",
      "effect": {
        "units": [
          { 
            "type": "pulse", 
            "freqHz": 0.8, 
            "scaleAmp": 0.1,
            "waveform": "sine" 
          }
        ]
      }
    },
    {
      "name": "orbital-satellite", 
      "orbit": {
        "speedDegPerSec": 30,
        "orientationMode": "radial-out",
        "direction": "cw"
      }
    }
  ]
}
```

### 3. Type-Safe Configuration Mapping
```typescript
export function fromJson(raw: unknown): AllConfigs {
  // Runtime validation with TypeScript inference
  const parsed = raw as ConfigurationJSON;
  
  return {
    basic: validateBasicConfig(parsed.basic),
    spin: validateSpinConfig(parsed.spin),
    orbit: validateOrbitConfig(parsed.orbit),
    clock: validateClockConfig(parsed.clock), 
    effect: validateEffectConfig(parsed.effect),
  };
}
```

## 🚀 Performance & Optimization Strategies

### 1. Pure Function Memoization
```typescript
// Cache expensive calculations when inputs haven't changed
const memoizedOrbitState = useMemo(() => 
  computeOrbitState(orbitConfig, basePosition, { spinAngleDeg }),
  [orbitConfig, basePosition.x, basePosition.y, spinAngleDeg]
);
```

### 2. Batch Processing Capability
```typescript
// Process multiple layers efficiently
function processLayers(layerConfigs: LayerConfig[]): RenderableLayer[] {
  return layerConfigs.map(config => ({
    id: config.id,
    renderable: produceFrame(config),
    zIndex: config.basic.zIndex ?? 0,
  })).sort((a, b) => a.zIndex - b.zIndex);
}
```

### 3. Time Injection for Consistency
```typescript
// Single time source prevents frame inconsistencies  
const frameTime = performance.now();
const results = layers.map(layer => 
  produceFrame({ ...layer, nowMs: frameTime })
);
```

## 🔧 Integration Patterns

### 1. Renderer-Agnostic Output
```typescript
interface Renderable {
  // Universal properties any renderer can use
  imageUrl: string;
  positionPx: Vec2;           // Screen coordinates
  scale: Vec2;                // X/Y multipliers
  opacity: number;            // 0-1 alpha
  finalAngleDeg: number;      // 0-360° rotation
  anchor01: Vec2;             // 0-1 pivot point
  zIndex: number;             // Depth ordering
  visible: boolean;           // Visibility flag
}
```

### 2. Framework Integration Examples

#### **React Integration**
```typescript
function LayerComponent({ config }: { config: LayerConfig }) {
  const [renderable, setRenderable] = useState<Renderable>();
  
  useAnimationFrame(() => {
    const result = produceFrame(config);
    setRenderable(result.renderable);
  });
  
  return (
    <div 
      style={{
        position: 'absolute',
        left: renderable?.positionPx.x,
        top: renderable?.positionPx.y,
        transform: `rotate(${renderable?.finalAngleDeg}deg) scale(${renderable?.scale.x}, ${renderable?.scale.y})`,
        opacity: renderable?.opacity,
      }}
    />
  );
}
```

#### **Canvas Integration**
```typescript
function renderToCanvas(ctx: CanvasRenderingContext2D, renderable: Renderable) {
  ctx.save();
  ctx.globalAlpha = renderable.opacity;
  ctx.translate(renderable.positionPx.x, renderable.positionPx.y);
  ctx.rotate((renderable.finalAngleDeg * Math.PI) / 180);
  ctx.scale(renderable.scale.x, renderable.scale.y);
  
  // Draw image with anchor offset
  const img = getImageByUrl(renderable.imageUrl);
  const offsetX = -img.width * renderable.anchor01.x;
  const offsetY = -img.height * renderable.anchor01.y;
  ctx.drawImage(img, offsetX, offsetY);
  
  ctx.restore();
}
```

#### **WebGL/Three.js Integration**
```typescript
function updateThreeMesh(mesh: THREE.Mesh, renderable: Renderable) {
  mesh.position.set(
    renderable.positionPx.x - canvasWidth/2,   // Center origin
    -(renderable.positionPx.y - canvasHeight/2), // Flip Y
    0
  );
  mesh.rotation.z = (renderable.finalAngleDeg * Math.PI) / 180;
  mesh.scale.set(renderable.scale.x, renderable.scale.y, 1);
  mesh.material.opacity = renderable.opacity;
  mesh.visible = renderable.visible;
}
```

## 💡 Advanced Usage Patterns

### 1. Dynamic Configuration Updates
```typescript
// Real-time parameter modification
function createLiveLayer(baseConfig: LayerConfig) {
  return {
    setSpinSpeed: (degPerSec: number) => 
      updateConfig(cfg => ({ ...cfg, spin: { ...cfg.spin, speedDegPerSec: degPerSec }})),
    
    setOrbitRadius: (radiusPx: number) =>
      updateConfig(cfg => ({ ...cfg, orbit: { ...cfg.orbit, radiusPx }})),
      
    addEffect: (effect: EffectUnit) =>
      updateConfig(cfg => ({ 
        ...cfg, 
        effect: { 
          ...cfg.effect, 
          units: [...(cfg.effect.units ?? []), effect] 
        }
      })),
  };
}
```

### 2. Multi-Layer Coordination
```typescript
// Synchronized layer behaviors
function createFormation(centerConfig: LayerConfig, satelliteCount: number) {
  const satellites = Array.from({ length: satelliteCount }, (_, i) => ({
    ...centerConfig,
    orbit: {
      enable: true,
      orbitCenter: centerConfig.basic.position,
      radiusPx: 100,
      startAngleDeg: (360 / satelliteCount) * i,  // Evenly distributed
      speedDegPerSec: 30,
      orientationMode: "radial-out" as const,
    },
  }));
  
  return { center: centerConfig, satellites };
}
```

### 3. Interactive Behavior Systems
```typescript
// Mouse/touch interaction integration
function createInteractiveLayer(config: LayerConfig) {
  return {
    onHover: () => addTemporaryEffect(config, {
      type: "pulse",
      scaleAmp: 0.2,
      freqHz: 2,
      durationMs: 1000,
    }),
    
    onClick: () => addTemporaryEffect(config, {
      type: "shake", 
      posAmp: { x: 5, y: 5 },
      freqHz: 30,
      durationMs: 300,
    }),
    
    onDrag: (deltaX: number, deltaY: number) => 
      updatePosition(config, deltaX, deltaY),
  };
}
```

## 🎯 System Advantages & Use Cases

### **Perfect For:**
- **Game UI Systems**: Consistent behavior across devices and renderers
- **Interactive Dashboards**: Complex animations with precise timing
- **Educational Simulations**: Physics-based motion with mathematical precision  
- **Creative Tools**: Composable effects with real-time parameter control
- **Data Visualization**: Coordinated multi-element animations

### **Key Advantages:**
- ✅ **Pure Functions**: Deterministic, testable, composable
- ✅ **Renderer Agnostic**: Works with Canvas, WebGL, DOM, SVG
- ✅ **Time Precise**: Consistent behavior across frame rates
- ✅ **Configuration Driven**: JSON-based setup with TypeScript safety
- ✅ **Performance Optimized**: Minimal allocations, efficient calculations
- ✅ **Extensible**: Clean module boundaries for new behaviors
- ✅ **Professional Grade**: Production-ready architecture and patterns

### **Comparison Advantages:**
- **vs Launcher**: Pure logic (no Pixi.js dependency), flexible canvas sizes
- **vs Upgraded**: Simpler architecture, renderer-independent, pure functions
- **vs Animation Libraries**: Domain-specific optimizations, precise angle control
- **vs Game Engines**: Lightweight, web-optimized, configuration-driven

This system represents a **sophisticated, pure-functional approach** to interactive layer processing that prioritizes mathematical precision, architectural cleanliness, and maximum flexibility for integration with any rendering technology.