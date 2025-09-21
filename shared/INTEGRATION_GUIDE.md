# Layer & Stages Integration Guide
## Complete System Integration Documentation

### 🎯 Overview

This guide explains how the **Layer System** (animation logic) and **Stages System** (3D rendering) work together to create a complete graphics pipeline.

```
┌─────────────────────────────────────────────────────────┐
│                 COMPLETE PIPELINE                       │
├─────────────────────────────────────────────────────────┤
│ JSON Config                                             │
│ ↓                                                       │
│ 🧠 LAYER SYSTEM (shared/layer/)                        │
│ ├─ Validation & Normalization                          │
│ ├─ Animation Behaviors                                  │
│ └─ LayerData[] Output                                   │
│ ↓                                                       │
│ 🔄 DATA CONVERSION                                      │
│ └─ LayerData → StageObject                             │
│ ↓                                                       │
│ 🎨 STAGES SYSTEM (shared/stages/)                      │
│ ├─ Three.js Rendering                                  │
│ ├─ Mesh & Material Factories                           │
│ └─ WebGL Canvas Output                                  │
└─────────────────────────────────────────────────────────┘
```

### 🔄 Data Flow Integration

#### **Step 1: Layer Processing**
```typescript
import { produceLayers } from './shared/layer/LayerProducer';

// Input: JSON configuration
const layerConfig: LibraryConfig = {
  stage: { width: 1920, height: 1080, origin: "center" },
  layers: [
    {
      layerId: "hero-sprite",
      imagePath: "/assets/hero.png",
      position: { x: 100, y: 200 },
      scale: 1.5,
      behaviors: {
        spin: { enabled: true, rpm: 30, direction: "cw" },
        pulse: { enabled: true, amplitude: 0.2, rpm: 10 }
      }
    }
  ]
};

// Processing context
const context: ProcessingContext = {
  stage: { width: 1920, height: 1080, origin: "center" },
  time: performance.now() / 1000, // Current time in seconds
  registry: new Map()
};

// Process through Layer System
const layerResult = produceLayers(layerConfig, context);
// Output: { layers: LayerData[], warnings: string[] }
```

#### **Step 2: Data Conversion**
```typescript
// Convert LayerData to StageObject
function convertLayerDataToStageObject(layerData: LayerData): StageObject {
  return {
    id: layerData.id,
    position: [
      layerData.transform.position.x,
      layerData.transform.position.y,
      0 // Z coordinate for 3D
    ],
    rotation: layerData.transform.angle * (Math.PI / 180), // Convert degrees to radians
    scale: [
      layerData.transform.scale.x,
      layerData.transform.scale.y,
      1.0
    ],
    visible: layerData.state.isVisible,
    metadata: {
      type: determineObjectType(layerData.asset),
      texture: layerData.asset.type === "path" ? layerData.asset.path : undefined,
      opacity: layerData.transform.opacity,
      // Additional metadata based on layer configuration
    }
  };
}

function determineObjectType(asset: AssetRef): string {
  if (asset.type === "path" && asset.path.match(/\.(png|jpg|jpeg|gif)$/i)) {
    return "sprite";
  }
  return "rectangle"; // Default fallback
}
```

#### **Step 3: Stages Rendering**
```typescript
import { StagesRenderer } from './shared/stages/StagesRenderer';
import { StagesLogic } from './shared/stages/StagesLogic';

// Initialize Stages System
const logic = new StagesLogic();
const renderer = new StagesRenderer(logic);

const quality: RenderQuality = {
  dpr: window.devicePixelRatio,
  antialias: true,
  shadows: false,
  textureScale: 1.0
};

const canvas = await renderer.initialize(quality);
document.body.appendChild(canvas);

// Convert and render LayerData
layerResult.layers.forEach(layerData => {
  const stageObject = convertLayerDataToStageObject(layerData);
  renderer.setRenderObject(stageObject);
});

// Start render loop
renderer.start();
```

### 🎮 Complete Integration Example

