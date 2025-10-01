# 🔗 Stage Transform System - File Relationships & Dependencies

## 📊 Architecture Overview

```
App.tsx
  └── LauncherScreen.tsx
      ├── LogicStage.tsx (Pixi Renderer)
      │   ├── stage-pixi-adapter.ts
      │   │   └── stage-transform.ts ⭐ CORE SYSTEM
      │   └── logicLoader.ts
      │       ├── LogicLoaderBasic.ts
      │       ├── LogicLoaderSpin.ts
      │       ├── LogicLoaderOrbit.ts
      │       ├── LogicLoaderClock.ts
      │       ├── LogicLoaderEffects.ts
      │       └── LogicLoaderEffectsAdvanced.ts
      └── LogicStageDom.tsx (DOM Fallback)
```

## 🎯 Core Transform Chain

### 1. **stage-transform.ts** (Foundation)

```typescript
// The mathematical core
export const STAGE_WIDTH = 1024
export const STAGE_HEIGHT = 1024
export function calculateStageTransform()
export function transformCoordinatesToStage()
export class StageTransformManager
```

**Used by:**

- `stage-pixi-adapter.ts` - Integrates with Pixi.js
- `stage-gesture-adapter.ts` - Handles touch/mouse events
- `LogicLoaderBasic.ts` - Applies basic positioning

### 2. **stage-pixi-adapter.ts** (Pixi Integration)

```typescript
export class PixiStageAdapter {
  private transformManager: StageTransformManager;
  async mount(rootElement: HTMLElement);
  transformEventCoordinates(event);
}
```

**Uses:**

- `stage-transform.ts` - Core transform calculations
- Pixi.js Application API

**Used by:**

- `LogicStage.tsx` - Main stage component

### 3. **LogicStage.tsx** (React Component)

```typescript
export default function LogicStage() {
  // Creates PixiStageAdapter
  // Loads scene configuration
  // Mounts Pixi application
}
```

**Uses:**

- `stage-pixi-adapter.ts` - Pixi integration
- `logicLoader.ts` - Scene building
- `LogicConfig.ts` - Configuration

**Used by:**

- `LauncherScreen.tsx` - Main screen

## 🎮 Logic Processing Chain

### 4. **logicLoader.ts** (Scene Builder)

```typescript
export async function buildSceneFromLogic(app, cfg) {
  // Loads assets
  // Creates sprites
  // Applies transforms through processor chain
}
```

**Uses:**

- `LogicLoaderBasic.ts` - Basic transforms
- `LogicLoaderSpin.ts` - Rotation
- `LogicLoaderOrbit.ts` - Orbital motion
- `LogicLoaderClock.ts` - Time-based
- `LogicLoaderEffects.ts` - Visual effects

### 5. **LogicLoaderBasic.ts** (Basic Transforms)

```typescript
export function logicApplyBasicTransform(app, sprite, cfg) {
  // Converts percentage to pixels using STAGE_WIDTH/HEIGHT
  // Applies position, scale, rotation
}
```

**Uses:**

- `stage-transform.ts` - STAGE_WIDTH, STAGE_HEIGHT constants
- `LogicMath.ts` - Math utilities

**Used by:**

- `logicLoader.ts` - In processing chain
- All other logic loaders for base transforms

## 🎨 Configuration & Assets

### 6. **LogicConfig.json** (Data)

```json
{
  "layersID": ["L10", "L11", ...],
  "imageRegistry": { "a": "/src/Asset/SAMPLE.png" },
  "layers": [
    {
      "id": "L10",
      "position": { "xPct": 50, "yPct": 50 },
      "scale": { "pct": 28 }
    }
  ]
}
```

**Used by:**

- `LogicConfig.ts` - Configuration loader
- `logicLoader.ts` - Scene building

### 7. **sceneTypes.ts** (Type Definitions)

```typescript
export type LayerConfig = {
  position: { xPct: number; yPct: number };
  scale?: { pct?: number };
  // ... all layer properties
};
```

**Used by:**

- All logic loader files
- Configuration system
- Type checking throughout

## 🖱️ Gesture & UI Integration

### 8. **LauncherBtnGesture.tsx** (Gesture Hook)

```typescript
export function useLauncherBtnGesture() {
  // Uses stage coordinate transformation
  // Handles touch/mouse events
}
```

**Uses:**

- Stage coordinate transformation (implicitly)
- React event handling

**Used by:**

- `LauncherScreen.tsx` - Main interaction

### 9. **stage-gesture-adapter.ts** (Gesture Utils)

```typescript
export function createCoordinateTransformer(manager) {
  // Transforms React events to stage coordinates
}
```

**Uses:**

- `stage-transform.ts` - Coordinate transformation
- React event types

## 🎛️ Support Systems

### 10. **LogicCapability.ts** (Hardware Detection)

```typescript
export function detectRenderer(mode): "pixi" | "dom";
export function isWebGLAvailable(): boolean;
```

**Used by:**

- `LauncherScreen.tsx` - Renderer selection
- `LogicLoaderEffectsAdvanced.ts` - Feature gating

### 11. **LogicMath.ts** (Math Utilities)

```typescript
export function toRad(deg): number;
export function clamp(n, min, max): number;
export function clampRpm60(v): number;
```

**Used by:**

- All logic loader files
- Transform calculations
- Animation systems

## 📱 CSS Integration

### 12. **stage-cover.css** (Styling)

```css
.stage-cover-root {
  /* Root container */
}
.stage-cover-container {
  /* Stage container */
}
.stage-cover-canvas {
  /* Canvas element */
}
.stage-cover-overlay {
  /* Gesture overlay */
}
```

**Applied by:**

- `stage-transform.ts` - CSS class management
- `stage-pixi-adapter.ts` - DOM structure

## 🔄 Data Flow Summary

```
1. Configuration (LogicConfig.json)
   ↓
2. Scene Building (logicLoader.ts)
   ↓
3. Transform Application (LogicLoaderBasic.ts)
   ↓ (uses stage-transform.ts constants)
4. Pixi Integration (stage-pixi-adapter.ts)
   ↓ (uses stage-transform.ts calculations)
5. React Component (LogicStage.tsx)
   ↓
6. Main Screen (LauncherScreen.tsx)
   ↓
7. User Interaction → Gesture System → Stage Coordinates
```

## 🎯 Key Dependencies

**External Libraries:**

- **Pixi.js**: WebGL rendering, sprite management
- **React**: UI framework, component lifecycle
- **TypeScript**: Type safety, development experience

**Internal Systems:**

- **stage-transform.ts**: Mathematical foundation for everything
- **LogicConfig.json**: Defines what gets rendered
- **CSS classes**: Visual presentation layer

## 💡 Extension Points

**To add new features:**

1. **New Effects**: Add to `LogicLoaderEffects.ts` or create new loader
2. **New Transforms**: Extend `LogicLoaderBasic.ts` or create processor
3. **New Gestures**: Extend gesture system with stage coordinate support
4. **New Renderers**: Implement adapter pattern like `stage-pixi-adapter.ts`

**All extensions automatically inherit:**

- ✅ Responsive scaling behavior
- ✅ Coordinate transformation system
- ✅ Multi-device gesture support
- ✅ Performance optimizations
