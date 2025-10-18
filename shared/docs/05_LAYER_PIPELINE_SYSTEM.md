# Layer Pipeline System

The layer pipeline converts configuration entries into renderable objects and enriches them with animation state every frame. This document maps each phase and highlights which functions own critical steps.

## Pipeline Stages

```
ConfigYuzha.json
   -> transformConfig()
LayerConfigEntry[]
   -> prepareLayer()
UniversalLayerData[]
   -> createStagePipeline()
PreparedLayer[] (data + processors)
   -> Renderer adapters -> LayerEngines
Renderer output
```

## Phase 1 - Transform Configuration

- `shared/config/Config.ts`
  - `transformConfig(rawEntries)`: merges grouped settings into `LayerConfigEntry`.
  - `validateLayerConfig(entry)`: guards against out-of-range values.
  - `loadLayerConfig()`: prepares and caches the sorted array.

## Phase 2 - Prepare Layer

- `shared/layer/LayerCore.ts`
  - `prepareLayer(entry, stageSize)`:
    - Resolves asset URLs via `resolveAssetPath()` and `resolveAssetUrl()`.
    - Loads image dimensions (cached in `IMAGE_DIMENSION_CACHE`).
    - Computes scale and position using `compute2DTransform()`.
    - Builds `imageMapping` (center, tip, base) using `computeImageMapping()`.
    - Populates `layer.calculation` with coordinate bundles for use by processors.
    - Returns `UniversalLayerData` or `null` if the asset is missing.
  - Helper exports such as `validatePoint`, `imagePointToStagePoint`, `stagePointToPercent` are reusable by processors.

## Phase 3 - Processor Attachment

- `shared/layer/pipeline/ProcessorRegistry.ts`
  - Registers processor plugins (`spin`, `orbital`, `image-mapping-debug`, etc.).
  - `getProcessorsForEntry(entry)` evaluates plugins against config and returns attachable processors.
- `shared/layer/pipeline/StagePipeline.ts`
  - `createStagePipeline({ stageSize? })`: prepares each layer then uses the registry to assemble `{ data, processors }` tuples.
  - `toRendererInput(pipeline)`: convenience helper for renderer adapters.

### Provided Processor Modules

- `LayerCorePipelineSpin.ts`
  - `createSpinProcessor(config)`: adds timed rotation updates.
- `LayerCorePipelineOrbital.ts`
  - `createOrbitalProcessor(config)`: moves layers along circular paths, optionally auto-orienting them.
- `LayerCorePipelineImageMappingUtils.ts`
  - Combines image mapping math, debug visual generation, and `createImageMappingDebugProcessor(config)`.

Processors follow the signature:

```ts
type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;
```

They should treat `layer` as immutable and return a new object (or shallow clone) containing modifications.

## Phase 4 - Frame Execution

- `shared/layer/LayerCorePipeline.ts`
  - `runPipeline(baseLayer, processors, timestamp)`: sequentially applies processors and returns `EnhancedLayerData`.
  - `processBatch(baseLayers, processors, timestamp)`: convenience helper for running the same processors on multiple layers.
- Renderers call `runPipeline()` on every frame that requires animation and reuse cached results for static layers.
- `createPipelineCache()` (from `LayerCorePipeline.ts`) memoises processor output keyed by `layerId` and timestamp bucket.

## Phase 5 - Rendering

- Renderer adapters under `shared/layer/pipeline/renderers/` mount the pipeline into each backend (DOM, Canvas, Three) and wire up viewport transforms.
- Renderer engines consume `EnhancedLayerData`:
  - `layer.position`, `layer.scale`, and `layer.rotation` control base transforms.
  - `layer.currentRotation` (spin processor) and `layer.currentOrbitAngle` (orbital processor) provide per-frame adjustments.
  - `layer.imageMappingDebugVisuals` contains primitives for optional overlays.
  - `layer.visible` lets processors hide layers when they exit the stage bounds.

## Error Handling

- Missing assets: `prepareLayer()` logs a warning and skips the layer.
- Processor failures: all processors should catch internal errors and return the original layer to preserve rendering. Follow this pattern when adding new processors.
- Validation warnings: appear only in development builds but should be treated as actionable.

## Extending the Pipeline

1. **Add a processor module**:
   - Export `createMyProcessor(config): LayerProcessor`.
   - Accept overrides and use defaults from `layer.calculation`.
   - Return the original layer if your feature is disabled by config.
2. **Register the processor** via `registerProcessor({ name, shouldAttach, create })` so the pipeline can attach it automatically.
3. **Update docs**:
   - Document new config fields in `01_CONFIG_SYSTEM_GUIDE.md`.
   - Extend this file with the new processor description.
4. **Tests**:
   - Add unit tests under `shared/layer/__tests__` to cover the new processor logic.

## AI Agent Notes

- Call `createStagePipeline()` in isolation when you need a snapshot of prepared layers and attached processors.
- The pipeline is deterministic given the same config, timestamp, and processor set. Use this property for snapshot testing.
- Avoid side effects inside processors. Cache objects inside closures instead.
- When debugging, log `layer.layerId` and relevant calculated fields; each processor receives the enriched state from the previous one.
