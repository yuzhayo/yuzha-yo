I'll create a comprehensive onboarding prompt for new AI agents. Let me save this as a documentation file:
Action: file_editor create /app/docs/ai-agent-onboarding.md --file-text "# AI Agent Onboarding Guide - Yuzha Config-Driven Layer System

## 🎯 Your Mission
You're working on a **config-driven 2D/3D layer rendering system** called Yuzha. Everything is driven by JSON configuration, with a modular processor pipeline for animations.

## 📚 Essential Reading Order (Follow This Sequence)

### Phase 1: Understand the Config System (15 minutes)
Read these files IN ORDER to understand how layers are defined:

1. **`/app/shared/config/ConfigYuzha.json`** (5 min)
   - This is THE source of truth for all layers
   - Look at 2-3 layer examples to see the structure
   - Note the grouped structure: Core properties + optional \"groups\" (Basic Config, Spin Config, Orbital Config)
   - **Key insight**: Groups are OPTIONAL and can be mixed/matched

2. **`/app/shared/config/Config.ts`** (10 min)
   - Read the top comments and type definitions
   - Focus on: `LayerConfigEntry`, `ConfigYuzhaEntry`, `transformConfig()`
   - **Key insight**: Config is loaded, flattened, validated, then sorted by LayerOrder

### Phase 2: Understand the Data Flow (20 minutes)
Follow the data pipeline from config to screen:

3. **`/app/shared/layer/layerCore.ts`** (10 min)
   - Read the top module documentation
   - Focus on: `prepareLayer()` function (main entry point)
   - Understand: `UniversalLayerData` type (base layer data)
   - **Key insight**: This converts config → renderable data (positions, scales, asset URLs)

4. **`/app/shared/layer/layer.ts`** (10 min)
   - Read sections 1-2: Types & Pipeline, Processor Registry
   - Focus on: `LayerProcessor` type, `runPipeline()`, `registerProcessor()`
   - **Key insight**: Processors are plugins that enhance layers based on config

### Phase 3: Understand Existing Processors (15 minutes)

5. **`/app/shared/layer/layerSpin.ts`** (7 min)
   - See how `createSpinProcessor()` works
   - Notice: time-based rotation, pivot calculations
   - **Key insight**: Processors receive (layer, timestamp) → return enhanced layer

6. **`/app/shared/layer/layerOrbit.ts`** (8 min)
   - See orbital motion calculations
   - Notice: similar pattern to spin processor
   - **Key insight**: Processors can combine (spin + orbit = rotating while orbiting)

### Phase 4: Understand the Stage System (10 minutes)

7. **`/app/shared/stage/StageSystem.ts`** (10 min)
   - Read sections 1-2: Coordinate System, Data Pipeline
   - Focus on: `createStagePipeline()` (orchestrates everything)
   - **Key insight**: 2048x2048 fixed stage, auto-scales to viewport

### Phase 5: See It in Action (5 minutes)

8. **`/app/yuzha/src/MainScreen.tsx`** (5 min)
   - See how renderers are chosen and stages are displayed
   - **Key insight**: Three renderer options (DOM, Canvas, Three.js)

## 🧠 Mental Model

```
USER EDITS ConfigYuzha.json
         ↓
Config.ts loads, transforms, validates
         ↓
StageSystem.createStagePipeline()
         ↓
For each layer:
  1. layerCore.prepareLayer() → UniversalLayerData
  2. getProcessorsForEntry() → attach processors (spin, orbit, etc.)
         ↓
Renderer (DOM/Canvas/Three.js) displays layers
         ↓
Each frame: run processors → update positions/rotations → render
```

## 🔑 Key Concepts

### 1. Config-Driven Everything
- **Layers are defined in JSON**, not code
- To add a layer: edit ConfigYuzha.json
- To change behavior: modify config properties

### 2. Processor Pipeline Pattern
- **Processors are modular behaviors** that attach based on config
- Pattern: Check config → decide if processor applies → attach it
- Example: If `spinSpeed > 0`, attach spin processor

### 3. Dual-Space Coordinates
- **Stage space**: Fixed 2048x2048 coordinate system (pixels)
- **Image space**: Relative to individual image dimensions (pixels or %)
- **Percent space**: 0-100% for relative positioning

### 4. Three Config Groups
- **Core**: Always required (LayerID, ImageID, LayerOrder, renderer, ImageScale)
- **Basic Config**: Static positioning (BasicStagePoint, BasicImagePoint, BasicImageAngle)
- **Spin Config**: Rotation animation (spinSpeed, spinDirection, spinStagePoint, spinImagePoint)
- **Orbital Config**: Circular motion (orbitSpeed, orbitStagePoint, orbitLinePoint, orbitOrient)

