# Porting Guide: yuzha-yo → dhepil-suite

**Date**: 2026-08-04  
**Status**: Planning Phase  
**Purpose**: Extract yuzha visual system as shared library + migrate counter2/alphaRemove apps

---

## 🎯 Migration Goals

### What We're Building

```
dhepil-suite/
├── ui/
│   ├── [existing enterprise UI - Ant Design]
│   └── yuzha/                    # 🆕 NEW: Visual library (extracted from yuzha-yo)
│       ├── engine/               # Rendering engines
│       ├── mainscreen/           # MainScreen system
│       ├── assets/               # Sprites + fonts
│       └── styles/               # Theme CSS
│
└── apps/
    ├── clipboard/                # ✅ Existing (reference pattern)
    ├── counter2/                 # 🔄 Migrated from yuzha-yo
    └── alpha-remover/            # 🔄 Migrated from yuzha-yo
```

### Key Principles

1. **yuzha = Library, NOT App** - Like Ant Design, but for game-style UI
2. **Zero Breaking Changes** - dhepil-suite enterprise UI unaffected
3. **Co-existence** - Enterprise UI and yuzha UI are separate systems
4. **Follow Established Patterns** - counter2/alpha-remover follow clipboard pattern

---

## 📦 What Gets Extracted

### From `yuzha-yo/shared/` → `dhepil-suite/ui/yuzha/`

#### 1. Rendering Engines (`shared/layer/` → `ui/yuzha/engine/`)

| File | Lines | Purpose | Notes |
|------|-------|---------|-------|
| `StageCanvas.tsx` | ~800 | Canvas 2D renderer | Keep as-is |
| `StageThree.tsx` | ~600 | Three.js WebGL renderer | Keep as-is |
| `RendererDetector.ts` | ~150 | Device capability detection | Keep as-is |
| `DeviceCapability.ts` | ~100 | Performance profiling | Keep as-is |

#### 2. MainScreen System (`yuzha/src/` → `ui/yuzha/mainscreen/`)

**Current**: `MainScreenUtils.tsx` (419 lines - monolithic)

**Target**: Split into 6 modules:

| New File | Lines | Exports | Source (line range) |
|----------|-------|---------|---------------------|
| `constants.ts` | ~10 | `STAGE_WIDTH`, `STAGE_HEIGHT`, `STAGE_CENTER_X/Y` | MainScreenUtils:17-21 |
| `types.ts` | ~50 | All TypeScript interfaces | MainScreenUtils:44-99 |
| `utilities.ts` | ~40 | `getStandaloneUrl()`, `clearCachesAndReload()` | MainScreenUtils:105-143 |
| `gesture.ts` | ~90 | `useMainScreenBtnGesture()` hook | MainScreenUtils:149-234 |
| `effects.ts` | ~55 | `useMainScreenBtnEffect()` hook | MainScreenUtils:236-292 |
| `components.tsx` | ~180 | `MainScreenUpdater`, `MainScreenBtnPanel` | MainScreenUtils:310-431 |
| `index.ts` | ~10 | Barrel export (re-export all) | NEW |

**Plus**:
- `MainScreen.tsx` (80 lines) - Main wrapper component

#### 3. Assets (`shared/assets/` → `ui/yuzha/assets/`)

**Sprites** (~15MB, 120+ files):
```
sprites/
├── CLOCKBG.png, MAINBG.png, STARBG.png      # Backgrounds
├── needle.png, 12needle.png, GEAR*.png      # UI elements
├── Fx_MagicCircle_*.png                      # Effects (50+ files)
├── sprite_*.png                              # Game UI elements (60+ files)
└── UI_*.png, Img_*.png                       # Misc UI (10+ files)
```

**Fonts** (~3MB):
```
fonts/
├── taimingda.ttf                             # Custom game font
└── taimingda.css                             # @font-face definition
```

#### 4. Theme CSS (`yuzha/src/index.css` → `ui/yuzha/styles/theme.css`)

Extract these sections:
```css
/* Keep */
.btn { @apply inline-flex items-center gap-1 px-3 py-1.5 rounded ...; }
.badge { @apply text-xs px-2 py-0.5 rounded ...; }
@keyframes pulse { /* transform + opacity */ }

/* Discard (app-specific) */
.app-shell, .app-toolbar  /* Not needed in library */
html, body, #root         /* App-level reset */
```

---

## 🔄 What Gets Migrated as Apps

### counter2: `yuzha-yo/counter2/` → `dhepil-suite/apps/counter2/`

