# API Reference

This reference summarises the primary exported functions, types, and modules used across the Yuzha runtime. It focuses on stable contracts that AI agents and contributors rely on.

## Conventions
- Paths are relative to the workspace root (`shared/` or `yuzha/src/`).
- Function signatures use TypeScript syntax.
- Optional parameters are marked with `?`.
- Return types may be simplified for clarity.

---

## Configuration (`shared/config`)

| Export | Signature | Description |
| ------ | --------- | ----------- |
| `loadLayerConfig` | `(): LayerConfig` | Returns the cached configuration array in draw order. |
| `validateLayerConfig` | `(entry: LayerConfigEntry) => string[]` | Validates a single config entry; returns error messages. |
| `ConfigYuzhaAccordion` | `React.FC<{ layers: LayerConfigEntry[]; onChange: ... }>` | Accordion UI for editing config groups. |
| `ConfigYuzhaPopup` | `React.FC<{ isOpen: boolean; onClose(): void; title?: string }>` | Popup shell containing the accordion editor. |
| `transformConfigToAccordion` | `(...) => AccordionParentItem[]` | Converts runtime config into UI-friendly data. |
| `transformAccordionToConfig` | `(...) => LayerConfigEntry[]` | Converts UI state back into config entries. |
| `saveConfigToLocalStorage` | `(accordion: AccordionParentItem[]) => void` | Persists config overrides. |
| `loadConfigFromLocalStorage` | `() => AccordionParentItem[]` | Restores overrides, falling back to base config. |

Types of interest:
- `LayerConfigEntry`
- `LayerConfig` (alias for `LayerConfigEntry[]`)
- `LayerRenderer` (`"2D"` or `"3D"`)

---

## Layer Core (`shared/layer/LayerCore.ts`)

### Preparation
| Export | Signature | Notes |
| ------ | --------- | ----- |
| `prepareLayer` | `(entry: LayerConfigEntry, stageSize: number) => Promise<UniversalLayerData | null>` | Resolves assets, computes transforms, returns canonical layer data. |
| `preloadCriticalAssets` | `(imageIds: string[]) => Promise<void>` | Primes the image dimension cache. |
| `compute2DTransform` | `(entry, stageSize, imageDimensions) => Layer2DTransform` | Calculates stage position/scale using pivot logic. |

### Geometry Helpers
| Export | Signature |
| ------ | --------- |
| `imagePointToStagePoint` | `(point, imageDimensions, scale, position) => Point2D` |
| `stagePointToImagePoint` | `(point, imageDimensions, scale, position) => Point2D` |
| `imagePointToPercent` | `(point, imageDimensions) => PercentPoint` |
| `imagePercentToImagePoint` | `(percent, imageDimensions) => Point2D` |
| `stagePointToPercent` | `(point, stageSize) => PercentPoint` |
| `stagePercentToStagePoint` | `(percent, stageSize) => Point2D` |
| `validatePoint` | `(point, fallback?) => Point2D` |
| `validateScale` | `(scale, fallback?) => Point2D` |
| `validateDimensions` | `(dimensions, fallback?) => { width: number; height: number }` |
| `is2DLayer` | `(entry) => boolean` |

Types of interest:
- `UniversalLayerData`
- `LayerCalculationPoints`
- `Point2D`
- `PercentPoint`

---

## Pipeline Core (`shared/layer/LayerCorePipeline.ts`)

| Export | Signature | Description |
| ------ | --------- | ----------- |
| `LayerProcessor` | `(layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData` | Function signature for processors. |
| `EnhancedLayerData` | `UniversalLayerData & {...}` | Layer data augmented by processors. |
| `runPipeline` | `(layer, processors, timestamp?) => EnhancedLayerData` | Calls processors sequentially. |
| `processBatch` | `(layers, processors, timestamp?) => EnhancedLayerData[]` | Applies the same processors to multiple layers. |

---

## Processor Modules (`shared/layer`)

| Module | Key Export | Purpose |
| ------ | ---------- | ------- |
| `LayerCorePipelineSpin.ts` | `createSpinProcessor(config: SpinConfig)` | Adds rotational animation based on spin config. |
| `LayerCorePipelineOrbital.ts` | `createOrbitalProcessor(config: OrbitalConfig)` | Adds orbital motion, auto orientation, and orbit line data. |
| `LayerCorePipelineImageMappingDebug.ts` | `createImageMappingDebugProcessor(config)` | Generates debug visuals (markers, rays, axis lines). |
| `LayerCoreAnimationUtils.ts` | `AnimationConstants`, `normalizeAngle`, `applyRotationDirection`, `calculateOrbitPosition`, `createPipelineCache`, `batchLayersByAnimation` | Shared math helpers and caches. |
| `LayerCorePipelineImageMappingUtils.ts` | `CanvasDebugRenderer`, `DomDebugRenderer`, `generate*` helpers | Rendering utilities for debug visuals. |
| `LayerCorePipelineOrbitalUtils.ts` | `generateOrbit*` helpers | Adds orbit-specific debug primitives. |

