# Configuration System Guide

## Overview

The configuration system transforms grouped JSON into a flat structure optimized for runtime. This guide explains the complete flow from `ConfigYuzha.json` to rendered layers.

---

## Configuration Files

### 1. ConfigYuzha.json (Source of Truth)

**Location:** `/app/shared/config/ConfigYuzha.json`

**Purpose:** Human-readable layer configuration with grouped settings

**Structure:**
```json
[
  {
    "layerId": "unique-layer-id",
    "imageId": "ASSET_ID",
    "renderer": "2D" | "3D",
    "order": 100,
    "groups": {
      "Basic Config": { /* positioning & rotation */ },
      "Spin Config": { /* rotation animation */ },
      "Orbital Config": { /* circular motion */ },
      "Image Mapping Debug": { /* visual debugging */ }
    }
  }
]
```

### 2. Config.ts (Transformer)

**Location:** `/app/shared/config/Config.ts`

**Purpose:** Transform grouped JSON → flat LayerConfigEntry with override logic

**Functions:**
- `transformConfig()` - Merge groups, apply overrides
- `loadLayerConfig()` - Load and validate config
- `validateLayerConfig()` - Check for errors

---

## Group Types & Fields

### Group 1: Basic Config (Foundation)

**Purpose:** Static positioning, scaling, and rotation

**Fields:**

```typescript
{
  // Scaling (10-500%, default 100)
  "scale": [100, 100],  // [x%, y%]

  // Positioning (NEW pivot-based system)
  "BasicStagePoint": [1024, 1024],  // Stage pixels (0-2048)
  "BasicImagePoint": [50, 50],      // Image percent (0-100)
  // This places the image point at the stage point

  // Rotation (0-360°, default 0)
  "BasicAngleImage": 0,  // Degrees counter-clockwise

  // Image orientation (advanced)
  "imageTip": 90,   // Angle where "tip" is located (default 90° = top)
  "imageBase": 270  // Angle where "base" is located (default 270° = bottom)
}
```

**Legacy Fields (Deprecated):**
```json
{
  "position": [1024, 1024]  // Old center-based positioning
}
```

**Positioning Logic:**

```typescript
// NEW: Pivot-based (preferred)
BasicStagePoint: [1024, 1024]  // Where to place
BasicImagePoint: [50, 50]       // What to place there

// Example: Place top-left corner of image at stage center
BasicStagePoint: [1024, 1024]
BasicImagePoint: [0, 0]

// Example: Place image center at stage center (default)
BasicStagePoint: [1024, 1024]
BasicImagePoint: [50, 50]
```

---

### Group 2: Spin Config (Rotation Animation)

**Purpose:** Continuous rotation around a pivot point

**Fields:**

```typescript
{
  // Spin pivot (where to spin from)
  "spinStagePoint": [1024, 1024],  // Stage pixels (0-2048)
  "spinImagePoint": [50, 50],      // Image percent (0-100)

  // Animation settings
  "spinSpeed": 10,         // Degrees per second (0 = disabled)
  "spinDirection": "cw"    // "cw" = clockwise, "ccw" = counter-clockwise
}
```

**Activation Logic:**

```typescript
if (spinSpeed > 0) {
  // Spin is ACTIVE - overrides Basic positioning
  merged.BasicStagePoint = spin.spinStagePoint;
  merged.BasicImagePoint = spin.spinImagePoint;
  merged.BasicAngleImage = 0;  // Reset static rotation
}
```

**Example:**

```json
{
  "Spin Config": {
    "spinStagePoint": [1024, 1024],  // Spin around stage center
    "spinImagePoint": [50, 50],      // Using image center as pivot
    "spinSpeed": 30,                  // 30° per second (1 rotation = 12s)
    "spinDirection": "cw"             // Clockwise
  }
}
```

---

### Group 3: Orbital Config (Circular Motion)

**Purpose:** Move layer in circular path around a center point

**Status:** ⚠️ **Processor ready, NOT wired to stages yet**

**Fields:**

