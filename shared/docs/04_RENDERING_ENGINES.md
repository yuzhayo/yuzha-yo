# Rendering Engines

## Overview

This system supports **3 different rendering engines** that all share the same layer data and processor pipeline. Each has different trade-offs in performance, compatibility, and features.

---

## Architecture Comparison

```
┌────────────────────────────────────────────────────────┐
│                   SHARED LAYER PIPELINE                      │
│  Config → prepareLayer() → runPipeline() → EnhancedLayerData  │
└────────────────────────┬───────────────────────────────┘
                         │
           ┌────────────┴────────────┐
           │                         │
    ┌──────┼───────┐     ┌──────┼───────┐     ┌──────┼───────┐
    │  DOM Renderer  │     │Canvas Renderer│     │Three Renderer│
    │CSS Transforms│     │  2D Context   │     │    WebGL     │
    └───────────────┘     └───────────────┘     └───────────────┘
```

---

## 1. DOM Renderer

### Technology

- **CSS Transforms** for position, scale, rotation
- **HTML div** containers for each layer
- **img** elements for images
- **Browser compositing** for final output

### Files

- **Stage:** `StageDOM.tsx`
- **Engine:** `LayerEngineDOM.ts`

### How It Works

```typescript
// Create div container per layer
const layerDiv = document.createElement("div");
layerDiv.style.position = "absolute";

// Add image
const img = document.createElement("img");
img.src = layer.imageUrl;
img.style.width = `${naturalWidth}px`;
img.style.height = `${naturalHeight}px`;

// Position via CSS left/top
img.style.left = `${position.x - naturalWidth / 2}px`;
img.style.top = `${position.y - naturalHeight / 2}px`;

// Transform via CSS (scale + rotate)
img.style.transformOrigin = "center center";
img.style.transform = `scale(${scale.x}, ${scale.y}) rotate(${rotation}deg)`;

layerDiv.appendChild(img);
container.appendChild(layerDiv);
```

### Animation Loop

```typescript
const animate = (timestamp: number) => {
  for (const layer of layers) {
    if (layer.hasAnimation) {
      const enhanced = runPipeline(layer.baseData, layer.processors, timestamp);
      
      // Update CSS transform
      const rotation = enhanced.currentRotation ?? enhanced.rotation ?? 0;
      layer.img.style.transform = `scale(${enhanced.scale.x}, ${enhanced.scale.y}) rotate(${rotation}deg)`;
      
      // Update position
      layer.img.style.left = `${enhanced.position.x - naturalWidth / 2}px`;
      layer.img.style.top = `${enhanced.position.y - naturalHeight / 2}px`;
    }
  }
  
  requestAnimationFrame(animate);
};
```

### Pros

✅ **Best Compatibility** - Works everywhere (even IE11 with polyfills)
✅ **Hardware Accelerated** - Browser compositing is GPU-accelerated
✅ **Easy Debugging** - Inspect elements in DevTools
✅ **No Canvas/WebGL** - Works in restricted environments
✅ **CSS Animations** - Can leverage CSS transitions if needed

### Cons

❌ **Layer Limit** - Performance degrades with 100+ layers
❌ **Reflow Risk** - Frequent updates can cause layout recalculation
❌ **No Pixel Control** - Can't manipulate individual pixels
❌ **Debugging Markers** - Harder to render custom debug shapes

### Best For

- **General use** - Default for most scenarios
- **Static scenes** - Minimal animation
- **Mobile web** - Best battery life
- **Accessibility** - Screen readers can access DOM

---

## 2. Canvas Renderer

### Technology

- **Canvas 2D API** for drawing
- **Single canvas** element (2048×2048)
- **Manual pixel rendering** every frame
- **Immediate mode** graphics

### Files

- **Stage:** `StageCanvas.tsx`
- **Engine:** `LayerEngineCanvas.ts`

### How It Works

