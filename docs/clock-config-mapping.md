# Clock Config → Layer Pipeline Mapping

## Purpose

This document explains how the clock-specific configuration now lives inside `ConfigYuzha.json` and flows through `LayerConfigEntry`. Use this mapping to understand how the legacy standalone config (`ClockStageConfig.json`) was translated into the unified stage system.

## Coordinate & Geometry Fields

| Clock JSON field  | Layer entry target                                                | Notes                                                                                             |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `stagePoint`      | `Spin Config.spinStagePoint` and `Basic Config.BasicStagePoint`   | Keeps the element pivot anchored on the same stage coordinate for both spin and static placement. |
| `stageLine`       | `Orbital Config.orbitLinePoint`                                   | Defines orbit radius/direction. Orbit centre remains `orbitStagePoint` (same as `stagePoint`).    |
| `spinImagePoint`  | `Spin Config.spinImagePoint` AND `Orbital Config.orbitImagePoint` | Percent pivot relative to texture; supports values outside 0–100.                                 |
| `sizePercent.x/y` | `ImageScale` (x%, y%)                                             | LayerCore already supports non-uniform scale via the `[x, y]` tuple.                              |

## Spin / Orbit Behaviour

| Clock JSON field  | Layer entry target                     | Notes                                                                                                   |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `spin.speed`      | `Spin Config.spinSpeed`                | Will accept either numeric RPM (rotations per hour) or string alias (`"hour"`, `"minute"`, `"second"`). |
| `spin.direction`  | `Spin Config.spinDirection`            | Same literal values (`"cw"` / `"ccw"`).                                                                 |
| `spin.format`     | **New** `Spin Config.spinFormat`       | Needs to be added to the layer schema to capture 12/24 hour behaviour.                                  |
| `spin.timezone`   | **New** `Spin Config.spinTimezone`     | Stores timezone offset string (UTC±HH[:MM]).                                                            |
| `orbit.speed`     | `Orbital Config.orbitSpeed`            | Supports numeric or alias, like spin.                                                                   |
| `orbit.direction` | `Orbital Config.orbitDirection`        | Reuses existing field.                                                                                  |
| `orbit.format`    | **New** `Orbital Config.orbitFormat`   | Mirrors spin format; optional but keeps config consistent.                                              |
| `orbit.timezone`  | **New** `Orbital Config.orbitTimezone` | Optional timezone for orbit alias speeds.                                                               |

## Additional Behaviour

- The old `ClockStageConfig.stageSize` maps to the global `STAGE_SIZE` (2048) already provided by `StageSystem`.
- `ClockStageConfig.defaultTimezone` is represented by giving each element an explicit timezone or defaulting to UTC.

## Transformation Checklist

1. `shared/config/Config.ts` accepts the new properties (`spinSpeedAlias`, `spinFormat`, `spinTimezone`, `orbitSpeedAlias`, `orbitFormat`, `orbitTimezone`) and preserves numeric fallbacks.
2. `LayerConfigEntry` and `EnhancedLayerData` expose the same fields so processors can read alias parameters without extra parsing.
3. Spin/orbit processors resolve alias speeds via `shared/layer/clockTime.ts`, ensuring both numeric and clock-based motion share the same path.
4. All clock elements now reside in `ConfigYuzha.json` (see entries with `LayerID` starting `clock-`).

Keep this document updated if additional clock-only fields are introduced so future migrations remain deterministic.
