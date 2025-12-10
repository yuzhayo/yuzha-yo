# Per-layer alpha cutoff plan

Goal: expose a JSON-configurable alpha cutoff (alphaTest) per layer so black backgrounds in additive glows can be trimmed without code edits.

Steps for a future agent:
1) Model/typing: In `shared/layer/model.ts`, add `AlphaCutoff?: number` to `LayerConfigEntry`, and add `alphaCutoff?: number` to `UniversalLayerData`/`EnhancedLayerData`.
2) Prepare layer: In `prepareBasicState` (in `shared/layer/engine.ts`), read `entry.AlphaCutoff`, clamp to [0,1], default to current hardcoded value (0.01), and store as `alphaCutoff` on `baseData`.
3) Three renderers: In `shared/layer/StageThree.tsx` and `yuzha/src/counter/counterScreen.tsx`, set `alphaTest` to `data.alphaCutoff ?? 0.01` when creating `MeshBasicMaterial`. Keep `alphaMap: texture` so luminance drives alpha for assets without an alpha channel.
4) Config usage: Then JSON entries can set "AlphaCutoff": 0.08 (example) per layer. Higher values remove more dark tones; too high will clip faint lines. Works with BlendMode: "additive".
5) Optional: add validation (warn if out of range) and, if desired, allow a global default via env/config.

Current context: The repo already uses BlendMode (additive/normal) and sets `alphaMap: texture` + `alphaTest: 0.01` globally. This plan makes alphaTest adjustable per layer.