#### Current Structure (yuzha-yo)
```
counter2/
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx                      # Entry point
    ├── counter2Screen.tsx            # 343 lines - MONOLITHIC
    ├── counter2FloatingButton.tsx
    ├── counter2CountDisplay.tsx
    ├── counter2Buttons.tsx
    ├── counter2Settings.tsx
    ├── counter2Floating.tsx
    ├── index.ts
    └── index.css
```

#### Target Structure (dhepil-suite)
```
apps/counter2/
├── app.manifest.json                 # 🆕 Hub contract
├── package.json                      # Update: @dhepil-suite/counter2
├── vite.config.ts                    # Keep as-is
├── tsconfig.json                     # 🆕 Add
└── src/
    ├── main.tsx                      # Update: import from new paths
    ├── App.tsx                       # 🆕 NEW: ApplicationProviders wrapper
    ├── Counter2Gate.tsx              # 🆕 NEW: Gate pattern
    ├── app/
    │   └── ApplicationProviders.tsx  # 🆕 NEW: Theme wrapper
    ├── engine/
    │   ├── types.ts                  # 🆕 NEW: Domain types
    │   └── useCounter2Engine.ts      # 🆕 NEW: Extract from counter2Screen
    ├── components/
    │   ├── Counter2FloatingButton.tsx  # Move from src/
    │   ├── Counter2CountDisplay.tsx
    │   ├── Counter2Buttons.tsx
    │   ├── Counter2Settings.tsx
    │   └── Counter2Floating.tsx
    └── styles/
        └── global.css                # Minimal reset
```

#### Required Refactoring

**1. Extract Business Logic** (counter2Screen.tsx → engine/useCounter2Engine.ts)

```typescript
// BEFORE (counter2Screen.tsx - lines 109-220)
export default function Counter2Screen({ onBack }) {
  const [count, setCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [floatingSize, setFloatingSize] = useState(250);
  // ... 30+ state variables ...
  
  const increment = useCallback(() => { /* ... */ }, []);
  const reset = useCallback(() => { /* ... */ }, []);
  // ... 10+ handlers ...
  
  return <div>...</div>;
}

// AFTER (engine/useCounter2Engine.ts)
export function useCounter2Engine() {
  const [count, setCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [floatingSize, setFloatingSize] = useState(250);
  // ... state ...
  
  const increment = useCallback(() => { /* ... */ }, []);
  const reset = useCallback(() => { /* ... */ }, []);
  // ... handlers ...
  
  return {
    // State
    count, showSettings, floatingSize,
    // Handlers
    increment, reset, toggleSettings,
    // Computed
    deviceCapability, rendererLabel,
  };
}

// Counter2Gate.tsx (NEW)
export function Counter2Gate({ onBack }) {
  const engine = useCounter2Engine();
  
  return (
    <div className="relative w-full h-screen">
      <StageCanvas loadPipeline={engine.loadPipeline} />
      
      <Counter2Controls
        onBack={onBack}
        onToggleSettings={engine.toggleSettings}
        onReset={engine.reset}
      />
      
      <Counter2FloatingButton onActivate={engine.increment} />
      
      <Counter2CountDisplay>
        {engine.count}
      </Counter2CountDisplay>
      
      {engine.showSettings && <Counter2Settings {...engine.settings} />}
    </div>
  );
}
```

**2. Update Imports**

```typescript
// BEFORE
import { StageCanvas } from "@shared/layer";
import { getDeviceCapability } from "@shared/utils/DeviceCapability";

// AFTER
import { StageCanvas } from "../../ui/yuzha/engine";
import { getDeviceCapability } from "../../ui/yuzha/engine";
import "../../ui/yuzha/assets/fonts/taimingda.css";
```

**3. Add app.manifest.json**

```json
{
  "schemaVersion": 1,
  "id": "counter2",
  "name": "Counter 2",
  "runtime": "vite",
  "description": "Animated counter with Stage pipeline rendering",
  "desktop": {
    "enabled": true,
    "script": "desktop:dev",
    "appId": "com.dhepil.counter2",
    "productName": "Counter 2"
  }
}
```

---

### alpha-remover: `yuzha-yo/alphaRemove/` → `dhepil-suite/apps/alpha-remover/`

#### Current Structure
```
alphaRemove/
├── package.json
└── src/
    ├── main.tsx
    ├── AlphaRemoveScreen.tsx         # 274 lines - self-contained
    └── index.css
```

#### Target Structure
```
apps/alpha-remover/
├── app.manifest.json
├── package.json                      # @dhepil-suite/alpha-remover
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                       # 🆕 ApplicationProviders
    ├── AlphaRemoverGate.tsx          # 🆕 Optional (app is simple)
    ├── app/
    │   └── ApplicationProviders.tsx
    ├── engine/
    │   └── useAlphaRemover.ts        # 🆕 Extract image processing
    └── styles/
        └── global.css
```

