# Porting Guide: yuzha-yo → dhepil-suite

**Date**: 2026-08-20 (rewrite of 2026-08-04 plan)
**Status**: Planning Phase
**Purpose**: Extract the config-driven animation engine from yuzha-yo as a reusable library (`ui/yuzha/`). **Apps are NOT migrated** — counter2 and alphaRemove stay in yuzha-yo. This document doubles as the **integration playbook** for any future app that wants to consume the engine.

---

## 🎯 Migration Goals

### What We're Building

```
dhepil-suite/
├── ui/
│   ├── [existing enterprise UI - Ant Design]
│   └── yuzha/                    # 🆕 NEW: Reusable config-driven animation engine
│       ├── *.ts / *.tsx          # Engine source (flat, one level)
│       ├── assets/               # Sprites + ImageRegistry
│       └── screens/              # Animation screens, each defined by ONE JSON file
└── apps/
    └── [existing apps unchanged]
```

### Key Principles

1. **yuzha = Library, NOT App** — a reusable engine consumed via source imports
2. **Screens are data** — adding a new animation screen = adding one JSON file to `screens/`, zero code changes
3. **Zero Breaking Changes** — dhepil-suite enterprise UI unaffected
4. **Compact tree** — max 2-3 levels deep, files grouped at the root of `ui/yuzha/`
5. **yuzha-yo stays intact** — archived later for reference only

### Out of Scope (NOT extracted)

| Item | Reason |
|------|--------|
| `counter2/`, `alphaRemove/` apps | Stay in yuzha-yo |
| `shared/effect/polaraura.ts` | Standalone shader effect, can be extracted later if needed |
| `shared/components/ui/*`, `shared/lib/utils`, `shared/fonts/`, theme CSS | App theming, not engine |
| `shared/sound/` | App asset |

### MainScreen: included, but DEMO ONLY

`MainScreen.tsx` + `MainScreenUtils.tsx` are extracted **as a demo/showcase entry point**, not as a production API:

- They prove the whole pipeline works end-to-end (auto renderer select, manual override, fallback) and give integrators something to render immediately.
- `MainScreenUtils.tsx` contains app-specific chrome that does NOT belong in real integrations: launcher buttons linking to yuzha-yo ports (Counter2 ↗, Alpha Remover ↗), Replit-specific URL helpers, cache-busting reload.
- Production apps should use `Stage` / `StageCanvas` / `StageThree` directly (see Integration Playbook).

---

## 🎛️ Renderer Selection — Current State (verified in code)

There are TWO levels of "2D/3D" selection. Only one is functional:

### 1. Screen-level (✅ real, keep)

`RendererDetector.getRendererType()` returns `"three" | "canvas"`:
- Detects headless/AI-agent/no-WebGL environments → forces Canvas 2D
- Otherwise → Three.js WebGL
- `MainScreen.tsx` adds a manual override (`auto | canvas | three`) + fallback to Canvas when Three.js throws (`StageThree onError`)

### 2. Per-layer `renderer: "2D" | "3D"` (⚠️ nominal, currently a no-op)

Declared in the JSON schema (`model.ts`), but `is2DLayer()` (`engine.ts`) returns `true` for **both** values — every layer goes through the same preparation path, and both renderers draw every layer as a flat textured plane.

### Recommendation for the library

- Keep screen-level selection as the public API: `Stage` (auto + fallback), or pick `StageCanvas` / `StageThree` explicitly.
- Keep the per-layer `renderer` field in the schema as forward-compatible metadata, documented as currently non-routing. Removing it would break existing JSON configs for no benefit.

---

## 📂 Target Structure (compact, max 3 levels from repo root)

