# 📚 Variant Layer System - Quick File Reference

## 🎯 **ESSENTIAL FILES** (Core System)

| File | Purpose | Key Exports |
|------|---------|-------------|
| **`LayerProducer.ts`** | ⭐ **Main pipeline orchestrator** | `produceFrame()`, `ProduceInput`, `ProduceOutput`, `Renderable` |
| **`LayerLogicBasic.ts`** | ⭐ **Foundation transforms** | `computeBasicState()`, `resolveFinalAngle()`, `BasicConfig` |
| **`LayerLogicSpin.ts`** | ⭐ **Rotation behavior** | `getSpinAngleDeg()`, `computeSpinState()`, `SpinConfig` |
| **`LayerLogicOrbit.ts`** | ⭐ **Orbital motion** | `computeOrbitState()`, `getOrbitOrientationDeg()`, `OrbitConfig` |
| **`LayerLogicClock.ts`** | ⭐ **Time-based logic** | `getClockDrivenImageAngle()`, `computeClockState()`, `ClockConfig` |

## 📁 **BY CATEGORY**

### **🏗️ Core Pipeline Architecture**
```
/app/old/variant/
├── LayerProducer.ts            ⭐ Main orchestration pipeline
├── index.ts                    📦 Barrel exports (clean imports)
└── LayerConverter.ts           🔄 JSON ↔ TypeScript mapping utilities
```

### **🧠 Logic Processing Modules**
```
/app/old/variant/
├── LayerLogicBasic.ts          ⭐ Foundation layer (position/scale/angle)
├── LayerLogicSpin.ts           🔄 Rotation/spinning behavior
├── LayerLogicOrbit.ts          🌍 Orbital motion behavior  
├── LayerLogicClock.ts          🕐 Time-based angle calculations
└── LayerLogicEffect.ts         ✨ Visual effects (fade/pulse/shake/etc)
```

### **⚙️ Configuration System**
```
Configuration Files (JSON):
├── basic.config.json           📝 Position, scale, anchoring presets
├── spin.config.json            🔄 Rotation speed, direction presets
├── orbit.config.json           🌍 Orbital motion path presets
├── clock.config.json           🕐 Timezone, tick mode presets
├── effect.config.json          ✨ Visual effect combinations
└── configs.all.json            📊 Combined configuration (all modules)
```

## 🚀 **START HERE FOR UNDERSTANDING**

### **📖 Reading Order (Recommended)**
1. **`variant-system-analysis.md`** - Read complete technical analysis first
2. **`LayerProducer.ts`** - Understand the main pipeline orchestration
3. **`LayerLogicBasic.ts`** - Study foundation transform system
4. **Configuration JSONs** - See practical usage examples
5. **`LayerLogicSpin.ts`** - Learn rotation/angle override system  
6. **`LayerLogicOrbit.ts`** - Understand position override mechanics
7. **`LayerLogicClock.ts`** - Study time-based integration
8. **`LayerLogicEffect.ts`** - Learn visual post-processing

### **🔧 For Implementation**
1. **`LayerProducer.ts`** - Main integration patterns and pipeline flow
2. **`LayerConverter.ts`** - JSON validation and mapping utilities
3. **Configuration files** - Real-world usage examples and presets
4. **`index.ts`** - Clean import/export structure
5. **Individual Logic Modules** - Specific behavior implementation details

### **⚡ For Quick Reference**
1. **`variant-file-relationships.md`** - Architecture overview and data flow
2. **Type definitions** - Interfaces across all modules
3. **Configuration schemas** - JSON structure examples
4. **Priority systems** - Angle and position override rules

## 🎯 **MOST IMPORTANT FILES** (Priority Order)

| Priority | File | Why Critical |
|----------|------|--------------|
| **🥇 #1** | `LayerProducer.ts` | Main pipeline - orchestrates entire processing flow |
| **🥈 #2** | `LayerLogicBasic.ts` | Foundation system - all other modules build on this |
| **🥉 #3** | `variant-system-analysis.md` | Complete understanding guide (technical deep-dive) |
| **4** | `LayerLogicSpin.ts` | Angle override system - demonstrates priority mechanics |
| **5** | Configuration JSONs | Real usage examples - shows practical implementation |
| **6** | `LayerLogicOrbit.ts` | Position override system - complex coordinate calculations |

## 📋 **FILE MODIFICATION GUIDELINES**

### **🎯 Core Logic Modifications**
- **Basic Transforms**: Edit `LayerLogicBasic.ts` → position/scale/anchor calculations
- **Angle Priority**: Edit `resolveFinalAngle()` → Clock > Spin > Manual hierarchy  
- **Pipeline Flow**: Edit `LayerProducer.ts` → processing order and data flow
- **Effect Processing**: Edit `LayerLogicEffect.ts` → visual post-processing

### **🔧 Behavior Extensions**
- **New Logic Module**: Create `LayerLogic[Name].ts` following existing patterns
- **Pipeline Integration**: Add to `ProduceInput` interface and `produceFrame()` flow
- **Configuration**: Create corresponding `[name].config.json` with presets
- **Type System**: Extend interfaces in respective modules