```typescript
// Setup canvas
const canvas = document.createElement("canvas");
canvas.width = 2048;
canvas.height = 2048;
const ctx = canvas.getContext("2d");

// Animation loop
const renderFrame = (timestamp: number) => {
  // Clear canvas
  ctx.clearRect(0, 0, 2048, 2048);
  
  for (const layer of layers) {
    const enhanced = runPipeline(layer.baseData, layer.processors, timestamp);
    
    // Save context state
    ctx.save();
    
    // Translate to position
    ctx.translate(enhanced.position.x, enhanced.position.y);
    
    // Rotate
    ctx.rotate(enhanced.currentRotation * Math.PI / 180);
    
    // Draw image (centered)
    ctx.drawImage(
      layer.image,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );
    
    // Restore context state
    ctx.restore();
  }
  
  requestAnimationFrame(renderFrame);
};
```

### Optimizations

**1. Split Layers by Rotation:**

```typescript
const noRotationLayers: LayerRenderData[] = [];
const withRotationLayers: LayerRenderData[] = [];

for (const layer of layers) {
  if (layer.transformCache.hasRotation) {
    withRotationLayers.push(layer);
  } else {
    noRotationLayers.push(layer);  // Faster path
  }
}
```

**2. Transform Cache:**

```typescript
const transformCache: TransformCache = {
  scaledWidth: image.width * scale.x,
  scaledHeight: image.height * scale.y,
  centerX: (image.width / 2) * scale.x,
  centerY: (image.height / 2) * scale.y,
  // ... pre-calculated values
};
```

### Pros

✅ **Full Control** - Pixel-level manipulation
✅ **Debug Rendering** - Easy to draw custom shapes/lines
✅ **Consistent Output** - Same result across browsers
✅ **Offscreen Canvas** - Can render to buffer
✅ **AI Agent Friendly** - Works in headless browsers

### Cons

❌ **CPU Intensive** - All rendering on CPU
❌ **No Hardware Acceleration** - (unless using OffscreenCanvas)
❌ **Redraw Everything** - Can't skip unchanged pixels
❌ **Memory Usage** - 2048×2048 = 16MB canvas

### Best For

- **AI Agents** - Headless browser screenshots
- **Debugging** - Need to render visual markers
- **Complex Effects** - Custom pixel manipulation
- **Fallback** - When WebGL unavailable

---

## 3. Three.js Renderer (WebGL)

### Technology

- **Three.js** library (WebGL wrapper)
- **Orthographic camera** (2D projection)
- **Plane meshes** for each layer
- **GPU-accelerated** rendering

### Files

- **Stage:** `StageThree.tsx`
- **Engine:** `LayerEngineThree.ts`

### How It Works

```typescript
// Setup Three.js
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  -2048 / 2, 2048 / 2,  // left, right
  2048 / 2, -2048 / 2,  // top, bottom
  0.1, 2000             // near, far
);
camera.position.z = 1000;

// Load texture
const texture = await textureLoader.loadAsync(layer.imageUrl);
texture.colorSpace = THREE.SRGBColorSpace;

// Create mesh
const geometry = new THREE.PlaneGeometry(scaledWidth, scaledHeight);
const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
const mesh = new THREE.Mesh(geometry, material);

// Create group for rotation
const group = new THREE.Group();
group.position.set(
  position.x - 2048 / 2,
  -(position.y - 2048 / 2),  // Flip Y axis
  0
);
group.add(mesh);
scene.add(group);

// Animation loop
const animate = (timestamp: number) => {
  for (const item of meshData) {
    if (item.hasAnimation) {
      const enhanced = runPipeline(item.baseData, item.processors, timestamp);
      
      // Update position
      item.group.position.set(
        enhanced.position.x - 2048 / 2,
        -(enhanced.position.y - 2048 / 2),
        0
      );
      
      // Update rotation (note: negative for Three.js)
      item.group.rotation.z = -(enhanced.currentRotation * Math.PI / 180);
    }
  }
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
```

### Coordinate System Difference

