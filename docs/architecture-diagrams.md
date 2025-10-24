Perfect! Now let me create a visual architecture diagram file:
Action: file_editor create /app/docs/architecture-diagrams.md --file-text "# Yuzha Architecture Diagrams

## 1. High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         USER/DEVELOPER                        │
│                  Edits ConfigYuzha.json                      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                    CONFIG LAYER                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ConfigYuzha.json                                       │ │
│  │ - Layer definitions with groups                        │ │
│  │ - Core + Basic + Spin + Orbital configs               │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │ Config.ts                                              │ │
│  │ - Load, transform, validate                           │ │
│  │ - Flatten groups → LayerConfigEntry[]                │ │
│  │ - Sort by LayerOrder                                  │ │
│  └────────────────────┬───────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                  PREPARATION LAYER                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ StageSystem.createStagePipeline()                      │ │
│  │ - Orchestrates pipeline creation                       │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│         ┌─────────────┴─────────────┐                       │
│         ↓                           ↓                        │
│  ┌─────────────┐            ┌──────────────┐               │
│  │ layerCore.  │            │ Processor    │               │
│  │ prepareLayer│            │ Registry     │               │
│  │             │            │              │               │
│  │ - Assets    │            │ - Spin       │               │
│  │ - Positions │            │ - Orbital    │               │
│  │ - Scales    │            │ - [Custom]   │               │
│  └──────┬──────┘            └──────┬───────┘               │
│         │                          │                        │
│         └────────────┬─────────────┘                        │
│                      ↓                                       │
│         ┌────────────────────────┐                         │
│         │  PreparedLayer[]       │                         │
│         │  (data + processors)   │                         │
│         └────────────┬────────────┘                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                    RENDER LAYER                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ MainScreen.tsx                                         │ │
│  │ - Choose renderer (DOM/Canvas/Three.js)               │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│         ┌─────────────┼─────────────┐                       │
│         ↓             ↓             ↓                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ StageDOM │  │ StageCanvas│ │StageThree│                 │
│  │          │  │            │ │          │                 │
│  │ CSS 2D   │  │ Canvas 2D  │ │ WebGL 3D │                 │
│  └─────┬────┘  └─────┬──────┘ └─────┬────┘                 │
│        │             │              │                       │
│        └─────────────┼──────────────┘                       │
│                      ↓                                       │
│         ┌────────────────────────┐                         │
│         │  Each Frame:           │                         │
│         │  1. Run processors     │                         │
│         │  2. Update state       │                         │
│         │  3. Render to screen   │                         │
│         └────────────────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

## 2. Layer Processing Pipeline (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│ SINGLE LAYER PIPELINE (for each layer in config)           │
└─────────────────────────────────────────────────────────────┘

Step 1: Configuration Entry
┌──────────────────────────┐
│ LayerConfigEntry         │
│ from ConfigYuzha.json    │
│                          │
│ {                        │
│   LayerID,               │
│   ImageID,               │
│   LayerOrder,            │
│   renderer,              │
│   ImageScale,            │
│   groups: { ... }        │
│ }                        │
└───────────┬──────────────┘
            │
            ↓
Step 2: Asset Resolution & Base Preparation (layerCore)
┌──────────────────────────┐
│ prepareLayer()           │
│                          │
│ → Resolve ImageID        │
│ → Load image dimensions  │
│ → Calculate position     │
│ → Calculate scale        │
│ → Compute pivot points   │
│ → Create UniversalData   │
└───────────┬──────────────┘
            │
            ↓
Step 3: Processor Attachment (layer.ts)
┌──────────────────────────┐
│ getProcessorsForEntry()  │
│                          │
│ Check all registered     │
│ processors:              │
│                          │
│ ✓ Spin? (spinSpeed>0)   │
│ ✓ Orbital? (orbitSpeed)  │
│ ✓ Custom? (conditions)   │
│                          │
│ → Create processor list  │
└───────────┬──────────────┘
            │
            ↓
