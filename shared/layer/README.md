# Layer System Documentation

## Overview

The Layer System is the core rendering pipeline for the Yuzha application. It handles layer preparation, animation processing (spin and orbital motion), and debug visualization for a sophisticated 2D composition system using React and Three.js.

## Module Architecture

### Current Structure (Post-Refactoring, October 2025)

The layer system has been refactored into specialized modules with clear separation of concerns:

```
shared/layer/
├── layerBasic.ts       # Pure utilities (coordinate transforms, math, validation)
├── layerCore.ts        # Core layer preparation and asset resolution
├── layerDebug.ts       # Debug visualization (Canvas/Three.js renderers)
├── layerSpin.ts        # Spin animation processor
├── layerOrbit.ts       # Orbital motion processor
├── layer.ts            # Pipeline orchestrator and processor registry
├── index.ts            # Module exports
└── README.md           # This file
```

### Module Responsibilities

#### **layerBasic.ts** - Foundation Utilities
- **Purpose**: Pure math functions with no external dependencies
- **Key Functions**:
  - `imagePercentToImagePoint()` - Convert percent coordinates to image space
  - `imagePointToStagePoint()` - Transform image coordinates to stage coordinates
  - `validatePoint()` - Coordinate validation
  - `lerp()`, `clamp()`, `normalizeAngle()` - Math utilities
- **Dependencies**: None
- **Used By**: layerCore, layerSpin, layerOrbit, layerDebug

#### **layerCore.ts** - Core Layer System
- **Purpose**: Layer preparation, asset resolution, and image mapping
- **Key Functions**:
  - `prepareLayer()` - Main entry point for layer preparation
  - `computeImageMapping()` - Calculate image positioning and dimensions
  - `getAssetPath()` - Resolve asset paths from registry
- **Key Types**:
  - `UniversalLayerData` - Base layer data structure
  - `ImageMapping` - Image positioning data
  - `LayerCalculation` - Pre-calculated coordinate transformations
- **Dependencies**: layerBasic, Config (external)
- **Used By**: layer.ts, stage renderers

#### **layerDebug.ts** - Debug Visualization
- **Purpose**: Visual debugging tools for layer system development
- **Key Exports**:
  - `createImageMappingDebugProcessor()` - Debug processor factory
  - `CanvasDebugRenderer` - Canvas 2D debug rendering functions
  - `ThreeDebugRenderer` - Three.js debug rendering functions
  - Debug marker types (ImageCenterMarker, ImageTipMarker, etc.)
- **Features**:
  - Image center/tip/base markers
  - Axis lines and rotation indicators
  - Orbital motion visualization
  - Bounding boxes and ray tracing
- **Dependencies**: layerCore, layerBasic
- **Used By**: layer.ts (optional debug processor)

#### **layerSpin.ts** - Spin Animation
- **Purpose**: Continuous rotation animation around pivot points
- **Key Exports**:
  - `createSpinProcessor()` - Spin animation processor factory
  - `calculateSpinRotation()` - Calculate rotation at timestamp
  - Spin-related types (SpinData, SpinConfig, etc.)
- **Features**:
  - RPM-based rotation speed
  - Custom pivot point support
  - Rotation offset handling
- **Dependencies**: layerCore, layerBasic
- **Used By**: layer.ts (registered processor)

#### **layerOrbit.ts** - Orbital Motion
- **Purpose**: Orbital movement around parent layers
- **Key Exports**:
  - `createOrbitalProcessor()` - Orbital motion processor factory
  - `calculateOrbitPosition()` - Calculate position at timestamp
  - Orbital types (OrbitalData, OrbitalConfig, etc.)
- **Features**:
  - Parent-child orbital relationships
  - Elliptical orbits
  - Phase offset support
  - Base/tip point orbital motion
- **Dependencies**: layerCore, layerBasic
- **Used By**: layer.ts (registered processor)

#### **layer.ts** - Pipeline Orchestrator
- **Purpose**: Processor registry and pipeline execution
- **Key Exports**:
  - `registerProcessor()` - Register new layer processors
  - `getProcessorsForEntry()` - Get applicable processors
  - `runPipeline()` - Execute processors on layer data
  - `EnhancedLayerData` - Layer data after processor enhancement