```
ui/yuzha/
├── index.ts              # Barrel export (single entry point)
├── model.ts              # Types + config validation/loading (parameterized)
├── math.ts               # Pure math: coordinates, pivots, clock math, easing
├── engine.ts             # Runtime: assets, layer prep, processor registry, pipeline
├── motion.ts             # Spin/orbit motion processors built from config
├── StageSystem.ts        # 2048x2048 stage + createStagePipeline() + screen loader
├── StageCanvas.tsx       # Canvas 2D renderer component
├── StageThree.tsx        # Three.js WebGL renderer component
├── Stage.tsx             # 🆕 Auto-select wrapper (three → canvas fallback)
├── MainScreen.tsx        # 📦 DEMO ONLY - showcase screen with renderer toggle
├── MainScreenUtils.tsx   # 📦 DEMO ONLY - overlay panel/gesture for the demo
├── RendererDetector.ts   # WebGL/headless detection
├── DeviceCapability.ts   # Device performance profiling
├── assetResolver.ts      # getAssetUrl/requireAssetUrl helpers
├── ImageRegistry.mjs     # Registry sync tool (npm run sync:image)
├── ImageRegistry.json    # Generated: imageId → path
├── assets/               # All sprites, FLAT (no subfolders)
│   └── *.png
└── screens/              # One JSON = one animation screen
    ├── yuzha.json        # ← current ConfigYuzha.json (default/example)
    └── counter.json      # ← current ConfigCounter2.json (example)
```

Depth: `dhepil-suite/ui/yuzha/assets/x.png` = 3 levels. No nesting beyond this.

---

## 📦 What Gets Extracted

### Engine source (`shared/layer/` + `shared/utils/` + `shared/asset/` → `ui/yuzha/`)

Actual line counts verified 2026-08-20:

| Source (yuzha-yo) | Target | Lines | Notes |
|-------------------|--------|-------|-------|
| `shared/layer/model.ts` | `model.ts` | 432 | **MODIFY**: remove hardcoded `ConfigYuzha.json` import |
| `shared/layer/math.ts` | `math.ts` | 651 | Keep as-is (pure functions) |
| `shared/layer/engine.ts` | `engine.ts` | 740 | **MODIFY**: asset glob path + prefix check (see Fix 3) |
| `shared/layer/motion.ts` | `motion.ts` | 450 | Keep as-is |
| `shared/layer/StageSystem.ts` | `StageSystem.ts` | 605 | **MODIFY**: `createStagePipeline({ config })` + screen loader (Fix 1-2) |
| `shared/layer/index.ts` | `index.ts` | 256 | Trim re-exports to library surface |
| `shared/layer/StageCanvas.tsx` | `StageCanvas.tsx` | 512 | Keep as-is (already has `loadPipeline` prop) |
| `shared/layer/StageThree.tsx` | `StageThree.tsx` | 559 | **MODIFY**: add `loadPipeline` prop (Fix 4) |
| `shared/utils/RendererDetector.ts` | `RendererDetector.ts` | 54 | Keep as-is |
| `shared/utils/DeviceCapability.ts` | `DeviceCapability.ts` | 53 | Keep as-is |
| `shared/asset/assetResolver.ts` | `assetResolver.ts` | 19 | Keep as-is (import from `./index`) |
| `shared/asset/ImageRegistry.mjs` | `ImageRegistry.mjs` | — | **MODIFY**: scan `ui/yuzha/assets/`, emit `assets/x.png` paths |
| `shared/asset/ImageRegistry.json` | `ImageRegistry.json` | — | Regenerate after move |

### Demo (`yuzha/src/` → `ui/yuzha/`, demo only)

| Source | Target | Lines | Notes |
|--------|--------|-------|-------|
| `yuzha/src/MainScreen.tsx` | `MainScreen.tsx` | 80 | **MODIFY**: point at `./StageCanvas`, `./StageThree`; render default screen |
| `yuzha/src/MainScreenUtils.tsx` | `MainScreenUtils.tsx` | 388 | **MODIFY**: remove app-specific launcher buttons (Counter2 ↗, Alpha Remover ↗) and Replit URL helper; keep renderer toggle + gesture + panel. Mark file header `DEMO ONLY` |

### Assets (`shared/asset/*.png` → `ui/yuzha/assets/`, flat)

~149 files, ~15MB. All sprites copied flat into `assets/`. See Asset Strategy decision below.

### Screens (`shared/layer/Config*.json` → `ui/yuzha/screens/`)

| Source | Target | Used by |
|--------|--------|---------|
| `ConfigYuzha.json` | `screens/yuzha.json` | Clock screen (19 layers: stars, gears, zodiac, real-time clock hands) |
| `ConfigCounter2.json` | `screens/counter.json` | Counter backdrop example (pulse + spin layers) |

Adding a screen later = drop a new JSON into `screens/`. No code changes needed.

---

## 🔧 Required Code Changes (the 5 fixes that make it reusable)

### Fix 1: Parameterize config loading

`model.ts` currently does `import rawConfig from "./ConfigYuzha.json"`. Replace:

