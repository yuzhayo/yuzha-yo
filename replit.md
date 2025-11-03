# Yuzha Animation Framework

## Overview

The Yuzha Animation Framework is a modern TypeScript-based animation framework that utilizes a JSON-based "Layer System" to generate animated visual outputs. It is built as a monorepo leveraging React, Vite, Three.js (WebGL), and Canvas 2D, featuring an intelligent dual-renderer system. The project aims to provide a robust and performant solution for creating complex animations, with a focus on clear architecture and efficient rendering across different environments.

## User Preferences

Communication: Simple, everyday language

## System Architecture

The framework employs a dual-renderer system, defaulting to Three.js WebGL for production environments and falling back to Canvas 2D for AI agents or screenshot generation, with automatic headless browser detection. Both renderers (Canvas and Three.js) share identical animation patterns and utilize a fixed 2048x2048 coordinate system that scales dynamically to fit various screen sizes.

The core animation logic revolves around a Layer System where JSON configurations define layers that pass through a pipeline of processors (e.g., `Spin Processor`) before reaching the rendering engine. The configuration structure clearly separates layer identity from feature-specific groups (Basic, Spin, Orbital, Debug Config). Performance is optimized through techniques like pipeline caching, pre-calculated math constants, static layer buffering, and lazy calculations for static layers. Debugging is supported by a comprehensive Image Mapping Debug visualization system with configurable visual helpers integrated as a pipeline processor.

**Key Technical Implementations & Design Choices:**

- **Monorepo Structure:** `yuzha/` for the main application and `shared/` for common logic.
- **Rendering:** Three.js (WebGL) for high-performance production, Canvas 2D as a fallback.
- **Coordinate System:** Stage2048 system (2048x2048 pixels) for consistent scaling.
- **Layer System:** JSON config drives `LayerCore` with extensible processors for transformations and animations.
- **Configuration:** `ConfigYuzha.json` defines layer properties and animation parameters. `transformConfig` handles conditional overrides for animation parameters.
- **Performance:**
  - Pipeline caching for processor results.
  - Pre-calculated math constants (`DEG_TO_RAD`, `TWO_PI`).
  - StaticLayerBuffer for one-time rendering of static content.
  - Image dimension and mapping caches.
  - Lazy calculations and `React.memo` for rendering optimization.
- **Debugging:** `ImageMappingDebugConfig` allows enabling various visual helpers (markers, axis lines, rays, bounding boxes) for both Canvas 2D and Three.js renderers.
- **TypeScript:** Strict type checking used throughout the project, with Vite handling compilation.

## Recent Changes

### Layer Module Consolidation (Latest - Nov 3, 2025)

Complete file structure consolidation to unify all layer-related code under a single directory:

- **Unified Directory Structure**: All layer functionality consolidated into `shared/layer/`
  - **Config.ts** (moved from `shared/config/`) - Layer configuration loading and validation
  - **ConfigYuzha.json** (moved from `shared/config/`) - Layer definitions and animation parameters
  - **StageSystem.ts** (moved from `shared/stage/`) - Coordinate system and data pipeline
  - **StageCanvas.tsx** (moved from `shared/stage/`) - Canvas 2D renderer with static buffering
  - **StageThree.tsx** (moved from `shared/stage/`) - Three.js WebGL renderer with scene management
  - **layerMotion.ts** (moved from `shared/motion/`) - Motion processing and transformations
  - **layerCore.ts** - Core layer preparation and asset resolution
  - **layer.ts** - Processor pipeline orchestrator
  - **layerBasic.ts** - Pure math utilities
  - **clockTime.ts** - Time/clock calculations

- **Updated index.ts**: Comprehensive module exports with clear documentation
  - Exports all layer types, functions, renderers, and configuration utilities
  - Added detailed JSDoc comments explaining old vs new structure for future AI agents
  - Includes migration notes for legacy import paths

