# Simplified Layer System - Implementation Plan

## Overview

This document outlines the plan for creating a simplified layer rendering system that replaces the complex grouped configuration approach with a clean, minimal system focused on essential functionality: **image display, scale adjustment, and layer ordering**.

## Current vs New System

### Current System (Complex)

- **Config**: `ConfigYuzha.json` with grouped settings (Basic, Spin, Orbital, Debug)
- **Logic**: Spread across multiple files (`LayerCore.ts`, `LayerCorePipeline.ts`, processors)
- **Processing**: Complex pipeline with spin, orbital, and debug processors
- **Complexity**: ~2000+ lines of code across many files

### New System (Simplified)

- **Config**: `config/Config.json` with 4 essential fields only
- **Logic**: Single file `shared/logic/core.ts` with 4 standalone functions
- **Processing**: Direct render - no processors, no pipelines
- **Complexity**: ~200-300 lines total

## 1. New Configuration Structure

### File: `config/Config.json`

```json
[
  {
    "layerID": "background-stars",
    "layerOrder": 10,
    "imageID": "STARBG",
    "imageScale": 100
  },
  {
    "layerID": "clock-background",
    "layerOrder": 20,
    "imageID": "CLOCKBG",
    "imageScale": 100
  }
]
```

### Field Definitions

- **`layerID`** (string): Unique identifier for the layer
- **`layerOrder`** (number): Render order (lower = rendered first/behind, higher = rendered last/on top)
- **`imageID`** (string): Reference to image in `ImageRegistry.json`
- **`imageScale`** (number): Scale percentage (100 = normal size, 200 = 2x, 50 = half size)

### Capabilities

✅ Select and display images using imageID  
✅ Adjust layer scale (zoom in/out)  
✅ Control layer ordering (which layers appear on top)  
❌ No animations (spin, orbital)  
❌ No debug visualizations  
❌ No complex transformations

## 2. Core Logic Functions

### File: `shared/logic/core.ts`

This file contains **4 standalone functions** - completely independent from the `shared/layer/` codebase:

#### Function 1: `loadConfig()`

```typescript
function loadConfig(): LayerConfig[];
```

**Purpose**: Load and parse the simplified config JSON  
**Returns**: Array of layer configuration objects  
**Logic**: Read `config/Config.json`, validate basic fields, sort by layerOrder

#### Function 2: `resolveAsset(imageID: string)`

```typescript
function resolveAsset(imageID: string): { path: string; url: string } | null;
```

**Purpose**: Convert imageID to actual image file path and URL  
**Logic**:

- Look up imageID in `ImageRegistry.json`
- Return both relative path and absolute URL
- Return null if not found

#### Function 3: `calculateTransform(config: LayerConfig)`

```typescript
function calculateTransform(config: LayerConfig): Transform;
```

**Purpose**: Calculate position and scale for rendering  
**Logic**:

- Convert imageScale (percentage) to actual scale factor (100 → 1.0, 200 → 2.0)
- Default position: center of 2048x2048 stage (1024, 1024)
- Return: `{ position: {x, y}, scale: {x, y} }`

#### Function 4: `prepareLayerData(config: LayerConfig)`

```typescript
function prepareLayerData(config: LayerConfig): LayerData | null;
```

**Purpose**: Combine everything into ready-to-render data  
**Logic**:

- Call `resolveAsset()` to get image
- Call `calculateTransform()` to get position/scale
- Load image dimensions
- Return complete layer data object:
  ```typescript
  {
    layerID: string,
    imageUrl: string,
    position: {x, y},
    scale: {x, y},
    order: number,
    dimensions: {width, height}
  }
  ```

### Type Definitions

```typescript
type LayerConfig = {
  layerID: string;
  layerOrder: number;
  imageID: string;
  imageScale: number;
};

type LayerData = {
  layerID: string;
  imageUrl: string;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  order: number;
  dimensions: { width: number; height: number };
};

type Transform = {
  position: { x: number; y: number };
  scale: { x: number; y: number };
};
```

## 3. Integration with Renderers

### Current Flow (Complex)

```
MainScreen
  → StageDOM/Canvas/Three
  → createStagePipeline()
  → ProcessorRegistry
  → runPipeline()
  → LayerEngines
```

### New Flow (Simplified)