```typescript
// BEFORE
import rawConfig from "./ConfigYuzha.json";
export function loadLayerConfig(): LayerConfig { ... }

// AFTER
export function loadLayerConfig(source: LayerConfigEntry[]): LayerConfig {
  const entries = structuredClone(source); // never mutate caller's JSON
  // ... existing normalize + validate + sort logic unchanged ...
}
```

### Fix 2: Screen loader (the "screen = JSON" contract)

New in `StageSystem.ts` (Vite static glob so builds stay analyzable):

```typescript
const screenModules = import.meta.glob("./screens/*.json", { eager: true });

export function listScreens(): string[] { /* keys minus extension */ }

export function loadScreenConfig(name: string): LayerConfigEntry[] {
  const mod = screenModules[`./screens/${name}.json`];
  if (!mod) throw new Error(`[yuzha] Unknown screen "${name}". Available: ${listScreens()}`);
  return mod.default as LayerConfigEntry[];
}

// Pipeline entry point gains options:
export async function createStagePipeline(
  options: StagePipelineOptions & { config?: LayerConfigEntry[] } = {},
): Promise<StagePipeline> {
  const config = options.config ?? loadScreenConfig("yuzha"); // default screen
  // ... rest unchanged, using loadLayerConfig(config) ...
}
```

### Fix 3: Asset resolution paths

`engine.ts` has two hardcoded layout assumptions that break on move:

```typescript
// BEFORE
const assetManifest = import.meta.glob("../asset/*.{png,...}", {...});
if (!path.toLowerCase().startsWith("shared/asset/")) throw ...
const filename = path.replace(/^shared\/asset\//i, "");
const manifestKey = `../asset/${filename}`;

// AFTER
const assetManifest = import.meta.glob("./assets/*.{png,...}", {...});
if (!path.toLowerCase().startsWith("assets/")) throw ...
const filename = path.replace(/^assets\//i, "");
const manifestKey = `./assets/${filename}`;
```

Then regenerate `ImageRegistry.json` (entries become `{ "id": "GEAR1", "path": "assets/GEAR1.png" }`).

### Fix 4: StageThree `loadPipeline` prop

```typescript
type StageThreeProps = {
  onError?: () => void;
  loadPipeline?: () => Promise<StagePipeline>; // 🆕 matches StageCanvas
};
// inside useEffect: const pipeline = await loadPipeline();
```

### Fix 5: `Stage.tsx` wrapper + demo cleanup

- New `Stage.tsx` (~30 lines): `getRendererType()` → render `StageThree onError={fallback}` or `StageCanvas`, forwarding `screen` / `loadPipeline` and a `mode` override. This is the production-grade replacement for MainScreen's selection logic.
- `MainScreen.tsx` rewired to use the library imports; `MainScreenUtils.tsx` stripped of yuzha-yo app links. Both keep a `DEMO ONLY` banner — integrators copy the pattern, not the chrome.

---

## 📖 Integration Playbook — how any app connects to the engine

This is the section future app developers follow. Everything below assumes the library lives at `dhepil-suite/ui/yuzha/`.

### Step 0: Prerequisites in the consuming app

| Requirement | Why |
|-------------|-----|
| `three` + `@types/three` in the monorepo deps | StageThree renderer |
| Vite (or any bundler that supports `import.meta.glob` + JSON imports) | Asset manifest + screen loader |
| `resolveJsonModule: true` in tsconfig | JSON config imports |
| Vite `dedupe: ["react", "react-dom", "three"]` | Prevent duplicate instances under HMR/monorepo linking (yuzha-yo already does this) |
| Optional alias: `"@yuzha": "./ui/yuzha"` in tsconfig `paths` + vite `alias` | Cleaner imports; relative paths also fine (clipboard pattern) |

### Step 1: Choose how you render

```typescript
import { Stage, StageCanvas, StageThree, getRendererType } from "@yuzha";

// A) Recommended: auto-select + automatic Canvas fallback
<Stage screen="yuzha" />

// B) Explicit renderer
<StageCanvas loadPipeline={() => createStagePipeline({ config: myConfig })} />

// C) Auto-select with manual override (what the demo MainScreen does)
<Stage screen="yuzha" mode={mode} onModeChange={setMode} />
```

### Step 2: Pick a screen source

