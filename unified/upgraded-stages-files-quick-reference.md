# 📚 Upgraded Stages System - Quick File Reference

## 🎯 **ESSENTIAL FILES** (Core System)

| File | Purpose | Key Exports |
|------|---------|-------------|
| **`StagesEngine.ts`** | ⭐ **Public API Entry Point** | `StagesEngine` class, main interface |
| **`StagesLogic.ts`** | ⭐ **Coordination & Library Export** | `StagesLogic`, `createStages()`, all exports |
| **`StagesLogicTransform.ts`** | ⭐ **3D Coordinate System** | `StagesLogicTransform`, `STAGE_WIDTH/HEIGHT` |
| **`LayerPipeline.ts`** | ⭐ **Behavior Processing** | `compose()`, `produceFull()`, pipeline functions |
| **`LayerTypes.ts`** | ⭐ **Complete Type System** | All interfaces, types, configurations |

## 📁 **BY CATEGORY**

### **🏗️ Core Engine Architecture**
```
/app/old/upgraded/
├── StagesEngine.ts              ⭐ Public API & main entry point
├── StagesLogic.ts               ⭐ Coordination layer & library export  
├── StagesRenderer.ts            🎨 Three.js rendering engine
├── StagesTypes.ts               📋 Engine type definitions
└── mainconfig.json              ⚙️ Default configuration
```

### **🧠 Logic Modules (AI Modifiable)**
```
/app/old/upgraded/
├── StagesLogicTransform.ts      📐 Coordinate & transform system
├── StagesLogicDevice.ts         🔧 Hardware detection & performance tiers  
└── StagesLogicPerformance.ts    📊 Performance monitoring & optimization
```

### **🎮 Object & Event Management**
```
/app/old/upgraded/
├── StagesEngineObjects.ts       🎯 3D object lifecycle & metadata processing
├── StagesEngineEvents.ts        👆 Advanced event handling & gestures
├── StagesEngineLayer.ts         📚 Layer management integration
├── StagesRendererMesh.ts        🔷 3D mesh creation & management
└── StagesRendererMaterial.ts    🎨 Material system for Three.js
```

### **🔄 Layer Processing Pipeline**
```
/app/old/upgraded/
├── LayerPipeline.ts             ⭐ Composable behavior pipeline
├── LayerProducer.ts             🏭 Main processing orchestrator
├── LayerValidator.ts            ✅ Input validation & normalization
├── LayerConverter.ts            🔄 Format conversion utilities
├── LayerImageResolver.ts        🖼️ Asset resolution system
├── LayerMappingImage.ts         🗺️ Image mapping utilities
├── LayerMappingScreen.ts        📱 Screen coordinate mapping
└── LayerTypes.ts                📋 Complete type definitions
```

### **🎭 Behavior Logic Modules**
```
/app/old/upgraded/
├── LayerLogicBasic.ts           ⭐ Base transforms (position/scale/rotation)
├── LayerLogicSpin.ts            🔄 Rotation animation behavior
├── LayerLogicOrbit.ts           🌍 Orbital motion behavior  
├── LayerLogicPulse.ts           💓 Scale pulsing behavior
└── LayerLogicFade.ts            👻 Opacity fade behavior
```

## 🚀 **START HERE FOR UNDERSTANDING**

### **📖 Reading Order (Recommended)**
1. **`stages-system-analysis.md`** - Read complete technical analysis first
2. **`StagesEngine.ts`** - Understand the main API surface
3. **`StagesLogic.ts`** - Learn coordination and library exports
4. **`LayerTypes.ts`** - Study the complete type system
5. **`LayerPipeline.ts`** - Understand behavior processing
6. **`StagesLogicTransform.ts`** - Learn coordinate system details

### **🔧 For Implementation**
1. **`StagesEngine.ts`** - Main integration patterns
2. **`LayerProducer.ts`** - Full processing pipeline examples
3. **`StagesLogicDevice.ts`** - Device detection and performance tiers
4. **`StagesEngineObjects.ts`** - Object management and metadata processing
5. **`LayerValidator.ts`** - Input validation and error handling

### **⚡ For Quick Reference**
1. **`StagesTypes.ts`** - Core engine type definitions
2. **`LayerTypes.ts`** - Layer system type definitions  
3. **`mainconfig.json`** - Default configuration format
4. **`file-relationships.md`** - Architecture overview

## 🎯 **MOST IMPORTANT FILES** (Priority Order)

| Priority | File | Why Critical |
|----------|------|--------------|
| **🥇 #1** | `StagesEngine.ts` | Main public API - how applications interact with the system |
| **🥈 #2** | `StagesLogic.ts` | Coordination hub - manages all subsystems and serves as library export |
| **🥉 #3** | `LayerTypes.ts` | Type system foundation - defines all data structures |
| **4** | `stages-system-analysis.md` | Complete understanding guide (this analysis) |
| **5** | `LayerPipeline.ts` | Behavior processing engine - core animation system |
| **6** | `StagesLogicTransform.ts` | Coordinate system - mathematical foundation |

