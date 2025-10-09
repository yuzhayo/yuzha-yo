# Architecture Overview

## System Purpose

This is a **2D/3D Animation Engine** built with React + TypeScript that renders animated layers with precise positioning, rotation (spin), and circular motion (orbital) on a fixed 2048×2048 canvas that automatically scales to any viewport size.

---

## Tech Stack

### Core Technologies
- **Frontend Framework:** React 18.3
- **Language:** TypeScript 5.6
- **Build Tool:** Vite 7.0
- **Bundler:** ESBuild (ultra-fast)

### Rendering Engines (3 options)
- **DOM Renderer:** CSS transforms (best compatibility)
- **Canvas Renderer:** Canvas 2D API (fallback for headless)
- **Three.js Renderer:** WebGL (best performance, default)

### UI & Styling
- **CSS Framework:** Tailwind CSS 3.4
- **Component Library:** Radix UI (Accordion)
- **Icons:** Radix Icons

### State Management
- **Local State:** React useState/useRef (no Redux/Zustand)
- **Config Storage:** localStorage + JSON files

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│  MainScreen.tsx → Renderer Selection (DOM/Canvas/Three)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONFIGURATION LAYER                        │
│  ConfigYuzha.json → Config.ts (transform) → LayerConfig[]   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   LAYER PREPARATION                          │
│  LayerCore.prepareLayer() → UniversalLayerData              │
│  • Load images                                               │
│  • Calculate positions                                       │
│  • Compute transforms                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   PROCESSOR PIPELINE                         │
│  • SpinProcessor (rotation animation)                        │
│  • OrbitalProcessor (circular motion) [ready, not wired]    │
│  • DebugProcessor (visual debugging)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   RENDERING ENGINES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DOM Renderer │  │Canvas Renderer│  │Three Renderer│      │
│  │ CSS Transform│  │  2D Context   │  │    WebGL     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
                    60fps Loop
```

---

## Project Structure

```
/app/
├── shared/                      # Shared code (engine core)
│   ├── config/                 # Configuration system
│   │   ├── Config.ts                   # Transform grouped JSON → flat
│   │   ├── ConfigYuzha.json            # Source of truth (layer config)
│   │   ├── ImageRegistry.json          # Asset manifest (auto-generated)
│   │   ├── ImageRegistry.mjs           # Asset sync script
│   │   ├── ConfigYuzhaPopup.tsx        # Live config editor UI
│   │   ├── ConfigYuzhaAccordion.tsx    # Nested config UI
│   │   └── ConfigYuzhaPopupUtils.ts    # localStorage helpers
│   │
│   ├── layer/                  # Layer rendering system
│   │   ├── LayerCore.ts                        # Core positioning logic
│   │   ├── LayerCorePipeline.ts                # Processor pattern
│   │   ├── LayerCorePipelineSpin.ts            # Spin animation
│   │   ├── LayerCorePipelineOrbital.ts         # Orbital motion
│   │   ├── LayerCorePipelineImageMapping.ts    # Image geometry
│   │   ├── LayerCorePipelineImageMappingDebug.ts  # Debug processor
│   │   ├── LayerCorePipelineImageMappingUtils.ts  # Debug visuals
│   │   ├── LayerCoreAnimationUtils.ts          # Math utilities
│   │   ├── LayerEngineDOM.ts                   # CSS renderer
│   │   ├── LayerEngineCanvas.ts                # Canvas 2D renderer
│   │   └── LayerEngineThree.ts                 # WebGL renderer
│   │
│   ├── stages/                 # Stage components (orchestrators)
│   │   ├── StageDOM.tsx        # Load config + mount DOM layers
│   │   ├── StageCanvas.tsx     # Load config + mount Canvas layers
│   │   └── StageThree.tsx      # Load config + mount Three.js layers
│   │
│   ├── utils/                  # Utilities
│   │   ├── stage2048.ts                # Viewport scaling system
│   │   ├── DeviceCapability.ts         # Performance detection
│   │   └── RendererDetector.ts         # Auto renderer selection
│   │
│   ├── Asset/                  # PNG images (gears, backgrounds)
│   └── docs/                   # 📚 Documentation (YOU ARE HERE)
│
├── yuzha/                       # Main app
│   ├── src/
│   │   ├── App.tsx                     # Entry point
│   │   ├── MainScreen.tsx              # Renderer switcher
│   │   ├── MainScreenUtils.tsx         # UI controls & gestures
│   │   ├── index.css                   # Global styles
│   │   └── main.tsx                    # React DOM mount
│   ├── index.html              # HTML template
│   ├── package.json            # App dependencies
│   ├── vite.config.ts          # Vite configuration
│   └── tsconfig.json           # TypeScript config
│
├── package.json                 # Monorepo workspace config
├── tsconfig.base.json          # Base TypeScript config
└── tailwind.config.ts          # Tailwind configuration
```

---

## Data Flow: JSON → Screen (Step by Step)

### Step 1: Configuration Loading

```typescript
// ConfigYuzha.json (grouped structure)
[
  {
    "layerId": "GEAR1",
    "imageId": "GEAR1",
    "renderer": "2D",
    "order": 100,
    "groups": {
      "Basic Config": { "scale": [100, 100], "BasicStagePoint": [1024, 1024] },
      "Spin Config": { "spinSpeed": 10, "spinDirection": "cw" }
    }
  }
]

