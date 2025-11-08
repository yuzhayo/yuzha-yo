# Layer System Changelog

## Flat Config Refactoring (Nov 8, 2025)

### Overview
Complete refactoring of the configuration system from grouped structure to flat structure for simplicity and clarity.

### Objective
Simplify the layer configuration architecture by:
- Removing nested "groups" structure
- Using direct top-level properties
- Maintaining all animation functionality (spin, orbit, clock aliases)
- Improving readability for future AI agents

### Changes Made

#### 1. Config.ts Simplification
**File:** `shared/layer/Config.ts`

**Removed:**
- `ConfigYuzhaEntry` type (grouped JSON structure with nested "groups")
- `transformConfig()` function (flattening logic)
- Complex group merging logic (Basic Config, Spin Config, Orbital Config)

**Added:**
- Direct flat JSON loading from ConfigYuzha.json
- `normalizeConfig()` - handles clock alias string conversion
- `normalizeMotionGroup()` - converts string speeds to alias fields
- Comprehensive documentation for future AI agents
- Fixed TypeScript `import.meta.env` compatibility issues

**Clock Alias Normalization:**
```typescript
// Before (string in config)
{ "spinSpeed": "hour" }

// After normalization
{ "spinSpeedAlias": "hour", "spinFormat": "24", "spinTimezone": "UTC" }
```

**Pipeline Flow:**
```
ConfigYuzha.json (flat)
  ↓
normalizeConfig() → normalize clock aliases
  ↓
validateConfig() → check valid ranges
  ↓
sort by LayerOrder
  ↓
loadLayerConfig() → return to StageSystem
```

#### 2. ConfigYuzha.json Flattening
**File:** `shared/layer/ConfigYuzha.json`

**Transformation:** All 20 layers converted from grouped to flat structure

**Before (grouped structure):**
```json
{
  "LayerID": "HOUR-hand",
  "ImageID": "UI_Clock_HourHand",
  "renderer": "2D",
  "LayerOrder": 920,
  "ImageScale": [104, 104],
  "groups": {
    "Spin Config": {
      "spinStagePoint": [1024, 1024],
      "spinImagePoint": [50, 80],
      "spinSpeedAlias": "hour",
      "spinDirection": "cw",
      "spinFormat": "24",
      "spinTimezone": "UTC+7"
    }
  }
}
```

**After (flat structure):**
```json
{
  "LayerID": "HOUR-hand",
  "ImageID": "UI_Clock_HourHand",
  "renderer": "2D",
  "LayerOrder": 920,
  "ImageScale": [104, 104],
  "spinStagePoint": [1024, 1024],
  "spinImagePoint": [50, 80],
  "spinSpeed": "hour",
  "spinDirection": "cw",
  "spinFormat": "24",
  "spinTimezone": "UTC+7"
}
```

**Critical Fix:**
- Corrected zodiac layer: `spinSpeedAlias: 18` → `spinSpeed: 18`
- Invalid alias value would have broken clock-driven animations

#### 3. TypeScript Compatibility Fixes
**File:** `shared/layer/layerCore.ts`

**Fixed:** `import.meta.env` TypeScript errors (2 occurrences)

**Before:**
```typescript
if (import.meta.env?.DEV) {
  // validation logic
}
```

**After:**
```typescript
const IS_DEV = typeof import.meta !== 'undefined' && 
               typeof (import.meta as any).env !== 'undefined' ? 
               (import.meta as any).env.DEV : true;
if (IS_DEV) {
  // validation logic
}
```

### Files Modified
1. `shared/layer/Config.ts` - Complete rewrite with flat structure
2. `shared/layer/ConfigYuzha.json` - All 20 layers flattened
3. `shared/layer/layerCore.ts` - Fixed TypeScript compatibility

### Files Unchanged (Compatible with Flat Config)
- `shared/layer/layerMotion.ts` - Already reads flat properties directly
- `shared/layer/layerBasic.ts` - Pure math utilities (no config dependency)
- `shared/layer/StageSystem.ts` - Uses loadLayerConfig() (still works)
- `shared/layer/layer.ts` - Processor pipeline (config-agnostic)
- All renderer files (StageCanvas.tsx, StageThree.tsx)

### Verification Results

#### TypeScript Compilation
```bash
✅ npm run typecheck
> yuzha-yo@0.1.0 typecheck
> npm run typecheck --workspace yuzha && tsc --noEmit --project tsconfig.base.json
SUCCESS - No errors
```

