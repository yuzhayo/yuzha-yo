# Adding New Features

## Overview

This guide walks through adding new animation types or features to the system using the processor pattern.

---

## Feature Development Workflow

```
1. Design Config Schema
   ↓
2. Update TypeScript Types
   ↓
3. Create Processor
   ↓
4. Wire to Stages
   ↓
5. Test
   ↓
6. Document
```

---

## Example: Adding "Pulse" Animation

### Goal

Create animation that scales layer up/down repeatedly (breathing effect).

### Step 1: Design Config Schema

**Add to ConfigYuzha.json:**

```json
{
  "layerId": "my-layer",
  "groups": {
    "Pulse Config": {
      "pulseSpeed": 2,           // Pulses per second
      "pulseScaleMin": 90,       // Minimum scale (% of base)
      "pulseScaleMax": 110,      // Maximum scale (% of base)
      "pulseEasing": "smooth"    // "linear" | "smooth" | "bounce"
    }
  }
}
```

### Step 2: Update TypeScript Types

**File:** `Config.ts`

**Add to group types:**

```typescript
// Add to ConfigYuzhaEntry type
export type ConfigYuzhaEntry = {
  layerId: string;
  imageId: string;
  renderer: "2D" | "3D";
  order: number;
  groups: {
    "Basic Config": BasicConfigGroup;
    "Spin Config": SpinConfigGroup;
    "Orbital Config": OrbitalConfigGroup;
    "Pulse Config": PulseConfigGroup;  // ← Add this
    "Image Mapping Debug": ImageMappingDebugConfigGroup;
  };
};

// Define group type
export type PulseConfigGroup = {
  pulseSpeed?: number;
  pulseScaleMin?: number;
  pulseScaleMax?: number;
  pulseEasing?: "linear" | "smooth" | "bounce";
};
```

**Add to flat config:**

```typescript
export type LayerConfigEntry = {
  // ... existing fields
  
  // Pulse Config
  pulseSpeed?: number;
  pulseScaleMin?: number;
  pulseScaleMax?: number;
  pulseEasing?: "linear" | "smooth" | "bounce";
};
```

**Update transformConfig():**

```typescript
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    const merged: Partial<LayerConfigEntry> = { /* ... */ };

    const basic = entry.groups["Basic Config"] || {};
    const spin = entry.groups["Spin Config"] || {};
    const orbital = entry.groups["Orbital Config"] || {};
    const pulse = entry.groups["Pulse Config"] || {};  // ← Add this
    const debug = entry.groups["Image Mapping Debug"] || {};

    // Phase 1: Basic
    Object.assign(merged, basic);

    // Phase 2: Spin (overrides if active)
    if (spin.spinSpeed && spin.spinSpeed > 0) {
      // ... existing logic
    }

    // Phase 3: Orbital (overrides if active)
    Object.assign(merged, orbital);

    // Phase 4: Pulse (additive, doesn't override)
    Object.assign(merged, pulse);  // ← Add this

    // Phase 5: Debug
    Object.assign(merged, debug);

    return merged as LayerConfigEntry;
  });
}
```

### Step 3: Create Processor

**File:** `LayerCorePipelinePulse.ts` (new file)

```typescript
import type { LayerProcessor } from "./LayerCorePipeline";
import type { UniversalLayerData, EnhancedLayerData } from "./LayerCore";
import { easeInOutQuad } from "./LayerCoreAnimationUtils";

export type PulseConfig = {
  pulseSpeed: number;     // Pulses per second
  pulseScaleMin: number;  // Min scale %
  pulseScaleMax: number;  // Max scale %
  pulseEasing?: "linear" | "smooth" | "bounce";
};

export function createPulseProcessor(config: PulseConfig): LayerProcessor {
  const pulseSpeed = config.pulseSpeed ?? 0;
  const pulseScaleMin = (config.pulseScaleMin ?? 100) / 100;  // Convert % to decimal
  const pulseScaleMax = (config.pulseScaleMax ?? 100) / 100;
  const pulseEasing = config.pulseEasing ?? "smooth";

  // Early exit if disabled
  if (pulseSpeed === 0 || pulseScaleMin === pulseScaleMax) {
    return (layer: UniversalLayerData): EnhancedLayerData => 
      layer as EnhancedLayerData;
  }

  // Pre-calculate constants
  const pulseDuration = 1000 / pulseSpeed;  // ms per pulse
  const scaleRange = pulseScaleMax - pulseScaleMin;

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    const currentTime = timestamp ?? performance.now();
    
    // Calculate pulse progress (0-1)
    const elapsed = currentTime % pulseDuration;
    let progress = elapsed / pulseDuration;
    
    // Apply easing
    if (pulseEasing === "smooth") {
      progress = easeInOutQuad(progress);
    } else if (pulseEasing === "bounce") {
      // Simple bounce easing
      progress = Math.abs(Math.sin(progress * Math.PI));
    }
    // "linear" uses raw progress
    
    // Calculate current scale multiplier
    const scaleMultiplier = pulseScaleMin + (scaleRange * progress);
    
    // Apply to layer scale
    const newScale = {
      x: layer.scale.x * scaleMultiplier,
      y: layer.scale.y * scaleMultiplier
    };
    
    return {
      ...layer,
      scale: newScale,  // Override scale
      pulseProgress: progress,
      pulseScaleMultiplier: scaleMultiplier,
      hasPulseAnimation: true,
    } as EnhancedLayerData;
  };
}
```