↓ Config.ts → transformConfig()

// LayerConfigEntry (flat, merged, sorted by order)
[
  {
    layerId: "GEAR1",
    imageId: "GEAR1",
    renderer: "2D",
    order: 100,
    scale: [100, 100],
    BasicStagePoint: [1024, 1024],  // From Spin (overridden)
    spinSpeed: 10,
    spinDirection: "cw",
    BasicAngleImage: 0  // Reset by Spin
  }
]
```

### Step 2: Layer Preparation

```typescript
// LayerCore.prepareLayer(entry, STAGE_SIZE)
↓
// UniversalLayerData
{
  layerId: "GEAR1",
  imageId: "GEAR1",
  imageUrl: "blob:http://...",
  imagePath: "shared/asset/GEAR1.png",
  position: { x: 1024, y: 1024 },  // Calculated from pivot
  scale: { x: 1.0, y: 1.0 },
  rotation: 0,
  imageMapping: { /* geometry data */ },
  calculation: { /* pre-calculated points */ }
}
```

### Step 3: Processor Creation

```typescript
// StageDOM/Canvas/Three.tsx
const processors: LayerProcessor[] = [];

// Conditionally add processors based on config
if (entry.spinSpeed > 0) {
  processors.push(createSpinProcessor({
    spinSpeed: entry.spinSpeed,
    spinDirection: entry.spinDirection
  }));
}

