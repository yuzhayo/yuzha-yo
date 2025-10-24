Perfect! Now let me create one final **cheat sheet** for quick reference:
Action: file_editor create /app/docs/cheat-sheet.md --file-text "# Yuzha Quick Reference Cheat Sheet

## 🚀 1-Minute Quick Start

```bash
# 1. View the app (runs on port 3000)
curl http://localhost:3000

# 2. Edit layers
nano /app/shared/config/ConfigYuzha.json

# 3. Check logs
tail -f /var/log/supervisor/yuzha.*.log
```

## 📝 Add a Layer in 30 Seconds

```json
// In /app/shared/config/ConfigYuzha.json
{
  \"LayerID\": \"my-new-layer\",
  \"ImageID\": \"GEAR1\",              // Must exist in ImageRegistry.json
  \"renderer\": \"2D\",
  \"LayerOrder\": 500,               // Lower = background, higher = foreground
  \"ImageScale\": [100, 100],        // [x%, y%] scale
  \"groups\": {
    \"Basic Config\": {
      \"BasicStagePoint\": [1024, 1024],   // Where to place on stage
      \"BasicImagePoint\": [50, 50],        // Which image point to anchor
      \"BasicImageAngle\": 0                // Rotation in degrees
    }
  }
}
```

## 🎨 Add Animation (Spin or Orbit)

### Spin (Rotation)

```json
\"Spin Config\": {
  \"spinStagePoint\": [1024, 1024],   // Pivot center on stage
  \"spinImagePoint\": [50, 50],       // Pivot point on image (%)
  \"spinSpeed\": 10,                  // Degrees per second
  \"spinDirection\": \"cw\"             // \"cw\" or \"ccw\"
}
```

### Orbit (Circular Motion)

```json
\"Orbital Config\": {
  \"orbitStagePoint\": [1024, 1024],  // Circle center
  \"orbitLinePoint\": [1324, 1024],   // Point defining radius
  \"orbitImagePoint\": [50, 50],      // Which image point orbits (%)
  \"orbitSpeed\": 30,                 // Degrees per second
  \"orbitDirection\": \"cw\",           // \"cw\" or \"ccw\"
  \"orbitOrient\": false,             // Rotate to face center?
  \"orbitLine\": false                // Show orbit path?
}
```

## 🗂️ File Quick Finder

| Need to...                  | File                                  |
| --------------------------- | ------------------------------------- |
| Add/edit layers             | `/app/shared/config/ConfigYuzha.json` |
| Change config types         | `/app/shared/config/Config.ts`        |
| See spin processor example  | `/app/shared/layer/layerSpin.ts`      |
| See orbit processor example | `/app/shared/layer/layerOrbit.ts`     |
| Add new processor           | Create `/app/shared/layer/layerX.ts`  |
| Register processor          | `/app/shared/layer/layer.ts`          |
| Understand pipeline         | `/app/shared/stage/StageSystem.ts`    |
| See coordinate math         | `/app/shared/layer/layerBasic.ts`     |
| View main entry point       | `/app/yuzha/src/MainScreen.tsx`       |

## 🔧 Common Config Properties

### Core (Required)

```typescript
LayerID: string           // Unique identifier
ImageID: string          // Asset from ImageRegistry.json
renderer: \"2D\" | \"3D\"   // Rendering engine
LayerOrder: number      // Draw order (lower = back)
ImageScale?: [x, y]     // Scale percentage (10-500)
```

### Basic Config (Optional)

```typescript
BasicStagePoint?: [x, y]     // Position on stage (0-2048 pixels)
BasicImagePoint?: [x%, y%]   // Anchor point on image (0-100%)
BasicImageAngle?: degrees    // Static rotation (0-360)
```

### Spin Config (Optional)

```typescript
spinStagePoint?: [x, y]      // Pivot center (0-2048 pixels)
spinImagePoint?: [x%, y%]    // Pivot on image (0-100%)
spinSpeed?: number           // Degrees/second
spinDirection?: \"cw\"|\"ccw\"   // Clockwise or counter-clockwise
```

### Orbital Config (Optional)

```typescript
orbitStagePoint?: [x, y]     // Circle center (0-2048 pixels)
orbitLinePoint?: [x, y]      // Point defining radius
orbitImagePoint?: [x%, y%]   // Which point orbits (0-100%)
orbitSpeed?: number          // Degrees/second
orbitDirection?: \"cw\"|\"ccw\"  // Direction
orbitOrient?: boolean        // Face center while orbiting?
orbitLine?: boolean          // Show orbit path?
```

## 🎯 Coordinate Systems Cheat

| System        | Range       | Use For                          |
| ------------- | ----------- | -------------------------------- |
| Stage Space   | 0-2048 px   | Layer positions, centers, pivots |
| Image Space   | 0-W, 0-H px | Raw image coordinates            |
| Percent Space | 0-100%      | Relative positioning on images   |

**Key Points:**

- Stage is always 2048x2048
- Center of stage: `[1024, 1024]`
- Center of image: `[50, 50]` in percent

## 🔄 Processor Pattern Template