```
MainScreen
  → StageDOM/Canvas/Three
  → loadConfig()
  → prepareLayerData()
  → Direct render
```

### Steps to Replace Layer Codebase

#### Step 1: Update Imports in Stage Files

Replace:

```typescript
import { createStagePipeline } from "../layer/pipeline/StagePipeline";
import { mountDomLayers } from "../layer/LayerEngines";
```

With:

```typescript
import { loadConfig, prepareLayerData } from "../logic/core";
```

#### Step 2: Simplify Rendering Logic

Replace pipeline creation:

```typescript
// OLD
const pipeline = await createStagePipeline();
const layers = toRendererInput(pipeline);
```

With direct data preparation:

```typescript
// NEW
const configs = loadConfig();
const layers = configs
  .map(prepareLayerData)
  .filter((layer) => layer !== null)
  .sort((a, b) => a.order - b.order);
```

#### Step 3: Update Render Functions

Simplified render - no processors, just position and scale:

**DOM Renderer:**

```typescript
function renderDomLayer(layer: LayerData, container: HTMLElement) {
  const img = document.createElement("img");
  img.src = layer.imageUrl;
  img.style.position = "absolute";
  img.style.left = `${layer.position.x - (layer.dimensions.width * layer.scale.x) / 2}px`;
  img.style.top = `${layer.position.y - (layer.dimensions.height * layer.scale.y) / 2}px`;
  img.style.transform = `scale(${layer.scale.x}, ${layer.scale.y})`;
  container.appendChild(img);
}
```

**Canvas Renderer:**

```typescript
function renderCanvasLayer(layer: LayerData, ctx: CanvasRenderingContext2D) {
  const img = new Image();
  img.src = layer.imageUrl;
  img.onload = () => {
    ctx.save();
    ctx.translate(layer.position.x, layer.position.y);
    ctx.scale(layer.scale.x, layer.scale.y);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };
}
```

**Three.js Renderer:**

```typescript
function renderThreeLayer(layer: LayerData, scene: THREE.Scene) {
  const texture = new THREE.TextureLoader().load(layer.imageUrl);
  const geometry = new THREE.PlaneGeometry(
    layer.dimensions.width * layer.scale.x,
    layer.dimensions.height * layer.scale.y,
  );
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(layer.position.x, layer.position.y, layer.order);
  scene.add(mesh);
}
```

## 4. Migration Checklist

### Files to Create

- [ ] `config/Config.json` - Extract data from ConfigYuzha.json
- [ ] `shared/logic/core.ts` - Implement 4 functions
- [ ] `shared/logic/log.md` - This documentation (✓)

### Files to Modify

- [ ] `shared/stage/StageDOM.tsx` - Update to use new core.ts
- [ ] `shared/stage/StageCanvas.tsx` - Update to use new core.ts
- [ ] `shared/stage/StageThree.tsx` - Update to use new core.ts

### Files to Keep (Optional)

The old `shared/layer/` folder can be kept for reference but won't be used by the new system.

### Testing

1. Load config → verify all layers are loaded
2. Display images → verify correct images appear
3. Adjust scale → verify zoom works
4. Change order → verify layering is correct

## 5. Benefits of New System

### For Users

- **Simple Config**: Easy to understand and edit
- **Fast**: No complex processing overhead
- **Predictable**: What you configure is what you see

### For AI Agents

- **Clear Logic**: 4 functions, easy to trace
- **No Dependencies**: Self-contained system
- **Easy to Modify**: Change one function without breaking others

### For Developers

- **Maintainable**: ~200 lines vs ~2000+ lines
- **Debuggable**: Simple flow, easy to troubleshoot
- **Extensible**: Add new fields to config as needed

## 6. Future Enhancements (Optional)

If needed later, can add to config:

- `position`: Custom x,y position
- `rotation`: Rotation angle
- `opacity`: Transparency level
- `visible`: Show/hide toggle

But keep it simple for now - **image display, scale, and order only**.

---

## Summary

This simplified system provides exactly what's needed:

1. ✅ Select images using imageID
2. ✅ Adjust scale
3. ✅ Control layer order

No animations, no processors, no complexity - just clean, direct rendering.

**Next Step**: Implement `shared/logic/core.ts` with the 4 functions described above.
