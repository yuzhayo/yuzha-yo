"# Analysis: Restructuring Configuration Groups

## Proposed Change

### Current Structure

```json
{
  \"layerId\": \"stars-background\",
  \"groups\": {
    \"Basic Config\": {
      \"renderer\": \"2D\",
      \"order\": 50,
      \"imageId\": \"STARBG\",
      \"scale\": [100, 100],
      \"imageTip\": 90,
      \"imageBase\": 270,
      \"BasicStagePoint\": [2, 1024],
      \"BasicImagePoint\": [50, 50]
    }
  }
}
```

### Proposed Structure

```json
{
  \"layerId\": \"stars-background\",
  \"imageId\": \"STARBG\",
  \"order\": 50,
  \"renderer\": \"2D\",
  \"groups\": {
    \"Basic Config\": {
      \"scale\": [100, 100],
      \"BasicStagePoint\": [2, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicAngleImage\": 0
    }
  }
}
```

With `imageTip` and `imageBase` moved to a separate future use group or removed entirely from config files.

---

## Pros and Cons Analysis

### ✅ PROS

#### 1. **Clearer Hierarchy** ⭐⭐⭐⭐⭐

**Current**: Everything is nested inside groups, even layer identity properties

```json
{
  \"layerId\": \"stars-background\",  // Layer identity
  \"groups\": {
    \"Basic Config\": {
      \"imageId\": \"STARBG\",        // Also layer identity - feels wrong
      \"renderer\": \"2D\",           // Also layer identity
      \"order\": 50                 // Also layer identity
    }
  }
}
```

**Proposed**: Layer identity at top level, positioning details in groups

```json
{
  \"layerId\": \"stars-background\",  // Layer identity - clear
  \"imageId\": \"STARBG\",            // Layer identity - clear
  \"renderer\": \"2D\",               // Layer identity - clear
  \"order\": 50,                    // Layer identity - clear
  \"groups\": {
    \"Basic Config\": {             // Positioning/transformation details
      \"scale\": [100, 100],
      \"BasicStagePoint\": [2, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicAngleImage\": 0
    }
  }
}
```

**Benefit**: More intuitive - \"what is this layer\" vs \"how should it be positioned\"

---

#### 2. **Better Logical Grouping** ⭐⭐⭐⭐⭐

**Proposed categorization makes sense**:

**Top Level** (Layer Identification):

- `layerId`: Unique identifier
- `imageId`: Which image asset to use
- `renderer`: How to render (2D/3D)
- `order`: Rendering order/z-index

**Basic Config Group** (Positioning & Transformation):

- `scale`: Size
- `BasicStagePoint`: Where on stage
- `BasicImagePoint`: Which point of image
- `BasicAngleImage`: Rotation

**Other Groups** (Features):

- Spin Config
- Orbital Config
- Image Mapping Debug

**Benefit**: Natural categorization that matches mental model

---

#### 3. **Easier to Read** ⭐⭐⭐⭐

**Current**: Need to dive into groups to see basic info

```json
{
  \"layerId\": \"stars-background\",
  \"groups\": {
    \"Basic Config\": {
      \"imageId\": \"STARBG\",      // ← Have to look here to see what image
      \"renderer\": \"2D\",          // ← Have to look here to see renderer type
      \"order\": 50                // ← Have to look here to see order
    }
  }
}
```

**Proposed**: Scan top level to understand the layer

```json
{
  \"layerId\": \"stars-background\",
  \"imageId\": \"STARBG\",            // ← Immediately visible
  \"renderer\": \"2D\",               // ← Immediately visible
  \"order\": 50,                    // ← Immediately visible
  \"groups\": { ... }
}
```

**Benefit**: Faster to understand what each layer is about

---

#### 4. **More Scalable** ⭐⭐⭐⭐

As you add more groups (Animation, Effects, Filters, etc.), top-level properties stay clean:

