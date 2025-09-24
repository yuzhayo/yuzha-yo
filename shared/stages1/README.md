# Fixed Canvas + Adapter System

This package provides a 2048x2048 fixed-design canvas plus an adapter layer so different renderers can share the same surface.

## Bundled adapters

| Adapter | Description |
| --- | --- |
| `webgl` | Hands you the raw WebGL/WebGL2 context for custom pipelines. |
| `three` | Wraps `THREE.WebGLRenderer` while the canvas manager handles scaling. |

Register custom adapters with `CanvasAdapterManager.registerAdapter(name, AdapterClass)`.

```ts
import { createCanvasAdapter, registerDefaultAdapters } from '@shared/stages1'

registerDefaultAdapters()

const { renderer } = await createCanvasAdapter(rootElement, {
  renderer: 'three',
  autoFallback: true,
  fallbackOrder: ['webgl'],
})

// renderer is a THREE.WebGLRenderer when using the three adapter
```

The canvas always stays 2048x2048; the manager applies a "cover" transform so your rendering logic can rely on stable coordinates.