```typescript
{
  // Orbit center (center of circular path)
  "orbitCenter": [1024, 1024],     // Stage pixels (0-2048)
  
  // Which image point follows the orbit
  "orbitImagePoint": [50, 50],     // Image percent (0-100)
  
  // Orbit size
  "orbitRadius": 200,               // Pixels (0-2048)
  
  // Animation settings
  "orbitSpeed": 45,                 // Degrees per second
  "orbitDirection": "cw"            // "cw" or "ccw"
}
```

**Planned Override Logic:**

```typescript
if (orbitSpeed > 0) {
  // Orbital is ACTIVE - overrides Spin and Basic
  merged.BasicStagePoint = orbital.orbitCenter;
  merged.BasicImagePoint = orbital.orbitImagePoint;
  merged.spinSpeed = 0;  // Disable spin when orbiting?
}
```

---

### Group 4: Image Mapping Debug (Visual Debugging)

**Purpose:** Visualize positioning calculations

**Fields:**

```typescript
{
  // Toggle markers
  "showCenter": false,       // Image center point (red crosshair)
  "showTip": false,          // Image tip point (green circle)
  "showBase": false,         // Image base point (blue circle)
  "showStageCenter": false,  // Stage center at 1024,1024 (cyan star)
  
  // Toggle lines
  "showAxisLine": false,     // Yellow line from base to tip
  "showRotation": false,     // Rotation indicator arc
  "showTipRay": false,       // Ray from center to tip
  "showBaseRay": false,      // Ray from center to base
  "showBoundingBox": false,  // Image bounding box
  
  // Marker styles
  "centerStyle": "crosshair",  // "dot" | "crosshair"
  "tipStyle": "circle",       // "circle" | "arrow"
  "baseStyle": "circle",      // "circle" | "square"
  "stageCenterStyle": "star",  // "dot" | "crosshair" | "star"
  
  // Custom colors
  "debugColors": {
    "center": "#FF0000",
    "tip": "#00FF00",
    "base": "#0000FF"
  }
}
```

---

## Override Priority System

### Priority Levels (Highest → Lowest)

```
1. Orbital Config    [PLANNED - Not yet implemented]
   ↓ overrides
2. Spin Config       [ACTIVE when spinSpeed > 0]
   ↓ overrides
3. Basic Config      [Always present - foundation]
   ↓ never overrides
4. Debug Config      [Additive only - visual debugging]
```

### transformConfig() Logic

**Location:** `/app/shared/config/Config.ts` lines 135-176

```typescript
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    const merged: Partial<LayerConfigEntry> = {
      layerId: entry.layerId,
      imageId: entry.imageId,
      renderer: entry.renderer,
      order: entry.order,
    };

    const basic = entry.groups["Basic Config"] || {};
    const spin = entry.groups["Spin Config"] || {};
    const orbital = entry.groups["Orbital Config"] || {};
    const debug = entry.groups["Image Mapping Debug"] || {};

    // PHASE 1: Start with Basic Config (foundation)
    Object.assign(merged, basic);

    // PHASE 2: Spin Config overrides when active
    if (spin.spinSpeed && spin.spinSpeed > 0) {
      Object.assign(merged, spin);
      
      // Override positioning: Spin takes control
      if (spin.spinStagePoint) merged.BasicStagePoint = spin.spinStagePoint;
      if (spin.spinImagePoint) merged.BasicImagePoint = spin.spinImagePoint;
      
      // Reset static rotation: Spin controls rotation now
      merged.BasicAngleImage = 0;
    } else {
      // Spin inactive: still copy config for reference
      Object.assign(merged, spin);
    }

    // PHASE 3: Orbital Config (TODO - not yet implemented)
    Object.assign(merged, orbital);

    // PHASE 4: Debug Config (additive, never overrides)
    Object.assign(merged, debug);

    return merged as LayerConfigEntry;
  });
}
```

### Why This Design?

**Cross-Group Dependencies:**
- Spin needs `scale` from Basic (for coordinate transforms)
- Spin needs `imageDimensions` (for percent → pixel conversion)
- Orbital will need `scale` and possibly `spinSpeed`

**Alternative (More Complex):**
```typescript
// ❌ Each processor reads multiple groups
createSpinProcessor({
  spin: groups.spin,
  basic: groups.basic,  // Need this too!
})

// ✅ Current: Single merged config
createSpinProcessor({
  spinSpeed: merged.spinSpeed,
  scale: merged.scale,  // Already resolved
})
```

