# 🔗 Variant Layer System - File Relationships & Dependencies

## 📊 Architecture Overview
```
LayerProducer.ts (Main Pipeline Entry)
  ├── LayerLogicBasic.ts (Foundation Layer)
  │   ├── Position Management (absolute/fraction)
  │   ├── Scale Management (uniform/xy)
  │   ├── Anchor Resolution (center/top-left/custom)
  │   └── Angle Foundation (manual baseline)
  ├── LayerLogicSpin.ts (Rotation Behavior)
  │   ├── Speed Control (degPerSec/periodSec)
  │   ├── Direction Management (cw/ccw)
  │   └── Time Windowing (delay/duration)
  ├── LayerLogicOrbit.ts (Orbital Motion)
  │   ├── Path Calculation (center/radius/angle)
  │   ├── Orientation Modes (inheritSpin/radial/tangent)
  │   └── Position Override System
  ├── LayerLogicClock.ts (Time-Based Logic)
  │   ├── Timezone Support (IANA zones)
  │   ├── Hand Calculations (hour/min/sec)
  │   └── Spin Integration (imageSpin modes)
  └── LayerLogicEffect.ts (Visual Effects)
      ├── Fade Effects (opacity transitions)
      ├── Pulse Effects (scale breathing)
      ├── Blink Effects (on/off visibility)
      ├── Shake Effects (position jitter)
      └── Wiggle Effects (micro rotations)
```

## 🎯 Core Pipeline Chain

### 1. **LayerProducer.ts** (Orchestration Hub)
```typescript
export function produceFrame(input: ProduceInput): ProduceOutput {
  // 1) Basic foundational state
  // 2) Spin angle calculation
  // 3) Orbit position + orientation suggestions
  // 4) Clock angle with spin inheritance
  // 5) Final angle resolution (priority system)
  // 6) Effect application (post-processing)
}
```

**Key Exports:**
- `produceFrame()` - Main pipeline function
- `ProduceInput/ProduceOutput` - Pipeline interfaces
- `Renderable` - Final output format

**Uses:**
- `LayerLogicBasic` - Foundation transforms
- `LayerLogicSpin` - Rotation calculations
- `LayerLogicOrbit` - Orbital motion
- `LayerLogicClock` - Time-based angles
- `LayerLogicEffect` - Visual post-processing

### 2. **LayerLogicBasic.ts** (Foundation Layer)
```typescript
export function computeBasicState(cfg: BasicConfig, canvasSizePx: Vec2): BasicState
export function resolveFinalAngle(baseAngleDeg: number, overrides: {...}): FinalAngleDecision
```

**Core Responsibilities:**
- Position resolution (absolute px vs 0-1 fractions)
- Scale calculation (uniform vs xy-split)
- Anchor point management (center/top-left/custom)
- Base angle establishment (before overrides)
- Visibility and opacity management

**Key Features:**
- **Position Modes**: `"absolute"` (pixel coordinates) vs `"fraction"` (0-1 normalized)
- **Scale Modes**: `"uniform"` (single multiplier) vs `"xy"` (separate x/y scaling)
- **Anchor System**: `"center"`, `"top-left"`, or `"custom"` with 0-1 coordinates

**Used by:**
- `LayerProducer` - Foundation for all processing
- All other logic modules for base transform data

### 3. **LayerLogicSpin.ts** (Rotation System)
```typescript
export function computeSpinState(cfg: SpinConfig): SpinState
export function getSpinAngleDeg(cfg: SpinConfig): number | null
```

**Core Features:**
- **Speed Control**: `speedDegPerSec` (direct) or `periodSec` (period-based)
- **Direction**: `"cw"` (clockwise) or `"ccw"` (counter-clockwise)  
- **Time Windows**: `startDelayMs` and `durationMs` for gated motion
- **Angle Convention**: 0-360°, up = 90°, clockwise positive