## 💡 **MODIFICATION POINTS**

### **🎯 Core Behavior Changes**
- **Device Detection**: Edit `StagesLogicDevice.ts` → `DeviceDetectionRules` class
- **Transform Behavior**: Edit `StagesLogicTransform.ts` → `TransformRules` class  
- **Performance Rules**: Edit `StagesLogicPerformance.ts` → performance thresholds
- **Animation Behaviors**: Edit `LayerLogic*.ts` files → mathematical functions

### **🔧 System Extensions**
- **New Behaviors**: Create `LayerLogic[Name].ts` following existing pattern
- **New 3D Effects**: Extend `StagesRendererMesh.ts` or `StagesRendererMaterial.ts`
- **New Event Types**: Extend `StagesEngineEvents.ts` → `enhanceEvent()` method
- **New Object Types**: Extend `StagesEngineObjects.ts` → `processMetadata()` method

### **⚙️ Configuration Changes**
- **Stage Dimensions**: Modify `STAGE_WIDTH/HEIGHT` in `StagesLogicTransform.ts`
- **Device Tiers**: Update tier configs in `StagesLogicDevice.ts`
- **Pipeline Composition**: Use `compose()` function in `LayerPipeline.ts`
- **Quality Settings**: Adjust `RenderQuality` parameters in device logic

## 🔍 **COMPARISON WITH LAUNCHER SYSTEM**

| Aspect | Launcher (Old) | Upgraded (New) |
|--------|----------------|----------------|
| **Rendering** | Pixi.js (2D Canvas) | Three.js (3D WebGL) |
| **Stage Size** | 1024×1024 | 2048×2048 |
| **Architecture** | Monolithic files | Modular child systems |
| **Device Adaptation** | Basic capability detection | Advanced GPU/memory profiling |
| **Behaviors** | Simple effects | Complex orbital/pulse/fade |
| **Events** | Basic coordinate transform | Enhanced gestures & analytics |
| **Performance** | Manual optimization | Automatic adaptive quality |
| **Object Management** | Simple sprites | Metadata-driven 3D objects |
| **Type System** | Basic scene types | Comprehensive validation |

## 📋 **FILE MODIFICATION GUIDELINES**

### **✅ AI CAN MODIFY (Child Modules)**
- `StagesLogic*.ts` - All logic modules
- `StagesEngine*.ts` - Object and event management  
- `StagesRenderer*.ts` - Mesh and material systems
- `LayerLogic*.ts` - All behavior processors
- `LayerValidator.ts` - Validation rules
- `LayerConverter.ts` - Format conversion

### **⚠️ AI SHOULD BE CAREFUL (Parent Modules)**
- `StagesEngine.ts` - Main API (coordination logic only)
- `StagesRenderer.ts` - Core renderer (child module integration)
- `LayerPipeline.ts` - Core pipeline (composition logic)
- `LayerProducer.ts` - Main orchestrator

### **🔒 TYPES & CONSTANTS (Extend, Don't Break)**
- `StagesTypes.ts` - Add new types, don't change existing
- `LayerTypes.ts` - Extend interfaces, maintain compatibility
- `mainconfig.json` - Update examples, keep structure

## 🎯 **QUICK INTEGRATION EXAMPLES**

### **Basic Engine Setup**
```typescript
import { StagesEngine } from './StagesEngine';

const engine = new StagesEngine({ deviceTier: 'auto' });
await engine.mount(containerElement);
```

### **Add Custom Behavior**
```typescript
// Create LayerLogicCustom.ts following LayerLogicSpin.ts pattern
export function applyCustom(prev, cfg, timeSeconds) {
  // Custom animation logic
  return { customProperty: newValue };
}
```

### **Custom Pipeline**
```typescript
import { compose } from './LayerPipeline';

const customPipeline = compose(['basic', 'spin', 'custom']);
const result = customPipeline(config, context);
```

## 🎨 **VISUAL ARCHITECTURE MAP**

```
StagesEngine (Public API)
    ├── StagesLogic (Coordination)
    │   ├── Transform (2048×2048 coordinates)
    │   ├── Device (GPU detection)  
    │   └── Performance (adaptive quality)
    ├── StagesRenderer (Three.js)
    │   ├── Mesh (3D objects)
    │   └── Material (textures/shaders)
    ├── Objects (metadata processing)
    └── Events (gesture detection)

LayerPipeline (Behavior Processing)
    ├── Producer (orchestration)
    ├── Validator (input checking)
    └── Logic Modules
        ├── Basic (transforms)
        ├── Spin (rotation)
        ├── Orbit (circular motion)
        ├── Pulse (scaling)
        └── Fade (opacity)
```

This file structure represents a **professional-grade 3D interactive engine** with modular architecture, device intelligence, and sophisticated behavior processing capabilities - a complete evolution from the original Launcher system.