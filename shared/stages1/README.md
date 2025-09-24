# Fixed Canvas System

A renderer-agnostic 2048×2048 fixed canvas system with responsive scaling for consistent cross-device experiences.

## Overview

The Fixed Canvas System provides a stable 2048×2048 coordinate space that scales intelligently to any viewport size while maintaining visual consistency and design integrity.

## Key Features

- **Fixed Coordinate System**: Always 2048×2048 regardless of device
- **Responsive Scaling**: "Cover" behavior fills viewport while maintaining aspect ratio
- **Renderer Agnostic**: Works with Pixi.js, DOM, WebGL, Canvas2D, or any rendering system
- **Coordinate Transformation**: Automatic viewport-to-canvas coordinate conversion
- **Touch/Mouse Support**: Event handling with coordinate transformation
- **Debug Utilities**: Visual debugging and transform information

## Quick Start

### Basic Canvas Setup

```typescript
import { FixedCanvasManager } from './FixedCanvas'

const manager = new FixedCanvasManager({
  debug: true,
  backgroundColor: '#000000'
})

const { canvas, overlay } = manager.initialize(document.getElementById('root'))

// Canvas is ready - use with any renderer
const ctx = canvas.getContext('2d')
// ... your rendering code
```

### With Pixi.js

```typescript
import { PixiCanvasAdapter } from './PixiCanvasAdapter'

const adapter = new PixiCanvasAdapter({
  debug: true,
  antialias: true,
  backgroundAlpha: 0
})

const { app, coordinateTransformer } = await adapter.mount(document.getElementById('root'))

// Pixi app is ready with 2048×2048 stage
app.stage.addChild(mySprite)
```

### With DOM Elements

```typescript
import { DOMCanvasAdapter } from './DOMCanvasAdapter'

const adapter = new DOMCanvasAdapter({
  debug: true
})

const { container, coordinateTransformer } = adapter.initialize(document.getElementById('root'))

// Add elements with percentage-based positioning
const element = document.createElement('div')
adapter.addElement('my-element', element, {
  xPct: 50,    // Center horizontally
  yPct: 50,    // Center vertically  
  scale: 1.5,  // 150% size
  rotation: 45 // 45 degrees
})
```

## Core Concepts

### Coordinate System

- **Canvas Space**: Always 2048×2048 pixels
- **Viewport Space**: Actual screen/window dimensions
- **Percentage Space**: 0-100% for positioning (xPct, yPct)

### Scaling Behavior

The system uses "cover" scaling:
- Canvas scales to fill the entire viewport
- Maintains 1:1 aspect ratio
- Crops excess if viewport aspect differs
- Always centered

### Event Handling

```typescript
const coordinateTransformer = createCoordinateTransformer(manager)

overlay.addEventListener('pointerdown', (e) => {
  const coords = coordinateTransformer.transformPointerEvent(e)
  if (coords) {
    console.log(`Canvas coordinates: ${coords.canvasX}, ${coords.canvasY}`)
  }
})
```

## API Reference

### FixedCanvasManager

Main class for managing the fixed canvas system.

#### Constructor Options

```typescript
interface FixedCanvasOptions {
  debug?: boolean              // Show debug overlay
  backgroundColor?: string     // Canvas background color
  containerClassName?: string  // CSS class for container
  canvasClassName?: string     // CSS class for canvas
}
```

#### Methods

- `initialize(rootElement)` - Setup the canvas system
- `getCanvas()` - Get the canvas element
- `getTransform()` - Get current transform data
- `transformEventCoordinates(event)` - Transform event coordinates
- `dispose()` - Clean up resources

### Coordinate Functions

- `calculateCanvasTransform(width, height)` - Calculate scaling transform
- `transformCoordinatesToCanvas(x, y, transform)` - Convert coordinates
- `isWithinCanvas(x, y)` - Check if coordinates are in bounds

## Integration Examples

### With Custom WebGL Renderer

```typescript
import { FixedCanvasManager, CANVAS_WIDTH, CANVAS_HEIGHT } from './FixedCanvas'

const manager = new FixedCanvasManager()
const { canvas } = manager.initialize(document.getElementById('root'))

const gl = canvas.getContext('webgl2')
gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
// ... WebGL setup
```

### With Canvas 2D

```typescript
const { canvas } = manager.initialize(document.getElementById('root'))
const ctx = canvas.getContext('2d')

// Draw at canvas coordinates
ctx.fillRect(100, 100, 200, 200) // Always consistent size
```

### With Three.js

```typescript
import * as THREE from 'three'

const { canvas } = manager.initialize(document.getElementById('root'))

const renderer = new THREE.WebGLRenderer({ 
  canvas: canvas,
  antialias: true
})
renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT, false)
```

## Benefits

- **Consistent Design**: Same visual appearance across all devices
- **Simplified Development**: No responsive calculations needed
- **Performance**: Fixed coordinate system is optimized
- **Cross-Platform**: Identical behavior everywhere
- **Future-Proof**: Works with any rendering technology

## File Structure

```
apps/stages/
├── FixedCanvas.ts       # Core canvas system
├── PixiCanvasAdapter.ts # Pixi.js integration
├── DOMCanvasAdapter.ts  # DOM rendering integration
├── index.ts            # Public exports
└── README.md          # This file
```

## Migration from Existing Code

If you have existing canvas code, the migration is straightforward:

1. Replace canvas creation with `FixedCanvasManager`
2. Update coordinate calculations to use 1024×1024 space
3. Use coordinate transformers for event handling
4. Remove manual scaling/resize logic

The system handles all scaling and coordinate transformation automatically.