- **Features**:
  - Pluggable processor architecture
  - Conditional processor attachment
  - Pipeline caching for performance
  - Animation utilities
- **Dependencies**: All layer modules
- **Used By**: Stage renderers, MainScreen

#### **index.ts** - Module Exports
- **Purpose**: Single entry point for layer system
- **Exports**: All public APIs from layer modules
- **Usage**: `import { prepareLayer } from "@shared/layer"`

## Historical Context

### Original Structure (Pre-October 2025)

The layer system was previously organized as:

```
shared/layer/
├── LayerCore.ts                          → Refactored to layerCore.ts + layerBasic.ts
├── LayerCorePipelineSpin.ts              → Renamed to layerSpin.ts
├── LayerCorePipelineOrbital.ts           → Renamed to layerOrbit.ts
├── LayerCorePipelineImageMappingUtils.ts → Refactored to layerDebug.ts
└── layer.ts                              → Kept (enhanced with better docs)
```

### Refactoring Goals (Achieved)

1. **Separation of Concerns**: Pure utilities separated from business logic
2. **Clear Dependencies**: No circular dependencies, layered architecture
3. **Maintainability**: Each module has single, well-defined responsibility
4. **Extensibility**: Easy to add new processors or utilities
5. **Documentation**: Comprehensive inline docs for future AI agents

### Migration Notes

- **API Compatibility**: All public APIs preserved, no breaking changes
- **Import Paths**: Updated to use new file names (lowercase convention)
- **Type Safety**: All types maintained and properly re-exported
- **Performance**: No regression, image dimension caching preserved
- **Testing**: All functionality verified working post-refactoring

## Data Flow

```
ConfigYuzha.json (layer definitions)
  ↓
Config.ts (loads, transforms, validates)
  ↓
layerCore.prepareLayer() (prepares base layer data)
  ↓
layer.ts processors (spin, orbit, debug)
  ↓
Stage Renderers (DOM/Canvas/Three)
  ↓
MainScreen.tsx (displays final result)
```

## Adding New Processors

To add a new layer processor (e.g., a blur effect):

```typescript
// 1. Import processor registry
import { registerProcessor, type LayerProcessor } from "@shared/layer/layer";

// 2. Create processor function
function createBlurProcessor(blurAmount: number): LayerProcessor {
  return (layer, timestamp) => ({
    ...layer,
    blurAmount,
    hasBlur: true,
  });
}

// 3. Register processor
registerProcessor({
  name: "blur",
  shouldAttach(entry) {
    return entry.blurAmount !== undefined && entry.blurAmount > 0;
  },
  create(entry) {
    return createBlurProcessor(entry.blurAmount);
  },
});
```

## Performance Considerations

- **Image Dimension Caching**: Asset dimensions cached to avoid repeated Image loading
- **Pipeline Caching**: Processor pipelines cached per layer entry
- **Lazy Loading**: Images loaded on-demand when layers are prepared
- **Pre-calculated Transforms**: Coordinate transformations pre-computed in layerCore

## Debug Visualization

Enable debug visualization in `ConfigYuzha.json`:

```json
{
  "layerEntry": "example-layer",
  "debug": {
    "showCenter": true,
    "showTip": true,
    "showBase": true,
    "showAxisLine": true,
    "showRotation": false,
    "showBoundingBox": false
  }
}
```

See `layerDebug.ts` for complete debug configuration options.

## Related Documentation

- **Architecture**: `shared/docs/00_ARCHITECTURE_OVERVIEW.md`
- **Coordinate Systems**: `shared/docs/02_COORDINATE_SYSTEMS.md`
- **Spin Animation**: `shared/docs/03_SPIN_ANIMATION_DEEP_DIVE.md`
- **Debug Visualization**: `shared/docs/07_DEBUG_VISUALIZATION.md`
- **API Reference**: `shared/docs/API_REFERENCE.md`
