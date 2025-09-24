# Canvas Adapter Manager - Usage Examples

## Basic Usage

### Simple Setup with Auto-Registration

```typescript
import { createCanvasAdapter } from '@/stages'

const { manager, adapter, renderer, context } = await createCanvasAdapter(
  document.getElementById('root'),
  {
    renderer: 'pixi',
    autoFallback: true,
    debug: true
  }
)

// Use the renderer
if (adapter.name === 'pixi') {
  const app = renderer as PIXI.Application
  // Add sprites, etc.
}
```

### Manual Manager Setup

```typescript
import { CanvasAdapterManager } from '@/stages'

const manager = new CanvasAdapterManager({
  renderer: 'dom',
  debug: true,
  rendererOptions: {
    enableAcceleration: true
  }
})

const { adapter, renderer } = await manager.mount(document.getElementById('root'))
```

### Dynamic Renderer Switching

```typescript
// Start with Pixi
const manager = new CanvasAdapterManager({ renderer: 'pixi' })
const { adapter } = await manager.mount(rootElement)

// Switch to DOM renderer
const { adapter: newAdapter } = await manager.switchRenderer('dom', {
  enableAcceleration: true
})
```

## Creating Custom Adapters

### 1. Create Your Adapter Class

```typescript
import { BaseAdapter } from '@/stages/adapters/BaseAdapter'
import type { RendererContext } from '@/stages'

class MyCustomAdapter extends BaseAdapter<MyCustomRenderer> {
  readonly name = 'mycustom'

  canRun(): boolean {
    // Check if your renderer can run
    return typeof MyCustomRenderer !== 'undefined'
  }

  async initialize(context: RendererContext): Promise<MyCustomRenderer> {
    this.validateContext(context)
    
    // Initialize your renderer with the canvas
    this.renderer = new MyCustomRenderer(context.canvas, this.options)
    
    this.setInitialized()
    return this.renderer
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.destroy()
      this.renderer = null
    }
    this.isInitialized = false
  }
}
```

### 2. Register Your Adapter

```typescript
import { CanvasAdapterManager } from '@/stages'

// Register your custom adapter
CanvasAdapterManager.registerAdapter('mycustom', MyCustomAdapter)

// Now you can use it
const { renderer } = await createCanvasAdapter(rootElement, {
  renderer: 'mycustom'
})
```

## Built-in Adapters

### Pixi.js Adapter

```typescript
const { renderer } = await createCanvasAdapter(rootElement, {
  renderer: 'pixi',
  rendererOptions: {
    backgroundAlpha: 0,
    antialias: true,
    dprCap: 2
  }
})

// renderer is PIXI.Application
const sprite = new PIXI.Sprite(texture)
renderer.stage.addChild(sprite)
```

### DOM Adapter

```typescript
const { renderer } = await createCanvasAdapter(rootElement, {
  renderer: 'dom',
  rendererOptions: {
    enableAcceleration: true
  }
})

// renderer implements DOMRenderer interface
const element = document.createElement('div')
renderer.addElement('myDiv', element, {
  xPct: 50,
  yPct: 50,
  scale: 1.5,
  rotation: 45
})
```

### Canvas 2D Adapter

```typescript
const { renderer } = await createCanvasAdapter(rootElement, {
  renderer: 'canvas2d',
  rendererOptions: {
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  }
})

// renderer is CanvasRenderingContext2D
renderer.fillStyle = 'red'
renderer.fillRect(100, 100, 200, 200)
```

### WebGL Adapter

```typescript
const { renderer } = await createCanvasAdapter(rootElement, {
  renderer: 'webgl',
  rendererOptions: {
    preferWebGL2: true,
    antialias: true,
    alpha: true
  }
})

// renderer is WebGLRenderingContext or WebGL2RenderingContext
const program = createShaderProgram(renderer, vertexSource, fragmentSource)
```

## Auto-Fallback System

```typescript
const { adapter, renderer } = await createCanvasAdapter(rootElement, {
  renderer: 'pixi',           // Try Pixi first
  autoFallback: true,         // Enable fallback
  fallbackOrder: ['webgl', 'canvas2d', 'dom'], // Fallback order
  debug: true                 // Show which renderer was selected
})

console.log(`Using: ${adapter.name}`) // Shows which renderer was actually used
```

## Event Handling with Coordinate Transformation

```typescript
const { context } = await createCanvasAdapter(rootElement, {
  renderer: 'pixi'
})

context.overlay.addEventListener('pointerdown', (e) => {
  const coords = context.coordinateTransformer.transformPointerEvent(e)
  if (coords && context.coordinateTransformer.isWithinCanvas(coords.canvasX, coords.canvasY)) {
    console.log(`Canvas coordinates: ${coords.canvasX}, ${coords.canvasY}`)
  }
})
```

## Advanced Usage

### Multiple Canvas Instances

```typescript
// Create multiple canvas instances with different renderers
const pixiManager = new CanvasAdapterManager({ renderer: 'pixi' })
const domManager = new CanvasAdapterManager({ renderer: 'dom' })

const pixiResult = await pixiManager.mount(document.getElementById('pixi-root'))
const domResult = await domManager.mount(document.getElementById('dom-root'))
```

### Runtime Renderer Detection

```typescript
import { detectBestRenderer } from '@/stages'

const bestRenderer = detectBestRenderer()
console.log(`Best available renderer: ${bestRenderer}`)

const { adapter } = await createCanvasAdapter(rootElement, {
  renderer: bestRenderer
})
```

### Custom Adapter with Advanced Features

```typescript
class AdvancedAdapter extends BaseAdapter<MyRenderer> {
  readonly name = 'advanced'
  private animationLoop: number = 0

  canRun(): boolean {
    return this.checkHardwareRequirements()
  }

  async initialize(context: RendererContext): Promise<MyRenderer> {
    this.validateContext(context)
    
    // Initialize with hardware detection
    const capabilities = await this.detectCapabilities()
    this.renderer = new MyRenderer(context.canvas, capabilities)
    
    // Start render loop
    this.startRenderLoop()
    
    this.setInitialized()
    return this.renderer
  }

  update(context: RendererContext): void {
    // Handle resize, settings changes, etc.
    this.renderer?.updateViewport(context.getTransform())
  }

  dispose(): void {
    cancelAnimationFrame(this.animationLoop)
    this.renderer?.destroy()
    this.renderer = null
    this.isInitialized = false
  }

  private startRenderLoop(): void {
    const render = () => {
      this.renderer?.render()
      this.animationLoop = requestAnimationFrame(render)
    }
    this.animationLoop = requestAnimationFrame(render)
  }
}
```