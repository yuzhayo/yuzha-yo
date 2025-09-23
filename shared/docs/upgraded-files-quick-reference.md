# 📚 Upgraded Layer System - Quick File Reference

## 🎯 **ESSENTIAL FILES** (Core System)

| File | Purpose | Key Exports |
|------|---------|-------------|
| **`StagesEngine.ts`** | ⭐ **Main public API entry point** | `StagesEngine` class, `mount()`, `setObject()` |
| **`StagesLogic.ts`** | ⭐ **Coordination layer & library export** | `StagesLogic` class, module coordination |
| **`StagesLogicDevice.ts`** | ⭐ **Performance intelligence** | `StagesLogicDevice`, device tier detection |
| **`StagesLogicTransform.ts`** | ⭐ **Coordinate transformation system** | `STAGE_WIDTH/HEIGHT`, coordinate conversion |
| **`StagesRenderer.ts`** | ⭐ **Three.js WebGL rendering** | `StagesRenderer`, scene management |

## 📁 **BY CATEGORY**

### **🏗️ Core Engine Architecture**
```
/app/merge/upgraded/
├── StagesEngine.ts                 ⭐ Main API (public interface)
├── StagesLogic.ts                  ⭐ Coordination layer & exports
├── StagesEngineObjects.ts          📦 Object lifecycle management
├── StagesEngineEvents.ts           🎯 Event handling system
└── useLayerEngine.ts               ⚛️ React integration hook
```

### **🧠 Logic Processing Modules (StagesLogic Children)**
```
/app/merge/upgraded/
├── StagesLogicDevice.ts            🔍 GPU/memory device intelligence
├── StagesLogicTransform.ts         📐 Coordinate system & scaling
├── StagesLogicPerformance.ts       📊 FPS monitoring & adaptive quality
├── StagesTypes.ts                  📝 Type definitions for logic system
└── StagesRenderer.ts               🎨 Three.js WebGL integration
```

### **🎨 Rendering System (Three.js)**
```
/app/merge/upgraded/
├── StagesRenderer.ts               🎨 Main Three.js renderer
├── StagesRendererMesh.ts           🔺 Geometry & mesh management
├── StagesRendererMaterial.ts       🎭 Material & texture system
└── StagesTypes.ts                  📝 Rendering type definitions
```

### **⚙️ Layer Processing Pipeline**
```
/app/merge/upgraded/
├── LayerPipeline.ts                🔄 Processing orchestration
├── LayerProducer.ts                🏭 Layer production system
├── LayerValidator.ts               ✅ Configuration validation
├── LayerConverter.ts               🔄 JSON ↔ TypeScript mapping
├── LayerTypes.ts                   📋 Layer system types
├── LayerImageResolver.ts           🖼️ Asset resolution system
└── LayerMappingImage.ts            📍 Image coordinate mapping
```

### **🎛️ Layer Logic Behaviors**
```
/app/merge/upgraded/
├── LayerLogicBasic.ts              ⭐ Foundation transforms
├── LayerLogicSpin.ts               🔄 Rotation behaviors
├── LayerLogicOrbit.ts              🌍 Orbital motion
├── LayerLogicClock.ts              🕐 Time-based behaviors
├── LayerLogicPulse.ts              💓 Scale pulsing effects
└── LayerLogicFade.ts               🌫️ Opacity animations
```

### **🎯 React Integration & Configuration**
```
/app/merge/upgraded/
├── LayerReactStage.tsx             📱 React stage component
├── useLayerEngine.ts               ⚛️ Engine integration hook
├── LayerAdapterStages.ts           🔗 Stages system adapter
├── LayerMappingScreen.ts           📱 Screen coordinate mapping
└── mainconfig.json                 ⚙️ Default configuration
```

## 🚀 **START HERE FOR UNDERSTANDING**

### **📖 Reading Order (Recommended)**
1. **`upgraded-system-analysis.md`** - Read complete technical analysis first
2. **`StagesEngine.ts`** - Understand main public API structure
3. **`StagesLogic.ts`** - Study coordination layer and library exports
4. **`StagesLogicDevice.ts`** - Learn device intelligence and performance tiers
5. **`StagesLogicTransform.ts`** - Study 2048×2048 coordinate system
6. **`StagesRenderer.ts`** - Understand Three.js integration
7. **`LayerPipeline.ts`** - Learn layer processing orchestration
8. **Individual Layer Logic modules** - Study specific behaviors

### **🔧 For Implementation**
1. **`StagesEngine.ts`** - Main integration patterns and public API
2. **`StagesLogic.ts`** - Library structure and module coordination
3. **Device Intelligence modules** - Performance optimization patterns
4. **Rendering System modules** - Three.js integration patterns
5. **Layer Processing modules** - Configuration-driven behavior system
6. **React Integration modules** - Component patterns and hooks

### **⚡ For Quick Reference**
1. **`upgraded-file-relationships.md`** - Architecture overview and data flow
2. **`StagesTypes.ts`** - Core type definitions and interfaces
3. **`LayerTypes.ts`** - Layer system type definitions
4. **`mainconfig.json`** - Configuration examples and defaults
5. **Performance optimization settings** - Device tier configurations

## 🎯 **MOST IMPORTANT FILES** (Priority Order)