**Integration Points:**
- **Manual Override**: When spin active → manual angle ignored
- **Clock Inheritance**: Clock can use spin angle via `imageSpin: "true"`
- **Orbit Orientation**: Orbit can inherit spin for orientation

**Used by:**
- `LayerProducer` - Angle override in pipeline
- `LayerLogicClock` - Inheritance via `inheritSpinDeg`
- `LayerLogicOrbit` - Orientation inheritance

### 4. **LayerLogicOrbit.ts** (Orbital Motion System)
```typescript
export function computeOrbitState(cfg: OrbitConfig, basePositionPx: Vec2): OrbitState
export function getOrbitOrientationDeg(cfg: OrbitConfig, basePositionPx: Vec2): number | null
```

**Motion Mechanics:**
- **Center**: User-defined or auto-inferred from base position
- **Radius**: Explicit or calculated from center-to-position distance
- **Path**: Circular orbital motion with configurable speed
- **Direction**: Independent CW/CCW rotation

**Orientation Modes:**
- `"inheritSpin"`: Follow spin angle (fallback to radial-out if no spin)
- `"radial-out"`: Face away from center (default orbital behavior)
- `"radial-in"`: Face toward center  
- `"tangent"`: Face along orbital path direction

**Position Override:**
- Orbit **replaces** basic position with calculated orbital coordinates
- Provides orientation **suggestions** for final angle resolution

**Used by:**
- `LayerProducer` - Position override and orientation input

### 5. **LayerLogicClock.ts** (Time-Based System)
```typescript
export function computeClockState(cfg: ClockConfig): ClockState
export function getClockDrivenImageAngle(cfg: ClockConfig): number | null
```

**Time Management:**
- **Timezone Support**: Full IANA timezone handling via `Intl.DateTimeFormat`
- **Tick Modes**: `"smooth"` (continuous) vs `"tick"` (discrete seconds)
- **Time Format**: 12/24 hour (for display, not angle calculation)

**Image Spin Integration:**
- `"none"`: No clock-driven rotation
- `"true"`: Inherit external spin angle
- `"sec"/"min"/"hour"`: Bind to specific clock hand

**Angle Priority:**
- Clock angles can **override** both spin and manual angles
- Integrates with spin system via inheritance modes

**Used by:**
- `LayerProducer` - High-priority angle override

### 6. **LayerLogicEffect.ts** (Visual Post-Processing)
```typescript
export function computeEffectState(cfg: EffectConfig): EffectState
export function applyEffectToRenderable(input: {...}, eff: EffectState): {...}
```

**Effect Types:**
- **Fade**: Opacity transitions with easing curves
- **Pulse**: Scale and opacity breathing (waveform-based)
- **Blink**: Hard on/off opacity switching
- **Shake**: Random position jitter with controlled frequency
- **Wiggle**: Sinusoidal micro-rotations and position

**Processing Model:**
- **Accumulative**: Multiple effects combine via mix parameters
- **Post-Transform**: Applied after all other logic modules
- **Non-Override**: Effects modify but don't replace core values

**Angle Handling:**
- `allowAngleNudge: false` (default): No angle modifications
- `allowAngleNudge: true`: Small angle additions permitted

**Used by:**
- `LayerProducer` - Final post-processing step

## 🔄 Data Flow & Priority System

### Pipeline Execution Order
```
1. BasicState ← computeBasicState(basicConfig)
   ↓ (foundation: position, scale, base angle)
2. SpinAngle ← getSpinAngleDeg(spinConfig)  
   ↓ (rotation override: null | number)
3. OrbitState ← computeOrbitState(orbitConfig, basicPosition, spinAngle)
   ↓ (position override + orientation suggestion)
4. ClockAngle ← getClockDrivenImageAngle(clockConfig, inheritSpinDeg)
   ↓ (time-based angle override)
5. FinalAngle ← resolveFinalAngle(baseAngle, {clockAngle, spinAngle})
   ↓ (priority resolution: Clock > Spin > Manual)
6. EffectState ← computeEffectState(effectConfig)
   ↓ (visual modifications: opacity, scale, position, micro-angle)
7. Renderable ← applyEffectToRenderable(combinedState, effects)
   ↓ (final output for renderer)
```

