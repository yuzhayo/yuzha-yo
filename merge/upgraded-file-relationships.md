# 🔗 Upgraded Layer System - File Relationships & Dependencies

## 📊 Architecture Overview
```
StagesEngine.ts (Main API Entry Point)
  └── StagesLogic.ts (Coordination Layer)
      ├── StagesLogicDevice.ts (Performance Intelligence)
      │   ├── DeviceDetectionRules (GPU/Memory Analysis)
      │   └── DeviceTier (Low/Mid/High Configuration)
      ├── StagesLogicTransform.ts (Coordinate System) 
      │   ├── TransformRules (Cover/Contain/Fill Algorithms)
      │   └── ViewportTransform (Scale/Offset Calculations)
      └── StagesLogicPerformance.ts (Real-time Monitoring)
          ├── PerformanceMetrics (FPS/Memory Tracking)
          └── QualityAdjustment (Adaptive Quality System)
  ├── StagesRenderer.ts (Three.js Integration)
  │   ├── StagesRendererMesh.ts (Geometry Management)
  │   ├── StagesRendererMaterial.ts (Material System)
  │   └── WebGL Scene Management
  ├── StagesEngineObjects.ts (Object Lifecycle)
  │   ├── Object Storage & Retrieval
  │   ├── Spatial Queries & Hit Testing
  │   └── Batch Processing Operations
  └── StagesEngineEvents.ts (Event Management)
      ├── Touch/Mouse Event Handling
      ├── Coordinate Transformation Integration
      └── Event History & Analytics
```

## 🎯 Core System Chain

### 1. **StagesEngine.ts** (Main Public API)
```typescript
export class StagesEngine {
  // Single coordination point - unified entry
  private logic: StagesLogic
  private renderer: StagesRenderer
  private objectManager: StagesEngineObjects
  private eventManager: StagesEngineEvents
}
```

**Key Exports:**
- `StagesEngine` class - Main public API
- `mount()` - DOM integration
- `setObject()` - Object management
- `transformCoordinates()` - Coordinate conversion

**Uses:**
- `StagesLogic` - Coordination layer
- `StagesRenderer` - Three.js rendering
- `StagesEngineObjects` - Object management
- `StagesEngineEvents` - Event handling

**Used by:**
- Client applications
- React integration components
- Testing frameworks

### 2. **StagesLogic.ts** (Coordination Hub)
```typescript
export class StagesLogic {
  private transformRules: StagesLogicTransform
  private deviceRules: StagesLogicDevice  
  private performanceRules: StagesLogicPerformance
}
```

**Core Responsibilities:**
- Coordinates child logic modules
- Manages inter-module communication
- Provides unified API to StagesEngine
- Handles update callbacks and notifications

**Integration Points:**
- Device changes → Performance + Transform updates
- Performance monitoring → Quality adjustments
- Transform changes → Renderer updates
- Update callbacks → StagesEngine notifications

**Used by:**
- `StagesEngine` - Main coordination
- Performance monitoring systems
- Device adaptation logic

### 3. **StagesLogicDevice.ts** (Performance Intelligence)
```typescript
export class StagesLogicDevice {
  private deviceTier: DeviceTier | null
  private detectionRules: DeviceDetectionRules
}
```

**Core Features:**
- **GPU Analysis**: WebGL renderer/vendor detection
- **Memory Detection**: JavaScript heap size limits
- **Tier Classification**: Low/Mid/High performance categories
- **Quality Mapping**: DPR, antialias, shadows, texture quality

**Device Tier Configurations:**
```typescript
high: { maxDPR: 2.0, antialias: true, shadows: true, maxObjects: 1000 }
mid:  { maxDPR: 1.5, antialias: true, shadows: false, maxObjects: 500 }
low:  { maxDPR: 1.0, antialias: false, shadows: false, maxObjects: 250 }
```

**Detection Strategy:**
- Primary: GPU vendor/renderer analysis
- Fallback: Memory-based tier assignment
- Override: Manual tier forcing capability

**Used by:**
- `StagesLogic` - Device tier coordination
- `StagesLogicPerformance` - Performance monitoring
- `StagesRenderer` - Quality configuration

### 4. **StagesLogicTransform.ts** (Coordinate System)
```typescript
export class StagesLogicTransform {
  private transformRules: TransformRules
  private resizeObserver: ResizeObserver
}
```