Step 4: Prepared Layer (ready for rendering)
┌──────────────────────────┐
│ PreparedLayer            │
│ {                        │
│   entry: original config │
│   data: UniversalData    │
│   processors: [          │
│     spinProcessor,       │
│     orbitalProcessor,    │
│     customProcessor      │
│   ]                      │
│ }                        │
└───────────┬──────────────┘
            │
            ↓
Step 5: Frame Rendering (each animation frame)
┌──────────────────────────┐
│ runPipeline()            │
│                          │
│ Input: baseData + time   │
│                          │
│ → Run processor 1        │
│ → Run processor 2        │
│ → Run processor 3        │
│                          │
│ Output: EnhancedData     │
│ (with animations)        │
└───────────┬──────────────┘
            │
            ↓
Step 6: Render to Screen
┌──────────────────────────┐
│ Renderer displays layer  │
│ at calculated position,  │
│ rotation, scale, etc.    │
└──────────────────────────┘
```

## 3. Processor System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    PROCESSOR REGISTRY                         │
│                    (Singleton Pattern)                        │
└───────────────────────────────────────────────────────────────┘

                    ┌────────────────┐
                    │ RegisterProcessor│
                    │ (at module load) │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Spin Processor│    │Orbital Process│    │Custom Process │
│               │    │               │    │               │
│ shouldAttach: │    │ shouldAttach: │    │ shouldAttach: │
│  spinSpeed>0  │    │  orbitStage   │    │  customProp   │
│               │    │   Point != null│    │    != null    │
│ create:       │    │               │    │               │
│  spinProcessor│    │ create:       │    │ create:       │
│               │    │  orbitalProc  │    │  customProc   │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │ plugins: Array   │
                    │ [spin, orbit,    │
                    │  custom, ...]    │
                    └────────┬─────────┘
                             │
                             │ When preparing layer:
                             ↓
                    ┌────────────────────┐
                    │getProcessorsForEntry│
                    │                    │
                    │ For each plugin:   │
                    │   if shouldAttach: │
                    │     create & add   │
                    └────────┬───────────┘
                             │
                             ↓
                    ┌────────────────────┐
                    │ LayerProcessor[]   │
                    │ attached to layer  │
                    └────────────────────┘
```

## 4. Config Structure & Transformation

```
┌─────────────────────────────────────────────────────────────┐
│                  ConfigYuzha.json                           │
│                  (Grouped Structure)                        │
└─────────────────────────────────────────────────────────────┘

Input Format:
{
  \"LayerID\": \"my-layer\",
  \"ImageID\": \"ASSET\",
  \"renderer\": \"2D\",
  \"LayerOrder\": 100,
  \"ImageScale\": [100, 100],

  \"groups\": {                          ← Groups are OPTIONAL
    \"Basic Config\": {
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50],
      \"BasicImageAngle\": 0
    },
    \"Spin Config\": {
      \"spinSpeed\": 10,
      \"spinDirection\": \"cw\"
    },
    \"Orbital Config\": {
      \"orbitSpeed\": 5,
      \"orbitStagePoint\": [1024, 1024]
    }
  }
}
            │
            │ transformConfig()
            ↓
┌─────────────────────────────────────────────────────────────┐
│               LayerConfigEntry                              │
│               (Flattened Structure)                         │
└─────────────────────────────────────────────────────────────┘

Output Format:
{
  // Core (always present)
  \"LayerID\": \"my-layer\",
  \"ImageID\": \"ASSET\",
  \"renderer\": \"2D\",
  \"LayerOrder\": 100,
  \"ImageScale\": [100, 100],

  // Basic Config (if present)
  \"BasicStagePoint\": [1024, 1024],
  \"BasicImagePoint\": [50, 50],
  \"BasicImageAngle\": 0,

  // Spin Config (if present)
  \"spinSpeed\": 10,
  \"spinDirection\": \"cw\",

  // Orbital Config (if present)
  \"orbitSpeed\": 5,
  \"orbitStagePoint\": [1024, 1024]
}
```

