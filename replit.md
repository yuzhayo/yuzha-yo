# Yuzha Animation Framework

## Overview

The Yuzha Animation Framework is a modern TypeScript-based animation framework that utilizes a JSON-based "Layer System" to generate animated visual outputs. It is built as a monorepo leveraging React, Vite, Three.js (WebGL), and Canvas 2D, featuring an intelligent dual-renderer system. The project aims to provide a robust and performant solution for creating complex animations, with a focus on clear architecture and efficient rendering across different environments.

## User Preferences

Communication: Simple, everyday language

## System Architecture

The framework employs a dual-renderer system, defaulting to Three.js WebGL for production environments and falling back to Canvas 2D for AI agents or screenshot generation, with automatic headless browser detection. All rendering engines (Canvas, DOM, Three.js) share identical animation patterns and utilize a fixed 2048x2048 coordinate system that scales dynamically to fit various screen sizes.

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

### Stage System Architecture Refactoring (Latest - Oct 18, 2025)
Major architectural consolidation completed and verified:

- **Created StageSystem.ts**: Unified `stage2048.ts` and `StagePipeline.ts` into a single `shared/stage/StageSystem.ts` file
  - Section 1: Coordinate system (computeCoverTransform, createStageTransformer, viewport/stage conversions)
  - Section 2: Data pipeline (createStagePipeline, toRendererInput, processor registry)
  - Comprehensive inline documentation for future developers

- **Self-Contained Renderers**: Embedded rendering engines directly into each renderer component:
  - `StageDOM.tsx`: Contains mountDomLayers logic with DOM-specific rendering, animation loop, and resource management
  - `StageCanvas.tsx`: Contains mountCanvasLayers logic with Canvas 2D rendering and static layer buffering
  - `StageThree.tsx`: Contains mountThreeLayers logic with WebGL/Three.js rendering and scene management
  
- **Deleted Legacy Files**: Removed `stage2048.ts`, `StagePipeline.ts`, and `LayerEngines.ts` after successful migration

- **Architecture Flow**: ConfigYuzha.json → Config.ts → StageSystem (coordinate + pipeline) → Renderers → MainScreen

- **Verified**: No regressions, typecheck passed, application renders correctly with all animations working

### Previous Code Consolidation
- **Merged Renderer Adapters**: Combined renderer adapter files with their corresponding stage components:
  - `DomRendererAdapter.ts` → merged into `StageDOM.tsx`
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
