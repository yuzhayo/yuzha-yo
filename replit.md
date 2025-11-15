# Yuzha Animation Framework

## Overview

The Yuzha Animation Framework is a modern TypeScript-based animation framework that generates animated visual outputs using a JSON-based "Layer System." Built as a monorepo with React, Vite, Three.js (WebGL), and Canvas 2D, it features an intelligent dual-renderer system. The project aims to provide a robust and performant solution for creating complex animations with clear architecture and efficient rendering.

## User Preferences

Communication: Simple, everyday language

## System Architecture

The framework utilizes a dual-renderer system, defaulting to Three.js WebGL for production and falling back to Canvas 2D for AI agents or screenshot generation, with automatic headless browser detection. Both renderers share identical animation patterns and operate on a fixed 2048x2048 coordinate system that dynamically scales.

Core animation logic is driven by a Layer System where JSON configurations define layers processed by a pipeline (e.g., `Spin Processor`) before rendering. The configuration separates layer identity from feature-specific groups. Performance is optimized through pipeline caching, pre-calculated math constants, static layer buffering, and lazy calculations. Debugging is supported by an Image Mapping Debug visualization system with configurable visual helpers. The system uses an extended coordinate system supporting negative and >100% percent values for advanced animation capabilities.

**Key Technical Implementations & Design Choices:**

- **Monorepo Structure:** `yuzha/` for the main application and `shared/` for common logic.
- **Rendering:** Three.js (WebGL) for high-performance; Canvas 2D as fallback.
- **Coordinate System:** Stage2048 system (2048x2048 pixels) for consistent scaling, `normalizePercent()` for extended range.
- **Layer System:** JSON config drives `LayerCore` with extensible processors for transformations and animations, consolidated under `shared/layer/`.
- **Configuration:** `ConfigYuzha.json` defines layer properties and animation parameters in a flat structure, with `transformConfig` for conditional overrides and clock alias normalization.
- **Performance:** Pipeline caching, pre-calculated constants, `StaticLayerBuffer`, image dimension/mapping caches, lazy calculations, and `React.memo`.
- **Debugging:** `ImageMappingDebugConfig` for visual helpers across renderers.
- **TypeScript:** Strict type checking with Vite for compilation.

## Recent Architecture Changes (Nov 2025)

### Layer Module Simplification Refactoring

**Objective:** Consolidate duplicate code in the `shared/layer/` module to establish clear single sources of truth and improve maintainability.

**Changes Implemented:**

1. **Asset Path Case Sensitivity Fix:**
   - Renamed `shared/Asset/` → `shared/asset/` for Linux/production compatibility
   - Updated all references in `engine.ts` and `ImageRegistry.json`

2. **Configuration Consolidation:**
   - **Before:** Duplicate config loading in `Config.ts` and `model.ts`
   - **After:** `model.ts` is the single source for types and config loading
   - Deleted: `shared/layer/Config.ts`
   - All imports now use barrel exports from `index.ts` → `model.ts`

3. **Math/Clock Function Consolidation:**
   - **Before:** Clock/time functions split between `clockTime.ts` and `math.ts`
   - **After:** `math.ts` is the single source for all pure calculation functions
   - Deleted: `shared/layer/clockTime.ts`
   - Consolidated: `resolveClockSpeed`, `calculateRotationDegrees`, timezone parsing, etc.

4. **Asset Loading Production Fix:**
   - **Critical Issue:** Dynamic `new URL()` construction prevented Vite from bundling assets in production
   - **Solution:** Implemented static asset manifest using `import.meta.glob('../asset/*.{png,jpg,...}', { eager: true, query: '?url', import: 'default' })`
   - **Result:** Vite can now statically analyze and bundle all assets for production builds

5. **Barrel Export Cleanup:**
   - Updated `shared/layer/index.ts` to export from `model.ts` and `math.ts`
   - Fixed all import paths in `StageSystem.ts`, `engine.ts` to use barrel exports
   - Removed unused imports and fixed ESLint violations

**Architecture Principles for Future AI Agents:**

- `model.ts` = Single source of truth for types, constants, and configuration loading
- `math.ts` = Single source of truth for pure calculation functions (no side effects)
- `engine.ts` = Runtime execution layer that imports from `model.ts` and `math.ts`
- `index.ts` = Barrel export that re-exports from the above modules
- Asset loading MUST use `import.meta.glob` for Vite static analysis (critical for production builds)

**Validation:**

- ✅ TypeScript typecheck passes
- ✅ ESLint passes (max-warnings=0)
- ✅ Prettier formatting verified
- ✅ All 19 layers load successfully in dev mode
- ✅ Zero runtime errors in browser console
- ✅ Production build compatibility ensured via static asset manifest

## External Dependencies

- **React 18:** Frontend UI library.
- **TypeScript:** Programming language.
- **Vite 7:** Build tool and development server.
- **Three.js:** WebGL 3D library.
- **Tailwind CSS:** Utility-first CSS framework.