```json
{
  \"layerId\": \"complex-layer\",
  \"imageId\": \"COMPLEX\",
  \"renderer\": \"3D\",
  \"order\": 100,
  \"groups\": {
    \"Basic Config\": { ... },
    \"Spin Config\": { ... },
    \"Orbital Config\": { ... },
    \"Animation Config\": { ... },      // New
    \"Effects Config\": { ... },        // New
    \"Filter Config\": { ... },         // New
    \"Particle Config\": { ... }        // New
  }
}
```

**Benefit**: Can add many feature groups without cluttering layer identification

---

#### 5. **Matches Industry Patterns** ⭐⭐⭐⭐

Similar to game engines and animation tools:

- Unity: GameObject properties at top, components nested
- After Effects: Layer properties at top, transforms/effects nested
- Blender: Object data at top, modifiers/properties nested

**Benefit**: Familiar structure for developers from other domains

---

#### 6. **Better for Tooling/UI** ⭐⭐⭐⭐⭐

If you build a config editor UI:

**Layer List Panel** (shows top-level properties):

```
📄 stars-background
   Image: STARBG
   Renderer: 2D
   Order: 50

📄 character-sprite
   Image: CHAR
   Renderer: 3D
   Order: 100
```

**Properties Panel** (shows groups when layer selected):

```
📦 Basic Config
   ├─ scale: [100, 100]
   ├─ position: [1024, 1024]
   └─ rotation: 0°

📦 Spin Config
   └─ speed: 0

📦 Orbital Config
   └─ radius: 0
```

**Benefit**: Natural separation for UI/tools

---

#### 7. **Reduced Nesting** ⭐⭐⭐

**Current**: 3 levels to get to properties

```
entry → groups → \"Basic Config\" → property
```

**Proposed**: 2 levels for identity, 3 for details

```
entry → property (for identity)
entry → groups → \"Basic Config\" → property (for details)
```

**Benefit**: Less indentation, easier to navigate

---

#### 8. **Cleaner for Simple Cases** ⭐⭐⭐⭐

For layers that only need basics:

```json
{
  \"layerId\": \"simple-bg\",
  \"imageId\": \"BG\",
  \"renderer\": \"2D\",
  \"order\": 10,
  \"groups\": {
    \"Basic Config\": {
      \"scale\": [100, 100],
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicAngleImage\": 0
    }
  }
}
```

No need for Spin/Orbital groups if not using those features.

**Benefit**: Minimal config for simple layers

---

### ❌ CONS

#### 1. **Code Changes Required** ⭐⭐⭐

**Impact**: Need to update `Config.ts` transformation logic

**Current code** (lines 134-146):

```typescript
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    // Merge all groups into a single config entry
    const merged: Partial<LayerConfigEntry> = { layerId: entry.layerId };

    Object.values(entry.groups).forEach((group) => {
      Object.assign(merged, group);
    });

    return merged as LayerConfigEntry;
  });
}
```

**New code needed**:

```typescript
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    const merged: Partial<LayerConfigEntry> = {
      layerId: entry.layerId,
      imageId: entry.imageId, // ← Add top-level properties
      renderer: entry.renderer,
      order: entry.order,
    };

    Object.values(entry.groups).forEach((group) => {
      Object.assign(merged, group);
    });

    return merged as LayerConfigEntry;
  });
}
```

**Mitigation**: Small, straightforward change (~5 lines)

---

#### 2. **Breaking Change for Existing Configs** ⭐⭐⭐⭐

**Impact**: All existing ConfigYuzha.json entries need migration

**Current configs**: ~11 entries in ConfigYuzha.json (based on earlier grep results)

**Migration needed**: For each entry, move `imageId`, `renderer`, `order` from groups to top level

**Mitigation**:

- Write a migration script
- Or manually update (relatively small number of entries)
- Can support both formats temporarily

---

#### 3. **Type Definition Updates** ⭐⭐

**Impact**: Need to update TypeScript types

**Current** (Config.ts, lines 80-129):