#### Required Refactoring

**1. Extract Image Processing Logic**

```typescript
// engine/useAlphaRemover.ts (NEW)
export function useAlphaRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(32);
  const [curve, setCurve] = useState(1.4);
  const [preview, setPreview] = useState<ImageDataResult | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Effect: Load image when file changes
  useEffect(() => { /* ... */ }, [file]);
  
  // Effect: Reprocess on threshold/curve change
  useEffect(() => { /* ... */ }, [threshold, curve]);
  
  return {
    file, setFile,
    threshold, setThreshold,
    curve, setCurve,
    preview,
    downloadName: computeDownloadName(file),
    reprocess: () => processImage(imgRef.current, threshold, curve),
  };
}
```

**2. Add Theme Integration**

```typescript
// app/ApplicationProviders.tsx (NEW)
export function ApplicationProviders({ children }) {
  return (
    <SharedThemeProvider colorPrimary="#10b981" borderRadius={8}>
      {children}
    </SharedThemeProvider>
  );
}
```

**Note**: alpha-remover doesn't use yuzha library (no canvas rendering), but follows same app pattern for consistency.

---

## 🔧 Technical Implementation Steps

### Phase 1: Create `ui/yuzha/` Library Structure

```bash
cd C:\VSCODE\dhepil-suite

# Create directory structure
mkdir -p ui/yuzha/engine
mkdir -p ui/yuzha/mainscreen
mkdir -p ui/yuzha/assets/sprites
mkdir -p ui/yuzha/assets/fonts
mkdir -p ui/yuzha/styles
```

### Phase 2: Copy Rendering Engines

```bash
# From yuzha-yo to dhepil-suite
cp ../yuzha-yo/shared/layer/StageCanvas.tsx ui/yuzha/engine/
cp ../yuzha-yo/shared/layer/StageThree.tsx ui/yuzha/engine/
cp ../yuzha-yo/shared/utils/RendererDetector.ts ui/yuzha/engine/
cp ../yuzha-yo/shared/utils/DeviceCapability.ts ui/yuzha/engine/
```

**Update imports in copied files**:
```typescript
// BEFORE (in yuzha-yo)
import type { LayerConfigEntry } from "./types";

// AFTER (in dhepil-suite)
import type { LayerConfigEntry } from "./types";  // Same (relative path)
```

### Phase 3: Split MainScreenUtils

**Manual process** (not script-able due to complexity):

1. Create 6 new files in `ui/yuzha/mainscreen/`
2. Copy-paste relevant sections from `MainScreenUtils.tsx`
3. Update imports between modules
4. Create barrel export `index.ts`

**See "What Gets Extracted" section above for line ranges.**

### Phase 4: Copy Assets

```bash
# Copy all sprites
cp -r ../yuzha-yo/shared/assets/sprites/* ui/yuzha/assets/sprites/

# Copy fonts
cp ../yuzha-yo/shared/fonts/taimingda.ttf ui/yuzha/assets/fonts/
cp ../yuzha-yo/shared/fonts/taimingda.css ui/yuzha/assets/fonts/
```

**Total size**: ~18MB (consider git-lfs if repo size becomes issue)

### Phase 5: Extract Theme CSS

```bash
# Create theme.css
touch ui/yuzha/styles/theme.css
```

**Manually copy** these sections from `yuzha-yo/yuzha/src/index.css`:
- `.btn`, `.badge` classes
- `@keyframes pulse`
- Exclude: `html/body` reset, `.app-shell`

### Phase 6: Create Barrel Exports

**ui/yuzha/index.ts**:
```typescript
// Re-export everything for easy consumption
export * from "./engine";
export * from "./mainscreen";
export * from "./styles";
```

**ui/yuzha/engine/index.ts**:
```typescript
export { StageCanvas } from "./StageCanvas";
export { StageThree } from "./StageThree";
export { getRendererType } from "./RendererDetector";
export { getDeviceCapability } from "./DeviceCapability";
```

**ui/yuzha/mainscreen/index.ts**:
```typescript
export * from "./constants";
export * from "./types";
export * from "./utilities";
export * from "./gesture";
export * from "./effects";
export * from "./components";
export { default as MainScreen } from "./MainScreen";
```

### Phase 7: Update dhepil-suite Dependencies

**package.json** (root):
```json
{
  "dependencies": {
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "antd": "6.5.2",
    "three": "^0.180.0"        // 🆕 ADD
  },
  "devDependencies": {
    "@types/three": "^0.180.0" // 🆕 ADD
  }
}
```