| Priority | File | Why Critical |
|----------|------|--------------|
| **🥇 #1** | `StagesEngine.ts` | Main public API - entry point for all functionality |
| **🥈 #2** | `StagesLogic.ts` | Coordination layer - manages all child logic modules |
| **🥉 #3** | `upgraded-system-analysis.md` | Complete understanding guide (technical deep-dive) |
| **4** | `StagesLogicDevice.ts` | Device intelligence - critical for Android performance |
| **5** | `StagesLogicTransform.ts` | Coordinate system - 2048×2048 mathematical foundation |
| **6** | `StagesRenderer.ts` | Three.js integration - WebGL rendering system |

## 📋 **FILE MODIFICATION GUIDELINES**

### **🎯 Core System Modifications**
- **Public API**: Edit `StagesEngine.ts` → main interface changes
- **Coordination Logic**: Edit `StagesLogic.ts` → module coordination updates
- **Device Intelligence**: Edit `StagesLogicDevice.ts` → performance tier rules
- **Transform System**: Edit `StagesLogicTransform.ts` → coordinate algorithms
- **Rendering**: Edit `StagesRenderer.ts` → Three.js integration changes

### **🔧 Logic Module Extensions**
- **New Device Rules**: Extend `DeviceDetectionRules` class
- **New Transform Modes**: Add to `TransformRules` class
- **New Performance Metrics**: Extend `StagesLogicPerformance.ts`
- **New Layer Behaviors**: Create `LayerLogic[Name].ts` following existing patterns
- **New Event Types**: Extend `StagesEngineEvents.ts`

### **⚙️ Layer System Changes**
- **Pipeline Processing**: Edit `LayerPipeline.ts` → behavior orchestration
- **Configuration Validation**: Edit `LayerValidator.ts` → input validation rules
- **Type Definitions**: Update `LayerTypes.ts` or `StagesTypes.ts`
- **Asset Resolution**: Edit `LayerImageResolver.ts` → image loading logic

## 🎮 **SYSTEM INTERACTION PATTERNS**

### **🔄 Engine Coordination**
```
StagesEngine (Public API)
    ↓ coordinates
StagesLogic (Coordination Layer)
    ↓ manages
Child Modules (Device/Transform/Performance/Renderer)
    ↓ notify back
Update Callbacks (Device changes, Performance adjustments)
```

### **📊 Performance Intelligence**
```
Device Detection → Performance Tier → Quality Settings → Renderer Configuration
StagesLogicDevice → StagesLogicPerformance → RenderQuality → StagesRenderer
```

### **📐 Coordinate Pipeline**
```
Browser Events → Viewport Coordinates → Stage Coordinates → World Coordinates
StagesEngineEvents → StagesLogicTransform → Three.js Scene Objects
```

### **🎨 Rendering Chain**
```
Stage Objects → Mesh Creation → Material Application → Scene Rendering
StagesEngineObjects → StagesRendererMesh → StagesRendererMaterial → StagesRenderer
```

## 💡 **QUICK INTEGRATION EXAMPLES**

### **Basic Engine Usage**
```typescript
import { StagesEngine } from "./StagesEngine";

const engine = new StagesEngine({
  deviceTier: "auto", // or "low"/"mid"/"high"
  width: 2048,
  height: 2048
});

await engine.mount(containerElement);

engine.setObject("sprite1", {
  id: "sprite1",
  x: 1024, y: 1024, // center of 2048×2048 stage
  scale: 1.0,
  rotation: 0,
  texture: "./image.png"
});
```

### **React Integration**
```typescript
import { useLayerEngine } from "./useLayerEngine";

function MyComponent() {
  const engine = useLayerEngine({
    onMount: (engine) => {
      engine.setObject("logo", { x: 1024, y: 512 });
    }
  });
  
  return <div ref={engine.containerRef} />;
}
```

### **Custom Device Rules**
```typescript
// Extend StagesLogicDevice for custom detection
class CustomDeviceRules extends DeviceDetectionRules {
  detectTier(): "low" | "mid" | "high" {
    // Custom detection logic
    return "high";
  }
}
```

## 🔍 **KEY ARCHITECTURAL DIFFERENCES**

| Aspect | Upgraded System Approach |
|--------|-------------------------|
| **Stage Size** | 2048×2048 high-resolution virtual canvas |
| **Rendering** | Three.js WebGL with orthographic projection |
| **Architecture** | Modular coordination layer with child modules |
| **Performance** | Intelligent device detection with adaptive quality |
| **Coordinates** | Multi-system: Viewport → Stage → World conversion |
| **Logic Flow** | Coordination-based with update callbacks |
| **Configuration** | TypeScript interfaces with JSON validation |
| **Device Support** | Android-optimized with GPU intelligence |

## 🎯 **EXTENSION GUIDELINES**

### **✅ Easy to Extend**
- Add new device detection rules in `StagesLogicDevice.ts`
- Create new layer behaviors following `LayerLogic*.ts` pattern
- Extend configuration interfaces in type definition files
- Add new coordinate transformation modes in `StagesLogicTransform.ts`

### **⚠️ Moderate Complexity**
- Modify rendering pipeline in `StagesRenderer.ts`
- Add new coordination logic in `StagesLogic.ts`
- Extend event system in `StagesEngineEvents.ts`
- Create new mesh/material factories

### **🔒 Core Architecture (Be Careful)**
- Main public API in `StagesEngine.ts`
- Core coordination logic in `StagesLogic.ts`
- Transform mathematics in `TransformRules` class
- Performance tier configurations

This file structure represents a **professional-grade 3D rendering system** designed for high-performance web applications with intelligent device adaptation, modular architecture, and comprehensive coordinate transformation capabilities.