- **Deleted Empty Directories**: 
  - Removed `shared/stage/` (stage rendering now in shared/layer/)
  - Removed `shared/motion/` (motion logic now in shared/layer/)
  - Kept `shared/config/` for ImageRegistry files only

- **Import Path Updates**: Updated 23+ files across the codebase
  - `@shared/config/Config` → `@shared/layer/Config`
  - `@shared/stage/StageSystem` → `@shared/layer/StageSystem`
  - `@shared/motion/layerMotion` → `@shared/layer/layerMotion`

- **Architecture Flow**: ConfigYuzha.json → Config.ts → layerCore.prepareLayer() → layer.ts processors → StageSystem → Renderers → MainScreen

- **Benefits**:
  - Single source of truth for all layer functionality
  - Reduced cognitive load - no need to jump between config/, stage/, motion/, layer/ directories
  - Clearer dependency relationships within one directory
  - Simplified imports for future development

- **Verified**:
  - ✅ TypeScript compilation passed (yuzha workspace)
  - ✅ ESLint passed with zero errors
  - ✅ Prettier formatting applied
  - ✅ Workflow restarted successfully
  - ✅ No new console errors in browser
  - ✅ All animations rendering correctly
  - ✅ Fixed array destructuring TypeScript errors in layerMotion.ts

### Extended Coordinate System & Image Center Refactoring (Oct 24, 2025)

Architectural improvements to unlock creative animation capabilities while simplifying the codebase:

- **Extended Coordinate System**: Replaced `clampPercent()` with `normalizePercent()` throughout the layer system
  - Now supports negative and >100% percent values for external pivot points
  - Enables animations like door hinges, satellite orbits, and linked gears
  - Fully backward compatible with existing 0-100% configurations
  - Applied across layerBasic, layerCore, layerSpin, and layerOrbit modules

- **Image Center Refactoring**: Removed redundant caching for improved code clarity
  - Removed `imageCenter` field from `ImageMapping` type definition
  - Added `getImageCenter()` helper function for on-demand calculation
  - Updated all renderers (StageCanvas, StageThree) to use helper
  - No performance impact - calculations happen during layer mount, not per-frame

- **Updated Files**: 8 files systematically updated across the codebase
  - Core: `layerBasic.ts`, `layerCore.ts`, `layerSpin.ts`, `layerOrbit.ts`
  - Renderers: `StageCanvas.tsx`, `StageThree.tsx`
  - Tests: `layerCore.test.ts`

- **Verified**:
  - ✅ Architect reviewed and approved with Pass rating
  - ✅ All quality checks passing (typecheck, eslint, prettier)
  - ✅ No console errors, display functionality preserved
  - ✅ Backward compatible with existing configurations
  - ✅ Type definitions internally consistent

- **Recommended Next Steps** (from architect review):
  - Add unit tests for normalizePercent with out-of-range values
  - Profile heavy scenes to confirm performance under load
  - Update config authoring docs to highlight extended-percent capability

### Layer System Modular Refactoring (Oct 18, 2025)

Complete modular refactoring of the layer system for improved maintainability and separation of concerns:

- **New Modular Structure**: Split monolithic `LayerCore.ts` into specialized modules:
  - **layerBasic.ts** - Pure math utilities and coordinate transformations (no dependencies)
  - **layerCore.ts** - Core layer preparation, asset resolution, image mapping
  - **layerSpin.ts** - Spin animation system
  - **layerOrbit.ts** - Orbital motion system
  - _(Debug visualization module temporarily removed while the pipeline is simplified)_
  - **layer.ts** - Processor pipeline orchestrator and registry
  - **index.ts** - Unified module exports

- **Clean Architecture**: Layered dependency structure with no circular dependencies:

  ```
  layerBasic (foundation, no deps)
    ↑
  layerCore (imports layerBasic)
    ↑
  layerSpin, layerOrbit (import layerCore + layerBasic)
    ↑
  layer.ts (orchestrator, imports all)
  ```

