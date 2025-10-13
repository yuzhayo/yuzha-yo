# Architecture Overview

## Purpose
- Deliver a single source of truth for how the Yuzha runtime boots, loads configuration, resolves assets, and renders animated layers.
- Provide AI agents with a deterministic workflow so they can trace execution without guessing about side effects.
- Highlight which modules own which responsibilities and which functions form the public hand-off points between layers of the system.

## Runtime Pipeline
1. **App shell** (`yuzha/src/App.tsx`, `yuzha/src/MainScreen.tsx`)
   - Bootstraps React, injects the `MainScreen` wrapper, and exposes renderer controls from `MainScreenUtils.tsx`.
   - Calls `getRendererType()` to decide between DOM, Canvas, or Three.js renderers (or respect manual override).
2. **Configuration load** (`shared/config/Config.ts`)
   - `loadLayerConfig()` transforms `ConfigYuzha.json` groups into flat `LayerConfigEntry` objects, validates them, and sorts by draw order.
   - Results are cached in memory, so all renderers read the same immutable array.
3. **Layer preparation** (`shared/layer/LayerCore.ts`)
   - `prepareLayer()` resolves assets from `ImageRegistry.json`, measures images, calculates stage transforms, and precomputes coordinate bundles for centers, tips, bases, spin, and orbit anchors.
   - Returns `UniversalLayerData` for each 2D layer; 3D layers can be added later by extending this step.
4. **Processor pipeline** (`shared/layer/LayerCorePipeline.ts`)
   - Renderers attach processors such as `createSpinProcessor()`, `createOrbitalProcessor()`, and `createImageMappingDebugProcessor()`.
   - `runPipeline()` merges processor output into `EnhancedLayerData`.
5. **Renderer execution**
   - **DOM** (`shared/stages/StageDOM.tsx` + `LayerEngineDOM.ts`): positions absolute DOM nodes, applies CSS transforms, and injects debug overlays.
   - **Canvas** (`StageCanvas.tsx` + `LayerEngineCanvas.ts`): draws layers to a 2D context, re-running processors in a requestAnimationFrame loop only when animation is required.
   - **Three.js** (`StageThree.tsx` + `LayerEngineThree.ts`): builds textured quads in WebGL, reuses the same processors, and delegates orbit lines to Three helpers.
6. **Viewport transform** (`shared/utils/stage2048.ts`)
   - `createStageTransformer()` keeps the 2048x2048 stage centered within any viewport, ensuring consistent coordinates across renderers and overlays.

```
React App
  -> MainScreen.tsx
      -> StageDOM.tsx
      -> StageCanvas.tsx
      -> StageThree.tsx
          (each mounts its LayerEngine variant)
              ^
              |
       Config.load -> LayerCore.prepareLayer -> LayerCorePipeline.runPipeline
```

## Module Responsibilities

| File | Responsibility | Key Exports |
| ---- | -------------- | ----------- |
| `shared/config/Config.ts` | Load, flatten, validate grouped configuration. | `loadLayerConfig`, `validateLayerConfig` |
| `shared/layer/LayerCore.ts` | Resolve assets, compute transforms, prepare `UniversalLayerData`. | `prepareLayer`, `compute2DTransform`, coordinate helpers |
| `shared/layer/LayerCorePipeline.ts` | Compose processors that mutate layer data per frame. | `runPipeline`, `processBatch`, `LayerProcessor` |
| `shared/layer/LayerCorePipelineSpin.ts` | Add spin animation state. | `createSpinProcessor` |
| `shared/layer/LayerCorePipelineOrbital.ts` | Add orbital motion, auto-orientation, path visibility. | `createOrbitalProcessor` |
| `shared/layer/LayerCorePipelineImageMappingDebug.ts` | Generate debug overlay primitives. | `createImageMappingDebugProcessor` |
| `shared/layer/LayerEngine{DOM,Canvas,Three}.ts` | Renderer-specific mounting and frame loops. | `mountDomLayers`, `mountCanvasLayers`, `mountThreeLayers` |
| `shared/utils/stage2048.ts` | Maintain the fixed 2048 stage geometry and conversions. | `STAGE_SIZE`, `createStageTransformer`, `viewportToStageCoords` |
| `yuzha/src/MainScreenUtils.tsx` | UI overlay, renderer badge, config launcher, gesture handling. | `MainScreenBtnPanel`, `MainScreenUpdater`, `useMainScreenBtnGesture` |

## Cross-Cutting Concerns
- **Configuration groups**: `ConfigYuzha.json` separates "Basic Config", "Spin Config", "Orbital Config", and "Image Mapping Debug". `transformConfig()` merges them with clear precedence (spin overrides anchor points, orbital overrides position during animation, debug never overrides).
- **2048 Coordinate Contract**: All renderers, processors, and UI overlays read and write in stage coordinates. Conversion helpers in `LayerCore.ts` and `stage2048.ts` keep calculations consistent.
- **Processor determinism**: Processors are pure relative to `(layer, timestamp)` and never mutate global state. This makes them safe for AI agents to call directly, test, or recombine.
- **Asset registry**: `ImageRegistry.json` is the single list of file paths. `resolveAssetPath()` and `resolveAssetUrl()` enforce safe lookups and throw meaningful errors when a lookup fails.
- **Device capability detection**: `shared/utils/DeviceCapability.ts` and `RendererDetector.ts` select sensible defaults for browser vs. headless vs. low-end hardware.

## AI Agent Orientation
- Always start from `loadLayerConfig()`; do not manually import JSON. The loader applies validation, order sorting, and caching.
- When preparing new layers, use `prepareLayer(entry, STAGE_SIZE)` so you get coordinate bundles that processors expect.
- Adding a new animation requires **(a)** a processor that reads `layer.calculation` bundles, and **(b)** hooking the processor into each renderer in `StageDOM.tsx`, `StageCanvas.tsx`, and `StageThree.tsx`.
- To modify renderer behavior, prefer updating the layer engines. `MainScreen` purposefully stays thin and only toggles which renderer mounts.
- The stage transformer must be active before any pointer math. Use the cleanup function returned by `createStageTransformer()` when unmounting stages to avoid stale resize listeners.

## Operational Checklist
- `npm install` at repo root (`package.json`) to install shared workspaces.
- `npm run dev --workspace yuzha` to launch the Vite dev server.
- `npm test --workspace shared` runs layer unit tests located in `shared/layer/__tests__`.
- Regenerate the asset registry with `npm run sync:images` whenever new files are added under `shared/asset`.

This overview should equip an AI agent (or any new contributor) with the correct entry points, allowing deep dives into the specialised documents (`01_CONFIG_SYSTEM_GUIDE.md`, `05_LAYER_PIPELINE_SYSTEM.md`, etc.) without risk of missing critical context.