Run: `npm install`

### Phase 8: Migrate counter2 App

1. **Copy directory**:
   ```bash
   cp -r ../yuzha-yo/counter2 apps/counter2
   ```

2. **Create new files**:
   - `app.manifest.json`
   - `src/App.tsx`
   - `src/Counter2Gate.tsx`
   - `src/app/ApplicationProviders.tsx`
   - `src/engine/useCounter2Engine.ts`
   - `src/engine/types.ts`

3. **Refactor counter2Screen.tsx**:
   - Extract state/handlers → `engine/useCounter2Engine.ts`
   - UI-only logic stays in `Counter2Gate.tsx`

4. **Update imports**:
   - `@shared/layer` → `../../ui/yuzha/engine`
   - `@shared/utils` → `../../ui/yuzha/engine`
   - Add font import: `import "../../ui/yuzha/assets/fonts/taimingda.css"`

5. **Update package.json**:
   ```json
   {
     "name": "@dhepil-suite/counter2",
     "dependencies": {
       "react": "19.2.8",
       "react-dom": "19.2.8",
       "three": "^0.180.0"
     }
   }
   ```

6. **Add to monorepo workspaces** (root package.json):
   ```json
   {
     "workspaces": [
       "apps/*",
       "electron"
     ]
   }
   ```

### Phase 9: Migrate alpha-remover App

Same process as counter2, but simpler (no yuzha library usage).

### Phase 10: Test Build

```bash
# Test yuzha library builds with apps
cd apps/counter2
npm run typecheck
npm run build

cd ../alpha-remover
npm run typecheck
npm run build

# Test hub controller still works
cd ../..
npm run build
```

---

## 📝 Import Path Changes Reference

### For counter2 App

| Before (yuzha-yo) | After (dhepil-suite) |
|-------------------|----------------------|
| `import { StageCanvas } from "@shared/layer"` | `import { StageCanvas } from "../../ui/yuzha/engine"` |
| `import { getDeviceCapability } from "@shared/utils/DeviceCapability"` | `import { getDeviceCapability } from "../../ui/yuzha/engine"` |
| `import diceSound from "@shared/sound/dice.wav"` | Keep as-is (move `shared/sound/` to `apps/counter2/assets/`) |
| `import rawConfig from "@shared/layer/ConfigCounter2.json"` | Move to `apps/counter2/src/config.json` |

### For Apps Using yuzha Library

```typescript
// Recommended import pattern
import { MainScreen } from "../../ui/yuzha/mainscreen";
import { StageCanvas, StageThree, getRendererType } from "../../ui/yuzha/engine";
import "../../ui/yuzha/assets/fonts/taimingda.css";
import "../../ui/yuzha/styles/theme.css";

// Usage
function MyVisualApp() {
  return (
    <MainScreen>
      {/* Your content */}
    </MainScreen>
  );
}
```

---

## ⚠️ Critical Constraints & Decisions Needed

### 1. Asset Strategy (DECIDE BEFORE EXECUTION)

**Options**:
- **A)** Copy ALL 120 PNGs (~15MB) to `ui/yuzha/assets/sprites/`
- **B)** Copy only 10-15 core sprites, apps bring specific assets
- **C)** Lazy load assets via dynamic import

**Recommendation**: **Option A** (copy all) - yuzha is a complete library

**Trade-off**: Root package size +18MB, but apps get complete asset library

### 2. Three.js Bundle Impact

Adding `three: "^0.180.0"` to root adds ~600KB (gzipped ~150KB) to ALL apps, even enterprise apps (clipboard, tampermonkey).

**Mitigation options**:
- Accept it (modern bundle sizes)
- Dynamic import: `const THREE = await import("three")`
- Separate published package `@dhepil/yuzha`

**Recommendation**: **Accept it** - 150KB gzipped is reasonable for modern web apps

### 3. Component Naming

Keep `MainScreen` name or rename to `VisualScreen`/`GameScreen`?

**Recommendation**: **Keep `MainScreen`** - clear, established name in yuzha-yo

### 4. yuzha-yo Repo Fate

After migration:
- **A)** Archive for reference
- **B)** Transform into examples/demos repo
- **C)** Delete completely

**Recommendation**: **Archive** - keep for reference, mark as deprecated in README

### 5. Build Strategy

**Options**:
- **A)** Direct source imports (no pre-build) - apps compile `ui/yuzha/` source
- **B)** Pre-built library - `npm run build:ui-yuzha` → `ui/yuzha/dist/`
- **C)** Published package - `npm publish @dhepil/yuzha`