---

## Configuration Loading

### loadLayerConfig() Function

```typescript
export function loadLayerConfig(): LayerConfig {
  return config;  // Pre-transformed and sorted
}
```

**Process:**

1. **Import JSON:**
   ```typescript
   import rawConfig from "./ConfigYuzha.json";
   ```

2. **Transform:**
   ```typescript
   const transformed = transformConfig(rawConfig as ConfigYuzhaEntry[]);
   ```

3. **Sort by Order:**
   ```typescript
   const sorted = transformed.slice().sort((a, b) => 
     (a.order ?? 0) - (b.order ?? 0)
   );
   ```

4. **Validate (Dev Mode):**
   ```typescript
   const validated = validateConfig(sorted);
   ```

5. **Export:**
   ```typescript
   const config: LayerConfig = validated;
   ```

---

## Validation System

### validateLayerConfig() Function

**Checks:**

```typescript
export function validateLayerConfig(entry: LayerConfigEntry): string[] {
  const errors: string[] = [];

  // Required fields
  if (!entry.layerId) errors.push(`Missing layerId`);
  if (!entry.imageId) errors.push(`Missing imageId`);
  if (!entry.renderer) errors.push(`Missing renderer`);
  if (entry.order === undefined) errors.push(`Missing order`);

  // Scale range (10-500%)
  if (entry.scale) {
    const [sx, sy] = entry.scale;
    if (sx < 10 || sx > 500) errors.push(`Scale X out of range: ${sx}`);
    if (sy < 10 || sy > 500) errors.push(`Scale Y out of range: ${sy}`);
  }

  // Angle range (0-360°)
  if (entry.BasicAngleImage !== undefined) {
    if (entry.BasicAngleImage < 0 || entry.BasicAngleImage > 360) {
      errors.push(`BasicAngleImage out of range: ${entry.BasicAngleImage}`);
    }
  }

  // Speed validation (non-negative)
  if (entry.spinSpeed !== undefined && entry.spinSpeed < 0) {
    errors.push(`Negative spinSpeed: ${entry.spinSpeed}`);
  }
  if (entry.orbitSpeed !== undefined && entry.orbitSpeed < 0) {
    errors.push(`Negative orbitSpeed: ${entry.orbitSpeed}`);
  }

  return errors;
}
```

**Usage:**

```typescript
function validateConfig(config: LayerConfig): LayerConfig {
  if (!import.meta.env.DEV) return config;  // Skip in production

  config.forEach((entry, index) => {
    const errors = validateLayerConfig(entry);
    if (errors.length > 0) {
      console.warn(
        `[Config] Validation errors for layer #${index}:`,
        errors
      );
    }
  });

  return config;
}
```

---

## Adding a New Layer

### Step 1: Prepare Image

```bash
# 1. Add PNG to assets
cp my-image.png /app/shared/Asset/

# 2. Sync registry
npm run sync:image

