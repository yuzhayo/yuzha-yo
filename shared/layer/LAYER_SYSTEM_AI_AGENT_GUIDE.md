# Layer System Workflow - AI Agent Comprehensive Guide

## 🎯 Quick Start for AI Agents

This guide provides everything an AI agent needs to understand and work with the Layer System. If you know nothing about this system, reading this document will give you complete understanding and ability to use it effectively.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Core Concepts](#core-concepts)
3. [Data Flow & Architecture](#data-flow--architecture)
4. [File Structure & Responsibilities](#file-structure--responsibilities)
5. [Type System & Interfaces](#type-system--interfaces)
6. [Animation Behaviors](#animation-behaviors)
7. [Pipeline Workflow](#pipeline-workflow)
8. [Practical Usage Examples](#practical-usage-examples)
9. [Common Patterns](#common-patterns)
10. [Error Handling](#error-handling)
11. [Extension Points](#extension-points)
12. [Testing Strategy](#testing-strategy)
13. [Performance Considerations](#performance-considerations)

---

## System Overview

The **Layer System** is a pure, functional animation logic engine that processes JSON configurations into renderable data structures. It's designed to be:

- **Pure & Deterministic**: No side effects, same input = same output
- **Time-based**: All animations driven by time parameter (seconds)
- **Type-safe**: Full TypeScript with strict typing
- **Modular**: Each component can work independently
- **Extensible**: Easy to add new animation behaviors

### What It Does
```
JSON Configuration → Validation → Animation Logic → LayerData Output
```

### What It Doesn't Do
- **No Rendering**: Produces data for rendering systems
- **No I/O**: Pure functions only, no file operations
- **No UI**: Logic only, UI concerns handled elsewhere

---

## Core Concepts

### 1. **LibraryConfig** (Input)
The raw JSON configuration that describes what you want to animate:

```typescript
interface LibraryConfig {
  stage?: StageConfig;           // Canvas dimensions
  layers: LayerConfig[];         // Array of things to animate
}

interface LayerConfig {
  layerId: string;               // Unique identifier
  imagePath?: string;            // Path to image asset
  registryKey?: string;          // OR reference to asset registry
  
  position?: Vec2;               // Where to place it (pixels)
  scale?: number | Vec2;         // How big it should be
  angle?: number;                // Initial rotation (degrees)
  tilt?: Vec2;                   // X/Y tilt in degrees
  anchor?: Vec2;                 // Anchor point (0-1 normalized)
  opacity?: number;              // Opacity (0-1)
  
  behaviors?: BehaviorsConfig;   // What animations to apply
  events?: EventHooks;           // Event triggers
  
  layerWidth?: number;           // Layer width in pixels
  layerHeight?: number;          // Layer height in pixels
  fitMode?: FitMode;             // How image fits in layer
  alignment?: Alignment;         // Image alignment in layer
}
```

### 2. **LayerData** (Output)
The processed data ready for rendering:

```typescript
interface LayerData {
  id: string;                    // Unique identifier
  zIndex: number;                // Rendering order
  asset: AssetRef;               // Asset reference (validated, not resolved)
  transform: {                   // Final calculated transforms
    position: Vec2;
    scale: Vec2;
    angle: number;               // In degrees
    tilt: Vec2;                  // X/Y tilt in degrees
    anchor: Vec2;                // Anchor point (0-1 normalized)
    opacity: number;             // 0-1 opacity
  };
  container?: {                  // Image container settings (if layer has dimensions)
    width?: number;
    height?: number;
    fitMode: FitMode;
    alignment: Alignment;
  };
  behaviors: BehaviorsConfigNormalized; // Normalized behavior configs
  events?: EventHooks;           // Event configuration (optional)
  state: {                       // Current state flags
    isHovered: boolean;
    isPressed: boolean;
    isActive: boolean;
    isVisible: boolean;
  };
}
```

### 3. **ProcessingContext**
The runtime context needed for processing:

```typescript
interface ProcessingContext {
  stage: StageConfigNormalized;  // Normalized stage dimensions
  time: number;                  // Current time in seconds
  registry: Map<string, AssetMeta>; // Asset registry lookup
}
```

---

## Data Flow & Architecture

### High-Level Pipeline
```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER SYSTEM PIPELINE                   │
├─────────────────────────────────────────────────────────────┤
│ 1. INPUT: LibraryConfig (JSON)                             │
│    ↓                                                        │
│ 2. VALIDATION: LayerValidator.ts                           │
│    - Validate input structure                               │
│    - Apply defaults                                         │
│    - Normalize data types                                   │
│    ↓                                                        │
│ 3. PROCESSING: LayerProducer.ts                           │
│    ├─ Basic Transform (position, scale, angle)             │
│    ├─ Spin Behavior (rotation animation)                   │
│    ├─ Orbit Behavior (circular motion)                     │
│    ├─ Pulse Behavior (scale animation)                     │
│    └─ Fade Behavior (opacity animation)                    │
│    ↓                                                        │
│ 4. OUTPUT: LayerData[]                                      │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Transform Chain
```
LayerConfigNormalized
      ↓
1. LayerLogicBasic    → Basic transforms (static)
      ↓
2. LayerLogicSpin     → Apply rotation animation
      ↓
3. LayerLogicOrbit    → Apply position animation (circular)
      ↓
4. LayerLogicPulse    → Apply scale animation (breathing)
      ↓
5. LayerLogicFade     → Apply opacity animation
      ↓
   LayerData
```

### Key Design Principles

1. **Order Matters**: Behaviors are applied in strict sequence
2. **Immutability**: Each step creates new objects, no mutations
3. **Time-based**: All animations use `timeSeconds` parameter
4. **Composable**: Can enable/disable individual behaviors
5. **Fallback Safe**: Invalid inputs get reasonable defaults

---

## File Structure & Responsibilities

```
shared/layer/
├── LayerTypes.ts              # Core type definitions (READ FIRST)
├── LayerValidator.ts          # Input validation & normalization
├── LayerProducer.ts           # Main pipeline orchestrator
├── LayerPipeline.ts           # Modular composer for partial pipelines
├── LayerLogicBasic.ts         # Basic transform logic
├── LayerLogicSpin.ts          # Rotation animation behavior
├── LayerLogicOrbit.ts         # Circular motion behavior
├── LayerLogicPulse.ts         # Scale animation behavior
├── LayerLogicFade.ts          # Opacity animation behavior
├── LayerConverter.ts          # UI ↔ JSON conversion utilities
├── LayerImageResolver.ts      # Asset reference resolution
├── LayerMappingImage.ts       # Image-to-container mapping
├── LayerMappingScreen.ts      # Coordinate system conversion
└── test/                      # Comprehensive test suite
```

### File Modification Safety Guide

| File | Purpose | AI Modification Safety |
|------|---------|----------------------|
| `LayerTypes.ts` | Type definitions | ⚠️ **CAREFUL** - Only add new types |
| `LayerValidator.ts` | Validation logic | ⚠️ **CAREFUL** - Maintain compatibility |
| `LayerProducer.ts` | Main pipeline | ⚠️ **CAREFUL** - Core logic, test thoroughly |
| `LayerLogic*.ts` | Behavior logic | ✅ **SAFE** - Add new behaviors freely |
| `LayerConverter.ts` | UI utilities | ✅ **SAFE** - Utility functions |
| `LayerMapping*.ts` | Coordinate utils | ✅ **SAFE** - Utility functions |
| `LayerPipeline.ts` | Modular composer | ✅ **SAFE** - Extensible by design |

---

## Type System & Interfaces

### Basic Types
```typescript
// Geometric primitives
interface Vec2 { x: number; y: number; }
type Direction = "cw" | "ccw";
type StageOrigin = "center" | "top-left";
type FitMode = "contain" | "cover" | "stretch";
type Alignment = "center" | "top-left" | "top" | "top-right" | 
                 "left" | "right" | "bottom-left" | "bottom" | "bottom-right";
```

### Stage Config & Asset System
```typescript
interface StageConfig {
  width?: number;                 // Canvas width (default: 2048)
  height?: number;                // Canvas height (default: 2048)
  origin?: StageOrigin;           // "center" | "top-left" (default: "center")
}

// Two ways to reference assets
type AssetRef = 
  | { type: "path"; path: string; }           // Direct file path
  | { type: "registry"; key: string; };       // Registry lookup

interface AssetMeta {
  src: string;                    // Resolved path
  width: number;                  // Image width (or NaN)
  height: number;                 // Image height (or NaN)
  anchor?: Vec2;                  // Optional anchor override
  dpi?: number;                   // Optional DPI information
}
```

### Behavior Configurations
```typescript
interface SpinConfig {
  enabled: boolean;               // Is this behavior active?
  rpm: number;                    // Rotations per minute
  direction: Direction;           // "cw" or "ccw"
}

interface OrbitConfig {
  enabled: boolean;
  rpm: number;                    // Orbit speed
  radius: number;                 // Orbit radius in pixels
  center?: Vec2;                  // Orbit center (defaults to layer position)
  // Note: Direction not officially supported in TypeScript interface
  // but code supports it via casting: (cfg as { direction?: "cw" | "ccw" })
}

interface PulseConfig {
  enabled: boolean;
  amplitude: number;              // Scale amplitude (e.g., 0.2 = ±20%)
  rpm: number;                    // Pulse frequency
}

interface FadeConfig {
  enabled: boolean;
  from: number;                   // Starting opacity (0-1)
  to: number;                     // Ending opacity (0-1)
  rpm: number;                    // Fade frequency
}
```

### Container System
```typescript
interface ContainerConfig {
  width?: number;                 // Container width
  height?: number;                // Container height
  fitMode: FitMode;              // How image fits in container
  alignment: Alignment;           // Where image aligns in container
}
```

---

## Animation Behaviors

### 1. Basic Transform
**File**: `LayerLogicBasic.ts`
**Purpose**: Applies static transforms (position, scale, rotation, etc.)

```typescript
function applyBasicTransform(
  layer: LayerConfigNormalized,
  stage: StageConfigNormalized
): BasicTransform
```

- **Input**: Normalized layer configuration
- **Output**: Static transform properties
- **Notes**: This is a pass-through that applies defaults

### 2. Spin Behavior
**File**: `LayerLogicSpin.ts`
**Purpose**: Continuous rotation animation

```typescript
function applySpin(
  prev: { angle: number },
  cfg: SpinConfig,
  timeSeconds: number
): { angle: number }
```

- **Logic**: `deltaAngle = (rpm * 360 * timeSeconds) / 60`
- **Direction**: "cw" = positive, "ccw" = negative
- **Accumulative**: Adds to previous angle

### 3. Orbit Behavior
**File**: `LayerLogicOrbit.ts`
**Purpose**: Circular motion around a center point

```typescript
function applyOrbit(
  prev: { position: Vec2 },
  cfg: OrbitConfig,
  timeSeconds: number,
  baseCenter: Vec2
): { position: Vec2 }
```

- **Logic**: Parametric circle equation
- **Center**: Uses config center or falls back to base position
- **Replaces**: Overwrites position entirely

### 4. Pulse Behavior
**File**: `LayerLogicPulse.ts`
**Purpose**: Scale animation (breathing effect)

```typescript
function applyPulse(
  prev: { scale: Vec2 },
  cfg: PulseConfig,
  timeSeconds: number
): { scale: Vec2 }
```

- **Logic**: `scaleMultiplier = 1 + amplitude * sin(phase)`
- **Uniform**: Applies same scale to both X and Y
- **Multiplicative**: Multiplies with previous scale

### 5. Fade Behavior
**File**: `LayerLogicFade.ts`
**Purpose**: Opacity animation

```typescript
function applyFade(
  prev: { opacity: number },
  cfg: FadeConfig,
  timeSeconds: number
): { opacity: number }
```

- **Logic**: Sine wave interpolation between `from` and `to`
- **Range**: Always clamps to 0-1
- **Replaces**: Overwrites previous opacity

---

## Pipeline Workflow

### Main Pipeline: `LayerProducer.ts`

```typescript
import { produceLayers } from './shared/layer/LayerProducer';

// This is the main entry point for processing
function produceLayers(
  input: LibraryConfig,
  ctx: ProcessingContext
): { layers: LayerData[]; warnings: string[] }
```

**Step-by-step process**:

1. **Validation**: `validateLibraryConfig(input)`
   - Validates input structure
   - Applies defaults for missing values
   - Returns normalized configuration

2. **Layer Processing**: For each normalized layer:
   ```typescript
   // Resolve asset to ensure it exists
   resolveAsset(norm.assetRef, ctx.registry);
   
   // Apply transform chain
   const basic = applyBasicTransform(norm, stage);
   const spinRes = applySpin({ angle: basic.angle }, norm.behaviors.spin, ctx.time);
   const orbitRes = applyOrbit({ position: basic.position }, norm.behaviors.orbit, ctx.time, basic.position);
   const pulseRes = applyPulse({ scale: basic.scale }, norm.behaviors.pulse, ctx.time);
   const fadeRes = applyFade({ opacity: basic.opacity }, norm.behaviors.fade, ctx.time);
   ```

3. **Data Assembly**: Combine results into `LayerData`
   - **zIndex**: Set to input array index (stable ordering)
   - **State**: `isVisible: true` in LayerProducer (always visible)

### Modular Pipeline: `LayerPipeline.ts`

For when you need partial processing:

```typescript
import { compose, produceBasic, produceBasicSpin } from './shared/layer/LayerPipeline';

// Create custom pipeline with only specific behaviors
const customPipeline = compose(["spin", "fade"]);
const result = customPipeline(config, context);

// Or use convenience functions
const basicOnly = produceBasic(config, context);      // No animations
const spinOnly = produceBasicSpin(config, context);   // Only spin animation

// Important: LayerPipeline sets isVisible based on opacity
// isVisible = finalTransform.opacity > 0 (differs from LayerProducer)
```

---

## Practical Usage Examples

### Example 1: Simple Spinning Logo
```typescript
import { produceLayers } from './shared/layer/LayerProducer';

const config = {
  stage: { width: 1920, height: 1080, origin: "center" },
  layers: [
    {
      layerId: "company-logo",
      imagePath: "/assets/logo.png",
      position: { x: 0, y: 0 },        // Center of screen
      scale: 1.5,                      // 150% size
      behaviors: {
        spin: { 
          enabled: true, 
          rpm: 20,                     // 20 rotations per minute
          direction: "cw" 
        }
      }
    }
  ]
};

const context = {
  stage: { width: 1920, height: 1080, origin: "center" },
  time: performance.now() / 1000,     // Current time in seconds
  registry: new Map()                 // Empty asset registry
};

const result = produceLayers(config, context);
// result.layers[0] will contain the processed LayerData
```

### Example 2: Complex Animation System
```typescript
const config = {
  stage: { width: 2048, height: 2048, origin: "center" },
  layers: [
    {
      layerId: "center-sun",
      imagePath: "/sprites/sun.png",
      position: { x: 0, y: 0 },
      scale: 2.0,
      behaviors: {
        pulse: { enabled: true, amplitude: 0.1, rpm: 10 }
      }
    },
    {
      layerId: "planet-1",
      imagePath: "/sprites/planet1.png",
      position: { x: 0, y: 0 },       // Will be overridden by orbit
      scale: 0.8,
      behaviors: {
        orbit: { 
          enabled: true, 
          rpm: 5, 
          radius: 300,
          center: { x: 0, y: 0 }      // Orbit around sun
        },
        spin: { enabled: true, rpm: 30, direction: "ccw" }
      }
    },
    {
      layerId: "moon",
      imagePath: "/sprites/moon.png",
      position: { x: 0, y: 0 },
      scale: 0.3,
      behaviors: {
        orbit: { 
          enabled: true, 
          rpm: 20,                    // Faster orbit
          radius: 80,
          center: { x: 300, y: 0 }    // Orbit around planet (approximately)
        }
      }
    }
  ]
};

// Animate the system
function animateSystem() {
  const currentTime = performance.now() / 1000;
  const context = { ...baseContext, time: currentTime };
  const result = produceLayers(config, context);
  
  // Pass result.layers to your renderer
  updateRenderer(result.layers);
  
  requestAnimationFrame(animateSystem);
}
```

### Example 3: Asset Registry Usage
```typescript
// First, set up asset registry
const assetRegistry = new Map([
  ["hero_idle", { 
    src: "/sprites/hero_idle.png", 
    width: 64, 
    height: 64,
    anchor: { x: 0.5, y: 1.0 }        // Bottom-center anchor
  }],
  ["background", { 
    src: "/images/forest_bg.jpg", 
    width: 1920, 
    height: 1080 
  }]
]);

const config = {
  stage: { width: 1920, height: 1080 },
  layers: [
    {
      layerId: "bg",
      registryKey: "background",      // Use registry instead of imagePath
      position: { x: 960, y: 540 },
      scale: 1.0
    },
    {
      layerId: "character",
      registryKey: "hero_idle",
      position: { x: 500, y: 800 },
      behaviors: {
        pulse: { enabled: true, amplitude: 0.05, rpm: 15 }
      }
    }
  ]
};

const context = {
  stage: { width: 1920, height: 1080, origin: "top-left" },
  time: currentTime,
  registry: assetRegistry              // Provide the registry
};
```

### Example 4: Container and Image Fitting
```typescript
const config = {
  stage: { width: 800, height: 600 },
  layers: [
    {
      layerId: "profile-pic",
      imagePath: "/images/user_photo.jpg",
      position: { x: 100, y: 100 },
      container: {
        width: 200,                   // Fixed container size
        height: 200,
        fitMode: "cover",             // Crop to fill container
        alignment: "center"           // Center the image
      },
      behaviors: {
        fade: { 
          enabled: true, 
          from: 0.3, 
          to: 1.0, 
          rpm: 8 
        }
      }
    }
  ]
};
```

---

## Common Patterns

### Pattern 1: Time-based Animation Control
```typescript
// Create smooth entrance animation
function createEntranceAnimation(layerId: string, delaySeconds: number) {
  return {
    layerId,
    imagePath: `/sprites/${layerId}.png`,
    position: { x: 0, y: -200 },      // Start above screen
    scale: 0,                         // Start invisible
    behaviors: {
      // Fade in over 2 seconds
      fade: { enabled: true, from: 0, to: 1, rpm: 30 },
      // Scale up from 0 to normal size
      pulse: { enabled: true, amplitude: 1, rpm: 30 }
    }
  };
}
```

### Pattern 2: Conditional Behavior Activation
```typescript
function createInteractiveLayer(isHovered: boolean) {
  return {
    layerId: "interactive-button",
    imagePath: "/ui/button.png",
    position: { x: 400, y: 300 },
    scale: 1.0,
    behaviors: {
      pulse: { 
        enabled: isHovered,           // Only pulse when hovered
        amplitude: 0.1, 
        rpm: 30 
      },
      spin: { 
        enabled: isHovered, 
        rpm: 60, 
        direction: "cw" 
      }
    }
  };
}
```

### Pattern 3: Layered Animation System
```typescript
// Create background elements with different speeds (parallax effect)
function createParallaxLayers() {
  return [
    {
      layerId: "bg-far",
      imagePath: "/bg/mountains.png",
      position: { x: 0, y: 0 },
      behaviors: {
        // Slow horizontal movement
        orbit: { enabled: true, rpm: 0.5, radius: 100, center: { x: 0, y: 0 } }
      }
    },
    {
      layerId: "bg-mid",
      imagePath: "/bg/trees.png",
      position: { x: 0, y: 0 },
      behaviors: {
        // Medium speed movement
        orbit: { enabled: true, rpm: 1, radius: 200, center: { x: 0, y: 0 } }
      }
    },
    {
      layerId: "bg-near",
      imagePath: "/bg/grass.png",
      position: { x: 0, y: 0 },
      behaviors: {
        // Fast movement for parallax effect
        orbit: { enabled: true, rpm: 2, radius: 300, center: { x: 0, y: 0 } }
      }
    }
  ];
}
```

### Pattern 4: Asset Registry Management
```typescript
class AssetManager {
  private registry = new Map<string, AssetMeta>();
  
  async loadAsset(key: string, path: string): Promise<void> {
    try {
      // Load image to get dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = path;
      });
      
      // Add to registry
      this.registry.set(key, {
        src: path,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    } catch (error) {
      console.warn(`Failed to load asset ${key}:`, error);
      // Add placeholder
      this.registry.set(key, {
        src: path,
        width: NaN,
        height: NaN
      });
    }
  }
  
  getRegistry(): Map<string, AssetMeta> {
    return this.registry;
  }
}
```

---

## Error Handling

### Validation Errors
The `LayerValidator` returns detailed error information:

```typescript
interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];      // Blocking errors
  warnings: ValidationIssue[];    // Non-blocking issues
  normalized?: LibraryConfigNormalized;
}

interface ValidationIssue {
  code: string;                   // Error code for programmatic handling
  path: string;                   // JSON path where error occurred
  message: string;                // Human-readable message
  severity: "error" | "warning";
}
```

**Example error handling**:
```typescript
const result = validateLibraryConfig(input);
if (!result.ok) {
  // Handle validation errors
  result.errors.forEach(error => {
    console.error(`Validation error at ${error.path}: ${error.message}`);
  });
  return; // Don't proceed with invalid config
}

// Log warnings but continue
result.warnings.forEach(warning => {
  console.warn(`Warning at ${warning.path}: ${warning.message}`);
});

// Safe to use result.normalized
const layerData = produceLayers(result.normalized, context);
```

### Runtime Error Recovery
```typescript
function safeProduceLayers(config: LibraryConfig, context: ProcessingContext) {
  try {
    return produceLayers(config, context);
  } catch (error) {
    console.error('Layer production failed:', error);
    
    // Return empty result as fallback
    return {
      layers: [],
      warnings: [`Production failed: ${error.message}`]
    };
  }
}
```

### Asset Resolution Errors
```typescript
// LayerImageResolver throws on missing registry keys
try {
  const asset = resolveAsset(assetRef, registry);
} catch (error) {
  if (error.message.includes('not found')) {
    // Provide fallback asset
    return {
      src: '/assets/placeholder.png',
      width: 64,
      height: 64
    };
  }
  throw error; // Re-throw unexpected errors
}
```

---

## Extension Points

### Adding New Animation Behaviors

**Step 1**: Create behavior logic file
```typescript
// LayerLogicBounce.ts
interface BounceConfig {
  enabled: boolean;
  height: number;        // Bounce height in pixels
  rpm: number;           // Bounce frequency
}

export function applyBounce(
  prev: { position: Vec2 },
  cfg: BounceConfig,
  timeSeconds: number,
  basePosition: Vec2
): { position: Vec2 } {
  if (!cfg.enabled || cfg.rpm <= 0 || cfg.height <= 0) {
    return { position: { ...prev.position } };
  }
  
  const phase = (2 * Math.PI * cfg.rpm * timeSeconds) / 60;
  const bounceOffset = Math.abs(Math.sin(phase)) * cfg.height;
  
  return {
    position: {
      x: prev.position.x,
      y: basePosition.y - bounceOffset    // Bounce upward
    }
  };
}
```

**Step 2**: Add types to `LayerTypes.ts`
```typescript
// Add to BehaviorsConfig interface
interface BehaviorsConfig {
  spin?: Partial<SpinConfig>;
  orbit?: Partial<OrbitConfig>;
  pulse?: Partial<PulseConfig>;
  fade?: Partial<FadeConfig>;
  bounce?: Partial<BounceConfig>;     // Add this line
}

// Add to normalized version
interface BehaviorsConfigNormalized {
  spin: SpinConfig;
  orbit: OrbitConfig;
  pulse: PulseConfig;
  fade: FadeConfig;
  bounce: BounceConfig;               // Add this line
}
```

**Step 3**: Update validator defaults
```typescript
// In LayerValidator.ts, add to DEFAULT_BEHAVIORS
const DEFAULT_BEHAVIORS: BehaviorsConfigNormalized = {
  spin: { enabled: false, rpm: 0, direction: "cw" },
  orbit: { enabled: false, rpm: 0, radius: 0 },
  pulse: { enabled: false, amplitude: 0, rpm: 0 },
  fade: { enabled: false, from: 1, to: 1, rpm: 0 },
  bounce: { enabled: false, height: 0, rpm: 0 },  // Add this line
};
```

**Step 4**: Integrate in pipeline
```typescript
// In LayerProducer.ts, add to transform chain
const bounceRes = applyBounce(
  { position: orbitRes.position },  // After orbit
  norm.behaviors.bounce,
  ctx.time,
  basic.position
);

const finalTransform = {
  position: bounceRes.position,      // Use bounce result
  scale: pulseRes.scale,
  angle: spinRes.angle,
  // ... rest of properties
};
```

### Adding Custom Mesh Types

If you're integrating with a rendering system, you can extend how LayerData gets converted:

```typescript
function convertLayerDataToStageObject(layerData: LayerData): StageObject {
  // Determine object type based on asset or metadata
  let objectType = "sprite"; // default
  
  if (layerData.asset.type === "path") {
    const extension = layerData.asset.path.split('.').pop()?.toLowerCase();
    if (extension === "svg") {
      objectType = "vector";
    } else if (["mp4", "webm"].includes(extension || "")) {
      objectType = "video";
    }
  }
  
  return {
    id: layerData.id,
    position: [
      layerData.transform.position.x,
      layerData.transform.position.y,
      0
    ],
    rotation: layerData.transform.angle * (Math.PI / 180), // Convert to radians
    scale: layerData.transform.scale.x,
    visible: layerData.state.isVisible,
    metadata: {
      type: objectType,
      texture: layerData.asset.type === "path" ? layerData.asset.path : undefined,
      opacity: layerData.transform.opacity,
      // Add any custom properties your renderer needs
    }
  };
}
```

---

## Testing Strategy

### Unit Testing Individual Behaviors
```typescript
// Example test for spin behavior
describe('LayerLogicSpin', () => {
  it('should rotate clockwise over time', () => {
    const prev = { angle: 0 };
    const config = { enabled: true, rpm: 60, direction: "cw" as const };
    
    // After 1 second at 60 RPM, should complete 1 full rotation
    const result = applySpin(prev, config, 1.0);
    
    expect(result.angle).toBe(360);
  });
  
  it('should handle disabled behavior', () => {
    const prev = { angle: 45 };
    const config = { enabled: false, rpm: 60, direction: "cw" as const };
    
    const result = applySpin(prev, config, 1.0);
    
    expect(result.angle).toBe(45); // Unchanged
  });
});
```

### Integration Testing
```typescript
describe('Layer Pipeline Integration', () => {
  it('should process complete animation config', () => {
    const config = {
      stage: { width: 800, height: 600 },
      layers: [{
        layerId: "test",
        imagePath: "/test.png",
        position: { x: 100, y: 100 },
        behaviors: {
          spin: { enabled: true, rpm: 30, direction: "cw" },
          pulse: { enabled: true, amplitude: 0.2, rpm: 10 }
        }
      }]
    };
    
    const context = {
      stage: { width: 800, height: 600, origin: "center" },
      time: 0.5, // Half second
      registry: new Map()
    };
    
    const result = produceLayers(config, context);
    
    expect(result.layers).toHaveLength(1);
    expect(result.layers[0].id).toBe("test");
    expect(result.layers[0].transform.angle).toBeGreaterThan(0); // Spun
    expect(result.layers[0].transform.scale.x).not.toBe(1.0); // Pulsed
  });
});
```

### Validation Testing
```typescript
describe('LayerValidator', () => {
  it('should reject invalid configuration', () => {
    const invalidConfig = {
      layers: [{
        // Missing layerId
        imagePath: "/test.png"
      }]
    };
    
    const result = validateLibraryConfig(invalidConfig);
    
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('layer.id.missing');
  });
  
  it('should apply defaults for missing values', () => {
    const minimalConfig = {
      layers: [{
        layerId: "test",
        imagePath: "/test.png"
      }]
    };
    
    const result = validateLibraryConfig(minimalConfig);
    
    expect(result.ok).toBe(true);
    expect(result.normalized!.layers[0].position).toEqual({ x: 0, y: 0 });
    expect(result.normalized!.layers[0].scale).toEqual({ x: 1, y: 1 });
  });
});
```

---

## Performance Considerations

### Optimization Strategies

1. **Minimize Object Creation**
```typescript
// Good: Reuse objects when possible
const tempVec2 = { x: 0, y: 0 };
function optimizedTransform(pos: Vec2): Vec2 {
  tempVec2.x = pos.x;
  tempVec2.y = pos.y;
  return tempVec2;
}

// Even better: Return new objects but cache them
const resultCache = new Map<string, Vec2>();
function cachedTransform(key: string, pos: Vec2): Vec2 {
  let result = resultCache.get(key);
  if (!result) {
    result = { x: 0, y: 0 };
    resultCache.set(key, result);
  }
  result.x = pos.x;
  result.y = pos.y;
  return result;
}
```

2. **Early Returns for Disabled Behaviors**
```typescript
function applyBehavior(prev: State, cfg: Config, time: number): State {
  // Skip all calculations if disabled
  if (!cfg.enabled) {
    return { ...prev }; // Quick clone
  }
  
  // Only do expensive calculations if needed
  const result = expensiveCalculation(prev, cfg, time);
  return result;
}
```

3. **Batch Processing**
```typescript
function processLayersBatch(configs: LibraryConfig[], context: ProcessingContext) {
  // Process multiple configs in one call to amortize setup costs
  return configs.map(config => produceLayers(config, context));
}
```

4. **Registry Pre-warming**
```typescript
async function preloadAssets(assetPaths: string[]): Promise<Map<string, AssetMeta>> {
  const registry = new Map();
  
  await Promise.all(assetPaths.map(async (path, index) => {
    try {
      const img = new Image();
      img.src = path;
      await new Promise(resolve => img.onload = resolve);
      
      registry.set(`asset_${index}`, {
        src: path,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    } catch (error) {
      console.warn(`Failed to preload ${path}`);
    }
  }));
  
  return registry;
}
```

### Memory Management

```typescript
class LayerSystemManager {
  private assetRegistry = new Map<string, AssetMeta>();
  private configCache = new Map<string, LibraryConfigNormalized>();
  
  processLayers(config: LibraryConfig, time: number): LayerData[] {
    // Cache normalized config to avoid re-validation
    const configKey = JSON.stringify(config);
    let normalizedConfig = this.configCache.get(configKey);
    
    if (!normalizedConfig) {
      const validation = validateLibraryConfig(config);
      if (!validation.ok) throw new Error('Invalid config');
      normalizedConfig = validation.normalized!;
      this.configCache.set(configKey, normalizedConfig);
    }
    
    const context = {
      stage: normalizedConfig.stage,
      time,
      registry: this.assetRegistry
    };
    
    return produceLayers(config, context).layers;
  }
  
  clearCache(): void {
    this.configCache.clear();
  }
  
  dispose(): void {
    this.assetRegistry.clear();
    this.configCache.clear();
  }
}
```

---

## Conclusion

This guide provides everything an AI agent needs to understand and effectively work with the Layer System. The key points to remember:

1. **Pure Functions**: All layer logic is deterministic and side-effect free
2. **Time-based Animation**: Everything driven by `timeSeconds` parameter  
3. **Strict Ordering**: Behaviors apply in sequence (basic → spin → orbit → pulse → fade)
4. **Type Safety**: Full TypeScript coverage with strict validation
5. **Extensible Design**: Easy to add new behaviors following established patterns

### Quick Reference for AI Agents

**To process animations**:
```typescript
import { produceLayers } from './shared/layer/LayerProducer';
const result = produceLayers(config, context);
```

**To validate input**:
```typescript
import { validateLibraryConfig } from './shared/layer/LayerValidator';
const validation = validateLibraryConfig(input);
```

**To add new behavior**:
1. Create `LayerLogic[Name].ts` with apply function
2. Add types to `LayerTypes.ts`
3. Update defaults in `LayerValidator.ts`  
4. Integrate in `LayerProducer.ts`

**Common Issues**:
- Missing asset registry entries → Use `resolveAsset()` to check
- Time not updating → Ensure `context.time` changes between calls
- Unexpected behavior order → Remember: spin → orbit → pulse → fade

This system is designed to be predictable, testable, and extensible. Follow the established patterns and you'll be able to create powerful animation systems efficiently.

---

## 🚀 Complete Minimal Example

Here's a complete, validated example that compiles and demonstrates the full workflow:

```typescript
import { produceLayers, validateLibraryConfig } from './shared/layer/LayerProducer';
import type { LibraryConfig, ProcessingContext, AssetMeta } from './shared/layer/LayerTypes';

// 1. Set up asset registry (mimics loading actual images)
const assetRegistry = new Map<string, AssetMeta>([
  ["hero_sprite", {
    src: "/assets/hero.png",
    width: 64,
    height: 64,
    anchor: { x: 0.5, y: 1.0 }  // Bottom-center anchor
  }]
]);

// 2. Create valid LibraryConfig following actual TypeScript interface
const config: LibraryConfig = {
  stage: {
    width: 1920,
    height: 1080,
    origin: "center"  // Optional, defaults to "center"
  },
  layers: [
    {
      layerId: "hero",
      registryKey: "hero_sprite",           // Use registry instead of imagePath
      position: { x: 100, y: 200 },        // Center-based coordinates
      scale: 1.5,                          // Uniform scaling
      angle: 45,                           // Initial rotation in degrees
      tilt: { x: 0, y: 0 },               // No tilt
      anchor: { x: 0.5, y: 0.5 },         // Center anchor (overrides asset anchor)
      opacity: 0.8,                       // 80% opacity
      behaviors: {
        spin: { 
          enabled: true, 
          rpm: 30, 
          direction: "cw" 
        },
        pulse: { 
          enabled: true, 
          amplitude: 0.2, 
          rpm: 10 
        }
      },
      events: {
        onHover: [
          { action: "spin", set: { rpm: 60 } }
        ]
      },
      // Image fitting (these create normalized container)
      layerWidth: 128,
      layerHeight: 128,
      fitMode: "contain",
      alignment: "center"
    }
  ]
};

// 3. Validate configuration (important step!)
const validation = validateLibraryConfig(config);
if (!validation.ok) {
  console.error("Validation errors:", validation.errors);
  throw new Error("Invalid configuration");
}

// Log any warnings
validation.warnings.forEach(warning => {
  console.warn(`Warning: ${warning.path} - ${warning.message}`);
});

// 4. Create processing context
const context: ProcessingContext = {
  stage: validation.normalized!.stage,     // Use normalized stage
  time: performance.now() / 1000,         // Current time in seconds
  registry: assetRegistry                 // Asset lookup
};

// 5. Process layers through pipeline
const result = produceLayers(config, context);

// 6. Examine the output
console.log("Processing successful!");
console.log(`Generated ${result.layers.length} layers`);
console.log(`Warnings: ${result.warnings.length}`);

const heroLayer = result.layers[0];
console.log("Hero layer output:", {
  id: heroLayer.id,                       // "hero"
  zIndex: heroLayer.zIndex,               // 0 (array index)
  asset: heroLayer.asset,                 // { type: "registry", key: "hero_sprite" }
  transform: {
    position: heroLayer.transform.position, // Modified by orbit if enabled
    scale: heroLayer.transform.scale,       // Modified by pulse
    angle: heroLayer.transform.angle,       // Modified by spin
    opacity: heroLayer.transform.opacity    // Base opacity * fade
  },
  container: heroLayer.container,          // { width: 128, height: 128, fitMode: "contain", alignment: "center" }
  state: {
    isVisible: heroLayer.state.isVisible,  // true (from LayerProducer)
    isHovered: heroLayer.state.isHovered,  // false (default)
    isPressed: heroLayer.state.isPressed,  // false (default)  
    isActive: heroLayer.state.isActive     // false (default)
  }
});

// 7. Continue animation loop
function animationLoop() {
  const currentTime = performance.now() / 1000;
  const newContext = { ...context, time: currentTime };
  
  const animatedResult = produceLayers(config, newContext);
  
  // The hero layer will now have updated transforms based on time:
  // - angle will increase due to spin behavior (30 RPM)
  // - scale will oscillate due to pulse behavior (10 RPM, ±20% amplitude)
  
  // Pass animatedResult.layers to your renderer
  updateRenderer(animatedResult.layers);
  
  requestAnimationFrame(animationLoop);
}

// Helper function (implement based on your rendering system)
function updateRenderer(layers: LayerData[]) {
  // Convert LayerData to your renderer's format
  // This is where you'd integrate with Stages system or other renderer
}
```

### Key Validation Rules Demonstrated

1. **Asset Reference**: Must specify either `imagePath` OR `registryKey`, not both
2. **LayerId**: Required and must be unique within the config
3. **Behaviors**: All behavior configs are optional and have sensible defaults
4. **Stage Origin**: Affects coordinate interpretation (center vs top-left)
5. **Container Creation**: `layerWidth`/`layerHeight` + `fitMode`/`alignment` create normalized container
6. **Time Units**: `context.time` should be in seconds for RPM calculations to work correctly

### Expected Output Structure

```typescript
// The result.layers[0] will have this structure:
{
  id: "hero",
  zIndex: 0,
  asset: { type: "registry", key: "hero_sprite" },
  transform: {
    position: { x: 100, y: 200 },     // May change with orbit
    scale: { x: 1.5, y: 1.5 },        // May oscillate with pulse  
    angle: 45.0,                      // Will increase with spin
    tilt: { x: 0, y: 0 },
    anchor: { x: 0.5, y: 0.5 },
    opacity: 0.8                      // May oscillate with fade
  },
  container: {
    width: 128,
    height: 128,
    fitMode: "contain",
    alignment: "center"
  },
  behaviors: {
    spin: { enabled: true, rpm: 30, direction: "cw" },
    orbit: { enabled: false, rpm: 0, radius: 0 },
    pulse: { enabled: true, amplitude: 0.2, rpm: 10 },
    fade: { enabled: false, from: 1, to: 1, rpm: 0 }
  },
  events: {
    onHover: [{ action: "spin", set: { rpm: 60 } }]
  },
  state: {
    isHovered: false,
    isPressed: false,
    isActive: false,
    isVisible: true
  }
}
```

This example demonstrates the complete workflow and shows exactly what input produces what output, making it easy for AI agents to understand and replicate the patterns.