**Recommendation**: **Option A** (direct source) - simpler for monorepo, same as clipboard pattern

---

## 🧪 Testing Checklist

### After Phase 7 (Library Created)

- [ ] `ui/yuzha/engine/` files have no import errors
- [ ] `ui/yuzha/mainscreen/` modules export correctly
- [ ] Barrel exports work: `import { MainScreen } from "../../ui/yuzha/mainscreen"`
- [ ] Assets accessible: Font loads, sprites display
- [ ] TypeScript compiles without errors

### After Phase 8 (counter2 Migrated)

- [ ] counter2 dev server starts: `npm run dev`
- [ ] Canvas renders correctly
- [ ] Counter increments on button click
- [ ] Settings panel opens/closes
- [ ] Sound/haptics toggle works
- [ ] Build succeeds: `npm run build`
- [ ] Hub can launch counter2 via manifest

### After Phase 9 (alpha-remover Migrated)

- [ ] alpha-remover dev server starts
- [ ] File upload works
- [ ] Image processing works
- [ ] Download button works
- [ ] Split view works
- [ ] Build succeeds

### Final Integration Test

- [ ] dhepil-suite root builds: `npm run build`
- [ ] Hub controller shows all 3 apps (clipboard, counter2, alpha-remover)
- [ ] Enterprise UI (clipboard) unaffected
- [ ] Visual apps (counter2) work correctly
- [ ] All apps use correct theme (Ant Design or yuzha)

---

## 📊 Estimated Effort

| Phase | Task | Estimated Time | Complexity |
|-------|------|----------------|------------|
| 1 | Create directory structure | 5 min | Low |
| 2 | Copy rendering engines | 10 min | Low |
| 3 | Split MainScreenUtils | 2 hours | High |
| 4 | Copy assets | 10 min | Low |
| 5 | Extract theme CSS | 30 min | Medium |
| 6 | Create barrel exports | 20 min | Low |
| 7 | Update dependencies | 5 min | Low |
| 8 | Migrate counter2 | 4 hours | High |
| 9 | Migrate alpha-remover | 2 hours | Medium |
| 10 | Test & fix issues | 3 hours | Medium |
| **TOTAL** | | **~12 hours** | |

**Breakdown**:
- **Library creation** (Phases 1-7): ~3.5 hours
- **App migration** (Phases 8-9): ~6 hours
- **Testing** (Phase 10): ~3 hours

**Note**: Estimates assume familiarity with both codebases and no major blockers.

---

## 🚨 Rollback Plan

If migration fails or causes issues:

### Quick Rollback (Phases 1-7 only)

```bash
# Remove yuzha library
rm -rf ui/yuzha

# Revert package.json
git checkout package.json package-lock.json

# Reinstall
npm install
```

**Impact**: None - no apps affected yet

### Full Rollback (Phases 8-10)

```bash
# Remove migrated apps
rm -rf apps/counter2
rm -rf apps/alpha-remover

# Remove yuzha library
rm -rf ui/yuzha

# Revert all changes
git checkout package.json
npm install

# Restore from yuzha-yo
# (apps still work in original location)
```

**Impact**: yuzha-yo remains intact, can continue using original monorepo

---

## 📚 Related Documentation

- **dhepil-suite Architecture**: See `C:\Users\YUZHA\.claude\projects\c--VSCODE\memory\dhepil-suite-architecture.md`
- **yuzha-yo Architecture**: See `C:\Users\YUZHA\.claude\projects\c--VSCODE\memory\yuzha-yo-architecture.md`
- **Migration Context**: See `C:\Users\YUZHA\.claude\projects\c--VSCODE\memory\yuzha-migration-context.md`
- **clipboard Reference**: See `C:\VSCODE\dhepil-suite\apps\clipboard\` (reference child app implementation)

---

## ✅ Success Criteria

Migration is successful when:

1. ✅ `ui/yuzha/` library exists with all components
2. ✅ counter2 app works in `apps/counter2/` with same functionality as yuzha-yo
3. ✅ alpha-remover app works in `apps/alpha-remover/` with same functionality
4. ✅ dhepil-suite hub can launch all 3 child apps
5. ✅ Enterprise UI (clipboard, hub controller) works unchanged
6. ✅ All apps follow same patterns (Gate, Engine hook, ApplicationProviders)
7. ✅ No TypeScript errors in entire monorepo
8. ✅ All apps build successfully
9. ✅ yuzha-yo repo can be archived (no longer actively developed)

---

**Next Steps**: Answer 7 open questions in migration context, then proceed with execution.

**Last Updated**: 2026-08-04  
**Maintainer**: Development team
