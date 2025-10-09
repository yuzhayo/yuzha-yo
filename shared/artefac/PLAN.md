
Action: file_editor create /app/SPIN_ONLY_FIX_PLAN.md --file-text "# 🔧 Spin Animation Fix - Implementation Plan (SPIN ONLY)

## Executive Summary
**Problem**: Spin processors are never instantiated in Stage components  
**Solution**: Add spin processor instantiation logic to all three Stage files  
**Scope**: SPIN ONLY (skipping orbital for now)  
**Estimated Time**: 10-15 minutes  
**Risk Level**: Low (isolated change, well-defined scope)

---

## 📝 Detailed Fix Plan

### Phase 1: StageCanvas.tsx Modification

**File**: `/app/shared/stages/StageCanvas.tsx`

#### Step 1.1: Add Import (Line 6)
```typescript
// Add after line 6:
import { createSpinProcessor } from \"../layer/LayerCorePipelineSpin\";
```

#### Step 1.2: Add Spin Processor Instantiation (After Line 78)
```typescript
// Add after the debug processor block (after line 78):

// Add Spin processor if configured
if (entry.spinSpeed && entry.spinSpeed > 0) {
  processors.push(
    createSpinProcessor({
      spinSpeed: entry.spinSpeed,
      spinDirection: entry.spinDirection,
    })
  );
}
```

---

### Phase 2: StageDOM.tsx Modification

**File**: `/app/shared/stages/StageDOM.tsx`

#### Step 2.1: Add Imports (Line 5)
```typescript
// Add after line 5:
import { createSpinProcessor } from \"../layer/LayerCorePipelineSpin\";
import { createImageMappingDebugProcessor } from \"../layer/LayerCorePipelineImageMappingDebug\";
```

#### Step 2.2: Add Processor Instantiation (After Line 36)
```typescript
// Replace lines 36-41 with:
const processors: LayerProcessor[] = [];

// Add Image Mapping Debug processor if configured
const hasDebugConfig =
  entry.showCenter ||
  entry.showTip ||
  entry.showBase ||
  entry.showStageCenter ||
  entry.showAxisLine ||
  entry.showRotation ||
  entry.showTipRay ||
  entry.showBaseRay ||
  entry.showBoundingBox;

if (hasDebugConfig) {
  processors.push(
    createImageMappingDebugProcessor({
      showCenter: entry.showCenter,
      showTip: entry.showTip,
      showBase: entry.showBase,
      showStageCenter: entry.showStageCenter,
      showAxisLine: entry.showAxisLine,
      showRotation: entry.showRotation,
      showTipRay: entry.showTipRay,
      showBaseRay: entry.showBaseRay,
      showBoundingBox: entry.showBoundingBox,
      centerStyle: entry.centerStyle,
      tipStyle: entry.tipStyle,
      baseStyle: entry.baseStyle,
      stageCenterStyle: entry.stageCenterStyle,
      colors: entry.debugColors,
    }),
  );
}

// Add Spin processor if configured
if (entry.spinSpeed && entry.spinSpeed > 0) {
  processors.push(
    createSpinProcessor({
      spinSpeed: entry.spinSpeed,
      spinDirection: entry.spinDirection,
    })
  );
}
```

---

### Phase 3: StageThree.tsx Modification

**File**: `/app/shared/stages/StageThree.tsx`

#### Step 3.1: Add Import (Line 7)
```typescript
// Add after line 7:
import { createSpinProcessor } from \"../layer/LayerCorePipelineSpin\";
```

#### Step 3.2: Add Spin Processor Instantiation (After Line 100)
```typescript
// Add after the debug processor block (after line 100):

// Add Spin processor if configured
if (entry.spinSpeed && entry.spinSpeed > 0) {
  processors.push(
    createSpinProcessor({
      spinSpeed: entry.spinSpeed,
      spinDirection: entry.spinDirection,
    })
  );
}
```

---

## 📊 Changes Summary

| File | Imports Added | Lines Added | Complexity |
|------|---------------|-------------|------------|
| StageCanvas.tsx | 1 | ~10 | Low |
| StageDOM.tsx | 2 | ~35 | Medium |
| StageThree.tsx | 1 | ~10 | Low |
| **Total** | **4** | **~55** | **Low** |

---

## 🎯 Expected Outcome

### Before Fix
- CLOCKBG layer is static (no spin)
- Console: `[LayerEngineCanvas] Total layers loaded: 10 (all static)`

### After Fix
- CLOCKBG layer spins at 50°/second clockwise
- Console: `[LayerEngineCanvas] Starting 60fps animation loop for dynamic layers`
- Static layers remain unaffected

---

## 🧪 Testing Checklist

- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] CLOCKBG layer spins smoothly
- [ ] Animation is 50°/second clockwise
- [ ] Static layers remain static
- [ ] No console errors
- [ ] 60fps maintained

---

## 💡 Why Spin Only?

- ✅ Focused scope (easier to test)
- ✅ Smaller diff (easier to review)
- ✅ Lower risk (less code change)
- ✅ Orbital can be added later using same pattern

---

Ready to implement when you approve!
"
Observation: Create successful: /app/SPIN_ONLY_FIX_PLAN.md