**Stage Coordinates (Top-Left Origin):**
```
(0, 0) ┌────────────┐
       │            │
       │   (1024,   │
       │    1024)   │
       │      •     │
       └────────────┘
```

**Three.js Coordinates (Center Origin, Y Inverted):**
```
       ┌────────────┐
       │            │
(-1024,│    (0, 0)  │ (1024,
  1024)│      •     │  1024)
       │            │
       └────────────┘
```

**Conversion:**
```typescript
threeX = stageX - 1024;
threeY = -(stageY - 1024);  // Flip Y
```

### Device Capability Detection

**Location:** `DeviceCapability.ts`

```typescript
export function getDeviceCapability(): DeviceCapability {
  const performanceLevel = detectPerformanceLevel();  // low/medium/high
  const isMobile = isMobileDevice();
  const isLowEndDevice = performanceLevel === "low" || 
                         (isMobile && performanceLevel === "medium");

  return {
    performanceLevel,
    isMobile,
    isLowEndDevice,
    pixelRatio: isLowEndDevice ? 1 : Math.min(window.devicePixelRatio, 2),
    enableAntialiasing: !isMobile && performanceLevel === "high",
    maxTextureSize: isLowEndDevice ? 1024 : 2048,
  };
}
```

**Usage:**

```typescript
const deviceCap = getDeviceCapability();

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: deviceCap.enableAntialiasing,        // ← Off on mobile
  powerPreference: deviceCap.isLowEndDevice ? "low-power" : "default"
});
renderer.setPixelRatio(deviceCap.pixelRatio);      // ← 1x on low-end
```

### Pros

✅ **Best Performance** - GPU-accelerated, 1000+ layers
✅ **Smooth Animations** - Hardware compositing
✅ **3D Ready** - Can add 3D effects later
✅ **Efficient Memory** - GPU texture memory
✅ **Built-in Optimizations** - Culling, batching, etc.

### Cons

❌ **WebGL Required** - Doesn't work in some environments
❌ **Larger Bundle** - Three.js adds ~600KB
❌ **Mobile Battery** - More power consumption
❌ **Complexity** - Harder to debug
❌ **Context Loss** - WebGL context can be lost

### Best For

- **Production** - Default choice for complex scenes
- **High Layer Count** - 100+ layers
- **Smooth 60fps** - Demanding animations
- **Desktop Web** - Best performance

---

## Renderer Selection

### Auto-Detection

**Location:** `RendererDetector.ts`

```typescript
export function getRendererType(): "three" | "canvas" {
  const isAIAgent = isAIAgentEnvironment();
  const rendererType = isAIAgent ? "canvas" : "three";
  
  console.log("[RendererDetector] Environment detection:", {
    isAIAgent,
    rendererType,
    userAgent: navigator.userAgent,
    hasWebGL: "WebGLRenderingContext" in window,
  });
  
  return rendererType;
}

function isAIAgentEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  if (!("WebGLRenderingContext" in window)) return true;
  if (navigator.webdriver === true) return true;
  
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("headless") || ua.includes("phantom")) return true;
  
  // Try to create WebGL context
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return true;
  } catch {
    return true;
  }
  
  return false;
}
```

### Manual Override

**UI Control:** `MainScreen.tsx`

```typescript
const [rendererMode, setRendererMode] = useState<RendererMode>("auto");

const activeRenderer: RendererType = 
  rendererMode === "auto" ? autoDetectedRenderer : rendererMode;

// Render appropriate stage
{activeRenderer === "three" ? (
  <StageThree />
) : activeRenderer === "dom" ? (
  <StageDOM />
) : (
  <StageCanvas />
)}
```

**Button Controls:**

```typescript
<button onClick={() => setRendererMode("auto")}>Auto</button>
<button onClick={() => setRendererMode("dom")}>DOM</button>
<button onClick={() => setRendererMode("canvas")}>Canvas</button>
<button onClick={() => setRendererMode("three")}>Three</button>
```

---

## Performance Comparison

### Benchmark: 50 Layers, 10 Spinning