if (entry.showCenter || entry.showTip) {
  processors.push(createImageMappingDebugProcessor({ ... }));
}
```

### Step 4: Rendering Loop (60fps)

```typescript
requestAnimationFrame((timestamp) => {
  // Run pipeline with timestamp
  const enhanced = runPipeline(baseLayer, processors, timestamp);
  
  // enhanced = {
  //   ...baseLayer,
  //   currentRotation: 45.5,  // Added by SpinProcessor
  //   spinCenter: { x: 512, y: 512 },
  //   hasSpinAnimation: true
  // }
  
  // Update DOM/Canvas/Three.js with new rotation
  updateRenderer(enhanced);
});
```

---

## Key Concepts

### 1. Fixed Stage Coordinate System

- **Stage Size:** Always 2048×2048 pixels
- **Center Point:** (1024, 1024)
- **Viewport Scaling:** Stage scales to fit viewport using "cover" mode
- **Independence:** Stage coordinates never change, only viewport scale

### 2. Grouped Configuration

**Why Groups?**
- **Modularity:** Each feature (Basic/Spin/Orbital) has its own config section
- **Override Logic:** Higher priority groups override lower ones
- **Clean JSON:** Easy to read and edit

**Group Priority (Highest → Lowest):**
1. Orbital Config (planned, not yet active)
2. Spin Config (overrides Basic when `spinSpeed > 0`)
3. Basic Config (foundation, always present)
4. Debug Config (additive only, never overrides)

### 3. Processor Pipeline Pattern

**Benefits:**
- **Composable:** Chain multiple processors
- **Reusable:** Same processor works across all renderers
- **Testable:** Pure functions, easy to unit test
- **Extensible:** Add new processors without modifying core

**Execution:**
```typescript
function runPipeline(
  baseLayer: UniversalLayerData,
  processors: LayerProcessor[],
  timestamp?: number
): EnhancedLayerData {
  let result = baseLayer;
  for (const processor of processors) {
    result = processor(result, timestamp);  // Each adds properties
  }
  return result;
}
```

### 4. Multi-Renderer Architecture

**Why 3 Renderers?**
- **DOM:** Best compatibility, works everywhere
- **Canvas:** Fallback for AI agents/headless browsers
- **Three.js:** Best performance for complex scenes

**Auto-Selection:**
```typescript
const isAIAgent = isHeadless() || !hasWebGL();
const renderer = isAIAgent ? "canvas" : "three";
```

---

## Performance Optimizations

### 1. Pipeline Caching
```typescript
const cache = createPipelineCache();
const result = cache.get(layerId, () => runPipeline(...));
// Same layer in same frame → cached result
```

### 2. Static Layer Detection
```typescript
const isStatic = processors.length === 0;
if (isStatic) {
  // Render once, skip animation loop
}
```

### 3. Lazy Calculation
```typescript
if (needsFullCalculation) {
  // Compute all points (tip, base, spin, orbit)
} else {
  // Skip expensive calculations for static layers
}
```

### 4. Image Dimension Caching
```typescript
const cache = new Map<string, { width, height }>();
if (cache.has(url)) return cache.get(url);
```

---

## Development Workflow

### Adding a New Layer

1. **Add Image:** Place PNG in `/app/shared/Asset/`
2. **Sync Registry:** Run `npm run sync:image`
3. **Edit Config:** Add entry to `ConfigYuzha.json`
4. **Reload:** Changes hot-reload automatically

### Modifying Config (Live)

1. **Open Config UI:** Long-press anywhere on screen
2. **Click "Config" button**
3. **Edit values** in accordion
4. **Click "Save"** → Saves to localStorage
5. **Refresh page** to apply changes

### Debugging Positioning

1. **Enable Debug:** Set `showCenter: true` in config
2. **Visual Markers:** See center/tip/base points
3. **Axis Line:** Yellow line shows image orientation
4. **Stage Center:** Cyan star at (1024, 1024)

---

## File Dependencies

### Configuration Flow
```
ConfigYuzha.json
  ↓ imported by
Config.ts (transformConfig)
  ↓ exported as
loadLayerConfig() → LayerConfig[]
  ↓ used by
StageDOM/Canvas/Three.tsx
```

### Layer Flow
```
LayerCore.ts (prepareLayer)
  ↓ uses
LayerCorePipelineImageMapping.ts (computeImageMapping)
  ↓ returns
UniversalLayerData
  ↓ processed by
LayerCorePipeline.ts (runPipeline)
  ↓ with
LayerCorePipelineSpin.ts (createSpinProcessor)
  ↓ returns
EnhancedLayerData
  ↓ rendered by
LayerEngineDOM/Canvas/Three.ts
```

### Rendering Flow
```
App.tsx
  ↓
MainScreen.tsx (renderer selection)
  ↓
StageDOM/Canvas/Three.tsx (load config + mount)
  ↓
LayerEngineDOM/Canvas/Three.ts (60fps loop)
```

---

## Next Steps

- **📖 Read:** `01_CONFIG_SYSTEM_GUIDE.md` for config details
- **📐 Learn:** `02_COORDINATE_SYSTEMS.md` for positioning
- **🔄 Understand:** `03_SPIN_ANIMATION_DEEP_DIVE.md` for animations
- **🎨 Explore:** `04_RENDERING_ENGINES.md` for renderer comparison
- **🔧 Build:** `08_ADDING_NEW_FEATURES.md` for development guide

---

**AI Agent Note:** This architecture is designed for modularity and extensibility. The processor pattern allows adding new animation types without modifying core rendering logic. Always maintain the separation between config → preparation → processing → rendering.