#### **Full Application Setup**
```typescript
class GraphicsApplication {
  private layerConfig: LibraryConfig;
  private renderer: StagesRenderer;
  private logic: StagesLogic;
  private animationId: number | null = null;
  
  constructor(config: LibraryConfig) {
    this.layerConfig = config;
    this.logic = new StagesLogic();
    this.renderer = new StagesRenderer(this.logic);
  }
  
  async initialize(container: HTMLElement): Promise<void> {
    // Initialize renderer
    const quality: RenderQuality = {
      dpr: window.devicePixelRatio,
      antialias: true,
      shadows: false,
      textureScale: 1.0
    };
    
    const canvas = await this.renderer.initialize(quality);
    container.appendChild(canvas);
    
    // Start animation loop
    this.startAnimationLoop();
  }
  
  private startAnimationLoop(): void {
    const animate = () => {
      // Update time
      const currentTime = performance.now() / 1000;
      
      // Process layers with current time
      const context: ProcessingContext = {
        stage: this.getStageConfig(),
        time: currentTime,
        registry: this.getAssetRegistry()
      };
      
      const layerResult = produceLayers(this.layerConfig, context);
      
      // Update renderer with new data
      layerResult.layers.forEach(layerData => {
        const stageObject = this.convertToStageObject(layerData);
        this.renderer.updateRenderObject(stageObject);
      });
      
      // Continue animation
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  private convertToStageObject(layerData: LayerData): StageObject {
    return {
      id: layerData.id,
      position: [
        layerData.transform.position.x,
        layerData.transform.position.y,
        0
      ],
      rotation: layerData.transform.angle * (Math.PI / 180),
      scale: layerData.transform.scale.x, // Uniform scale
      visible: layerData.state.isVisible && layerData.transform.opacity > 0,
      metadata: {
        type: this.determineObjectType(layerData),
        texture: this.resolveAssetPath(layerData.asset),
        opacity: layerData.transform.opacity,
        width: layerData.container?.width,
        height: layerData.container?.height
      }
    };
  }
  
  private determineObjectType(layerData: LayerData): string {
    if (layerData.asset.type === "path") {
      const extension = layerData.asset.path.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) {
        return "sprite";
      }
    }
    return "rectangle";
  }
  
  private resolveAssetPath(asset: AssetRef): string | undefined {
    if (asset.type === "path") {
      return asset.path;
    } else if (asset.type === "registry") {
      const registryEntry = this.getAssetRegistry().get(asset.key);
      return registryEntry?.src;
    }
    return undefined;
  }
  
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
  }
}

// Usage
const app = new GraphicsApplication({
  stage: { width: 1920, height: 1080 },
  layers: [
    {
      layerId: "animated-logo",
      imagePath: "/logo.png",
      position: { x: 0, y: 0 },
      behaviors: {
        spin: { enabled: true, rpm: 20 },
        pulse: { enabled: true, amplitude: 0.1, rpm: 5 }
      }
    }
  ]
});

await app.initialize(document.getElementById('graphics-container')!);
```

### 🔧 Advanced Integration Patterns

#### **Event System Integration**
```typescript
import { StagesEngineEvents } from './shared/stages/StagesEngineEvents';

class InteractiveGraphicsApp extends GraphicsApplication {
  private eventHandler: StagesEngineEvents;
  
  async initialize(container: HTMLElement): Promise<void> {
    await super.initialize(container);
    
    // Setup event handling
    this.eventHandler = new StagesEngineEvents(this.renderer);
    
    // Handle object interactions
    this.eventHandler.onObjectClick = (objectId: string) => {
      this.handleObjectClick(objectId);
    };
    
    this.eventHandler.onObjectHover = (objectId: string, isHovering: boolean) => {
      this.handleObjectHover(objectId, isHovering);
    };
  }
  
  private handleObjectClick(objectId: string): void {
    // Update layer configuration to trigger animation
    const layer = this.layerConfig.layers.find(l => l.layerId === objectId);
    if (layer && layer.behaviors) {
      // Trigger spin animation on click
      layer.behaviors.spin = {
        enabled: true,
        rpm: 60,
        direction: "cw"
      };
    }
  }
  
  private handleObjectHover(objectId: string, isHovering: boolean): void {
    // Update object state for hover effects
    const layer = this.layerConfig.layers.find(l => l.layerId === objectId);
    if (layer && layer.behaviors) {
      // Scale up on hover
      layer.behaviors.pulse = {
        enabled: isHovering,
        amplitude: 0.2,
        rpm: 30
      };
    }
  }
}
```

#### **Performance Optimization Integration**
```typescript
import { StagesLogicPerformance } from './shared/stages/StagesLogicPerformance';

class OptimizedGraphicsApp extends GraphicsApplication {
  private performanceMonitor: StagesLogicPerformance;
  
  async initialize(container: HTMLElement): Promise<void> {
    await super.initialize(container);
    
    this.performanceMonitor = new StagesLogicPerformance();
    
    // Monitor performance and adjust quality
    setInterval(() => {
      const stats = this.performanceMonitor.getStats();
      this.adjustQualityBasedOnPerformance(stats);
    }, 1000);
  }
  
  private adjustQualityBasedOnPerformance(stats: any): void {
    if (stats.averageFPS < 30) {
      // Reduce quality for better performance
      this.renderer.updateQuality({
        dpr: 1.0,
        antialias: false,
        shadows: false,
        textureScale: 0.5
      });
    } else if (stats.averageFPS > 55) {
      // Increase quality when performance allows
      this.renderer.updateQuality({
        dpr: window.devicePixelRatio,
        antialias: true,
        shadows: true,
        textureScale: 1.0
      });
    }
  }
}
```