```typescript
// Built-in screen (JSON lives in ui/yuzha/screens/)
<Stage screen="counter" />

// App-owned JSON (recommended for app-specific visuals)
import myConfig from "./screens/myFeature.json";
const load = () => createStagePipeline({ config: myConfig });
<StageCanvas loadPipeline={load} />

// Discover what's available
import { listScreens } from "@yuzha"; // → ["yuzha", "counter"]
```

### Step 3: Author the screen JSON (layer schema reference)

A screen is an **array of layer entries**. All coordinates are in the fixed **2048×2048 stage space**; the stage auto-scales to any viewport (cover behavior).

```jsonc
[
  {
    // ===== REQUIRED =====
    "LayerID": "GEAR-1",              // unique id
    "ImageID": "GEAR1",               // must exist in ImageRegistry.json
    "renderer": "2D",                 // "2D" | "3D" — metadata only today (see Renderer Selection)
    "LayerOrder": 350,                // draw order, low = behind

    // ===== APPEARANCE (optional) =====
    "ImageScale": [100, 100],         // percent of native size, [x, y], clamped 10-500
    "Opacity": 0.6,                   // 0-1
    "BlendMode": "additive",          // "additive" | "normal" (Three.js renderer)
    "PulseSeconds": 3.0,              // opacity pulse period; omit to disable
    "PulseAmplitude": 0.25,           // pulse strength 0-1 (default 0.15)

    // ===== STATIC POSITIONING (optional) =====
    "BasicStagePoint": [1024, 1024],  // where to anchor, stage coords
    "BasicImagePoint": [50, 50],      // which image point (%) anchors there
    "BasicImageAngle": 45,            // static rotation in degrees

    // ===== SPIN = rotation around an anchor (optional) =====
    "spinStagePoint": [1024, 1024],   // anchor point on stage
    "spinImagePoint": [50, 50],       // pivot inside image (%), may exceed 0-100
    "spinSpeed": 20,                  // rotations per hour…
    "spinSpeed": "second",            // …OR real-clock alias: "second"|"minute"|"hour"
    "spinDirection": "cw",            // "cw" | "ccw"
    "spinFormat": "24",               // alias only: "12" | "24" hour mapping
    "spinTimezone": "UTC+7",          // alias only: "UTC", "UTC+8", "UTC-05:30"

    // ===== ORBIT = move along a circle (optional) =====
    "orbitStagePoint": [1024, 1024],  // orbit center
    "orbitLinePoint": [1224, 1024],   // point defining radius + starting angle
    "orbitLine": true,                // draw the orbit path
    "orbitSpeed": 4,                  // same speed semantics as spin
    "orbitDirection": "ccw"
  }
]
```

Key semantics (verified in `motion.ts`/`math.ts`):