**Core Mathematics:**
- **Stage Dimensions**: 2048×2048 high-resolution virtual canvas
- **Scaling Modes**: Cover, Contain, Fill algorithms
- **Coordinate Conversion**: Viewport ↔ Stage ↔ World coordinates
- **Responsive Handling**: ResizeObserver-based updates

**Scaling Algorithm (Cover Mode):**
```typescript
calculateCoverTransform(viewportWidth, viewportHeight) {
  const scaleX = viewportWidth / STAGE_WIDTH
  const scaleY = viewportHeight / STAGE_HEIGHT  
  const scale = Math.max(scaleX, scaleY)  // Cover behavior
  
  const offsetX = (viewportWidth - STAGE_WIDTH * scale) / 2
  const offsetY = (viewportHeight - STAGE_HEIGHT * scale) / 2
  
  return { scale, offsetX, offsetY }
}
```

**Coordinate Systems:**
- **Viewport**: Browser window coordinates
- **Stage**: 0-2048 virtual coordinate system
- **World**: Three.js centered coordinate system (-1024 to +1024)

**Used by:**
- `StagesLogic` - Transform coordination
- `StagesEngineEvents` - Event coordinate transformation
- `StagesRenderer` - Canvas positioning

### 5. **StagesLogicPerformance.ts** (Real-time Monitoring)
```typescript
export class StagesLogicPerformance {
  private metrics: PerformanceMetrics
  private adaptiveQuality: boolean
}
```

**Performance Tracking:**
- **FPS Monitoring**: 60fps target with rolling averages
- **Memory Usage**: Heap size tracking and limits
- **Render Calls**: Frame timing and GPU utilization
- **Object Count**: Scene complexity monitoring

**Adaptive Quality System:**
- **Quality Degradation**: Automatic DPR/antialias reduction
- **Performance Recovery**: Quality restoration when stable
- **Threshold-based**: FPS and memory-based triggers

**Integration Points:**
- Notifies StagesLogic of quality adjustments
- Receives device tier from StagesLogicDevice
- Tracks render calls from StagesRenderer

**Used by:**
- `StagesLogic` - Performance coordination
- `StagesRenderer` - Quality adjustment application
- Monitoring and analytics systems

## 🎨 Rendering System Chain

### 6. **StagesRenderer.ts** (Three.js Integration)
```typescript
export class StagesRenderer {
  private renderer: THREE.WebGLRenderer
  private camera: THREE.OrthographicCamera
  private scene: THREE.Scene
  private meshFactory: StagesRendererMesh
  private materialFactory: StagesRendererMaterial
}
```

**Rendering Setup:**
- **WebGL Renderer**: Hardware-accelerated Three.js rendering
- **Orthographic Camera**: 2D-style projection for UI consistency
- **Fixed Stage Size**: 2048×2048 virtual rendering canvas
- **Adaptive Quality**: DPR, antialias, shadows based on device tier

**Object Management:**
- Object creation delegated to `StagesRendererMesh`
- Material management via `StagesRendererMaterial`
- Automatic cleanup and disposal
- Render loop with performance tracking

**Used by:**
- `StagesEngine` - Main rendering coordination
- Performance monitoring (render call tracking)

### 7. **StagesRendererMesh.ts** (Geometry Management)
```typescript
export class StagesRendererMesh {
  createFromObject(object: StageObject): THREE.Mesh
  updateFromObject(object: StageObject, mesh: THREE.Mesh): void
}
```

**Mesh Creation Pipeline:**
- PlaneGeometry generation for 2D objects
- Transform application (position, rotation, scale)
- World coordinate conversion from stage coordinates
- Texture and material integration

**Coordinate Integration:**
```typescript
// Stage to World conversion for Three.js
const [worldX, worldY] = stageToWorld(object.x, object.y)
mesh.position.set(worldX, worldY, object.z || 0)
```

**Used by:**
- `StagesRenderer` - Mesh creation and updates
- Object lifecycle management

### 8. **StagesRendererMaterial.ts** (Material System)
```typescript
export class StagesRendererMaterial {
  createMaterial(object: StageObject): THREE.Material
  updateMaterial(material: THREE.Material, object: StageObject): void
}
```

**Material Features:**
- Texture loading and management
- Opacity and blending modes
- Performance-optimized material caching
- Quality-based texture scaling

**Used by:**
- `StagesRendererMesh` - Material application
- `StagesRenderer` - Material lifecycle

## 🎮 Object & Event Management