## 5. Coordinate Systems

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGE SPACE                              │
│                    (Fixed 2048x2048)                        │
│                                                             │
│  (0,0)                                      (2048,0)        │
│    ┌─────────────────────────────────────────┐             │
│    │                                         │             │
│    │         Stage coordinates               │             │
│    │         (absolute pixels)               │             │
│    │                                         │             │
│    │              (1024,1024)                │             │
│    │                  •  ← Center            │             │
│    │                                         │             │
│    │                                         │             │
│    │                                         │             │
│    └─────────────────────────────────────────┘             │
│  (0,2048)                                 (2048,2048)      │
│                                                             │
│  Scales to viewport using CSS transforms                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    IMAGE SPACE                              │
│                    (Relative to image dimensions)           │
│                                                             │
│  (0,0) ← Top-left corner                                   │
│    ┌─────────────────────────────────────────┐             │
│    │                                         │             │
│    │   Image Point coordinates               │             │
│    │   (pixels relative to image)            │             │
│    │                                         │             │
│    │          (width/2, height/2)            │             │
│    │                  •  ← Center            │             │
│    │                                         │             │
│    │                                         │             │
│    │                                         │             │
│    └─────────────────────────────────────────┘             │
│  (0,height)                          (width,height)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PERCENT SPACE                            │
│                    (0-100% for both axes)                   │
│                                                             │
│  (0%,0%)                                                    │
│    ┌─────────────────────────────────────────┐             │
│    │                                         │             │
│    │   Used for:                             │             │
│    │   - BasicImagePoint (where to anchor)   │             │
│    │   - spinImagePoint (pivot point)        │             │
│    │   - orbitImagePoint (orbit point)       │             │
│    │                                         │             │
│    │              (50%,50%)                  │             │
│    │                  •  ← Center            │             │
│    │                                         │             │
│    │                                         │             │
│    │                                         │             │
│    └─────────────────────────────────────────┘             │
│  (0%,100%)                            (100%,100%)          │
│                                                             │
│  Independent of image dimensions                           │
└─────────────────────────────────────────────────────────────┘