```typescript
type ConfigYuzhaEntry = {
  layerId: string;
  groups: {
    [groupName: string]: {
      renderer?: string;
      order?: number;
      imageId?: string;
      // ... other properties
    };
  };
};
```

**New**:

```typescript
type ConfigYuzhaEntry = {
  layerId: string;
  imageId: string; // ← Required at top level
  renderer: string; // ← Required at top level
  order: number; // ← Required at top level
  groups: {
    [groupName: string]: {
      // renderer, order, imageId removed from here
      scale?: number[];
      BasicStagePoint?: number[];
      // ... other properties
    };
  };
};
```

**Mitigation**: Clear change, TypeScript will catch any mistakes

---

#### 4. **Inconsistency During Transition** ⭐⭐⭐

**Impact**: If some configs use old format and some use new format, confusion

**Mitigation**:

- Do all-at-once migration
- Or support both formats with deprecation warning

---

#### 5. **Documentation Updates** ⭐⭐

**Impact**: Need to update:

- Configuration examples
- Documentation files
- Comments in code

**Mitigation**: Part of the migration process, not a major blocker

---

#### 6. **imageTip/imageBase Placement Unclear** ⭐⭐⭐

**Question**: Where do imageTip/imageBase go in new structure?

**Option A**: Remove from config files entirely (calculated with defaults)

```json
{
  \"groups\": {
    \"Basic Config\": {
      // No imageTip/imageBase - use defaults (90, 270)
    }
  }
}
```

**Option B**: Create separate \"Image Mapping\" group

```json
{
  \"groups\": {
    \"Basic Config\": { ... },
    \"Image Mapping\": {
      \"imageTip\": 90,
      \"imageBase\": 270
    }
  }
}
```

**Option C**: Keep in Basic Config but commented/optional

```json
{
  \"groups\": {
    \"Basic Config\": {
      \"scale\": [100, 100],
      \"BasicAngleImage\": 0
      // \"imageTip\": 90,      // Future use
      // \"imageBase\": 270     // Future use
    }
  }
}
```

**Recommendation**: Option A (remove from configs, use defaults until needed)

---

## Comparison Table

| Aspect               | Current Structure          | Proposed Structure            | Winner      |
| -------------------- | -------------------------- | ----------------------------- | ----------- |
| **Clarity**          | Properties mixed in groups | Identity vs details separated | ✅ Proposed |
| **Readability**      | Need to dive into groups   | Scan top level                | ✅ Proposed |
| **Logical Grouping** | Everything in groups       | Natural categorization        | ✅ Proposed |
| **Scalability**      | Can get cluttered          | Clean top level               | ✅ Proposed |
| **UI/Tooling**       | Harder to present          | Natural panels                | ✅ Proposed |
| **Migration Effort** | No change needed           | Requires migration            | ✅ Current  |
| **Code Complexity**  | Simple transform           | Slightly more complex         | ✅ Current  |
| **Type Safety**      | Works fine                 | Works fine                    | 🟰 Tie      |

---

## Recommendation: ✅ **YES, Restructure**

### Overall Assessment

**Pros outweigh cons significantly.**

### Reasoning

1. **Logical Structure** (High Value):
   - Much clearer separation of concerns
   - Matches mental model better
   - Easier to understand and maintain

2. **Migration Cost** (Low-Medium):
   - ~11 config entries to migrate
   - Simple transformation logic update
   - One-time cost

3. **Long-term Benefit** (High):
   - Better foundation for future features
   - Easier to add new groups
   - Better for tooling/UI development

4. **Industry Alignment**:
   - Similar to other systems
   - More intuitive for new developers

### Migration Strategy

**Phase 1**: Update Type Definitions

```typescript
type ConfigYuzhaEntry = {
  layerId: string;
  imageId: string; // Required
  renderer: string; // Required
  order: number; // Required
  groups: {
    [groupName: string]: {
      // Properties excluding imageId, renderer, order
    };
  };
};
```

**Phase 2**: Update Transform Function