- **Deleted Legacy Files**: Removed after successful migration:
  - `LayerCore.ts` → refactored to `layerCore.ts` + `layerBasic.ts`
- `LayerCorePipelineSpin.ts` → renamed to `layerSpin.ts`
- `LayerCorePipelineOrbital.ts` → renamed to `layerOrbit.ts`
- `LayerCorePipelineImageMappingUtils.ts` → removed (legacy debug tooling; can be restored from git history if needed)

- **Documentation**: Comprehensive inline documentation added to all modules with usage examples for future AI agents. Created `shared/layer/README.md` with architecture overview and historical context.

- **Architecture Flow**: ConfigYuzha.json → Config.ts → layerCore.prepareLayer() → layer.ts processors → Renderers → MainScreen

- **Verified**:
  - ✅ Architect reviewed and approved with Pass rating
  - ✅ No regressions, all functionality preserved
  - ✅ Application tested and rendering correctly
  - ✅ Prettier formatting applied
  - ✅ No circular dependencies
  - ✅ Clean separation of concerns achieved

### Previous Layer Pipeline System Consolidation (Oct 18, 2025)

Earlier refactoring to simplify the layer processing architecture:

- **Created layer.ts**: Merged `LayerCorePipeline.ts` and `ProcessorRegistry.ts` into unified `shared/layer/layer.ts`
- **Updated All Imports**: Refactored 9 files across the codebase to use the new unified module
- **Deleted Legacy Files**: Removed `LayerCorePipeline.ts` and `pipeline/ProcessorRegistry.ts`
- **Why**: Reduced file jumping for AI agents - all pipeline functionality in one well-documented file

### Stage System Architecture Refactoring (Oct 18, 2025)

Major architectural consolidation completed and verified:

- **Created StageSystem.ts**: Unified `stage2048.ts` and `StagePipeline.ts` into a single `shared/stage/StageSystem.ts` file
  - Section 1: Coordinate system (computeCoverTransform, createStageTransformer, viewport/stage conversions)
  - Section 2: Data pipeline (createStagePipeline, toRendererInput, processor registry)
  - Comprehensive inline documentation for future developers

- **Self-Contained Renderers**: Embedded rendering engines directly into each renderer component:
  - `StageCanvas.tsx`: Contains mountCanvasLayers logic with Canvas 2D rendering and static layer buffering
  - `StageThree.tsx`: Contains mountThreeLayers logic with WebGL/Three.js rendering and scene management
- **Deleted Legacy Files**: Removed `stage2048.ts`, `StagePipeline.ts`, and `LayerEngines.ts` after successful migration

- **Architecture Flow**: ConfigYuzha.json → Config.ts → StageSystem (coordinate + pipeline) → Renderers → MainScreen

- **Verified**: No regressions, typecheck passed, application renders correctly with all animations working

### Previous Code Consolidation

- **Merged Renderer Adapters**: Combined renderer adapter files with their corresponding stage components:
  - `CanvasRendererAdapter.ts` → merged into `StageCanvas.tsx`
  - `ThreeRendererAdapter.ts` → merged into `StageThree.tsx`
- **Removed**: `shared/layer/pipeline/renderers/` folder

### Planned Simplified System

A new simplified layer system is planned in `shared/logic/` to replace the complex grouped configuration:

- **New Config**: `config/Config.json` with 4 essential fields (layerID, layerOrder, imageID, imageScale)
- **Core Logic**: `shared/logic/core.ts` with 4 standalone functions for simple image rendering
- **Goal**: Enable image display, scale adjustment, and layer ordering without complex animations
- **Documentation**: See `shared/logic/log.md` for complete implementation plan

Current complex system in `shared/layer/` will remain for reference but new simplified approach will be self-contained.

## External Dependencies

- **React 18:** Frontend UI library.
- **TypeScript:** Programming language for type safety.
- **Vite 7:** Build tool and development server.
- **Three.js:** WebGL 3D library for high-performance rendering.
- **Tailwind CSS:** Utility-first CSS framework.