CONVERSION FUNCTIONS (layerBasic.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stage ←→ Percent:  stagePointToPercent(), percentToStagePoint()
Image ←→ Percent:  imagePointToPercent(), imagePercentToImagePoint()
Image ←→ Stage:    imagePointToStagePoint() (uses scale + position)
```

## 6. Processor Execution Flow

```
Frame N at timestamp T:

┌──────────────────────────────────────────────────────────┐
│ For each PreparedLayer:                                  │
└──────────────────────────────────────────────────────────┘

  ┌─────────────────────┐
  │ baseData            │  UniversalLayerData from layerCore
  │ (static properties) │
  └──────────┬──────────┘
             │
             ↓
  ┌─────────────────────┐
  │ Processor 1: Spin   │
  │ Input: baseData, T  │
  │                     │
  │ Calculate:          │
  │ - rotation angle    │
  │ - pivot position    │
  │                     │
  │ Output: data + spin │
  └──────────┬──────────┘
             │
             ↓
  ┌─────────────────────┐
  │ Processor 2: Orbital│
  │ Input: prev data, T │
  │                     │
  │ Calculate:          │
  │ - orbit position    │
  │ - orientation       │
  │                     │
  │ Output: data +      │
  │         spin + orbit│
  └──────────┬──────────┘
             │
             ↓
  ┌─────────────────────┐
  │ Processor 3: Custom │
  │ Input: prev data, T │
  │                     │
  │ Calculate:          │
  │ - custom properties │
  │                     │
  │ Output: EnhancedData│
  └──────────┬──────────┘
             │
             ↓
  ┌─────────────────────┐
  │ EnhancedLayerData   │
  │                     │
  │ Has all properties: │
  │ - position          │
  │ - rotation          │
  │ - scale             │
  │ - spin state        │
  │ - orbital state     │
  │ - custom state      │
  └──────────┬──────────┘
             │
             ↓
  ┌─────────────────────┐
  │ Renderer displays   │
  │ with all effects    │
  └─────────────────────┘

Key: Each processor builds on previous output (pipeline pattern)
```

## 7. Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER MODULES                            │
└─────────────────────────────────────────────────────────────┘

                    ┌───────────────┐
                    │ Config.ts     │
                    │ (loads JSON)  │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐   ┌───────────────┐   ┌──────────────┐
│ layerBasic.ts │   │ ImageRegistry │   │ StageSystem  │
│ (coordinates) │   │ (assets)      │   │              │
└───────┬───────┘   └───────┬───────┘   └──────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                    ┌───────────────┐
                    │ layerCore.ts  │
                    │ (prepareLayer)│
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐   ┌───────────────┐   ┌──────────────┐
│ layerSpin.ts  │   │ layerOrbit.ts │   │ [custom].ts  │
│               │   │               │   │              │
└───────┬───────┘   └───────┬───────┘   └──────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                    ┌───────────────┐
                    │  layer.ts     │
                    │  (registry +  │
                    │   pipeline)   │
                    └───────┬───────┘
                            │
                            ↓
                    ┌───────────────┐
                    │ StageSystem   │
                    │ (orchestrate) │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐   ┌───────────────┐   ┌──────────────┐
│ StageDOM.tsx  │   │StageCanvas.tsx│   │StageThree.tsx│
└───────┬───────┘   └───────┬───────┘   └──────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                    ┌───────────────┐
                    │ MainScreen.tsx│
                    │ (display)     │
                    └───────────────┘

Dependencies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Direct dependency
├─ Uses functions/types from
└─ Imports from
```

## 8. Adding New Feature (Visual Guide)

```
Step 1: Define Config Structure
┌─────────────────────────────────────┐
│ What config properties do you need? │
│                                     │
│ Example:                            │
│ - pulseSpeed?: number               │
│ - pulseScale?: [number, number]     │
│ - pulseDuration?: number            │
└──────────────┬──────────────────────┘
               ↓
Step 2: Create Processor File
┌─────────────────────────────────────┐
│ /app/shared/layer/layerPulse.ts    │
│                                     │
│ export function                     │
│   createPulseProcessor(config)      │
└──────────────┬──────────────────────┘
               ↓
Step 3: Update Types
┌─────────────────────────────────────┐
│ Config.ts:                          │
│ - Add to LayerConfigEntry           │
│ - Add to ConfigYuzhaEntry groups    │
│                                     │
│ layer.ts:                           │
│ - Add to EnhancedLayerData          │
└──────────────┬──────────────────────┘
               ↓
Step 4: Register Processor
┌─────────────────────────────────────┐
│ In layer.ts:                        │
│                                     │
│ registerProcessor({                 │
│   name: \"pulse\",                    │
│   shouldAttach: (entry) =>          │
│     entry.pulseSpeed > 0,           │
│   create: (entry) =>                │
│     createPulseProcessor(entry)     │
│ });                                 │
└──────────────┬──────────────────────┘
               ↓
Step 5: Test with Config
┌─────────────────────────────────────┐
│ In ConfigYuzha.json:                │
│                                     │
│ {                                   │
│   \"LayerID\": \"test-pulse\",          │
│   ...                               │
│   \"groups\": {                       │
│     \"Pulse Config\": {               │
│       \"pulseSpeed\": 2,              │
│       \"pulseScale\": [90, 110]       │
│     }                               │
│   }                                 │
│ }                                   │
└──────────────┬──────────────────────┘
               ↓
Step 6: Verify in Browser
┌─────────────────────────────────────┐
│ - Hot reload activates              │
│ - Check console for errors          │
│ - Verify animation works            │
│ - Adjust config values              │
└─────────────────────────────────────┘
```

---

**Use these diagrams to understand:**

- How data flows through the system
- Where to make changes
- How components interact
- Visual mental models for architecture
  "
  Observation: Create successful: /app/docs/architecture-diagrams.md