```typescript
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    const merged: Partial<LayerConfigEntry> = {
      layerId: entry.layerId,
      imageId: entry.imageId,
      renderer: entry.renderer as LayerRenderer,
      order: entry.order,
    };

    Object.values(entry.groups).forEach((group) => {
      Object.assign(merged, group);
    });

    return merged as LayerConfigEntry;
  });
}
```

**Phase 3**: Migrate ConfigYuzha.json

- Write a script or manually update each entry
- Move imageId, renderer, order to top level
- Remove imageTip/imageBase from configs (use defaults)

**Phase 4**: Test

- Verify all layers load correctly
- Check rendering is unchanged
- Test debug visualization

---

## Proposed Final Structure

### Clean Example

```json
{
  \"layerId\": \"stars-background\",
  \"imageId\": \"STARBG\",
  \"renderer\": \"2D\",
  \"order\": 50,
  \"groups\": {
    \"Basic Config\": {
      \"scale\": [100, 100],
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicAngleImage\": 0
    },
    \"Spin Config\": {
      \"spinStagePoint\": [1024, 1024],
      \"spinImagePoint\": [50, 50],
      \"spinSpeed\": 0,
      \"spinDirection\": \"cw\"
    },
    \"Orbital Config\": {
      \"orbitCenter\": [1024, 1024],
      \"orbitImagePoint\": [50, 50],
      \"orbitRadius\": 0,
      \"orbitSpeed\": 0,
      \"orbitDirection\": \"cw\"
    },
    \"Image Mapping Debug\": {
      \"showCenter\": false,
      \"showTip\": false,
      \"showBase\": false
    }
  }
}
```

### What Happens to imageTip/imageBase?

**Remove from config files** - They'll use defaults:

- `imageTip`: 90° (top)
- `imageBase`: 270° (bottom)

**When needed in future**, add them back in a dedicated group:

```json
{
  \"groups\": {
    \"Image Mapping\": {
      \"imageTip\": 90,
      \"imageBase\": 270
    }
  }
}
```

---

## Summary

### Pros (8 major benefits)

✅ Clearer hierarchy
✅ Better logical grouping  
✅ Easier to read
✅ More scalable
✅ Matches industry patterns
✅ Better for tooling/UI
✅ Reduced nesting
✅ Cleaner for simple cases

### Cons (6 manageable issues)

⚠️ Code changes required (small)
⚠️ Breaking change (one-time migration)
⚠️ Type updates needed (straightforward)
⚠️ Transition period (manageable)
⚠️ Documentation updates (standard)
⚠️ imageTip/imageBase placement (remove from configs)

### Verdict

**✅ RECOMMEND RESTRUCTURING**

The benefits for long-term maintainability, clarity, and scalability far outweigh the one-time migration cost.
"

"# Implementation Plan: Config Restructuring

## Overview

This document provides a **complete step-by-step implementation plan** for restructuring the configuration from nested groups to top-level identity properties.

---

## Step 1: Update Type Definitions in Config.ts

### File: `/app/shared/config/Config.ts`

#### Change 1.1: Update ConfigYuzhaEntry Type (Lines 80-129)

**Current**:

```typescript
type ConfigYuzhaEntry = {
  layerId: string;
  groups: {
    [groupName: string]: {
      renderer?: string;
      order?: number;
      imageId?: string;
      scale?: number[];
      position?: number[];
      BasicStagePoint?: number[];
      BasicImagePoint?: number[];
      BasicAngleImage?: number;
      imageTip?: number;
      imageBase?: number;
      spinStagePoint?: number[];
      spinImagePoint?: number[];
      spinSpeed?: number;
      spinDirection?: \"cw\" | \"ccw\";
      orbitCenter?: number[];
      orbitImagePoint?: number[];
      orbitRadius?: number;
      orbitSpeed?: number;
      orbitDirection?: \"cw\" | \"ccw\";
      showCenter?: boolean;
      showTip?: boolean;
      showBase?: boolean;
      showStageCenter?: boolean;
      showAxisLine?: boolean;
      showRotation?: boolean;
      showTipRay?: boolean;
      showBaseRay?: boolean;
      showBoundingBox?: boolean;
      centerStyle?: \"dot\" | \"crosshair\";
      tipStyle?: \"circle\" | \"arrow\";
      baseStyle?: \"circle\" | \"square\";
      stageCenterStyle?: \"dot\" | \"crosshair\" | \"star\";
      debugColors?: {
        center?: string;
        tip?: string;
        base?: string;
        stageCenter?: string;
        axisLine?: string;
        rotation?: string;
        tipRay?: string;
        baseRay?: string;
        boundingBox?: string;
      };
    };
  };
};
```

