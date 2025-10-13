# Configuration System Guide

## Scope
This guide explains every step of the configuration workflow: how `ConfigYuzha.json` is structured, how it is converted into runtime objects, how the UI reads and writes it, and which validation rules protect against malformed input. The goal is to let an AI agent adjust or extend configuration safely without touching renderer code.

## Files and Ownership
- `shared/config/ConfigYuzha.json` - Authoritative data file. Organised by groups so editors can keep related settings together.
- `shared/config/Config.ts` - Loads JSON, merges groups, validates entries, and exposes `loadLayerConfig()` for consumers.
- `shared/config/ConfigYuzhaPopup*.tsx` - React UI for editing config inside the running app.
- `shared/config/ConfigYuzhaAccordion*.ts[x]` - Accordion widgets and helpers used by the popup.
- `shared/config/ConfigYuzhaPopupUtils.ts` - Converts between runtime layer config and UI accordion data; persists user overrides into `localStorage`.

## JSON Structure
Each record in `ConfigYuzha.json` looks like:

```json
{
  "layerId": "ring_outer",
  "imageId": "orbital_ring_outer",
  "renderer": "2D",
  "order": 30,
  "groups": {
    "Basic Config": {
      "scale": [100, 100],
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 50],
      "BasicAngleImage": 0,
      "imageTip": 90,
      "imageBase": 270
    },
    "Spin Config": {
      "spinStagePoint": [1024, 1024],
      "spinImagePoint": [50, 50],
      "spinSpeed": 45,
      "spinDirection": "cw"
    },
    "Orbital Config": {
      "orbitStagePoint": [1024, 1024],
      "orbitLinePoint": [1280, 1024],
      "orbitImagePoint": [50, 50],
      "orbitLine": true,
      "orbitOrient": false,
      "orbitSpeed": 0,
      "orbitDirection": "ccw"
    },
    "Image Mapping Debug": {
      "showCenter": true,
      "showTip": true,
      "showBase": false,
      "showAxisLine": true
    }
  }
}
```

### Merge Rules in `Config.ts`
1. **Start with identity**: `layerId`, `imageId`, `renderer`, `order`.
2. **Basic Config** merges next. Fields include `scale`, `BasicStagePoint`, `BasicImagePoint`, `BasicAngleImage`, `imageTip`, `imageBase`.
3. **Spin Config** merges over basic values. When `spinSpeed > 0`, it replaces anchor points with `spinStagePoint` and `spinImagePoint`, and resets `BasicAngleImage` to 0 because rotation becomes dynamic.
4. **Orbital Config** merges afterwards. Any provided property overrides the same property from previous groups.
5. **Image Mapping Debug** merges last but never overwrites values that already exist; it is purely additive.

The resulting object matches `LayerConfigEntry` and is stored in a flat array. Sorting by `order` ensures deterministic layering for all renderers.

## Validation Flow
- `validateLayerConfig(entry)` checks:
  - Required identifiers (`layerId`, `imageId`, `renderer`, `order`).
  - `scale` ranges (10-500 percent per axis).
  - `BasicAngleImage` within 0-360 deg.
  - No negative spin or orbit speeds.
- `validateConfig(configArray)` runs validation for each entry during development builds (guarded by `import.meta.env.DEV`).
- Any warnings are logged with enough context to pinpoint the broken layer.

## Runtime Consumption
- `loadLayerConfig()` returns the cached array. Renderers should never import the raw JSON.
- `StageDOM.tsx`, `StageCanvas.tsx`, and `StageThree.tsx` all call `loadLayerConfig()` and filter with `is2DLayer()` (since 3D layers are future work).
- Each stage prepares layer data by calling `prepareLayer(entry, STAGE_SIZE)`.

## Config UI Workflow
1. `MainScreenUtils.tsx` renders `ConfigYuzhaPopup` when the user opens the overlay panel.
2. `transformConfigToAccordion()` converts the runtime config array into an accordion-friendly structure grouped by category.
3. When users save changes:
   - `transformAccordionToConfig()` converts UI data back into config entries.
   - `saveConfigToLocalStorage()` writes the updated groups.
4. On load, `loadConfigFromLocalStorage()` merges any saved overrides with the base JSON.
5. The popup communicates that the app must be refreshed (`clearCachesAndReload()` helper) to re-run `loadLayerConfig()`.

## Adding or Modifying Configuration
1. **Add assets**: place images under `shared/asset`, then run `npm run sync:images` to refresh the registry.
2. **Insert a new entry** in `ConfigYuzha.json` with the correct group keys. Keep `layerId` unique.
3. **Update the order** field to position the layer relative to the existing stack. Lower numbers render first (behind others).
4. **Optional UI labels**: the accordion auto-generates sections, but you may customise labels inside `ConfigYuzhaAccordion.tsx`.
5. **Validate**: run `npm run lint` or launch the app in dev mode to see validation warnings in the console.

### Extending Group Structure
- New groups can be introduced by adding another key under `groups` and updating `transformConfig()` merge logic.
- To expose the new group in the UI, extend the mapping inside `ConfigYuzhaPopupUtils.ts` so the accordion shows the right fields.
- Keep merge precedence clear: later groups override earlier ones unless explicitly prevented.

## AI Agent Checklist
- Use `loadLayerConfig()` when scripting tests or data exports. It already applies sorting and validation.
- When patching config programmatically, reuse `transformConfig()` to avoid missing precedence rules.
- To compute derived anchors or validations, prefer `prepareLayer()` so that spin/orbit defaults are consistent with runtime math.
- Use the popup utilities when building editing tools; they already serialise to localStorage and handle field defaults.
- Document any new fields in this guide so future agents understand how they propagate through the system.