### Angle Priority Resolution
```
Priority Order: CLOCK > SPIN > MANUAL > ORBIT_SUGGESTION

Final Angle Decision Logic:
if (clockAngle !== null)     → use Clock angle
else if (spinAngle !== null) → use Spin angle  
else if (orbitSuggestion)    → use Orbit orientation
else                         → use Manual base angle
```

### Position Override System
```
Position Flow:
Basic Position → Orbit Override → Effect Nudges → Final Position

- Basic: Calculates initial position (absolute/fraction)
- Orbit: Completely replaces with orbital coordinates (when enabled)
- Effects: Add small position modifications (shake/wiggle)
```

## 🎨 Configuration Integration

### JSON Configuration Structure
```json
{
  "canvasSizePx": { "x": 512, "y": 512 },
  "basic": { "position": {...}, "scale": {...}, "angle": 90 },
  "spin": { "enable": true, "speedDegPerSec": 60 },
  "orbit": { "enable": true, "center": {...}, "radius": 120 },
  "clock": { "enable": true, "imageSpin": "sec" },
  "effect": { "enable": true, "units": [...] }
}
```

### Cross-Module Configuration Dependencies
- **Spin → Clock**: `imageSpin: "true"` requires active spin config
- **Spin → Orbit**: `orientationMode: "inheritSpin"` uses spin angle
- **Basic → Orbit**: Base position used for auto-inference of center/radius
- **Canvas → Basic**: Fraction positions require canvas dimensions

## 🧩 Type System Integration

### Shared Types & Interfaces
```typescript
// Common across all modules
export type Vec2 = { x: number; y: number };
export type Direction = "cw" | "ccw";

// Cross-module interfaces  
interface ProduceInput {
  canvasSizePx: Vec2;
  basic: BasicConfig;
  spin: SpinConfig; 
  orbit: OrbitConfig;
  clock: ClockConfig;
  effect: EffectConfig;
}
```

### Module-Specific Exports
- **Basic**: `BasicConfig`, `BasicState`, `FinalAngleDecision`
- **Spin**: `SpinConfig`, `SpinState`, directional types
- **Orbit**: `OrbitConfig`, `OrbitState`, orientation modes
- **Clock**: `ClockConfig`, `ClockState`, time-related types
- **Effect**: `EffectConfig`, `EffectState`, effect unit types

## 💡 Extension & Modification Points

### To Add New Behaviors:
1. **Create** `LayerLogic[Name].ts` following existing patterns
2. **Export** computation functions and config interfaces
3. **Integrate** in `LayerProducer.ts` pipeline
4. **Add** to `ProduceInput` interface if needed

### To Modify Priority System:
- **Edit** `resolveFinalAngle()` in `LayerLogicBasic.ts`
- **Update** priority logic in `LayerProducer.ts`
- **Maintain** angle convention (0-360°, up=90°)

### To Extend Effect System:
- **Add** new effect types in `LayerLogicEffect.ts`
- **Implement** in effect dispatcher
- **Update** `EffectUnit` union type

## 🔧 Pure Function Architecture

**Key Design Principles:**
- ✅ **No Side Effects**: All functions are pure, deterministic
- ✅ **Time Injection**: Current time passed as parameter, not read internally
- ✅ **Immutable Inputs**: Configuration objects never modified
- ✅ **Composable**: Each module can be used independently
- ✅ **Type Safe**: Full TypeScript interfaces and validation

**Benefits:**
- Easy testing and debugging
- Predictable behavior across environments  
- Simple integration with any renderer
- Clear separation of concerns
- Time-travel debugging capability

This architecture represents a **professional-grade layer processing system** with clean module boundaries, predictable data flow, and extensive configurability for complex interactive graphics applications.