### **⚙️ Configuration Changes**
- **Presets**: Add new presets to existing JSON configs
- **Structure**: Extend config interfaces in respective TypeScript modules
- **Validation**: Update `LayerConverter.ts` for new fields/structures
- **Documentation**: Update examples in configuration files

## 🎮 **MODULE INTERACTION PATTERNS**

### **🔄 Processing Chain**
```
LayerBasic (Foundation)
    ↓ (provides base transforms)
LayerSpin (Angle Override)
    ↓ (can override manual angle)
LayerOrbit (Position Override)  
    ↓ (replaces position, suggests orientation)
LayerClock (Time Integration)
    ↓ (can override all angles with time-based)
LayerEffect (Post-Processing)
    ↓ (modifies final values)
Renderable Output
```

### **📊 Priority Systems**
```
ANGLE PRIORITY: Clock > Spin > Manual > Orbit Suggestion
POSITION FLOW: Basic → Orbit Override → Effect Nudges
TIME INTEGRATION: Clock ↔ Spin (inheritance via imageSpin)
ORIENTATION MODES: Orbit → Spin (inheritSpin mode)
```

### **🎯 Configuration Dependencies**
```
Canvas Size → Basic (fraction positions)
Basic Position → Orbit (auto-inference)  
Spin State → Clock (imageSpin inheritance)
Spin State → Orbit (orientation inheritance)
All Configs → Producer (main pipeline)
```

## 💡 **QUICK INTEGRATION EXAMPLES**

### **Basic Pipeline Usage**
```typescript
import { produceFrame } from "./LayerProducer";

const result = produceFrame({
  canvasSizePx: { x: 512, y: 512 },
  basic: basicConfig,
  spin: spinConfig, 
  orbit: orbitConfig,
  clock: clockConfig,
  effect: effectConfig,
});

// result.renderable → ready for any renderer
```

### **Individual Module Usage**
```typescript
import { computeBasicState } from "./LayerLogicBasic";
import { getSpinAngleDeg } from "./LayerLogicSpin";

const basic = computeBasicState(config, canvasSize);
const spinAngle = getSpinAngleDeg(spinConfig);
```

### **Configuration Loading**
```typescript
import allConfigs from "./configs.all.json";
import { fromJson } from "./LayerConverter";

const configs = fromJson(allConfigs);
const result = produceFrame(configs);
```

## 📖 **ANGLE CONVENTION REFERENCE**

### **Universal Standard**
- **Range**: 0-360° (normalized)
- **Zero Point**: 0° = Right/East
- **Up Direction**: 90° = Up/North  
- **Rotation**: Clockwise = Positive
- **Functions**: All modules use `normalize360(deg)`

### **Practical Examples**
```
  90° (Up)
    ↑
180° ← → 0° (Right)  
    ↓
 270° (Down)

Common Values:
- Right: 0°
- Up: 90° 
- Left: 180°
- Down: 270°
```

## 🎨 **EFFECT TYPES REFERENCE**

| Effect | Purpose | Key Parameters |
|--------|---------|----------------|
| **Fade** | Opacity transitions | `from`, `to`, `durationMs`, `easing` |
| **Pulse** | Scale/opacity breathing | `freqHz`, `waveform`, `scaleAmp`, `opacityAmp` |
| **Blink** | On/off visibility | `freqHz`, `duty`, `onOpacity`, `offOpacity` |
| **Shake** | Position jitter | `posAmp`, `angleAmpDeg`, `freqHz` |
| **Wiggle** | Micro rotations | `angleAmpDeg`, `posAmp`, `freqHz`, `waveform` |

## 🔍 **COMPARISON WITH OTHER SYSTEMS**

| Aspect | Launcher System | Upgraded System | Variant System |
|--------|----------------|-----------------|----------------|
| **Architecture** | Monolithic Pixi.js | Modular Three.js | Pure TypeScript Logic |
| **Rendering** | 2D Canvas (Pixi) | 3D WebGL (Three) | Renderer-Agnostic |
| **Stage Size** | 1024×1024 fixed | 2048×2048 adaptive | Canvas-size flexible |
| **Logic Flow** | Imperative/Mixed | Object-Oriented | Pure Functional |
| **Configuration** | Runtime mixing | Validation system | JSON + TypeScript |
| **Effects** | Basic built-ins | GPU accelerated | Math-based pure functions |
| **Time Handling** | Basic animation | Performance adaptive | Precise time injection |

## 🎯 **EXTENSION GUIDELINES**

### **✅ Easy to Extend**
- Add new effect types in `LayerLogicEffect.ts`
- Create new configuration presets in JSON files  
- Add utility functions in individual modules
- Extend type definitions with new interfaces

### **⚠️ Moderate Complexity**
- Add new logic modules (requires pipeline integration)
- Modify angle priority system (affects multiple modules)
- Change coordinate conventions (system-wide impact)
- Add new renderer integration patterns

### **🔒 Core Architecture (Be Careful)**  
- Pipeline execution order in `LayerProducer.ts`
- Basic foundation system in `LayerLogicBasic.ts`
- Cross-module type dependencies
- Configuration validation in `LayerConverter.ts`

This file structure represents a **pure, functional layer processing system** designed for maximum flexibility, testability, and integration with any rendering system while maintaining clean separation of concerns and predictable behavior.