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
| `AnimationConstants` | `{ DEG_TO_RAD, RAD_TO_DEG, ... }` | Precomputed constants used by spin/orbit math. |
| `normalizeAngle` | `(angle: number) => number` | Utility to clamp angles to 0-360 range. |
| `calculateOrbitPosition` | `(center, radius, angle) => { x: number; y: number }` | Reusable circular motion helper. |
| `createPipelineCache` | `() => PipelineCache` | Memoises processor output per frame. |
| `batchLayersByAnimation` | `(layers) => LayerBatch` | Splits layers into static/spin/orbital buckets.
| `easeInOutQuad` | `(t: number) => number` | Shared easing helper. |

---

## Stage Pipeline (`shared/layer/pipeline`)

| Export | Signature | Description |
| ------ | --------- | ----------- |
| `createStagePipeline` | `({ stageSize?, processorContext? }?) => Promise<StagePipeline>` | Loads config, prepares layers, attaches processors. |
| `StagePipeline` | `{ stageSize: number; layers: PreparedLayer[] }` | Result bundle fed to renderer adapters. |
| `PreparedLayer` | `{ entry: LayerConfigEntry; data: EnhancedLayerData; processors: LayerProcessor[] }` | Per-layer payload delivered to engines. |
| `toRendererInput` | `(pipeline) => { data, processors }[]` | Convenience helper for adapter calls. |
| `registerProcessor` | `(plugin: ProcessorPlugin) => void` | Adds or replaces a processor plugin. |
| `getProcessorsForEntry` | `(entry, context?) => LayerProcessor[]` | Evaluates plugins against a config entry. |

---

## Processor Modules (`shared/layer`)

| Module | Key Export | Purpose |
| ------ | ---------- | ------- |
| `LayerCorePipelineSpin.ts` | `createSpinProcessor(config: SpinConfig)` | Adds rotational animation based on spin config. |
| `LayerCorePipelineOrbital.ts` | `createOrbitalProcessor(config: OrbitalConfig)` | Adds orbital motion, auto orientation, and orbit line data. |
| `LayerCorePipelineImageMappingUtils.ts` | `computeImageMapping`, `createImageMappingDebugProcessor`, `CanvasDebugRenderer`, `DomDebugRenderer`, `ThreeDebugRenderer`, `generate*` helpers | Image mapping math & debug visuals. |

Types:
- `SpinConfig`, `OrbitalConfig`
- `ImageMappingDebugVisuals`

---

## Layer Engines (`shared/layer`)

| File | Export | Description |
| ---- | ------ | ----------- |
| `LayerEngines.ts` | `mountDomLayers`, `mountCanvasLayers`, `mountThreeLayers` | Shared DOM/Canvas/Three mounting logic. |

Each mount function resolves images, initialises renderer-specific resources, and returns a cleanup callback.

---

## Renderer Adapters (`shared/layer/pipeline/renderers`)

| File | Export | Description |
| ---- | ------ | ----------- |
| `DomRendererAdapter.ts` | `mountDomRenderer({ container, stage }, pipeline)` | Wires the stage pipeline into the DOM engine and viewport transformer. |
| `CanvasRendererAdapter.ts` | `mountCanvasRenderer({ container, canvas }, pipeline)` | Sets up the 2D context, transformer, and delegates to `mountCanvasLayers`. |
| `ThreeRendererAdapter.ts` | `mountThreeRenderer({ container, canvas }, pipeline)` | Configures WebGL renderer/camera and delegates to `mountThreeLayers`. |

---

## Stage Components (`shared/stage`)

| Component | Description |
| --------- | ----------- |
| `StageDOM.tsx` | React wrapper that calls `createStagePipeline()` then delegates to `mountDomRenderer`. |
| `StageCanvas.tsx` | React wrapper that calls `createStagePipeline()` then delegates to `mountCanvasRenderer`. |
| `StageThree.tsx` | React wrapper that calls `createStagePipeline()` then delegates to `mountThreeRenderer`. |

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
- **Prepare layers**: either call `prepareLayer(entry, STAGE_SIZE)` manually or rely on `createStagePipeline()` to do it for you.
- **Attach processors**: register plugins via `registerProcessor()` so the pipeline can attach them automatically.
- **Render frames**: inside the renderer, call `runPipeline(layer, processors, timestamp)` for animated layers.
- **Transform coordinates**: use `viewportToStageCoords()` and `stageToViewportCoords()` for input/output alignment.

---

Keep this document up to date as new modules or exports become part of the public workflow. When adding new processors, configuration helpers, or renderer engines, list them here with concise descriptions so downstream agents can rely on the documentation.
