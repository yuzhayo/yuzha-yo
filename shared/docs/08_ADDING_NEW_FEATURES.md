# Adding New Features

This playbook walks through extending the Yuzha engine safely. The focus is on adding new processors, configuration fields, or renderer capabilities without breaking existing behaviour.

## 1. Decide the Extension Type

| Scenario | Recommended Entry Point |
| -------- | ---------------------- |
| Add animation or per-frame behaviour | Create a processor in `shared/layer/` |
| Add static layer metadata | Extend `ConfigYuzha.json` and `Config.ts` |
| Change rendering visuals | Update `LayerEngines.ts` |
| Introduce UI controls | Modify `MainScreenUtils.tsx` or config popup modules |

## 2. Extend Configuration (Optional)
1. Add new keys inside the appropriate `groups` object in `ConfigYuzha.json`.
2. Update the merge logic in `transformConfig()` if the new field should override previous groups.
3. Update validation in `validateLayerConfig()` if ranges or types need enforcement.
4. Expose controls in `ConfigYuzhaAccordion.tsx` and `ConfigYuzhaPopupUtils.ts`.
5. Document the new field in `01_CONFIG_SYSTEM_GUIDE.md`.

## 3. Create a Processor
```ts
// shared/layer/LayerCorePipelineMyFeature.ts
import type { LayerProcessor } from "./LayerCorePipeline";

export type MyFeatureConfig = {
  intensity?: number;
};

export function createMyFeatureProcessor(config: MyFeatureConfig = {}): LayerProcessor {
  const { intensity = 1 } = config;

  if (intensity <= 0) {
    return (layer) => layer;
  }

  return (layer, timestamp) => {
    const elapsed = timestamp ? timestamp / 1000 : 0;
    const strength = Math.sin(elapsed) * intensity;

    return {
      ...layer,
      myFeature: { strength },
    };
  };
}
```

### Processor Guidelines
- Accept an optional config object so stages can override behaviour.
- Return the original layer if conditions disable the feature.
- Avoid mutating the incoming `layer`; always return a new object or shallow clone.
- Reuse helpers from `LayerCorePipeline.ts` (e.g., `normalizeAngle`, easing helpers) when dealing with time, angles, or easing.

## 4. Register the Processor
1. Import the factory in `shared/layer/pipeline/ProcessorRegistry.ts` (or a dedicated module) and call `registerProcessor({ name, shouldAttach, create })`.
2. Keep `shouldAttach` focused on config fields so `createStagePipeline()` can decide automatically.
3. If the processor relies on runtime overrides, pass them through the `ProcessorContext` object supplied by the pipeline options.

## 5. Update Renderer Support
- Update `LayerEngines.ts` (or the renderer adapters) only if the processor introduces new draw-time properties.
- Ensure the feature degrades gracefully in renderers that cannot implement it (return the original layer or skip drawing).

## 6. Update Documentation and Tests
- Add sections to relevant docs (this file, plus specialised deep dives as needed).
- Write unit tests under `shared/layer/__tests__` for processor logic.
- If the feature affects rendering output, add visual regression tests or manual QA steps.

## 7. Verify in All Renderers
- Use the `MainScreen` overlay to switch between DOM, Canvas, and Three renderers.
- Test headless environments (Canvas renderer) if the feature will run in automation pipelines.
- Check debug overlays to confirm geometry remains accurate.

## 8. Ship
- Confirm lint (`npm run lint`) and tests (`npm test`) pass.
- Update `package.json` scripts or tooling if your feature needs additional runtime support.
- Communicate the change by updating release notes or README as appropriate.

## AI Agent Notes
- Prefer incremental processor additions over modifying existing ones; this keeps behaviour composable.
- Maintain backwards compatibility by defaulting new config fields and processors to no-op.
- Use `registerProcessor()` to hook new effects instead of editing stage components directly.
- When in doubt, trace the pipeline described in `05_LAYER_PIPELINE_SYSTEM.md` to understand how data flows from config to renderers.