### 🎨 Custom Object Integration

#### **Adding Custom Object Types**
```typescript
// 1. Define custom LayerData metadata
interface CustomLayerMetadata {
  customType: "particle-emitter" | "text-display" | "progress-bar";
  particleCount?: number;
  text?: string;
  progress?: number;
}

// 2. Extend conversion logic
function convertCustomLayerData(layerData: LayerData): StageObject {
  const metadata = layerData.metadata as CustomLayerMetadata;
  
  return {
    id: layerData.id,
    position: [layerData.transform.position.x, layerData.transform.position.y, 0],
    rotation: layerData.transform.angle,
    scale: layerData.transform.scale.x,
    visible: layerData.state.isVisible,
    metadata: {
      type: metadata.customType,
      particleCount: metadata.particleCount,
      text: metadata.text,
      progress: metadata.progress,
      color: 0xffffff // Default color
    }
  };
}

// 3. Extend StagesRendererMesh to handle custom types
// (Add to StagesRendererMesh.createFromObject method)
case "particle-emitter":
  return this.createParticleEmitter(object);
case "text-display":
  return this.createTextDisplay(object);
case "progress-bar":
  return this.createProgressBar(object);
```

### 🧪 Testing Integration

#### **Integration Tests**
```typescript
describe('Layer-Stages Integration', () => {
  let app: GraphicsApplication;
  
  beforeEach(() => {
    app = new GraphicsApplication(testConfig);
  });
  
  afterEach(() => {
    app.dispose();
  });
  
  it('should render animated objects correctly', async () => {
    const container = document.createElement('div');
    await app.initialize(container);
    
    // Verify canvas is created
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Verify objects are in scene
    const stats = app.getRenderer().getStats();
    expect(stats.renderObjects).toBeGreaterThan(0);
  });
  
  it('should handle animation updates', async () => {
    await app.initialize(document.createElement('div'));
    
    // Simulate time progression
    jest.advanceTimersByTime(1000);
    
    // Verify animations are applied
    const layerResult = produceLayers(testConfig, {
      time: 1.0,
      stage: testStage,
      registry: new Map()
    });
    
    expect(layerResult.layers[0].transform.angle).not.toBe(0);
  });
});
```

### 🚀 Performance Best Practices

#### **Optimization Strategies**
1. **Batch Updates**: Group multiple object updates
2. **Conditional Rendering**: Skip invisible objects
3. **LOD (Level of Detail)**: Reduce complexity for distant objects
4. **Asset Preloading**: Load textures before rendering
5. **Memory Management**: Dispose unused objects

```typescript
class OptimizedIntegration {
  private updateBatch: Map<string, LayerData> = new Map();
  private batchTimeout: number | null = null;
  
  updateObject(layerData: LayerData): void {
    // Batch updates to reduce render calls
    this.updateBatch.set(layerData.id, layerData);
    
    if (this.batchTimeout === null) {
      this.batchTimeout = setTimeout(() => {
        this.processBatchUpdates();
        this.batchTimeout = null;
      }, 16); // ~60fps
    }
  }
  
  private processBatchUpdates(): void {
    for (const [id, layerData] of this.updateBatch) {
      if (this.isObjectVisible(layerData)) {
        const stageObject = this.convertToStageObject(layerData);
        this.renderer.updateRenderObject(stageObject);
      }
    }
    this.updateBatch.clear();
  }
  
  private isObjectVisible(layerData: LayerData): boolean {
    return layerData.state.isVisible && 
           layerData.transform.opacity > 0.01 &&
           this.isInViewport(layerData.transform.position);
  }
}
```

### 🔮 Future Extension Points

#### **Planned Enhancements**
1. **Physics Integration**: Box2D/Cannon.js integration
2. **Audio Sync**: Audio-reactive animations
3. **Post-Processing**: Bloom, blur, color grading effects
4. **VR/AR Support**: WebXR integration
5. **Networking**: Multi-user synchronization

#### **Plugin Architecture**
```typescript
interface GraphicsPlugin {
  name: string;
  version: string;
  initialize(app: GraphicsApplication): void;
  update(deltaTime: number): void;
  dispose(): void;
}

class PhysicsPlugin implements GraphicsPlugin {
  name = "physics";
  version = "1.0.0";
  
  initialize(app: GraphicsApplication): void {
    // Setup physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
  }
  
  update(deltaTime: number): void {
    this.world.step(deltaTime);
    // Update layer positions from physics
  }
}
```

---

This integration guide provides a complete framework for combining the Layer and Stages systems into powerful graphics applications. The modular design allows for easy extension and customization while maintaining performance and type safety.