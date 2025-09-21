# Developer Quick Start Guide
## 🚀 Get Up and Running in 10 Minutes

### 🎯 What This System Does

This is a **Two-Tier Graphics System** for web applications:
- **Layer System**: Pure animation logic (JSON → animated data)
- **Stages System**: Three.js 3D rendering (data → WebGL canvas)

**Result**: Smooth, performant web animations with behaviors like spin, orbit, pulse, and fade.

### ⚡ Quick Setup

```bash
# Install dependencies (already done)
npm install three @types/three

# Run type checking
npm run typecheck:shared

# All systems operational ✅
```

### 🏗️ Basic Usage

#### **1. Simple Animation (5 lines)**
```typescript
import { produceLayers } from './shared/layer/LayerProducer';

// Define what to animate
const config = {
  layers: [{
    layerId: "logo",
    imagePath: "/logo.png",
    position: { x: 0, y: 0 },
    behaviors: { spin: { enabled: true, rpm: 30 } }
  }]
};

// Process animation at current time
const result = produceLayers(config, {
  time: Date.now() / 1000,
  stage: { width: 1920, height: 1080, origin: "center" },
  registry: new Map()
});

// result.layers contains animated data ready for rendering
```

#### **2. Full Rendering (10 lines)**
```typescript
import { StagesRenderer } from './shared/stages/StagesRenderer';
import { StagesLogic } from './shared/stages/StagesLogic';

// Setup renderer
const logic = new StagesLogic();
const renderer = new StagesRenderer(logic);
const canvas = await renderer.initialize({ dpr: 2, antialias: true });
document.body.appendChild(canvas);

// Convert and render
const stageObject = {
  id: "logo",
  position: [0, 0, 0],
  rotation: result.layers[0].transform.angle,
  metadata: { type: "sprite", texture: "/logo.png" }
};

renderer.setRenderObject(stageObject);
renderer.start(); // Begin render loop
```

### 🎮 Animation Behaviors

| Behavior | Effect | Config |
|----------|--------|--------|
| **Spin** | Rotation | `{ enabled: true, rpm: 30, direction: "cw" }` |
| **Orbit** | Circular motion | `{ enabled: true, rpm: 10, radius: 100 }` |
| **Pulse** | Scale breathing | `{ enabled: true, amplitude: 0.2, rpm: 15 }` |
| **Fade** | Opacity oscillation | `{ enabled: true, from: 0.2, to: 1.0, rpm: 5 }` |

### 🎨 Object Types

| Type | Use Case | Metadata |
|------|----------|----------|
| **sprite** | Images/textures | `{ texture: "/path.png", width: 100, height: 100 }` |
| **circle** | Round shapes | `{ radius: 50, color: 0xff0000 }` |
| **rectangle** | Rectangles | `{ width: 100, height: 50, color: 0x00ff00 }` |
| **particle** | Particle effects | `{ count: 100, radius: 50 }` |
| **text** | Text display | `{ text: "Hello", width: 200, height: 50 }` |

### 🔧 Common Tasks

#### **Add New Animation Behavior**
```typescript
// 1. Create LayerLogicWobble.ts
export function applyWobble(
  prev: { position: Vec2 },
  cfg: WobbleConfig,
  timeSeconds: number
): { position: Vec2 } {
  if (!cfg.enabled) return prev;
  
  const wobble = {
    x: Math.sin(timeSeconds * cfg.frequency) * cfg.amplitude,
    y: Math.cos(timeSeconds * cfg.frequency) * cfg.amplitude
  };
  
  return {
    position: {
      x: prev.position.x + wobble.x,
      y: prev.position.y + wobble.y
    }
  };
}

// 2. Add to LayerTypes.ts
interface WobbleConfig {
  enabled: boolean;
  amplitude: number;
  frequency: number;
}

// 3. Integrate in LayerProducer.ts (see existing patterns)
```

#### **Add New Object Type**
```typescript
// In StagesRendererMesh.ts, add to createFromObject():
case "star":
  return this.createStar(object);

// Implement the method:
private createStar(object: StageObject): THREE.Mesh {
  const { metadata } = object;
  const radius = metadata?.radius || 50;
  const points = metadata?.points || 5;
  
  // Create star geometry (implementation details)
  const geometry = new THREE.RingGeometry(radius * 0.5, radius, points * 2);
  const material = new THREE.MeshLambertMaterial({
    color: metadata?.color || 0xffff00
  });
  
  return new THREE.Mesh(geometry, material);
}
```

### 📁 File Structure (What to Modify)

```
shared/
├── layer/                    # Animation Logic
│   ├── LayerTypes.ts        # ⚠️ Add types carefully
│   ├── LayerValidator.ts    # ⚠️ Maintain compatibility  
│   ├── LayerProducer.ts     # ⚠️ Core pipeline
│   ├── LayerLogic*.ts       # ✅ Add new behaviors here
│   └── LayerConverter.ts    # ✅ UI utilities
├── stages/                   # 3D Rendering
│   ├── StagesRenderer.ts    # ❌ STABLE - don't modify
│   ├── StagesRendererMesh.ts    # ✅ Add object types here
│   ├── StagesRendererMaterial.ts # ✅ Add materials here
│   └── StagesLogic*.ts      # ✅ Enhance logic modules
└── INTEGRATION_GUIDE.md     # 📖 Complete examples
```

### 🧪 Testing Your Changes

```typescript
// Test animation behavior
describe('WobbleLogic', () => {
  it('should wobble position correctly', () => {
    const result = applyWobble(
      { position: { x: 0, y: 0 } },
      { enabled: true, amplitude: 10, frequency: 2 },
      0.25 // quarter second
    );
    expect(result.position.x).toBeCloseTo(7.07); // sin(π/2) * 10
  });
});

// Test object creation
describe('StarMesh', () => {
  it('should create star mesh', () => {
    const mesh = meshFactory.createFromObject({
      id: "test",
      metadata: { type: "star", points: 5, radius: 50 }
    });
    expect(mesh).toBeInstanceOf(THREE.Mesh);
  });
});
```

### ⚡ Performance Tips

- **Layer System**: Use early returns, avoid allocations in hot paths
- **Stages System**: Dispose Three.js resources, cache materials
- **Integration**: Batch updates, skip invisible objects

```typescript
// Good: Early return
if (!config.enabled) return prev;

// Good: Resource disposal
renderer.dispose(); // Cleans up everything

// Good: Batched updates
objects.forEach(obj => renderer.setRenderObject(obj));
```

### 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **TypeScript errors** | Check imports: `import type` for types only |
| **Objects not rendering** | Verify object visibility and position |
| **Poor performance** | Check object count, dispose unused resources |
| **Animation not smooth** | Ensure consistent time parameter |

### 📖 Full Documentation

For complete details, see:
- **[Architecture Overview](../GRAPHICS_SYSTEM_DOCUMENTATION.md)** - System design
- **[Layer System](./layer/README.md)** - Animation logic details  
- **[Stages System](./stages/README.md)** - Rendering details
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Complete examples

### 🎯 Success Checklist

✅ Code passes `npm run typecheck:shared`  
✅ Code passes `npx eslint "shared/**/*.ts"`  
✅ Code passes `npx prettier --check "shared/**/*.ts"`  
✅ New features have tests  
✅ Performance remains acceptable (>30fps)  
✅ Documentation updated for new features  

---

You're ready to build amazing web graphics! 🎨✨

**Quick Start Completed** ✅  
**Next**: Read the specific system docs for the area you're working on.