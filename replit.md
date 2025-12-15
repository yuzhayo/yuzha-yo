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

## Recent Architecture Changes

### Timestamp Overlay System Refactoring (Dec 2025) - COMPLETED

**Objective:** Transform hardcoded 3-section text overlay system into a dynamic, expandable overlay system supporting unlimited text and image overlays.

**Phase 1 - Dynamic Overlay Array Architecture:**

1. **Type System Redesign:**
   - Created `BaseOverlay`, `TextOverlay`, `ImageOverlay` discriminated union types
   - Unified overlay structure with `id`, `type`, `position`, and type-specific fields
   - Location: `yuzha/src/timestamp/types.ts`

2. **State Management Consolidation:**
   - Replaced 3 separate useState hooks with single `overlays: Overlay[]` array
   - Map-based ref management: `useRef<Map<string, TimestampFloatingRef>>`
   - Added `syncOverlayPositionsFromRefs()` for position synchronization
   - Location: `yuzha/src/timestamp/timestampScreen.tsx`

**Phase 2 - Collision Detection:**

1. **AABB Collision Utilities:**
   - `checkAABBCollision()` - Tests if two bounding boxes overlap
   - `resolveCollision()` - Uses previous position to determine minimal axis correction
   - Location: `yuzha/src/timestamp/types.ts`

2. **Block Behavior:**
   - Overlays cannot overlap; dragging into another overlay pushes it back
   - Visual feedback: red outline during collision state
   - Collision checks happen in real-time during drag events

**Phase 3 - Image Overlay Support:**

1. **ImageFloating Component:**
   - Created `yuzha/src/timestamp/ImageFloating.tsx`
   - Supports drag and resize with corner handles
   - Separate ref management: `imageOverlayRefsMap` for image overlays
   - Interface: `ImageFloatingRef` with `getRelativePosition`, `setRelativePosition`, `getSize`

2. **Image Lifecycle:**
   - `addImageOverlay(src, width, height)` - Creates new image overlay with auto-scaling
   - `deleteImageOverlay(id)` - Removes image overlay and cleans up refs
   - `nextImageId` uses functional updates to prevent ID reuse after deletions

3. **Canvas Export:**
   - `handleSave()` awaits all image loads via Promise.all before drawing
   - Images render correctly in exported PNG

**Phase 4 - V3 Preset Migration:**

1. **TimestampPresetV3 Format:**
   - Stores full `overlays: Overlay[]` array including image overlays
   - Replaces separate `time`, `date`, `location` fields from V2

2. **Automatic Migration:**
   - `migrateV2toV3()` converts V2 presets to V3 on load
   - Chain migration: V1 → V2 → V3 for legacy presets
   - Location: `yuzha/src/timestamp/PresetManager.ts`

3. **Save/Load Updates:**
   - `handleSavePreset()` saves complete overlays array with synced positions
   - `handleLoadPreset()` restores all overlays including images, resets `nextImageId`

**Architecture Principles:**

- `overlays` state = Single source of truth for overlay data
- Refs store real-time drag positions; sync to state before saves/history
- `getCurrentState()` always fetches fresh positions from refs
- `DEFAULT_OVERLAYS` defines the 3 permanent sections (time, date, location)
- Collision resolution uses previous position for stable "block" behavior
- Image overlay IDs use functional state updates to prevent reuse
- Blob URLs are revoked on delete/preset load to prevent memory leaks

**Known Limitations:**

- Image overlays use blob: URLs which are session-only; saved presets store the URL but images will not persist across browser sessions
- For persistent images, a future enhancement could convert to base64 or server storage

**Key Files:**

- `yuzha/src/timestamp/types.ts` - Type definitions, collision utilities
- `yuzha/src/timestamp/timestampScreen.tsx` - Main component, state management
- `yuzha/src/timestamp/TimestampFloating.tsx` - Text overlay component
- `yuzha/src/timestamp/ImageFloating.tsx` - Image overlay component
- `yuzha/src/timestamp/TimestampSettings.tsx` - Settings panel, preset UI
- `yuzha/src/timestamp/PresetManager.ts` - Preset storage, V1/V2/V3 migration

### Counter2 Optimized Screen (Dec 2025) - COMPLETED

**Objective:** Create an optimized counter screen using the shared/layer architecture for better performance on low-end devices.

**Design Choices:**

1. **Separate Implementation:** Created `counter2` folder instead of refactoring original `counter` to minimize risk
2. **Canvas2D Only:** Uses `StageCanvas` exclusively for maximum compatibility and performance
3. **Custom Pipeline:** Implements `createCounter2Pipeline()` with custom config loading from `ConfigCounter2.json`
4. **Device Detection:** Uses `DeviceCapability` with `performanceLevel` and `isLowEndDevice` for device classification

**Key Files:**

- `yuzha/src/counter2/counter2Screen.tsx` - Main screen with custom pipeline loader
- `yuzha/src/counter2/counter2Floating.tsx` - Floating panel UI
- `yuzha/src/counter2/counter2Settings.tsx` - Settings panel
- `yuzha/src/counter2/counter2Buttons.tsx` - Control buttons
- `shared/layer/ConfigCounter2.json` - Layer configuration (all 2D layers)

**Architecture Notes:**

- `StageCanvas` accepts `loadPipeline` prop for custom configurations
- `PreparedLayer` format: `{ entry, data, processors, metadata }`
- All layers use `renderer: "2D"` for consistent Canvas2D rendering
- Navigation integrated through `MainScreenUtils.tsx`, `MainScreen.tsx`, and `App.tsx`

### Layer Module Simplification Refactoring (Nov 2025)

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
