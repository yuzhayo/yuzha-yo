# Layer System Documentation

## Overview

The layer system prepares configuration data for rendering and drives runtime animation. It now focuses on spin and orbital behaviors only—the legacy debug visualization tooling has been archived while the pipeline is simplified. Future agents can restore the debug module from git history if live overlays are required again.

## Speed System (Updated)

**IMPORTANT FOR FUTURE AI AGENTS:**

The speed system for both `spinSpeed` and `orbitSpeed` uses **ROTATIONS PER HOUR** as the unit of measurement.

### Speed Unit Details

- **Unit**: Rotations per hour (not degrees per second)
- **Formula**: `angle = elapsedSeconds × speed × 0.1`
  - Where `0.1 = 360° / 3600 seconds`
- **Relationship**: Low value = slow speed, High value = fast speed

### Examples

| Speed Value | Behavior                       | Description                |
| ----------- | ------------------------------ | -------------------------- |
| `1.0`       | 1 full rotation in 1 hour      | Standard speed             |
| `2.0`       | 2 full rotations in 1 hour     | 2x faster                  |
| `0.5`       | Half rotation (180°) in 1 hour | 2x slower                  |
| `12.0`      | 12 full rotations in 1 hour    | 1 rotation every 5 minutes |
| `0.1`       | 1/10 rotation (36°) in 1 hour  | Very slow                  |

### Conversion Reference

To convert from the old system (degrees per second) to the new system (rotations per hour):

```
rotations_per_hour = (degrees_per_second × 3600) / 360
rotations_per_hour = degrees_per_second × 10

Example:
  Old: spinSpeed = 36 (deg/sec) → New: spinSpeed = 360 (rot/hour)
  Old: spinSpeed = 0.1 (deg/sec) → New: spinSpeed = 1 (rot/hour)
```

To think about speed intuitively:

- Want 1 rotation per minute? Use `speed = 60`
- Want 1 rotation per 10 minutes? Use `speed = 6`
- Want 1 rotation per day (24 hours)? Use `speed = 1/24 ≈ 0.042`

## Module Architecture

```
shared/layer/
├── layerBasic.ts   # Coordinate math & validation helpers (no deps)
├── layerCore.ts    # Loads assets, computes positions, builds base layer data
├── layerSpin.ts    # Spin animation processor (pivot-correct rotation)
├── layerOrbit.ts   # Orbital motion processor (position + auto-orient)
├── layer.ts        # Processor registry, pipeline execution utilities
├── index.ts        # Barrel exports
└── README.md       # This guide
```

> Debug visualization utilities (`layerDebug.ts`) are currently removed; reintroduce them if diagnostic overlays are needed.

## Data Flow

```
ConfigYuzha.json (layer definitions)
  ↓
shared/config/Config.ts (loads, flattens groups, validates)
  ↓
shared/layer/layerCore.ts (prepareLayer → UniversalLayerData)
  ↓
shared/layer/layer.ts processors (spin + orbit)
  ↓
Stage renderers (DOM / Canvas / Three.js)
  ↓
React screens
```

## Module Summaries

### `layerBasic.ts` – Foundation Utilities

- Pure math/coordinate helpers (`imagePercentToImagePoint`, `imagePointToStagePoint`, `validatePoint`, `normalizeAngle`, etc.)
- No dependencies; imported by every other layer module.

### `layerCore.ts` – Core Preparation

- Resolves assets via `ImageRegistry.json`.
- Computes image center + scaled transforms (tip/base math removed for lean pipeline).
- Exposes `prepareLayer(entry, stageSize)` returning `UniversalLayerData` with:
  - Stage/image coordinate bundles (center, spin pivot, orbit anchors).
  - Asset URLs, scaling, rotation, and orbit configuration snapshots.

### `layerSpin.ts` – Spin Processor

- Runtime animation: rotates layers around the configured pivot while keeping the pivot anchored in stage space.
- Supports optional runtime overrides via `SpinConfig` (percent-based pivot).

### `layerOrbit.ts` – Orbital Processor

- Handles circular motion, optional auto-orientation, and orbit-line metadata.
- Computes visibility hints to let renderers skip off-stage orbital layers.

### `layer.ts` – Processor Registry & Utilities

- Registers the default processors (`spin`, `orbital`).
- Provides `runPipeline`, `processBatch`, and `createPipelineCache` for renderers.
- Maintains `EnhancedLayerData` type definitions reflecting the trimmed data model.

## Migration Notes

- Config debug flags (`showTip`, `showBase`, etc.) and tip/base angles were removed. JSON configs should only include core, spin, and orbital groups.
- Renderers no longer import debug helpers. Hooks remain in comments for future re-enabling.
- `LayerCorePipelineImageMappingUtils.ts` (legacy debug math) is retired; keep calculations inside `layerCore.ts`.

## Re-enabling Debug Tooling Later (TODO)

1. Restore `shared/layer/layerDebug.ts` and re-export it from `shared/layer/index.ts`.
2. Re-register the debug processor inside `layer.ts`.
3. Reintroduce debug draws in `StageCanvas.tsx` and `StageThree.tsx`.
4. Add config schema entries back into `shared/config/Config.ts` and JSON resources.

Keep this list updated if additional steps become necessary.
