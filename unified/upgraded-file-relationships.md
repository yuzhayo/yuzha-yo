# 🔗 Upgraded Stages System - File Relationships & Dependencies

## 📊 Architecture Overview
```
StagesEngine (Main Entry Point)
├── StagesLogic (Coordination Layer)
│   ├── StagesLogicTransform (Coordinate System)
│   ├── StagesLogicDevice (Hardware Detection)  
│   └── StagesLogicPerformance (Performance Management)
├── StagesRenderer (Three.js Rendering)
│   ├── StagesRendererMesh (3D Object Management)
│   └── StagesRendererMaterial (Material System)
├── StagesEngineObjects (Object Management)
└── StagesEngineEvents (Event Handling)

LayerPipeline (Processing System)
├── LayerProducer (Main Pipeline)
├── LayerValidator (Input Validation)
├── LayerConverter (Format Conversion)
├── LayerImageResolver (Asset Resolution)
└── LayerLogic* (Behavior Processors)
    ├── LayerLogicBasic (Transform Processing)
    ├── LayerLogicSpin (Rotation Behavior)
    ├── LayerLogicOrbit (Orbital Motion) 
    ├── LayerLogicPulse (Scale Animation)
    └── LayerLogicFade (Opacity Animation)
```

## 🎯 Core Engine Chain

### 1. **StagesEngine.ts** (Public API Entry Point)
```typescript
export class StagesEngine {
  private logic: StagesLogic;           // Coordination layer
  private renderer: StagesRenderer;     // Three.js rendering
  private objectManager: StagesEngineObjects;
  private eventManager: StagesEngineEvents;
}
```

**Key Methods:**
- `mount()` - Initialize and attach to DOM
- `setObject()` - Add/update 3D objects
- `transformCoordinates()` - Screen to stage conversion
- `addEventListener()` - Event handling

**Used by:**
- Application code (Public API)
- Integration systems

### 2. **StagesLogic.ts** (Coordination & Library Export)
```typescript
export class StagesLogic {
  private transformRules: StagesLogicTransform;
  private deviceRules: StagesLogicDevice;
  private performanceRules: StagesLogicPerformance;
}
```

**Coordinates:**
- Device detection → Performance tuning
- Transform changes → Renderer updates  
- Performance metrics → Quality adjustments

**Used by:**
- `StagesEngine.ts` - Main coordination
- Library consumers (as main export)

### 3. **StagesRenderer.ts** (Three.js Integration)
```typescript
export class StagesRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private meshFactory: StagesRendererMesh;
  private materialFactory: StagesRendererMaterial;
}
```

**Uses:**
- `StagesLogic` - Performance settings
- `StagesRendererMesh` - 3D object creation
- `StagesRendererMaterial` - Material management
- Three.js WebGL API

**Used by:**
- `StagesEngine.ts` - Rendering operations

## 🎮 Logic Processing Modules

### 4. **StagesLogicTransform.ts** (Coordinate System)
```typescript
export class StagesLogicTransform {
  private transformRules: TransformRules;
  calculateTransform()
  transformCoordinates()
  stageToWorld() / worldToStage()
}
```

**Features:**
- 2048×2048 fixed stage (vs 1024×1024 in Launcher)
- Cover/Contain/Fill scaling modes
- Screen-to-stage coordinate transformation
- Three.js world coordinate conversion

**Used by:**
- `StagesLogic` - Transform coordination
- `StagesEngine` - Coordinate transformation

### 5. **StagesLogicDevice.ts** (Hardware Detection)
```typescript
export class StagesLogicDevice {
  detectTier(): DeviceTier
  getRenderQuality(): RenderQuality
  setDeviceTier()
}
```

**Detects:**
- GPU capabilities (WebGL analysis)
- Memory availability
- Device performance tier (low/mid/high)

**Used by:**
- `StagesLogic` - Performance coordination
- `StagesRenderer` - Quality settings

### 6. **StagesLogicPerformance.ts** (Performance Management)
```typescript
export class StagesLogicPerformance {
  updatePerformance()
  getQualityAdjustment()
  trackRenderCall()
}
```

**Monitors:**
- FPS and frame timing
- Memory usage
- Render call counts
- Adaptive quality adjustments

**Used by:**
- `StagesLogic` - Performance coordination
- `StagesRenderer` - Quality adjustments

## 🏗️ Layer Processing Pipeline

### 7. **LayerPipeline.ts** (Pipeline Composer)
```typescript
export function compose(wrappers: Array<"spin" | "orbit" | "pulse" | "fade">)
export function produceFull() / produceBasic()
```

**Pipeline Order:**
1. Input validation → Normalization
2. Basic transforms → Position/Scale/Rotation
3. Behavior wrappers → Spin → Orbit → Pulse → Fade
4. Output generation → LayerData[]

**Uses:**
- `LayerValidator` - Input validation
- `LayerLogic*` - Transform processors
- `LayerProducer` - Full pipeline

### 8. **LayerProducer.ts** (Main Pipeline Orchestrator)
```typescript
export function produceLayers(input: LibraryConfig, ctx: ProcessingContext)
```

**Process Flow:**
1. Validate & normalize input
2. Apply basic transforms
3. Process behaviors (spin/orbit/pulse/fade)
4. Generate final LayerData