**Add to EnhancedLayerData:**

```typescript
// In LayerCorePipeline.ts
export type EnhancedLayerData = UniversalLayerData & {
  // ... existing properties
  
  // Pulse properties
  pulseProgress?: number;
  pulseScaleMultiplier?: number;
  hasPulseAnimation?: boolean;
};
```

### Step 4: Wire to Stages

**File:** `StageDOM.tsx` (and StageCanvas.tsx, StageThree.tsx)

**Add import:**

```typescript
import { createPulseProcessor } from "../layer/LayerCorePipelinePulse";
```

**Add to processor creation:**

```typescript
for (const entry of twoDLayers) {
  const layer = await prepareLayer(entry, STAGE_SIZE);
  if (!layer) continue;

  const processors: LayerProcessor[] = [];

  // Debug processor (if enabled)
  if (hasDebugConfig) {
    processors.push(createImageMappingDebugProcessor({ ... }));
  }

  // Spin processor (if enabled)
  if (entry.spinSpeed && entry.spinSpeed > 0) {
    processors.push(createSpinProcessor({ ... }));
  }

  // Pulse processor (if enabled) ← Add this
  if (entry.pulseSpeed && entry.pulseSpeed > 0) {
    processors.push(createPulseProcessor({
      pulseSpeed: entry.pulseSpeed,
      pulseScaleMin: entry.pulseScaleMin ?? 100,
      pulseScaleMax: entry.pulseScaleMax ?? 100,
      pulseEasing: entry.pulseEasing
    }));
  }

  layersWithProcessors.push({ data: layer, processors });
}
```

### Step 5: Test

**Add test layer to ConfigYuzha.json:**

```json
[
  {
    "layerId": "pulse-test",
    "imageId": "GEAR1",
    "renderer": "2D",
    "order": 100,
    "groups": {
      "Basic Config": {
        "scale": [100, 100],
        "BasicStagePoint": [1024, 1024],
        "BasicImagePoint": [50, 50]
      },
      "Pulse Config": {
        "pulseSpeed": 2,        // 2 pulses per second
        "pulseScaleMin": 80,    // 80% of base
        "pulseScaleMax": 120,   // 120% of base
        "pulseEasing": "smooth"
      }
    }
  }
]
```

**Verify:**
1. Layer appears
2. Scale animates from 80% to 120%
3. Animation is smooth
4. 2 pulses per second

### Step 6: Document

**Create:** `PULSE_ANIMATION.md`

**Add to:** `API_REFERENCE.md`

**Update:** `README.md` with new feature

---

## Common Patterns

### Pattern 1: Additive Processor (Like Pulse)

**Modifies existing properties without overriding positioning:**

```typescript
return {
  ...layer,
  scale: newScale,      // Modify scale
  opacity: newOpacity,  // Add opacity
  hasMyAnimation: true
};
```

**Use when:** Effect doesn't change position

### Pattern 2: Override Processor (Like Spin/Orbital)

**Overrides position/rotation from base config:**

```typescript
return {
  ...layer,
  position: newPosition,      // Override position
  currentRotation: newAngle,  // Override rotation
  hasMyAnimation: true
};
```

**Use when:** Effect controls position

### Pattern 3: Hybrid Processor

**Modifies some, adds others:**

```typescript
return {
  ...layer,
  position: newPosition,  // Override
  opacity: newOpacity,    // Add
  filters: ["blur(2px)"], // Add
  hasMyAnimation: true
};
```

---

## Adding Config UI

### Update ConfigYuzhaAccordion.tsx

**If using automatic config UI, it should detect new group automatically.**

**For custom controls:**

```typescript
// Add to accordion data transformation
function transformConfigToAccordion(config: LayerConfig): AccordionParentItem[] {
  return config.map(layer => ({
    id: layer.layerId,
    label: layer.layerId,
    children: [
      // ... existing groups
      {
        id: `${layer.layerId}-pulse`,
        label: "Pulse Config",
        children: [
          { id: `${layer.layerId}-pulseSpeed`, label: "Speed", value: layer.pulseSpeed, type: "number" },
          { id: `${layer.layerId}-pulseScaleMin`, label: "Min Scale", value: layer.pulseScaleMin, type: "number" },
          { id: `${layer.layerId}-pulseScaleMax`, label: "Max Scale", value: layer.pulseScaleMax, type: "number" },
        ]
      }
    ]
  }));
}
```

---

## Testing Checklist

### Unit Tests

