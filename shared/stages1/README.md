# Fixed Canvas System

A WebGL-focused 2048×2048 fixed canvas system with responsive scaling for consistent cross-device experiences.

## Overview

The Fixed Canvas System provides a stable 2048×2048 coordinate space that scales intelligently to any viewport size while maintaining visual consistency and design integrity. This version is optimized for WebGL rendering.

## Key Features

- **Fixed Coordinate System**: Always 2048×2048 regardless of device
- **Responsive Scaling**: "Cover" behavior fills viewport while maintaining aspect ratio
- **WebGL Focused**: Optimized for WebGL rendering contexts
- **Coordinate Transformation**: Automatic viewport-to-canvas coordinate conversion
- **Touch/Mouse Support**: Event handling with coordinate transformation
- **Debug Utilities**: Visual debugging and transform information

## Quick Start

### Basic Canvas Setup

```typescript
import { FixedCanvasManager } from './Canvas'

const manager = new FixedCanvasManager({
  debug: true,
  backgroundColor: '#000000'
})

const { canvas, overlay } = manager.initialize(document.getElementById('root'))

// Canvas is ready - use with WebGL
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
// ... your WebGL rendering code
```

### With WebGL Adapter

```typescript
import { CanvasAdapterManager, WebGLAdapter } from './index'

const manager = new CanvasAdapterManager({
  renderer: 'webgl',
  debug: true,
  autoFallback: true
})

const { renderer: gl, context } = await manager.mount(document.getElementById('root'))

// WebGL context is ready with 2048×2048 viewport
gl.viewport(0, 0, 2048, 2048)
// ... your WebGL rendering code
```

## Core Concepts

### Coordinate System

- **Canvas Space**: Always 2048×2048 pixels
- **Viewport Space**: Actual screen/window dimensions

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

### WebGL Integration

```typescript
import { FixedCanvasManager, CANVAS_WIDTH, CANVAS_HEIGHT } from './Canvas'

const manager = new FixedCanvasManager()
const { canvas } = manager.initialize(document.getElementById('root'))

const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
// ... WebGL setup
```

### Coordinate Functions

- `calculateCanvasTransform(width, height)` - Calculate scaling transform
- `transformCoordinatesToCanvas(x, y, transform)` - Convert coordinates
- `isWithinCanvas(x, y)` - Check if coordinates are in bounds

## Benefits

- **Consistent Design**: Same visual appearance across all devices
- **Simplified Development**: No responsive calculations needed
- **Performance**: Fixed coordinate system is optimized for WebGL
- **Cross-Platform**: Identical behavior everywhere
- **WebGL Optimized**: Tailored for modern graphics applications

## File Structure

```
stages1/
├── Canvas.ts                    # Core canvas system (2048×2048)
├── CanvasAdapter.ts             # Stable parent: Manager + Base adapter (consolidated)
├── CanvasAdapterRegister.ts     # Adapter registration utilities
├── AdapterWebGL.ts              # Dynamic child: WebGL implementation
├── index.ts                     # Public exports
└── README.md                    # This file
```

## Architecture Design

### **Stable Parent Components** (CanvasAdapter.ts)
- **CanvasAdapterManager**: Main orchestrator and controller
- **BaseAdapter**: Abstract interface for all adapters
- **Type definitions**: Interfaces and contracts

These are consolidated in one file because they're stable and work together.

### **Dynamic Child Components** (Separate files)
- **AdapterWebGL.ts**: WebGL-specific implementation
- **Future adapters**: Can be added without touching parent components

This separation ensures updates only touch child adapters, never the stable parent system.

## Migration from Multi-Renderer Version

If you were using the previous multi-renderer version:

1. Replace imports from `adapters/` to root level
2. Only WebGL adapter is available now
3. Update renderer type to 'webgl'
4. Remove references to other renderer types

The system handles all scaling and coordinate transformation automatically with WebGL focus.