Types:
- `SpinConfig`, `OrbitalConfig`
- `ImageMappingDebugVisuals`

---

## Layer Engines (`shared/layer`)

| File | Export | Description |
| ---- | ------ | ----------- |
| `LayerEngineDOM.ts` | `mountDomLayers(rootElement, layers)` | Creates DOM nodes, runs processor loop (if needed), returns cleanup. |
| `LayerEngineCanvas.ts` | `mountCanvasLayers(ctx, layersWithProcessors)` | Draws layers to a 2D context with optional animation loop. |
| `LayerEngineThree.ts` | `mountThreeLayers(scene, renderer, camera, layers)` | Adds textured meshes to a Three.js scene and animates them. |

Each mount function resolves images, initialises renderer-specific resources, and returns a cleanup callback.

---

## Stage Components (`shared/stages`)

| Component | Description |
| --------- | ----------- |
| `StageDOM.tsx` | React component mounting the DOM renderer; sets up transformer and cleanup. |
| `StageCanvas.tsx` | React component mounting the Canvas renderer. |
| `StageThree.tsx` | React component mounting the Three.js renderer, configures WebGL settings via `getDeviceCapability()`. |

All stage components share the same workflow: load config, prepare layers, attach processors, mount renderer, initialise `createStageTransformer`.

---

## Stage Utilities (`shared/utils/stage2048.ts`)

| Export | Signature | Description |
| ------ | --------- | ----------- |
| `STAGE_SIZE` | `2048` | Global stage dimension. |
| `StageTransform` | `{ scale: number; offsetX: number; offsetY: number; width: number; height: number }` | Result object for transforms. |
| `computeCoverTransform` | `(viewportWidth, viewportHeight) => StageTransform` | Calculates cover scaling. |
| `createStageTransformer` | `(stageEl, containerEl, options?) => () => void` | Applies the transform and handles resize events. |
| `applyStagePosition` | `(element, stageX, stageY) => void` | Positions DOM elements using stage coordinates. |
| `viewportToStageCoords` | `(x, y, transform) => { x: number; y: number }` | Convert viewport coordinates to stage space. |
| `stageToViewportCoords` | `(x, y, transform) => { x: number; y: number }` | Convert stage coordinates to viewport space. |

---

## Renderer Detection & Device Capability (`shared/utils`)

| Module | Export | Description |
| ------ | ------ | ----------- |
| `RendererDetector.ts` | `isAIAgentEnvironment(): boolean`, `getRendererType(): "three" | "canvas"` | Detects headless or limited environments and chooses a renderer. |
| `DeviceCapability.ts` | `getDeviceCapability(): DeviceCapability` | Returns flags like `isLowEndDevice`, `enableAntialiasing`, `pixelRatio`. |
| `logger.ts` | `createLogger(namespace)` | Lightweight logging helper with opt-in levels. |

---

## Main Screen (`yuzha/src`)

| File | Key Exports | Notes |
| ---- | ----------- | ----- |
| `MainScreen.tsx` | `MainScreen`, `MainScreenOverlay` | Hosts renderer selection, overlay buttons, and stage container. |
| `MainScreenUtils.tsx` | `MainScreenBtnPanel`, `MainScreenUpdater`, `MainScreenRendererBadge`, `MainScreenBtnDock`, `MainScreenBtnGestureArea`, `useMainScreenBtnGesture`, `clearCachesAndReload` | Overlay UI, gesture handling, update controls, config popup trigger. |

---

## Types

| Type | Description |
| ---- | ----------- |
| `LayerConfigEntry` | Runtime representation of a single layer's configuration. |
| `UniversalLayerData` | Output of `prepareLayer()`, ready for renderer consumption. |
| `EnhancedLayerData` | Layer data after processors run for a frame. |
| `LayerProcessor` | Function signature for pipeline processors. |
| `StageTransform` | Output of `computeCoverTransform()`. |
| `DeviceCapability` | Capability flags for renderer tuning. |

---

## Usage Patterns
- **Load configuration**: call `loadLayerConfig()` once during init; reuse the returned array.
- **Prepare layers**: call `prepareLayer(entry, STAGE_SIZE)` for each 2D layer.
- **Attach processors**: push `createSpinProcessor`, `createOrbitalProcessor`, or custom processors into the per-layer array.
- **Render frames**: inside the renderer, call `runPipeline(layer, processors, timestamp)` for animated layers.
- **Transform coordinates**: use `viewportToStageCoords()` and `stageToViewportCoords()` for input/output alignment.

---

Keep this document up to date as new modules or exports become part of the public workflow. When adding new processors, configuration helpers, or renderer engines, list them here with concise descriptions so downstream agents can rely on the documentation.