- **Speed aliases track real wall-clock time.** `"second"` = one rotation per minute (second-hand sweep), `"minute"` = per hour, `"hour"` = full dial per 12/24h per `format`. Combine with `timezone` for real clocks (the `yuzha` screen's hour hand runs UTC+7, 24h format).
- **Numeric speeds** are rotations-per-hour counted from page load.
- **Orbit radius & start angle** come from `orbitLinePoint` relative to `orbitStagePoint` — no separate radius field.
- Layers animate only if spin/orbit/pulse is configured; fully static layers are rendered once and culled if off-stage.

### Step 4: Add sprites (if your screen needs new images)

1. Drop the PNG into `ui/yuzha/assets/` (flat, unique filename).
2. Run the sync tool: `node ui/yuzha/ImageRegistry.mjs` — regenerates `ImageRegistry.json`.
3. Reference it via `"ImageID": "<filename without extension>"`.
4. In app code, resolve URLs with `requireAssetUrl("MY_SPRITE")` (throws if missing) or `getAssetUrl` (null if missing).

Apps may keep their own app-specific assets in their own folders; only sprites referenced by library screens belong in `ui/yuzha/assets/`.

### Step 5: Overlay your UI on top

The stage renders in an `absolute inset-0 z-0 pointer-events-none` container. App UI simply stacks above it:

```tsx
<div className="relative w-screen h-screen overflow-hidden">
  <Stage screen="counter" />
  <MyAppControls />   {/* z-10+, receives pointer events */}
</div>
```

This is exactly how yuzha-yo's counter2 overlays buttons/display on the stage — that app stays in yuzha-yo as the reference integration.

### Try it first: the demo

```tsx
import { MainScreen } from "@yuzha";  // 📦 DEMO ONLY
<MainScreen />
```

Long-press the screen to open the panel: shows active renderer, switches Auto/Canvas/Three live, exercises the fallback path. Use it to verify your environment, then build your own screen per Steps 2-5.

### Integration checklist

- [ ] Prerequisites met (deps, tsconfig, dedupe)
- [ ] `<Stage screen="yuzha" />` renders in my app
- [ ] My own screen JSON renders (start from a copy of `screens/counter.json`)
- [ ] New sprite added via registry sync and resolves without 404
- [ ] Renderer auto-detection picks correctly; Canvas fallback works when WebGL forced off
- [ ] No `ui/yuzha` file was modified to make my app work (if you needed a change, propose it upstream)

---

## 🔧 Technical Implementation Steps

### Phase 1: Create structure

```bash
cd C:\VSCODE\dhepil-suite
mkdir -p ui/yuzha/assets ui/yuzha/screens
```

### Phase 2: Copy engine source + demo

```bash
SRC=../yuzha-yo/shared
cp $SRC/layer/{model,math,engine,motion,StageSystem,index}.ts ui/yuzha/
cp $SRC/layer/{StageCanvas,StageThree}.tsx ui/yuzha/
cp $SRC/utils/{RendererDetector,DeviceCapability}.ts ui/yuzha/
cp $SRC/asset/{assetResolver.ts,ImageRegistry.mjs} ui/yuzha/
cp ../yuzha-yo/yuzha/src/{MainScreen.tsx,MainScreenUtils.tsx} ui/yuzha/
```

Then rewrite internal imports: everything becomes `./x` (flat layout). Files that need import edits: `engine.ts` (`../asset/ImageRegistry.json` → `./ImageRegistry.json`), `StageThree.tsx` (`../utils/DeviceCapability` → `./DeviceCapability`), `assetResolver.ts` (`@shared/layer` → `./index`), `MainScreen.tsx` (`@shared/layer/StageCanvas` → `./StageCanvas`, etc.).

### Phase 3: Apply the 5 fixes

Implement Fix 1-5 above. This is the only "real coding" phase.

### Phase 4: Copy assets + screens, regenerate registry

```bash
cp ../yuzha-yo/shared/asset/*.png ui/yuzha/assets/
cp ../yuzha-yo/shared/layer/ConfigYuzha.json ui/yuzha/screens/yuzha.json
cp ../yuzha-yo/shared/layer/ConfigCounter2.json ui/yuzha/screens/counter.json
node ui/yuzha/ImageRegistry.mjs   # regenerates ImageRegistry.json with assets/ paths
```

### Phase 5: Barrel export + dependencies

`index.ts`: keep the existing barrel structure, trimmed to the library surface (types, math, engine, motion, StageSystem exports, `StageCanvas`, `StageThree`, `Stage`, `MainScreen` (demo), `getRendererType`, `getDeviceCapability`, asset resolver).

Add to dhepil-suite root `package.json`:

```json
{ "dependencies": { "three": "^0.180.0" }, "devDependencies": { "@types/three": "^0.180.0" } }
```

### Phase 6: Verify

```bash
npm run typecheck && npm run build
```

Verification surface:
1. **Demo path**: mount `<MainScreen />` in a scratch Vite entry — confirms end-to-end pipeline, renderer toggle, fallback.
2. Unit tests (vitest): `loadLayerConfig` validation/alias normalization, clock math (`calculateRotationDegrees` for second/minute/hour + numeric), pivot positioning.
3. **Playbook dry-run**: follow the Integration Playbook Steps 1-5 as if you were a new app; fix anything unclear — the playbook must work cold.

---

## ⚠️ Decisions Needed

### 1. Asset Strategy

- **A)** Copy ALL ~149 PNGs (~15MB) to `ui/yuzha/assets/`
- **B)** Copy only sprites referenced by shipped screens (~25); apps bring their own
- **C)** Lazy-load via dynamic import

**Recommendation**: **A** — keeps shipped screens (incl. demo) self-contained; Vite only bundles what's referenced. Revisit B once apps start contributing sprites.

### 2. Three.js Bundle Impact

`three` adds ~600KB raw (~150KB gzipped). With **direct source imports**, only apps that actually import `StageThree`/`Stage` pay this cost — enterprise apps that never import yuzha are unaffected. No dynamic-import hack needed.

### 3. Build Strategy