## 🛠️ Common Tasks

### Adding a New Layer
1. Edit `/app/shared/config/ConfigYuzha.json`
2. Add entry with Core properties + optional groups
3. Server hot-reloads automatically

### Adding a New Processor
1. Create processor file in `/app/shared/layer/` (e.g., `layerPulse.ts`)
2. Implement `createXProcessor()` function matching `LayerProcessor` type
3. Register in `/app/shared/layer/layer.ts` using `registerProcessor()`
4. Add config properties to `LayerConfigEntry` type in `Config.ts`
5. Update `EnhancedLayerData` type if adding new properties

### Adding a New Config Property
1. Add to `ConfigYuzhaEntry` type in `Config.ts`
2. Add to `LayerConfigEntry` type in `Config.ts`
3. Update `transformConfig()` if special merge logic needed
4. Update `validateLayerConfig()` if validation needed
5. Use in processor or renderer

## 🚨 Critical Rules

1. **Never modify STAGE_SIZE (2048)** - entire system depends on this
2. **Processors must be pure functions** - no side effects except time tracking
3. **All angles in degrees** unless specifically marked as radians
4. **LayerOrder determines render order** - lower = background, higher = foreground
5. **Groups in JSON are optional** - a layer with only Core properties is valid

## 🧪 Testing Your Changes

1. **View the app**: Service runs on port 3000
2. **Check logs**: `tail -f /var/log/supervisor/yuzha.*.log`
3. **Test config**: Edit ConfigYuzha.json and see live reload
4. **Debug**: Enable dev mode in Config.ts for validation warnings

## 📁 File Reference Map

```
/app/
├── shared/
│   ├── config/
│   │   ├── ConfigYuzha.json         ← Layer definitions (edit this!)
│   │   ├── Config.ts                ← Config loader/transformer
│   │   └── ImageRegistry.json       ← Asset path mappings
│   ├── layer/
│   │   ├── layer.ts                 ← Processor registry & pipeline
│   │   ├── layerCore.ts             ← Base layer preparation
│   │   ├── layerBasic.ts            ← Coordinate utilities
│   │   ├── layerSpin.ts             ← Spin processor
│   │   └── layerOrbit.ts            ← Orbital processor
│   └── stage/
│       ├── StageSystem.ts           ← Pipeline orchestrator
│       ├── StageCanvas.tsx          ← Canvas 2D renderer
│       ├── StageDOM.tsx             ← DOM CSS renderer
│       └── StageThree.tsx           ← Three.js renderer
└── yuzha/
    └── src/
        ├── MainScreen.tsx           ← Entry point
        └── MainScreenUtils.tsx      ← UI controls
```

## 💡 Quick Start Scenarios

### Scenario 1: \"Add a pulsing animation to a layer\"
1. Read layerSpin.ts to see processor pattern
2. Create layerPulse.ts with similar structure
3. Register processor checking for `pulseSpeed` config
4. Add `pulseSpeed` and `pulseScale` to a layer in ConfigYuzha.json
5. Test and verify

### Scenario 2: \"Make a layer fade in over time\"
1. Add `fadeInDuration` to config types
2. Create processor that modifies layer opacity based on elapsed time
3. Add opacity to EnhancedLayerData type
4. Renderer will use opacity property automatically

### Scenario 3: \"Debug why a layer isn't showing\"
1. Check LayerOrder - is it being covered by higher layers?
2. Check BasicStagePoint - is it within 0-2048 bounds?
3. Check ImageID - does it exist in ImageRegistry.json?
4. Check console for validation warnings from Config.ts

## ✅ Verification Checklist

After reading this guide, you should be able to answer:
- [ ] Where are layers defined? (ConfigYuzha.json)
- [ ] What are the three config groups? (Basic, Spin, Orbital)
- [ ] What is the main entry point for layer preparation? (prepareLayer)
- [ ] How do processors attach to layers? (registerProcessor with shouldAttach)
- [ ] What is the fixed stage size? (2048x2048)
- [ ] What is the data flow from config to screen? (Config → LayerCore → Processors → Renderer)

## 🎓 Advanced Topics (Optional)

After mastering the basics, explore:
- `/app/shared/layer/layerBasic.ts` - Deep coordinate math
- `/app/shared/stage/StageCanvas.tsx` - Canvas rendering techniques
- `/app/shared/utils/RendererDetector.ts` - Auto renderer selection
- Performance optimizations in layer.ts (PipelineCache, StaticLayerBuffer)

---

**Now you're ready!** Start by reading ConfigYuzha.json and following the pipeline from there. When you need to add new features, use the processor pattern shown in layerSpin.ts and layerOrbit.ts.
"
Observation: Create successful: /app/docs/ai-agent-onboarding.md