```typescript
describe("PulseProcessor", () => {
  it("should scale between min and max", () => {
    const processor = createPulseProcessor({
      pulseSpeed: 1,      // 1 pulse per second
      pulseScaleMin: 50,  // 50%
      pulseScaleMax: 150  // 150%
    });

    const baseLayer: UniversalLayerData = {
      scale: { x: 1.0, y: 1.0 },
      // ... other required fields
    };

    // At 0ms (start)
    const result0 = processor(baseLayer, 0);
    expect(result0.scale.x).toBeCloseTo(0.5);  // 50% of base

    // At 500ms (middle)
    const result500 = processor(baseLayer, 500);
    expect(result500.scale.x).toBeCloseTo(1.5);  // 150% of base

    // At 1000ms (end = start)
    const result1000 = processor(baseLayer, 1000);
    expect(result1000.scale.x).toBeCloseTo(0.5);  // Back to 50%
  });

  it("should return unmodified for pulseSpeed = 0", () => {
    const processor = createPulseProcessor({
      pulseSpeed: 0,
      pulseScaleMin: 50,
      pulseScaleMax: 150
    });

    const baseLayer: UniversalLayerData = { /* ... */ };
    const result = processor(baseLayer, 1000);

    expect(result).toEqual(baseLayer);
  });
});
```

### Integration Tests

**Test with actual config:**

1. Add test layer to ConfigYuzha.json
2. Verify processor is created
3. Check animation visually
4. Verify timing (use browser DevTools)
5. Test in all 3 renderers (DOM, Canvas, Three)

### Performance Tests

**Measure impact:**

```typescript
const start = performance.now();
for (let i = 0; i < 1000; i++) {
  processor(baseLayer, i);
}
const elapsed = performance.now() - start;
console.log(`1000 iterations: ${elapsed}ms`);
// Should be < 5ms for good processor
```

---

## Best Practices

### 1. Early Exit for Disabled State

```typescript
if (config.speed === 0 || !config.enabled) {
  return (layer) => layer;  // No-op
}
```

### 2. Pre-Calculate Constants

```typescript
// ✅ Good: Calculate once
const speedPerMs = config.speed / 1000;
return (layer, timestamp) => {
  const value = timestamp * speedPerMs;
};

// ❌ Bad: Calculate every frame
return (layer, timestamp) => {
  const speedPerMs = config.speed / 1000;
  const value = timestamp * speedPerMs;
};
```

### 3. Use Utility Functions

```typescript
import { 
  normalizeAngle,
  easeInOutQuad,
  calculateElapsedTime 
} from "./LayerCoreAnimationUtils";
```

### 4. Add TypeScript Types

```typescript
export type MyConfig = {
  mySpeed: number;
  myEnabled?: boolean;
};

export function createMyProcessor(config: MyConfig): LayerProcessor {
  // ...
}
```

### 5. Document New Properties

```typescript
export type EnhancedLayerData = UniversalLayerData & {
  // ... existing
  
  /**
   * Current value from MyProcessor
   * Added when mySpeed > 0
   */
  myCurrentValue?: number;
  
  /**
   * Flag indicating MyProcessor is active
   */
  hasMyAnimation?: boolean;
};
```

---

## Common Pitfalls

### Pitfall 1: Modifying Input

```typescript
// ❌ Bad: Mutates input
return (layer, timestamp) => {
  layer.scale.x = newScale;  // Mutates!
  return layer;
};

// ✅ Good: Returns new object
return (layer, timestamp) => {
  return {
    ...layer,
    scale: { x: newScale, y: layer.scale.y }
  };
};
```

### Pitfall 2: Forgetting to Wire to Stages

**Must add to ALL stage files:**
- StageDOM.tsx
- StageCanvas.tsx
- StageThree.tsx

### Pitfall 3: Not Testing Edge Cases

**Test:**
- Speed = 0 (disabled)
- Speed < 0 (invalid)
- Min = Max (no animation)
- Very large values
- Very small values

### Pitfall 4: Performance Issues

**Avoid:**
- `Math.sin()` / `Math.cos()` in tight loops
- String concatenation every frame
- Object allocation every frame

**Use:**
- Pre-calculated lookup tables
- Object pooling
- Caching

---

## Advanced: Custom Easing

### Add Easing Function

**File:** `LayerCoreAnimationUtils.ts`

```typescript
/**
 * Elastic easing (bounce effect)
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Bounce easing (ball bounce)
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}
```

### Use in Processor

```typescript
import { easeOutBounce } from "./LayerCoreAnimationUtils";

let progress = elapsed / duration;
progress = easeOutBounce(progress);  // Apply easing
```

---

## Feature Checklist

Before considering feature complete:

- [ ] Config schema designed
- [ ] TypeScript types added
- [ ] Processor created
- [ ] Wired to all 3 stages
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] Performance tested
- [ ] Documentation written
- [ ] Examples added to ConfigYuzha.json
- [ ] API reference updated

---

## Next Steps

- **🔄 Orbital:** Read `09_ORBITAL_ANIMATION_TODO.md` for orbital integration
- **📊 Performance:** Read `10_PERFORMANCE_OPTIMIZATION.md`
- **📖 API:** Read `API_REFERENCE.md`

---

**AI Agent Note:** The processor pattern makes adding features straightforward. Always follow the 6-step workflow: Design → Types → Processor → Wire → Test → Document. Keep processors pure and composable.