| Renderer | FPS (Desktop) | FPS (Mobile) | Memory | CPU Usage |
|----------|---------------|--------------|--------|----------|
| **Three.js** | 60fps | 60fps | 80MB | 5% |
| **Canvas** | 60fps | 45fps | 120MB | 40% |
| **DOM** | 60fps | 50fps | 90MB | 15% |

### Benchmark: 200 Layers, 50 Spinning

| Renderer | FPS (Desktop) | FPS (Mobile) | Memory | CPU Usage |
|----------|---------------|--------------|--------|----------|
| **Three.js** | 60fps | 55fps | 200MB | 10% |
| **Canvas** | 45fps | 20fps | 300MB | 90% |
| **DOM** | 30fps | 15fps | 250MB | 60% |

**Winner:** Three.js (WebGL) scales best

---

## Static vs Animated Rendering

### Static Scene Detection

All renderers detect static scenes:

```typescript
const hasAnyAnimation = layers.some(layer => layer.hasAnimation);

if (hasAnyAnimation) {
  // Start 60fps animation loop
  animationFrameId = requestAnimationFrame(animate);
} else {
  // Render once, no loop
  renderOnce();
}
```

### Memory Savings

**Static Scene (No Animation):**
- No animation loop → **0% CPU**
- Single render → **Minimal GPU usage**
- No processor pipeline → **Less memory**

**Animated Scene (60fps):**
- Animation loop → **5-40% CPU**
- 60 renders/second → **GPU active**
- Processor pipeline → **Cache overhead**

---

## Debug Visualization Support

### Canvas Renderer

**Full Support** - Can draw arbitrary shapes:

```typescript
CanvasDebugRenderer.drawImageCenter(ctx, marker);  // Crosshair
CanvasDebugRenderer.drawImageTip(ctx, marker);     // Circle
CanvasDebugRenderer.drawAxisLine(ctx, line);       // Dashed line
```

### Three.js Renderer

**Full Support** - Creates mesh geometries:

```typescript
ThreeDebugRenderer.createImageCenterMesh(marker, scene, STAGE_SIZE, THREE);
ThreeDebugRenderer.createAxisLineMesh(line, scene, STAGE_SIZE, THREE);
```

### DOM Renderer

**Partial Support** - Can add overlay divs, but limited

---

## Migration Guide

### Switching Renderers

**No code changes needed!** All renderers consume the same layer data.

```typescript
// Before
import StageDOM from "@shared/stages/StageDOM";
<StageDOM />

// After
import StageThree from "@shared/stages/StageThree";
<StageThree />
```

### Renderer-Specific Notes

**DOM → Canvas:**
- Debug markers work better
- May need to adjust memory limits

**DOM → Three:**
- Better performance
- Check WebGL support

**Canvas → Three:**
- Less CPU usage
- Better for animations

**Three → Canvas:**
- Works in headless
- AI agent screenshots

---

## Troubleshooting

### Issue: Three.js Not Working

**Check WebGL:**

```javascript
const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl");
console.log(gl ? "WebGL available" : "WebGL not available");
```

**Fallback to Canvas:**

```typescript
const rendererMode = "canvas";  // Force canvas
```

### Issue: Canvas Rendering Black

**Check console:**

```
[LayerEngineCanvas] Failed to load image for "GEAR1"
```

**Fix:** Check ImageRegistry.json has correct paths

### Issue: DOM Renderer Stuttering

**Check layer count:**

```
[LayerEngineDOM] Total layers loaded: 150
```

**Solution:** Switch to Three.js for 100+ layers

---

## Next Steps

- **🔧 Pipeline:** Read `05_LAYER_PIPELINE_SYSTEM.md`
- **📊 Performance:** Read `10_PERFORMANCE_OPTIMIZATION.md`
- **🐛 Debug:** Read `07_DEBUG_VISUALIZATION.md`

---

**AI Agent Note:** For AI agents taking screenshots, always use Canvas renderer. It works reliably in headless browsers (Playwright, Puppeteer) where WebGL may not be available.