```typescript
// 1. Create processor function
export function createMyProcessor(config: MyConfig): LayerProcessor {
  const speed = config.speed ?? 0;
  let startTime: number | undefined;

  return (layer, timestamp) => {
    const currentTime = timestamp ?? performance.now();
    if (startTime === undefined) startTime = currentTime;
    const elapsed = (currentTime - startTime) / 1000;

    // Your calculation here
    const value = speed * elapsed;

    return {
      ...layer,
      myProperty: value,
      hasMyAnimation: true
    } as EnhancedLayerData;
  };
}

// 2. Register in layer.ts
registerProcessor({
  name: \"my-feature\",
  shouldAttach: (entry) => entry.mySpeed !== undefined && entry.mySpeed > 0,
  create: (entry) => createMyProcessor({ speed: entry.mySpeed })
});
```

## 📊 Type Update Checklist

When adding new config properties:

- [ ] Add to `LayerConfigEntry` in `Config.ts`
- [ ] Add to `ConfigYuzhaEntry` groups in `Config.ts`
- [ ] Add to `EnhancedLayerData` in `layer.ts`
- [ ] Update `transformConfig()` if special merge needed
- [ ] Update `validateLayerConfig()` if validation needed

## 🐛 Debug Checklist

Layer not showing?

- [ ] Check LayerOrder (covered by higher layer?)
- [ ] Check BasicStagePoint (in 0-2048 range?)
- [ ] Check ImageID (exists in ImageRegistry.json?)
- [ ] Check console for validation warnings
- [ ] Check logs: `tail -f /var/log/supervisor/yuzha.*.log`

Animation not working?

- [ ] Check config property values (speed > 0?)
- [ ] Check processor registration (shouldAttach correct?)
- [ ] Check EnhancedLayerData has new properties
- [ ] Check processor is in PreparedLayer.processors array
- [ ] Check timestamp is being passed to processor

## 🎓 Mental Models

### Config Flow

```
JSON → Transform → Validate → Sort → Prepare → Render
```

### Layer Flow (Single Layer)

```
Config Entry → prepareLayer() → Attach Processors → Run Pipeline → Display
```

### Processor Pipeline (Each Frame)

```
Base Data → [Processor 1] → [Processor 2] → [Processor N] → Enhanced Data
```

### Processor Registration

```
Define → Register → Condition Check → Auto-Attach → Execute
```

## 🛠️ Common Commands

```bash
# Service management
sudo supervisorctl status
sudo supervisorctl restart yuzha

# View logs
tail -f /var/log/supervisor/yuzha.*.log
tail -f /var/log/supervisor/yuzha.err.log

# Test app
curl http://localhost:3000
```

## 💡 Pro Tips

1. **Start with existing examples**: Copy-paste from ConfigYuzha.json
2. **Test incrementally**: Change one property at a time
3. **Use LayerOrder**: Control which layers appear on top
4. **Center of stage**: `[1024, 1024]` is always center
5. **Hot reload**: Save ConfigYuzha.json to see changes immediately
6. **Check console**: Dev mode shows validation warnings
7. **Groups are optional**: Mix and match Basic/Spin/Orbital as needed

## 📚 Learn More

- Full guide: `/app/docs/ai-agent-onboarding.md`
- Quick start: `/app/docs/quick-start-prompt.md`
- Diagrams: `/app/docs/architecture-diagrams.md`
- Template: `/app/docs/processor-template.ts`

## 🔑 Key Functions

| Function                  | File           | Purpose                        |
| ------------------------- | -------------- | ------------------------------ |
| `loadLayerConfig()`       | Config.ts      | Load & transform config        |
| `prepareLayer()`          | layerCore.ts   | Config → base layer data       |
| `registerProcessor()`     | layer.ts       | Add processor to registry      |
| `getProcessorsForEntry()` | layer.ts       | Get processors for a layer     |
| `runPipeline()`           | layer.ts       | Execute processor pipeline     |
| `createStagePipeline()`   | StageSystem.ts | Create complete stage pipeline |

## 🎨 Example: Full Layer with All Features

```json
{
  \"LayerID\": \"full-example\",
  \"ImageID\": \"GEAR1\",
  \"renderer\": \"2D\",
  \"LayerOrder\": 500,
  \"ImageScale\": [80, 80],
  \"groups\": {
    \"Basic Config\": {
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicImageAngle\": 45
    },
    \"Spin Config\": {
      \"spinStagePoint\": [1024, 1024],
      \"spinImagePoint\": [50, 50],
      \"spinSpeed\": 10,
      \"spinDirection\": \"cw\"
    },
    \"Orbital Config\": {
      \"orbitStagePoint\": [1024, 1024],
      \"orbitLinePoint\": [1324, 1024],
      \"orbitImagePoint\": [50, 50],
      \"orbitSpeed\": 30,
      \"orbitDirection\": \"ccw\",
      \"orbitOrient\": true,
      \"orbitLine\": true
    }
  }
}
```

This creates a layer that:

- Uses GEAR1 image at 80% scale
- Positioned at stage center via BasicStagePoint
- Spins clockwise at 10°/sec around its center
- Orbits counter-clockwise at 30°/sec around center at 300px radius
- Orients to face center while orbiting
- Shows orbit path visualization

---

**Print this cheat sheet for quick reference!**
"
Observation: Create successful: /app/docs/cheat-sheet.md
