# Architecture Flow Analysis

## Current Definition: "Logic Basic Wrap with Logic Spin"

### ✅ YES, This is CORRECT!

---

## Flow Breakdown

### 1️⃣ **Logic Basic** (Foundation Layer)

**Location:** `LayerCore.ts`

**Input:** `LayerConfigEntry` from JSON config

**Process:**

```typescript
prepareLayer(entry, stageSize) → UniversalLayerData
```

**What it does:**

- ✅ Loads image from asset registry
- ✅ Computes `imageMapping` (imageCenter, imageTip, imageBase, displayRotation)
- ✅ Calculates 2D transforms (position, scale)
- ✅ Creates base layer data structure

**Output:** `UniversalLayerData`

```typescript
{
  layerId: string,
  imageUrl: string,
  position: {x, y},
  scale: {x, y},
  imageMapping: ImageMapping,  // Core geometric data
  ...
}
```

---

### 2️⃣ **Logic Spin** (Enhancement Wrapper)

**Location:** `LayerCorePipelineSpin.ts`

**Input:** Spin configuration + UniversalLayerData

**Process:**

```typescript
createSpinProcessor({spinCenter, spinSpeed, spinDirection})
  → LayerProcessor function
  → Processor(UniversalLayerData) → EnhancedLayerData
```

**What it does:**

- ✅ **Wraps** the basic layer data
- ✅ Converts spinCenter from percentage to pixels
- ✅ Calculates time-based `currentRotation`
- ✅ Adds spin-specific properties
- ✅ Sets `hasSpinAnimation` flag

**Output:** `EnhancedLayerData` (extends UniversalLayerData)

```typescript
{
  ...UniversalLayerData,        // All basic properties
  spinCenter: {x, y},           // Added by spin logic
  spinSpeed: number,            // Added by spin logic
  spinDirection: "cw" | "ccw",  // Added by spin logic
  currentRotation: number,      // Added by spin logic
  hasSpinAnimation: boolean     // Added by spin logic
}
```

---

## Visual Flow Diagram

```
┌─────────────────────────────────┐
│  JSON Config                    │
│  - imageId, position, scale     │
│  - imageTip, imageBase          │
│  - spinCenter, spinSpeed        │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│  LOGIC BASIC (LayerCore)        │
│  prepareLayer()                 │
│  - Load image                   │
│  - Compute imageMapping         │
│  - Calculate transforms         │
└───────────────┬─────────────────┘
                ↓
         UniversalLayerData
                ↓
┌─────────────────────────────────┐
│  LOGIC SPIN (Pipeline)          │
│  createSpinProcessor()          │
│  - Wrap basic data              │ ← WRAPPING HAPPENS HERE
│  - Add spin properties          │
│  - Calculate rotation           │
└───────────────┬─────────────────┘
                ↓
         EnhancedLayerData
                ↓
┌─────────────────────────────────┐
│  Rendering Engine               │
│  (Canvas or Three.js)           │
│  - Use enhanced data            │
│  - Render with rotation         │
└─────────────────────────────────┘
```

---

## Code Evidence

### Stage Component (StageCanvas.tsx)

```typescript
// 1. BASIC LOGIC: Prepare base layer
const layer = await prepareLayer(entry, STAGE_SIZE); // UniversalLayerData

// 2. SPIN LOGIC: Wrap with processor
const processors: LayerProcessor[] = [];
if (entry.spinSpeed !== undefined) {
  processors.push(
    createSpinProcessor({
      spinCenter: entry.spinCenter,
      spinSpeed: entry.spinSpeed,
      spinDirection: entry.spinDirection,
    }),
  );
}

// 3. Pass to engine
layersWithProcessors.push({
  data: layer, // Basic data
  processors, // Spin wrapper
});
```

### Rendering Engine (LayerEngineCanvas.ts)

```typescript
// Basic data is wrapped/enhanced by spin processor
const layerData: EnhancedLayerData =
  processors.length > 0
    ? runPipeline(baseData, processors, timestamp) // WRAPPING
    : baseData;

// Use enhanced data
const rotation = layerData.currentRotation; // From spin logic
const pivot = layerData.spinCenter; // From spin logic
```

---

## Why "Wrap" is the Correct Term

### Definition of "Wrap"

To **wrap** means to enclose or surround something while preserving its original form.

### In This Architecture:

✅ **Basic logic remains intact** - UniversalLayerData is not modified

✅ **Spin logic surrounds it** - Processor takes UniversalLayerData as input

✅ **Creates enhanced version** - Returns EnhancedLayerData that includes all basic properties PLUS spin properties

✅ **Non-destructive** - Original data structure preserved, only extended

### Pattern Name: **Decorator Pattern / Pipeline Pattern**

- Basic logic provides the core
- Spin logic decorates/enhances it
- Can chain multiple processors (future: opacity, filters, etc.)

---

## Summary

### ✅ CONFIRMED: "Logic Basic Wrap with Logic Spin"

**Correct Definition:**

```
Basic Logic (Core layer data)
    wrapped by
Spin Logic (Enhancement processor)
    produces
Enhanced Data (Basic + Spin properties)
```

This is a **decorator/pipeline pattern** where:

- **Basic logic** = Foundation (imageMapping, transforms)
- **Spin logic** = Enhancement layer (rotation, pivot)
- **Wrapping** = Non-destructive extension of data

The architecture is correctly defined! 🎯