### 9. **StagesEngineObjects.ts** (Object Lifecycle)
```typescript
export class StagesEngineObjects {
  private objects = new Map<string, StageObject>()
  
  setObject(id: string, data: Partial<StageObject>): StageObject
  getObjectsInArea(x: number, y: number, w: number, h: number): StageObject[]
}
```

**Object Management:**
- Unique ID-based object storage
- Partial update support for efficiency
- Spatial queries for hit testing
- Batch processing for bulk operations

**Spatial Features:**
- Area-based object queries
- Hit testing integration
- Performance-optimized spatial indexing

**Used by:**
- `StagesEngine` - Object management API
- `StagesEngineEvents` - Hit testing

### 10. **StagesEngineEvents.ts** (Event Management)
```typescript
export class StagesEngineEvents {
  setupEventHandlers(container: HTMLElement, transformer: Function, hitTester: Function)
  addEventListener(type: string, listener: Function): void
}
```

**Event Processing:**
- Touch/Mouse/Pointer event normalization
- Coordinate transformation integration
- Hit testing with object manager
- Event history and analytics

**Event Flow:**
```
1. Browser Event (touch/mouse)
   ↓
2. Coordinate Transformation (viewport → stage)
   ↓  
3. Hit Testing (find objects at coordinates)
   ↓
4. Event Dispatch (to registered listeners)
```

**Used by:**
- `StagesEngine` - Event system setup
- Client applications - Event listening

## 🔧 Layer Logic System

### 11. **LayerPipeline.ts** (Processing Pipeline)
```typescript
export function produceLayers(input: LibraryConfig, ctx: ProcessingContext): LayerData[]
export function compose(wrappers: Array<"spin" | "orbit" | "pulse" | "fade">): Function
```

**Pipeline Processing:**
- Validation and normalization
- Behavior application (spin, orbit, pulse, fade)
- Transform composition
- LayerData output generation

**Composable Architecture:**
- Individual behavior modules
- Selective pipeline composition
- Pure functional approach

**Used by:**
- Layer processing applications
- Configuration-driven systems

### 12. **Layer Logic Modules** (Behavior System)
```
LayerLogicBasic.ts     - Foundation transforms (position, scale, rotation)
LayerLogicSpin.ts      - Rotation behaviors (RPM-based spinning)
LayerLogicOrbit.ts     - Orbital motion (center, radius, angular velocity)
LayerLogicClock.ts     - Time-based behaviors (hour/minute/second hands)
LayerLogicPulse.ts     - Scale pulsing effects
LayerLogicFade.ts      - Opacity animations
```

**Behavior Integration:**
- Normalized configuration input
- Time-based calculations
- Transform composition
- State management

## 🔄 Data Flow Summary

```
1. Client Application
   ↓ (creates StagesEngine)
2. Device Detection (StagesLogicDevice)
   ↓ (determines performance tier)
3. Transform Setup (StagesLogicTransform) 
   ↓ (calculates viewport scaling)
4. Renderer Initialization (StagesRenderer)
   ↓ (creates Three.js scene with device-optimized quality)
5. Object Management (StagesEngineObjects)
   ↓ (stores and tracks stage objects)
6. Event System (StagesEngineEvents)
   ↓ (handles user interactions with coordinate transformation)
7. Render Loop
   ↓ (performance monitoring and adaptive quality)
8. Quality Adjustment (StagesLogicPerformance)
   ↓ (automatic quality degradation/restoration)
```

## 🎯 Key Dependencies

**External Libraries:**
- **Three.js**: WebGL rendering, 3D mathematics, scene management
- **TypeScript**: Type safety, development experience, interface definitions

**Internal Systems:**
- **StagesLogic**: Central coordination for all child modules
- **Device Intelligence**: Performance tier detection and quality management
- **Transform System**: Mathematical foundation for coordinate conversion
- **Event Integration**: Touch/mouse handling with coordinate transformation

## 💡 Extension Points

**To add new features:**
1. **New Logic Modules**: Extend StagesLogic* pattern for new behaviors
2. **New Renderers**: Implement renderer interface for different graphics systems
3. **New Device Rules**: Modify DeviceDetectionRules for new device categories
4. **New Transform Modes**: Add scaling algorithms to TransformRules
5. **New Event Types**: Extend StagesEngineEvents for custom interaction patterns

**All extensions automatically inherit:**
- ✅ Device-aware performance optimization
- ✅ Adaptive quality management
- ✅ Coordinate transformation system
- ✅ Three.js rendering pipeline
- ✅ Event handling and hit testing
- ✅ Object lifecycle management