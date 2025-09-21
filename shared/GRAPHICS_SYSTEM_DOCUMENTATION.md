# Graphics System Documentation
## Comprehensive Guide to Layer & Stages Architecture

### 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Layer System (`shared/layer/`)](#layer-system)
3. [Stages System (`shared/stages/`)](#stages-system)
4. [Integration & Data Flow](#integration--data-flow)
5. [File Structure Reference](#file-structure-reference)
6. [Types & Interfaces](#types--interfaces)
7. [Usage Examples](#usage-examples)
8. [Development Guidelines](#development-guidelines)
9. [Error Handling](#error-handling)
10. [Performance Considerations](#performance-considerations)

---

## Architecture Overview

This project implements a **Two-Tier Graphics System** for web-based animations and 3D rendering:

```
┌─────────────────────────────────────────────────────────┐
│                    GRAPHICS PIPELINE                    │
├─────────────────────────────────────────────────────────┤
│  INPUT: JSON Config                                     │
│  ↓                                                      │
│  LAYER SYSTEM (shared/layer/)                          │
│  - Validation & Normalization                          │
│  - Animation Behaviors (Spin/Orbit/Pulse/Fade)         │
│  - Transform Pipeline                                   │
│  ↓                                                      │
│  OUTPUT: LayerData[]                                    │
│  ↓                                                      │
│  STAGES SYSTEM (shared/stages/)                        │
│  - Three.js WebGL Rendering                            │
│  - Mesh & Material Factories                           │
│  - 3D Object Management                                 │
│  ↓                                                      │
│  OUTPUT: Rendered Canvas                                │
└─────────────────────────────────────────────────────────┘
```

### Key Principles:
- **Separation of Concerns**: Layer handles logic, Stages handles rendering
- **Type Safety**: Full TypeScript with strict mode
- **Performance**: Caching, resource management, and optimization
- **Modularity**: Each component can be used independently
- **Extensibility**: Easy to add new behaviors and rendering types

---

## Layer System (`shared/layer/`)

The Layer System is a **pure, deterministic animation logic engine** that processes JSON configurations into renderable data structures.

### Core Philosophy:
- **No I/O Operations**: Pure functions only
- **No Side Effects**: Deterministic transforms
- **Time-based**: All animations driven by time parameter
- **Validator-First**: Input validation with detailed error reporting

### 🔄 Data Flow:
```
LibraryConfig (JSON) 
→ validateLibraryConfig() 
→ LibraryConfigNormalized 
→ Transform Pipeline 
→ LayerData[]
```

### 📁 File Structure:

#### **Core Types & Validation**
- **`LayerTypes.ts`** - Truth source for all interfaces and types
- **`LayerValidator.ts`** - Input validation and normalization

#### **Transform Pipeline**
- **`LayerLogicBasic.ts`** - Basic transforms (position, scale, rotation)
- **`LayerLogicSpin.ts`** - Continuous rotation behavior
- **`LayerLogicOrbit.ts`** - Circular orbital motion
- **`LayerLogicPulse.ts`** - Scale pulsing/breathing effects
- **`LayerLogicFade.ts`** - Opacity animation

#### **Orchestration**
- **`LayerProducer.ts`** - Main pipeline orchestrator
- **`LayerPipeline.ts`** - Modular composer for partial pipelines

#### **Utilities**
- **`LayerConverter.ts`** - UI ↔ JSON conversion utilities
- **`LayerImageResolver.ts`** - Asset reference resolution
- **`LayerMappingImage.ts`** - Image container mapping
- **`LayerMappingScreen.ts`** - Coordinate system conversion

### 🎯 Key Concepts:

#### **Animation Behaviors**
Each behavior is a pure function that takes previous state + config + time:

```typescript
// Example: Spin behavior
function applySpin(
  prev: { angle: number },
  cfg: SpinConfig,
  timeSeconds: number
): { angle: number }
```

#### **Transform Chain**
Behaviors are applied in strict order:
1. **Basic** → Static transforms
2. **Spin** → Rotation animation  
3. **Orbit** → Position animation
4. **Pulse** → Scale animation
5. **Fade** → Opacity animation

#### **Asset References**
Two types of asset references:
- **Path**: `{ type: "path", path: "/assets/image.png" }`
- **Registry**: `{ type: "registry", key: "hero_sprite" }`

---

## Stages System (`shared/stages/`)

The Stages System is a **Three.js-based 3D rendering engine** that converts LayerData into WebGL-rendered graphics.

### Core Philosophy:
- **Three.js Integration**: Full WebGL capabilities
- **Resource Management**: Automatic cleanup and caching
- **Factory Pattern**: Modular mesh and material creation
- **Performance Focus**: Optimized for real-time rendering

### 🔄 Rendering Flow:
```
LayerData[] 
→ StagesRenderer.setRenderObject() 
→ Mesh Factory 
→ Material Factory 
→ Three.js Scene 
→ WebGL Canvas
```

### 📁 File Structure:

#### **Core Engine**
- **`StagesEngine.ts`** - Main engine coordinator
- **`StagesRenderer.ts`** - Three.js scene and render management
- **`StagesTypes.ts`** - Type definitions for 3D objects

#### **Event System**
- **`StagesEngineEvents.ts`** - Event handling and user interaction
- **`StagesEngineObjects.ts`** - Object lifecycle management

#### **Logic Modules**
- **`StagesLogic.ts`** - Main logic coordinator
- **`StagesLogicDevice.ts`** - Device capability detection
- **`StagesLogicPerformance.ts`** - Performance monitoring
- **`StagesLogicTransform.ts`** - 3D transform calculations

#### **Rendering Factories**
- **`StagesRendererMesh.ts`** - Mesh creation and management
- **`StagesRendererMaterial.ts`** - Material creation and caching

### 🎯 Key Concepts:

#### **Render Quality System**
```typescript
interface RenderQuality {
  dpr: number;        // Device pixel ratio
  antialias: boolean; // Anti-aliasing
  shadows: boolean;   // Shadow rendering
  textureScale: number; // Texture resolution scale
}
```

#### **Object Types Supported**
- **Sprites**: 2D images with transparency
- **Shapes**: Circles, rectangles, lines
- **Text**: Text rendering (extensible)
- **Particles**: Particle systems
- **Characters**: Game character meshes
- **Weather**: Rain, snow effects
- **Clock**: Time display objects

#### **Material Types**
- **Basic**: Simple flat colors
- **Lambert/Phong**: Realistic lighting
- **Special Effects**: Glow, water, glass, metal, fire, ice

---

## Integration & Data Flow

### Complete Pipeline:
```typescript
// 1. JSON Input
const config: LibraryConfig = {
  stage: { width: 2048, height: 2048 },
  layers: [
    {
      layerId: "hero",
      imagePath: "/sprites/hero.png",
      position: { x: 100, y: 200 },
      behaviors: {
        spin: { enabled: true, rpm: 30 }
      }
    }
  ]
};

// 2. Layer Processing
const context: ProcessingContext = {
  stage: normalizedStage,
  time: Date.now() / 1000,
  registry: assetRegistry
};

const result = produceLayers(config, context);
// → { layers: LayerData[], warnings: string[] }

// 3. Stages Rendering
const renderer = new StagesRenderer(logic);
await renderer.initialize(quality);

result.layers.forEach(layerData => {
  const stageObject: StageObject = convertLayerDataToStageObject(layerData);
  renderer.setRenderObject(stageObject);
});

renderer.start(); // Begin render loop
```

### Data Transformation:
```
JSON Config → LayerData → StageObject → Three.js Mesh → WebGL
```

---

## File Structure Reference

### Complete Directory Structure:
```
shared/
├── layer/                      # Animation Logic Engine
│   ├── LayerTypes.ts          # Core type definitions
│   ├── LayerValidator.ts      # Input validation & normalization
│   ├── LayerConverter.ts      # UI conversion utilities
│   ├── LayerProducer.ts       # Main orchestrator
│   ├── LayerPipeline.ts       # Modular composer
│   ├── LayerLogicBasic.ts     # Basic transforms
│   ├── LayerLogicSpin.ts      # Rotation behavior
│   ├── LayerLogicOrbit.ts     # Orbital motion
│   ├── LayerLogicPulse.ts     # Scale animation
│   ├── LayerLogicFade.ts      # Opacity animation
│   ├── LayerImageResolver.ts  # Asset resolution
│   ├── LayerMappingImage.ts   # Image mapping
│   ├── LayerMappingScreen.ts  # Coordinate mapping
│   └── test/                  # Comprehensive test suite
└── stages/                     # 3D Rendering Engine
    ├── StagesTypes.ts         # 3D object type definitions
    ├── StagesEngine.ts        # Main engine
    ├── StagesRenderer.ts      # Three.js renderer
    ├── StagesLogic.ts         # Logic coordinator
    ├── StagesLogicDevice.ts   # Device detection
    ├── StagesLogicPerformance.ts # Performance monitoring
    ├── StagesLogicTransform.ts   # Transform calculations
    ├── StagesEngineEvents.ts     # Event system
    ├── StagesEngineObjects.ts    # Object management
    ├── StagesRendererMesh.ts     # Mesh factory
    └── StagesRendererMaterial.ts # Material factory
```

### File Responsibilities:

#### Layer System Files:
| File | Purpose | Modifiable by AI |
|------|---------|------------------|
| `LayerTypes.ts` | Type definitions | ⚠️ Carefully |
| `LayerValidator.ts` | Input validation | ⚠️ Carefully |
| `LayerProducer.ts` | Main pipeline | ⚠️ Carefully |
| `LayerLogic*.ts` | Behavior implementations | ✅ Yes |
| `LayerConverter.ts` | UI utilities | ✅ Yes |
| `LayerMapping*.ts` | Coordinate utilities | ✅ Yes |

#### Stages System Files:
| File | Purpose | Modifiable by AI |
|------|---------|------------------|
| `StagesRenderer.ts` | Core renderer | ❌ Stable (marked as PARENT) |
| `StagesRendererMesh.ts` | Mesh factory | ✅ Yes (marked as Child) |
| `StagesRendererMaterial.ts` | Material factory | ✅ Yes (marked as Child) |
| `StagesLogic*.ts` | Logic modules | ✅ Yes |
| `StagesEngine*.ts` | Engine modules | ✅ Yes |

---

## Types & Interfaces

### Core Layer Types:

```typescript
// Basic geometric types
interface Vec2 { x: number; y: number; }
type Direction = "cw" | "ccw";
type FitMode = "contain" | "cover" | "stretch";

// Animation behaviors
interface SpinConfig {
  enabled: boolean;
  rpm: number;
  direction: Direction;
}

interface OrbitConfig {
  enabled: boolean;
  rpm: number;
  radius: number;
  center?: Vec2;
}

// Main data structures
interface LayerConfig {        // Input JSON
  layerId: string;
  imagePath?: string;
  registryKey?: string;
  position?: Vec2;
  scale?: number | Vec2;
  angle?: number;
  behaviors?: BehaviorsConfig;
  // ... more properties
}

interface LayerData {          // Output for renderer
  id: string;
  zIndex: number;
  asset: AssetRef;
  transform: {
    position: Vec2;
    scale: Vec2;
    angle: number;
    opacity: number;
  };
  behaviors: BehaviorsConfigNormalized;
  state: {
    isVisible: boolean;
    isHovered: boolean;
    // ... more state
  };
}
```

### Core Stages Types:

```typescript
interface StageObject {        // 3D object representation
  id: string;
  position: [number, number, number];
  rotation: number | [number, number, number];
  scale: number | [number, number, number];
  visible: boolean;
  metadata?: {
    type: string;
    width?: number;
    height?: number;
    color?: number;
    texture?: string;
    // ... more properties
  };
}

interface RenderQuality {
  dpr: number;
  antialias: boolean;
  shadows: boolean;
  textureScale: number;
}
```

---

## Usage Examples

### Example 1: Basic Layer Animation
```typescript
import { produceLayers } from './shared/layer/LayerProducer';

const config = {
  stage: { width: 1920, height: 1080 },
  layers: [
    {
      layerId: "rotating-logo",
      imagePath: "/assets/logo.png",
      position: { x: 960, y: 540 },
      behaviors: {
        spin: { enabled: true, rpm: 10, direction: "cw" },
        pulse: { enabled: true, amplitude: 0.2, rpm: 5 }
      }
    }
  ]
};

const context = {
  stage: { width: 1920, height: 1080, origin: "center" },
  time: performance.now() / 1000,
  registry: new Map()
};

const result = produceLayers(config, context);
console.log(result.layers); // LayerData[]
```

### Example 2: 3D Rendering Setup
```typescript
import { StagesRenderer } from './shared/stages/StagesRenderer';
import { StagesLogic } from './shared/stages/StagesLogic';

const logic = new StagesLogic();
const renderer = new StagesRenderer(logic);

const quality = {
  dpr: window.devicePixelRatio,
  antialias: true,
  shadows: false,
  textureScale: 1.0
};

const canvas = await renderer.initialize(quality);
document.body.appendChild(canvas);

// Convert LayerData to StageObject
const stageObject = {
  id: layerData.id,
  position: [layerData.transform.position.x, layerData.transform.position.y, 0],
  rotation: layerData.transform.angle,
  scale: layerData.transform.scale.x,
  visible: layerData.state.isVisible,
  metadata: {
    type: "sprite",
    texture: layerData.asset.type === "path" ? layerData.asset.path : undefined
  }
};

renderer.setRenderObject(stageObject);
renderer.start();
```

### Example 3: Custom Material Creation
```typescript
import { StagesRendererMaterial } from './shared/stages/StagesRendererMaterial';

const materialFactory = new StagesRendererMaterial();

// Create glow effect
const glowMaterial = materialFactory.createMaterial("glow", {
  color: 0x00ffff,
  opacity: 0.8
});

// Create animated fire material
const fireMaterial = materialFactory.createAnimatedMaterial("fire", {
  color: 0xff4400
}, {
  type: "color-cycle",
  speed: 2.0
});
```

---

## Development Guidelines

### For AI Agents Working on This System:

#### ✅ **Safe to Modify:**
- All `LayerLogic*.ts` files - Add new animation behaviors
- `StagesRendererMesh.ts` - Add new mesh types and rendering methods
- `StagesRendererMaterial.ts` - Add new materials and visual effects
- `StagesLogic*.ts` files - Enhance logic modules
- Test files - Always add comprehensive tests

#### ⚠️ **Modify Carefully:**
- `LayerTypes.ts` - Only add new types, don't break existing ones
- `LayerValidator.ts` - Maintain backward compatibility
- `LayerProducer.ts` - Core pipeline, test thoroughly

#### ❌ **Do Not Modify:**
- `StagesRenderer.ts` - Marked as PARENT/STABLE in comments
- File structure - Don't rename or move files without updating imports

#### **Adding New Animation Behaviors:**
1. Create new file: `LayerLogic[BehaviorName].ts`
2. Follow the pattern: `apply[BehaviorName](prev, config, time)`
3. Add types to `LayerTypes.ts`
4. Update `LayerValidator.ts` for validation
5. Integration in `LayerProducer.ts` and `LayerPipeline.ts`
6. Write comprehensive tests

#### **Adding New Mesh Types:**
1. Add case in `StagesRendererMesh.createFromObject()`
2. Implement `create[MeshType]()` method
3. Add metadata types to `StagesTypes.ts`
4. Test with various configurations

### Code Quality Standards:
- **TypeScript Strict Mode**: All code must pass `tsc --strict`
- **ESLint**: Follow configured rules, use `import type` for types
- **Prettier**: Consistent formatting required
- **Testing**: Unit tests for all public functions
- **Documentation**: JSDoc comments for all public APIs

### Performance Guidelines:
- **Caching**: Use Maps for frequently accessed data
- **Resource Cleanup**: Always dispose Three.js resources
- **Batching**: Group similar operations
- **Time Complexity**: O(n) operations preferred, avoid O(n²)

---

## Error Handling

### Layer System Errors:
```typescript
// Validation errors are collected and returned
interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];    // Blocking errors
  warnings: ValidationIssue[]; // Non-blocking issues
  normalized?: LibraryConfigNormalized;
}

// Error codes for different categories
const ERROR_CODES = {
  'layer.id.missing': 'Layer ID is required',
  'layer.asset.invalid': 'Must specify either imagePath or registryKey',
  'behavior.spin.range': 'RPM should be >= 0'
};
```

### Stages System Errors:
```typescript
// Runtime errors with graceful degradation
try {
  const mesh = meshFactory.createFromObject(object);
  scene.add(mesh);
} catch (error) {
  console.warn(`Failed to create mesh for ${object.id}:`, error);
  // Fallback to default mesh
  const defaultMesh = meshFactory.createDefaultMesh(object);
  scene.add(defaultMesh);
}
```

### Error Recovery Strategies:
- **Validation Failures**: Return detailed error messages
- **Asset Loading**: Fallback to default assets
- **WebGL Errors**: Graceful degradation to simpler rendering
- **Performance Issues**: Automatic quality reduction

---

## Performance Considerations

### Layer System Optimization:
- **Pure Functions**: No side effects enable caching
- **Immutable Data**: Prevent accidental mutations
- **Minimal Allocations**: Reuse objects where possible
- **Early Returns**: Skip disabled behaviors

### Stages System Optimization:
- **Object Pooling**: Reuse Three.js objects
- **Texture Caching**: Share textures between materials
- **Frustum Culling**: Don't render off-screen objects
- **LOD (Level of Detail)**: Reduce quality for distant objects
- **Batch Rendering**: Group similar objects

### Memory Management:
```typescript
// Always dispose resources
renderer.dispose(); // Cleans up all Three.js resources
materialFactory.dispose(); // Cleans up materials and textures
meshFactory.clearCache(); // Cleans up cached meshes
```

### Performance Monitoring:
```typescript
const stats = renderer.getStats();
console.log({
  renderObjects: stats.renderObjects,
  cachedMaterials: stats.materialFactory.cachedMaterials,
  fps: logic.getPerformanceStats().fps
});
```

---

## Conclusion

This Graphics System provides a robust, type-safe, and performant foundation for web-based animations and 3D rendering. The clear separation between logic (Layer) and rendering (Stages) allows for independent development and testing of each component.

### Key Strengths:
- **Type Safety**: Full TypeScript coverage with strict mode
- **Modularity**: Clean separation of concerns
- **Performance**: Optimized for real-time rendering
- **Extensibility**: Easy to add new behaviors and rendering types
- **Testability**: Pure functions and comprehensive test coverage

### Next Steps for AI Agents:
1. Understand the data flow: JSON → LayerData → StageObject → WebGL
2. Follow the modular patterns when adding features
3. Maintain type safety and test coverage
4. Respect the stable/modifiable file guidelines
5. Focus on performance and resource management

This documentation should provide everything needed to work effectively with this graphics system. Happy coding! 🎨✨