**New**:

```typescript
type ConfigYuzhaEntry = {
  // Top-level identity properties (REQUIRED)
  layerId: string;
  imageId: string;
  renderer: \"2D\" | \"3D\";
  order: number;

  // Configuration groups (OPTIONAL)
  groups: {
    [groupName: string]: {
      // Identity properties removed from groups
      // renderer, order, imageId are now top-level only

      // Basic Config group properties
      scale?: number[];
      position?: number[];
      BasicStagePoint?: number[];
      BasicImagePoint?: number[];
      BasicAngleImage?: number;

      // Image Mapping properties (future use - not in configs yet)
      imageTip?: number;
      imageBase?: number;

      // Spin Config group properties
      spinStagePoint?: number[];
      spinImagePoint?: number[];
      spinSpeed?: number;
      spinDirection?: \"cw\" | \"ccw\";

      // Orbital Config group properties
      orbitCenter?: number[];
      orbitImagePoint?: number[];
      orbitRadius?: number;
      orbitSpeed?: number;
      orbitDirection?: \"cw\" | \"ccw\";

      // Image Mapping Debug group properties
      showCenter?: boolean;
      showTip?: boolean;
      showBase?: boolean;
      showStageCenter?: boolean;
      showAxisLine?: boolean;
      showRotation?: boolean;
      showTipRay?: boolean;
      showBaseRay?: boolean;
      showBoundingBox?: boolean;
      centerStyle?: \"dot\" | \"crosshair\";
      tipStyle?: \"circle\" | \"arrow\";
      baseStyle?: \"circle\" | \"square\";
      stageCenterStyle?: \"dot\" | \"crosshair\" | \"star\";
      debugColors?: {
        center?: string;
        tip?: string;
        base?: string;
        stageCenter?: string;
        axisLine?: string;
        rotation?: string;
        tipRay?: string;
        baseRay?: string;
        boundingBox?: string;
      };
    };
  };
};
```

---

## Step 2: Update transformConfig Function in Config.ts

### File: `/app/shared/config/Config.ts`

#### Change 2.1: Update transformConfig Function (Lines 134-146)

**Current**:

```typescript
// Transform grouped structure to flat LayerConfigEntry format
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    // Merge all groups into a single config entry
    const merged: Partial<LayerConfigEntry> = { layerId: entry.layerId };

    Object.values(entry.groups).forEach((group) => {
      Object.assign(merged, group);
    });

    return merged as LayerConfigEntry;
  });
}
```

**New**:

```typescript
// Transform grouped structure to flat LayerConfigEntry format
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    // Start with top-level identity properties
    const merged: Partial<LayerConfigEntry> = {
      layerId: entry.layerId,
      imageId: entry.imageId,
      renderer: entry.renderer as LayerRenderer,
      order: entry.order,
    };

    // Merge all group properties
    Object.values(entry.groups).forEach((group) => {
      Object.assign(merged, group);
    });

    return merged as LayerConfigEntry;
  });
}
```

**Key Changes**:

- Added `imageId`, `renderer`, `order` to initial merged object
- These come from top-level now, not from groups
- Cast `renderer` to `LayerRenderer` type for type safety

---

## Step 3: Migrate ConfigYuzha.json