# 3. Check registry
cat /app/shared/config/ImageRegistry.json
```

### Step 2: Add Config Entry

**Edit:** `/app/shared/config/ConfigYuzha.json`

```json
[
  {
    "layerId": "my-layer",
    "imageId": "my-image",
    "renderer": "2D",
    "order": 100,
    "groups": {
      "Basic Config": {
        "scale": [100, 100],
        "BasicStagePoint": [1024, 1024],
        "BasicImagePoint": [50, 50],
        "BasicAngleImage": 0
      },
      "Spin Config": {
        "spinStagePoint": [1024, 1024],
        "spinImagePoint": [50, 50],
        "spinSpeed": 0,
        "spinDirection": "cw"
      },
      "Orbital Config": {
        "orbitCenter": [1024, 1024],
        "orbitImagePoint": [50, 50],
        "orbitRadius": 0,
        "orbitSpeed": 0,
        "orbitDirection": "cw"
      },
      "Image Mapping Debug": {
        "showCenter": false,
        "showTip": false,
        "showBase": false
      }
    }
  }
]
```

### Step 3: Reload

```bash
# Hot reload should pick up changes automatically
# If not, manually refresh browser
```

---

## Field Reference

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `layerId` | string | ✅ | Unique identifier |
| `imageId` | string | ✅ | Must match ImageRegistry.json |
| `renderer` | "2D" \| "3D" | ✅ | Renderer type (currently only "2D" used) |
| `order` | number | ✅ | Render order (lower = behind, higher = front) |
| `groups` | object | ✅ | Config groups (see above) |

### Scale Field

| Value | Meaning |
|-------|--------|
| `[100, 100]` | Original size (1:1) |
| `[200, 200]` | Double size (2x) |
| `[50, 50]` | Half size (0.5x) |
| `[100, 200]` | Stretched vertically |
| `[10, 10]` | Minimum allowed |
| `[500, 500]` | Maximum allowed |

### Angle Fields

| Value | Direction |
|-------|----------|
| `0°` | Right →  |
| `90°` | Up ↑ |
| `180°` | Left ← |
| `270°` | Down ↓ |
| `45°` | Diagonal ↗ |

### Speed Fields

| spinSpeed | Rotation Time |
|-----------|---------------|
| `360` | 1 second/rotation |
| `180` | 2 seconds/rotation |
| `90` | 4 seconds/rotation |
| `45` | 8 seconds/rotation |
| `30` | 12 seconds/rotation |
| `10` | 36 seconds/rotation |

---

## Common Patterns

### Pattern 1: Static Image (No Animation)

```json
{
  "groups": {
    "Basic Config": {
      "scale": [100, 100],
      "BasicStagePoint": [1024, 1024],
      "BasicImagePoint": [50, 50]
    },
    "Spin Config": {
      "spinSpeed": 0  // Disabled
    }
  }
}
```

### Pattern 2: Spinning Gear (Center Pivot)

```json
{
  "groups": {
    "Basic Config": {
      "scale": [100, 100]
    },
    "Spin Config": {
      "spinStagePoint": [1024, 1024],  // Stage center
      "spinImagePoint": [50, 50],      // Image center
      "spinSpeed": 30,
      "spinDirection": "cw"
    }
  }
}
```

### Pattern 3: Spinning Gear (Off-Center Pivot)

```json
{
  "groups": {
    "Basic Config": {
      "scale": [100, 100]
    },
    "Spin Config": {
      "spinStagePoint": [1024, 1024],  // Spin around stage center
      "spinImagePoint": [25, 50],      // But use left edge as pivot
      "spinSpeed": 20,
      "spinDirection": "ccw"
    }
  }
}
```

### Pattern 4: Tiled Background

```json
[
  {
    "layerId": "bg-top-left",
    "order": 10,
    "groups": {
      "Basic Config": {
        "BasicStagePoint": [0, 0],
        "BasicImagePoint": [50, 50]
      }
    }
  },
  {
    "layerId": "bg-top-right",
    "order": 10,
    "groups": {
      "Basic Config": {
        "BasicStagePoint": [2048, 0],
        "BasicImagePoint": [50, 50]
      }
    }
  }
]
```

---

## Troubleshooting

### Issue: Layer Not Appearing

**Check:**
1. `imageId` matches ImageRegistry.json
2. `order` field is set (not overlapped by other layers)
3. `scale` is not 0
4. `BasicStagePoint` is within bounds (0-2048)

### Issue: Spin Not Working

**Check:**
1. `spinSpeed > 0`
2. `spinStagePoint` and `spinImagePoint` are set
3. Browser console for errors
4. Try switching renderer (DOM → Canvas → Three)

### Issue: Wrong Position

**Enable Debug:**
```json
{
  "Image Mapping Debug": {
    "showCenter": true,
    "showStageCenter": true
  }
}
```

**Visual Check:**
- Red crosshair = image center
- Cyan star = stage center (1024, 1024)
- If misaligned, adjust `BasicStagePoint` or `BasicImagePoint`

---

## Next Steps

- **📐 Coordinates:** Read `02_COORDINATE_SYSTEMS.md`
- **🔄 Spin Animation:** Read `03_SPIN_ANIMATION_DEEP_DIVE.md`
- **🎨 Renderers:** Read `04_RENDERING_ENGINES.md`
- **🐛 Debug Tools:** Read `07_DEBUG_VISUALIZATION.md`

---

**AI Agent Note:** When modifying configs, always validate against field ranges and ensure cross-group dependencies are maintained. The override system is crucial for spin/orbital animations to work correctly.