**Uses:**
- `LayerValidator` - Input validation
- `LayerImageResolver` - Asset resolution
- All `LayerLogic*` modules

### 9. **LayerValidator.ts** (Input Validation & Normalization)
```typescript
export function validateLibraryConfig(input: LibraryConfig): ValidationResult
```

**Validates:**
- Stage configuration
- Layer properties
- Asset references
- Behavior configurations
- Event hooks

**Used by:**
- `LayerPipeline` - Input processing
- `LayerProducer` - Main pipeline

## 🎨 Object & Event Management

### 10. **StagesEngineObjects.ts** (3D Object Management)
```typescript
export class StagesEngineObjects {
  setObject() / updateObject()
  processMetadata()
  getObjectsInArea()
  batchUpdate()
}
```

**Features:**
- Metadata-driven object processing
- Animation handling (rotate/pulse/float)
- Spatial queries
- Batch operations

**Used by:**
- `StagesEngine` - Object operations
- Event system for collision detection

### 11. **StagesEngineEvents.ts** (Event Processing)
```typescript
export class StagesEngineEvents {
  setupEventHandlers()
  processEvent()
  enhanceEvent()
}
```

**Enhanced Events:**
- Gesture detection (drag/double-click)
- Hover duration tracking
- Event history & analytics
- Custom event processors

**Used by:**
- `StagesEngine` - Event handling
- Application event listeners

## 🎭 Behavior Logic Modules

### 12. **LayerLogicBasic.ts** (Base Transforms)
```typescript
export function applyBasicTransform(layer, stage): BasicTransform
```

**Processes:**
- Position, Scale, Rotation
- Opacity, Anchor points
- Tilt (3D rotation on X/Y axes)

### 13. **LayerLogicSpin.ts** (Rotation Animation)
```typescript
export function applySpin(prev, cfg, timeSeconds): { angle: number }
```

**Features:**
- RPM-based rotation
- Clockwise/Counter-clockwise direction
- Time-based animation

### 14. **LayerLogicOrbit.ts** (Orbital Motion)
```typescript
export function applyOrbit(prev, cfg, timeSeconds, baseCenter): { position: Vec2 }
```

**Features:**
- Circular orbital paths
- Configurable radius & center
- RPM-based orbital speed

### 15. **LayerLogicPulse.ts** & **LayerLogicFade.ts** (Animations)
- Scale pulsing animation
- Opacity fade transitions
- Time-based sinusoidal motion

## 🔄 Data Flow Summary

```
1. Application Code
   ↓ (StagesEngine API)
2. StagesLogic Coordination
   ↓ (Device/Transform/Performance)  
3. StagesRenderer (Three.js)
   ↓ (WebGL Rendering)
4. DOM Canvas Element
   ↓ (User Interaction)
5. StagesEngineEvents
   ↓ (Coordinate Transform)
6. StagesLogicTransform
   ↓ (Object Updates)
7. StagesEngineObjects

LayerPipeline Flow:
1. LibraryConfig (JSON Input)
   ↓ (LayerValidator)
2. Normalized Configuration  
   ↓ (LayerProducer)
3. Basic Transforms
   ↓ (LayerLogic* Modules)
4. Behavior Processing
   ↓ (Output)
5. LayerData[] (Ready for Rendering)
```

## 🎯 Key Dependencies

**External Libraries:**
- **Three.js**: 3D rendering, WebGL, scene management
- **TypeScript**: Type safety, interface definitions
- **Browser APIs**: WebGL, ResizeObserver, Performance API

**Internal Dependencies:**
- **StagesLogic**: Central coordination for all modules
- **LayerTypes**: Type definitions for entire layer system
- **StagesTypes**: Type definitions for engine system
- **Transform System**: Mathematical foundation for coordinates

## 💡 Extension Points

**To add new features:**

1. **New Behaviors**: Create `LayerLogic[Name].ts` following existing pattern
2. **New 3D Effects**: Extend `StagesRendererMesh` or `StagesRendererMaterial`
3. **New Device Detection**: Modify `StagesLogicDevice` detection rules
4. **New Event Types**: Extend `StagesEngineEvents` event processing
5. **New Transform Modes**: Add to `StagesLogicTransform` scaling behaviors
6. **New Object Types**: Extend metadata processing in `StagesEngineObjects`

**All extensions automatically inherit:**
- ✅ 3D rendering capabilities (Three.js)
- ✅ Device-adaptive performance
- ✅ Coordinate transformation system
- ✅ Event handling & gesture detection
- ✅ Validation & type safety
- ✅ Modular architecture patterns

## 🔧 Advanced Features vs Launcher

**Upgraded System Advantages:**
- **3D Rendering**: Three.js vs Pixi.js 2D
- **Larger Stage**: 2048×2048 vs 1024×1024  
- **Device Adaptation**: Automatic performance scaling
- **Modular Logic**: Separated concerns with child modules
- **Advanced Behaviors**: Orbit, pulse, fade animations
- **Metadata System**: Complex object processing
- **Event Enhancement**: Gesture detection, history tracking
- **Pipeline Flexibility**: Composable behavior processing

This represents a complete evolution of the Launcher system into a professional 3D interactive engine with enterprise-grade architecture and performance management.