### File: `/app/shared/config/ConfigYuzha.json`

We need to migrate ALL entries. Based on earlier analysis, there are ~11 entries.

#### Migration Pattern

**Before (Current)**:

```json
{
  \"layerId\": \"stars-background\",
  \"groups\": {
    \"Basic Config\": {
      \"renderer\": \"2D\",
      \"order\": 50,
      \"imageId\": \"STARBG\",
      \"scale\": [100, 100],
      \"imageTip\": 90,
      \"imageBase\": 270,
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50]
    },
    \"Spin Config\": { ... },
    \"Orbital Config\": { ... },
    \"Image Mapping Debug\": { ... }
  }
}
```

**After (New)**:

```json
{
  \"layerId\": \"stars-background\",
  \"imageId\": \"STARBG\",
  \"renderer\": \"2D\",
  \"order\": 50,
  \"groups\": {
    \"Basic Config\": {
      \"scale\": [100, 100],
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicAngleImage\": 0
    },
    \"Spin Config\": { ... },
    \"Orbital Config\": { ... },
    \"Image Mapping Debug\": { ... }
  }
}
```

**Changes for each entry**:

1. ✅ Move `imageId` from `groups[\"Basic Config\"]` to top level
2. ✅ Move `renderer` from `groups[\"Basic Config\"]` to top level
3. ✅ Move `order` from `groups[\"Basic Config\"]` to top level
4. ✅ Remove `imageTip` from config (will use default 90°)
5. ✅ Remove `imageBase` from config (will use default 270°)
6. ✅ Add `BasicAngleImage: 0` if not present (for explicit default)

---

## Step 4: Create Migration Script (Optional)

### File: `/app/scripts/migrate-config.mjs` (NEW)

```javascript
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "../shared/config/ConfigYuzha.json");

// Read current config
const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Migrate each entry
const migratedConfig = rawConfig.map((entry) => {
  const basicConfig = entry.groups["Basic Config"] || {};

  // Create new structure with top-level identity properties
  const newEntry = {
    layerId: entry.layerId,
    imageId: basicConfig.imageId,
    renderer: basicConfig.renderer,
    order: basicConfig.order,
    groups: {},
  };

  // Process each group
  Object.entries(entry.groups).forEach(([groupName, groupProps]) => {
    const newGroupProps = { ...groupProps };

    // If this is Basic Config, remove identity properties
    if (groupName === "Basic Config") {
      delete newGroupProps.imageId;
      delete newGroupProps.renderer;
      delete newGroupProps.order;
      delete newGroupProps.imageTip; // Remove for future use
      delete newGroupProps.imageBase; // Remove for future use

      // Add BasicAngleImage if not present
      if (newGroupProps.BasicAngleImage === undefined) {
        newGroupProps.BasicAngleImage = 0;
      }
    }

    newEntry.groups[groupName] = newGroupProps;
  });

  return newEntry;
});

// Write migrated config
fs.writeFileSync(configPath, JSON.stringify(migratedConfig, null, 2), "utf-8");

console.log("✅ Migration complete!");
console.log(`Migrated ${migratedConfig.length} entries`);
```

**Usage**:

```bash
node /app/scripts/migrate-config.mjs
```

---

## Step 5: Manual Migration (Alternative to Script)

If you prefer manual migration, update each entry in ConfigYuzha.json:

### Entry 1: stars-background (first occurrence)

**Before**:

```json
{
  \"layerId\": \"stars-background\",
  \"groups\": {
    \"Basic Config\": {
      \"renderer\": \"2D\",
      \"order\": 50,
      \"imageId\": \"STARBG\",
      \"scale\": [100, 100],
      \"imageTip\": 90,
      \"imageBase\": 270,
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50]
    },
    \"Spin Config\": {
      \"spinStagePoint\": [1024, 1024],
      \"spinImagePoint\": [50, 50],
      \"spinSpeed\": 0,
      \"spinDirection\": \"cw\"
    },
    \"Orbital Config\": {
      \"orbitCenter\": [1024, 1024],
      \"orbitImagePoint\": [50, 50],
      \"orbitRadius\": 0,
      \"orbitSpeed\": 0,
      \"orbitDirection\": \"cw\"
    },
    \"Image Mapping Debug\": {
      \"showCenter\": false,
      \"showTip\": false,
      \"showBase\": false,
      \"showStageCenter\": false,
      \"showAxisLine\": false,
      \"showRotation\": false,
      \"showTipRay\": false,
      \"showBaseRay\": false,
      \"showBoundingBox\": false
    }
  }
}
```

**After**:

```json
{
  \"layerId\": \"stars-background\",
  \"imageId\": \"STARBG\",
  \"renderer\": \"2D\",
  \"order\": 50,
  \"groups\": {
    \"Basic Config\": {
      \"scale\": [100, 100],
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicAngleImage\": 0
    },
    \"Spin Config\": {
      \"spinStagePoint\": [1024, 1024],
      \"spinImagePoint\": [50, 50],
      \"spinSpeed\": 0,
      \"spinDirection\": \"cw\"
    },
    \"Orbital Config\": {
      \"orbitCenter\": [1024, 1024],
      \"orbitImagePoint\": [50, 50],
      \"orbitRadius\": 0,
      \"orbitSpeed\": 0,
      \"orbitDirection\": \"cw\"
    },
    \"Image Mapping Debug\": {
      \"showCenter\": false,
      \"showTip\": false,
      \"showBase\": false,
      \"showStageCenter\": false,
      \"showAxisLine\": false,
      \"showRotation\": false,
      \"showTipRay\": false,
      \"showBaseRay\": false,
      \"showBoundingBox\": false
    }
  }
}
```

Repeat for all other entries in the file.

---

## Step 6: Verification & Testing

### 6.1: Type Checking

```bash
cd /app
npx tsc --noEmit
```

Expected: No type errors

### 6.2: Visual Testing

1. Load the application
2. Verify all layers render correctly
3. Check that images appear in correct positions
4. Verify rotations are correct (should be 0° by default)
5. Test debug visualization (if enabled)

### 6.3: Console Log Verification

Check browser console for:

```
[LayerCore] Loaded layer \"stars-background\":
  imageId: STARBG
  renderer: 2D
  order: 50
  position: {...}
  scale: {...}
  rotation: 0
```

All layers should load without errors.

---

## Step 7: Update Documentation Comments (Optional)

### File: `/app/shared/config/Config.ts`

Add comments to clarify the new structure:

```typescript
/**
 * Configuration entry from JSON file with new structure.
 *
 * Structure:
 * - Top level: Layer identity (what is this layer?)
 *   - layerId: Unique identifier
 *   - imageId: Which image asset to use
 *   - renderer: How to render (2D or 3D)
 *   - order: Rendering order / z-index
 *
 * - Groups: Layer configuration (how should it behave?)
 *   - Basic Config: Position, scale, rotation
 *   - Spin Config: Rotation animation
 *   - Orbital Config: Orbital motion
 *   - Image Mapping Debug: Debug visualization
 */
type ConfigYuzhaEntry = {
  // ... type definition
};
```

---

## Complete File Changes Summary

### Files to Modify:

1. **`/app/shared/config/Config.ts`**
   - Update `ConfigYuzhaEntry` type (lines 80-129)
   - Update `transformConfig` function (lines 134-146)
   - Add documentation comments (optional)

2. **`/app/shared/config/ConfigYuzha.json`**
   - Migrate all ~11 entries
   - Move imageId, renderer, order to top level
   - Remove imageTip, imageBase from configs
   - Add BasicAngleImage: 0 explicitly

3. **`/app/scripts/migrate-config.mjs`** (NEW - Optional)
   - Create migration script for automated conversion

### Files NOT Modified:

- ✅ `/app/shared/layer/LayerCore.ts` - No changes needed
- ✅ `/app/shared/layer/LayerEngineCanvas.ts` - No changes needed
- ✅ `/app/shared/layer/LayerEngineThree.ts` - No changes needed
- ✅ `/app/shared/layer/LayerCorePipelineImageMapping.ts` - No changes needed

The transform function handles the conversion, so rendering code remains unchanged!

---

## Implementation Checklist

Use this checklist during implementation:

### Phase 1: Type Updates

- [ ] Update `ConfigYuzhaEntry` type in Config.ts
- [ ] Update `transformConfig` function in Config.ts
- [ ] Run `npx tsc --noEmit` to check for type errors
- [ ] Fix any type errors

### Phase 2: Config Migration

- [ ] **Option A**: Create and run migration script
  - [ ] Create `/app/scripts/migrate-config.mjs`
  - [ ] Run script: `node /app/scripts/migrate-config.mjs`
  - [ ] Review generated ConfigYuzha.json
- [ ] **Option B**: Manual migration
  - [ ] Migrate entry 1
  - [ ] Migrate entry 2
  - [ ] ... (continue for all entries)
  - [ ] Review all entries

### Phase 3: Testing

- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Load application in browser
- [ ] Check console for errors
- [ ] Verify all layers render correctly
- [ ] Check layer positions
- [ ] Check layer rotations (should be 0° default)
- [ ] Test debug visualization (if enabled)

### Phase 4: Documentation (Optional)

- [ ] Add comments to Config.ts
- [ ] Update README if applicable
- [ ] Document new structure for team

### Phase 5: Cleanup

- [ ] Remove migration script if no longer needed
- [ ] Commit changes
- [ ] Tag version if using git

---

## Rollback Plan

If something goes wrong, you can rollback:

### Backup Before Migration

```bash
cp /app/shared/config/ConfigYuzha.json /app/shared/config/ConfigYuzha.json.backup
cp /app/shared/config/Config.ts /app/shared/config/Config.ts.backup
```

### Restore if Needed

```bash
cp /app/shared/config/ConfigYuzha.json.backup /app/shared/config/ConfigYuzha.json
cp /app/shared/config/Config.ts.backup /app/shared/config/Config.ts
```

---

## Estimated Time

- **Type updates**: 10 minutes
- **Config migration** (script): 15 minutes
- **Config migration** (manual): 30-45 minutes
- **Testing**: 15 minutes
- **Documentation**: 10 minutes (optional)

**Total**: 50-90 minutes

---

## Risk Assessment

| Risk                 | Likelihood | Impact | Mitigation                   |
| -------------------- | ---------- | ------ | ---------------------------- |
| Type errors          | Low        | Medium | TypeScript catches them      |
| Config syntax errors | Medium     | High   | Test incrementally           |
| Breaking rendering   | Low        | High   | Keep backup, test thoroughly |
| Missing properties   | Low        | Medium | TypeScript catches them      |

---

## Success Criteria

✅ All TypeScript checks pass
✅ All layers load without errors
✅ All layers render in correct positions
✅ All layers have correct rotation (0° by default)
✅ Debug visualization works (if enabled)
✅ No console errors
✅ Config structure is cleaner and more readable

---

## Next Steps After Implementation

1. ✅ Test in development
2. ✅ Review with team
3. ✅ Update documentation
4. ✅ Deploy to production
5. ✅ Monitor for issues
6. ✅ Consider adding config validation

---

## Questions?

If you encounter any issues during implementation:

1. Check TypeScript errors first
2. Verify JSON syntax in ConfigYuzha.json
3. Check console for runtime errors
4. Review transform function logic
5. Test with a single layer first before migrating all

---

## Conclusion

This implementation plan provides:

- ✅ Complete code changes
- ✅ Step-by-step instructions
- ✅ Migration script option
- ✅ Testing procedures
- ✅ Rollback plan
- ✅ Time estimates
- ✅ Success criteria

Follow the phases in order, and you'll have a cleaner, more maintainable configuration structure!
"