- **A)** Direct source imports (apps compile `ui/yuzha/` source)
- **B)** Pre-built library (`ui/yuzha/dist/`)
- **C)** Published package `@dhepil/yuzha`

**Recommendation**: **A** — matches the clipboard pattern, simplest for a monorepo. Revisit C only if yuzha is consumed outside dhepil-suite.

### 4. Per-layer `renderer: "2D"|"3D"` field

**Recommendation**: keep in schema as metadata (documented non-routing). Both renderers draw flat planes; routing per-layer to different engines adds complexity with no current benefit.

### 5. yuzha-yo Repo Fate

**Recommendation**: **Archive** after the library is verified — keep for reference, mark deprecated. counter2/alphaRemove keep living there as reference integrations.

---

## 🧪 Testing Checklist

### After Phase 3 (engine compiles in new home)

- [ ] `npm run typecheck` passes with `ui/yuzha/` included
- [ ] Barrel exports resolve: `import { Stage, createStagePipeline } from "ui/yuzha"`
- [ ] No leftover `shared/` or `@shared/` imports in `ui/yuzha/`
- [ ] `loadScreenConfig("yuzha")` returns 19 layers, sorted by LayerOrder
- [ ] `loadLayerConfig` normalizes string speeds (`"minute"` → alias) and logs validation errors for bad entries

### After Phase 4 (assets)

- [ ] `ImageRegistry.json` regenerated: all paths start with `assets/`
- [ ] `requireAssetUrl("GEAR1")` returns a resolvable URL; unknown id throws
- [ ] No 404s in browser network tab when rendering `yuzha` screen

### After Phase 6 (render + demo + playbook)

- [ ] `<MainScreen />` demo renders; long-press opens panel; Auto/Canvas/Three toggle works
- [ ] Demo shows no yuzha-yo app links (Counter2/Alpha Remover buttons removed)
- [ ] `yuzha` screen renders in Canvas 2D mode and Three.js mode
- [ ] Clock hands match real UTC+7 time; zodiac spins ccw; gears spin at configured rph
- [ ] Pulse layers (counter screen, `PulseSeconds: 3`) visibly oscillate opacity
- [ ] Auto mode picks Three on normal browser, Canvas in headless/webdriver
- [ ] Three failure (onError) falls back to Canvas without crash
- [ ] Integration Playbook executed cold by following only this document
- [ ] dhepil-suite enterprise apps build unchanged

---

## 📊 Estimated Effort

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| 1 | Directory structure | 5 min | Low |
| 2 | Copy + rewrite imports | 30 min | Low |
| 3 | Fixes 1-5 (config parameterization, screens, asset paths, StageThree prop, Stage wrapper, demo cleanup) | 2.5 hours | Medium |
| 4 | Assets + registry regeneration | 15 min | Low |
| 5 | Barrel + deps | 20 min | Low |
| 6 | Tests + demo + playbook dry-run | 2.5 hours | Medium |
| **TOTAL** | | **~6 hours** | |

Assumes familiarity with both codebases; the risky part is Fix 3 (asset resolution) — verify it first with one sprite before bulk-copying.

---

## 🚨 Rollback Plan

The library is purely additive until an app starts importing it:

```bash
rm -rf ui/yuzha
git checkout package.json package-lock.json
npm install
```

**Impact**: none — no dhepil-suite app depends on it yet, yuzha-yo remains untouched throughout.

---

## ✅ Success Criteria

1. ✅ `ui/yuzha/` exists with the compact tree above (max 3 levels)
2. ✅ A new animation screen can be added by dropping ONE JSON file into `screens/` — no engine code changes
3. ✅ Renderer selection works: auto (Detector), manual (`StageCanvas`/`StageThree`), and fallback on WebGL failure
4. ✅ `<MainScreen />` demo runs and is clearly marked demo-only (no app-specific links)
5. ✅ `yuzha` and `counter` screens render identically to yuzha-yo in both renderers
6. ✅ A developer with no prior context can integrate the engine using only the Integration Playbook
7. ✅ dhepil-suite typecheck/build green; enterprise apps unaffected
8. ✅ No `shared/`, `@shared/`, or yuzha-yo-relative paths remain in `ui/yuzha/`
9. ✅ yuzha-yo can be archived

---

**Next Steps**: Approve decisions 1-5 above, then execute Phases 1-6.

**Last Updated**: 2026-08-20
**Maintainer**: Development team