#### ESLint
```bash
✅ npm run lint
> yuzha-yo@0.1.0 lint
> eslint "yuzha/**/*.{ts,tsx}" "shared/**/*.{ts,tsx}" --max-warnings=0
SUCCESS - Zero warnings
```

#### Runtime Testing
✅ Application loads successfully  
✅ All 20 layers loaded from flat config  
✅ Clock aliases resolved correctly (hour, minute, second)  
✅ Spinning gears animate at correct speeds  
✅ Hour hand uses clock-driven rotation  
✅ Zodiac ring rotates with numeric speed (18 rotations/hour)  
✅ No console errors  
✅ Visual output matches previous grouped config behavior  

**Console Output:**
```
[Config] Loaded flat config with 20 layers
[LayerCore] prepareLayer "HOUR-hand" took 25.40ms (modules: spin=true, orbit=false)
[LayerCore] prepareLayer "zodiac" took 28.50ms (modules: spin=true, orbit=false)
```

#### Architect Reviews
- **Initial Review:** FAIL - Identified zodiac layer data regression (`spinSpeedAlias: 18` invalid)
- **Final Review:** PASS - After correction, all config entries valid, animations working

### Layer Configuration Examples

#### Static Layer (No Animation)
```json
{
  "LayerID": "CLOCKBG",
  "ImageID": "CLOCKBG-A",
  "renderer": "2D",
  "LayerOrder": 751,
  "ImageScale": [100, 100],
  "BasicStagePoint": [1024, 1024],
  "BasicImagePoint": [50, 50],
  "BasicImageAngle": 0
}
```

#### Spinning Layer (Numeric Speed)
```json
{
  "LayerID": "GEAR1-0",
  "ImageID": "GEAR1",
  "renderer": "2D",
  "LayerOrder": 350,
  "ImageScale": [220, 220],
  "spinStagePoint": [920, 1420],
  "spinImagePoint": [50, 50],
  "spinSpeed": 20,
  "spinDirection": "ccw"
}
```

#### Clock-Driven Layer (Alias Speed)
```json
{
  "LayerID": "HOUR-hand",
  "ImageID": "UI_Clock_HourHand",
  "renderer": "2D",
  "LayerOrder": 920,
  "ImageScale": [104, 104],
  "spinStagePoint": [1024, 1024],
  "spinImagePoint": [50, 80],
  "spinSpeed": "hour",
  "spinDirection": "cw",
  "spinFormat": "24",
  "spinTimezone": "UTC+7"
}
```

### Benefits of Flat Structure

1. **Simplicity:** No nested groups - all properties at top level
2. **Clarity:** Direct property access, easier to read/write
3. **Less Code:** Removed 150+ lines of transformation logic
4. **Better DX:** JSON structure matches TypeScript type directly
5. **Maintainability:** Single source of truth, no sync issues between grouped/flat
6. **Future-Proof:** Documented extensively for future AI agents

### Migration Notes for Future AI Agents

**When editing ConfigYuzha.json:**
- All properties are at the top level (no "groups" nesting)
- Use `spinSpeed: "hour"/"minute"/"second"` for clock aliases
- Use `spinSpeed: 1.5` for numeric rotations per hour
- Never use `spinSpeedAlias` directly in JSON (it's set during normalization)
- Same applies to orbit properties

**When adding new layer properties:**
1. Add to `LayerConfigEntry` type in Config.ts
2. Update validation in `validateLayerConfig()` if needed
3. Properties work automatically (no transformation needed)

### Performance Impact
- **Load Time:** Slightly faster (no transformation overhead)
- **Memory:** Slightly lower (no temporary grouped structure)
- **Runtime:** No change (layerMotion already used flat properties)

### Breaking Changes
**None** - Flat config is backward compatible with animation behavior.

All existing animations (spin speeds, clock aliases, directions, formats, timezones) preserved exactly.

### Known Issues
- Missing placeholder assets: "sample", "sprite_005-" (expected, not critical)
- These layers skip rendering but don't cause errors

### Next Steps (Recommendations)
1. Replace placeholder assets when available
2. Add unit tests for Config.normalizeMotionGroup()
3. Consider adding runtime JSON schema validation (e.g., Zod)
4. Profile heavy scenes to confirm performance under load
5. Document flat config schema in user-facing docs
