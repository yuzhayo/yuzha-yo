# 📚 Stage Transform System - Quick File Reference

## 🎯 **ESSENTIAL FILES** (Core System)

| File                        | Purpose                              | Key Exports                                                                |
| --------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| **`stage-transform.ts`**    | ⭐ **Core math & coordinate system** | `calculateStageTransform()`, `StageTransformManager`, `STAGE_WIDTH/HEIGHT` |
| **`stage-pixi-adapter.ts`** | Pixi.js integration                  | `PixiStageAdapter` class                                                   |
| **`LogicStage.tsx`**        | Main React component                 | `LogicStage` component                                                     |
| **`logicLoader.ts`**        | Scene building pipeline              | `buildSceneFromLogic()`                                                    |
| **`LogicLoaderBasic.ts`**   | Basic transforms                     | `logicApplyBasicTransform()`                                               |

## 📁 **BY CATEGORY**

### **🔧 Transform & Coordination**

```
/app/Launcher/src/utils/
├── stage-transform.ts           ⭐ CORE - Math & coordinates
├── stage-pixi-adapter.ts        ⭐ Pixi.js integration
└── stage-gesture-adapter.ts     🖱️ Touch/mouse handling
```

### **🎮 Logic & Processing**

```
/app/Launcher/src/logic/
├── LogicStage.tsx              📱 Main stage component
├── LogicStageDom.tsx           💻 DOM fallback renderer
├── logicLoader.ts              🔧 Scene builder
├── LogicLoaderBasic.ts         ⭐ Basic positioning
├── LogicLoaderSpin.ts          🔄 Rotation animations
├── LogicLoaderOrbit.ts         🌍 Orbital motion
├── LogicLoaderClock.ts         🕐 Time-based positioning
├── LogicLoaderEffects.ts       ✨ Visual effects
├── LogicLoaderEffectsAdvanced.ts 🌟 Advanced effects
├── LogicTypes.ts               📝 Type definitions
├── sceneTypes.ts               📋 Scene types
├── LogicMath.ts                🧮 Math utilities
├── LogicConfig.ts              ⚙️ Config loader
├── LogicConfig.json            📊 Layer data
└── LogicCapability.ts          🔍 Hardware detection
```

### **🎨 UI & Interaction**

```
/app/Launcher/src/ui/
├── LauncherBtn.tsx             🔘 Button components
├── LauncherBtnGesture.tsx      👆 Gesture handling
└── LauncherBtnEffect.tsx       ✨ Button effects
```

### **🎯 Main Application**

```
/app/Launcher/src/
├── App.tsx                     🏠 Root component
├── main.tsx                    🚀 Entry point
└── logic/LauncherScreen.tsx    📱 Main screen
```

### **💎 Assets & Styling**

```
/app/Launcher/src/
├── Asset/                      🖼️ Images & resources
└── styles/stage-cover.css      🎨 Stage-specific CSS
```

## 🔍 **ANALYSIS FILES** (Created by Me)

| File                                 | Purpose                         |
| ------------------------------------ | ------------------------------- |
| **`stage-transform-analysis.md`**    | 📖 Complete technical deep-dive |
| **`stage-transform-demo.html`**      | 🎮 Interactive demonstration    |
| **`file-relationships.md`**          | 🔗 Architecture & dependencies  |
| **`stage-files-quick-reference.md`** | 📚 This reference guide         |

## 🚀 **START HERE FOR UNDERSTANDING**

### **📖 Reading Order (Recommended)**

1. **`stage-transform-analysis.md`** - Read the complete analysis first
2. **`stage-transform-demo.html`** - Open in browser for interactive examples
3. **`stage-transform.ts`** - Study the core mathematical system
4. **`LogicLoaderBasic.ts`** - See how transforms are applied
5. **`LogicStage.tsx`** - Understand React integration
6. **`logicLoader.ts`** - See the complete pipeline

### **🔧 For Implementation**

1. **`stage-pixi-adapter.ts`** - Pixi.js integration pattern
2. **`LogicConfig.json`** - Configuration format examples
3. **`sceneTypes.ts`** - Type definitions for development
4. **`stage-gesture-adapter.ts`** - Gesture handling utilities

### **⚡ For Quick Reference**

1. **`LogicMath.ts`** - Common math functions
2. **`LogicTypes.ts`** - Core type definitions
3. **`LogicCapability.ts`** - Hardware/feature detection
4. **`stage-cover.css`** - CSS class names & styling

## 🎯 **MOST IMPORTANT FILES** (Priority Order)

| Priority  | File                          | Why Critical                                             |
| --------- | ----------------------------- | -------------------------------------------------------- |
| **🥇 #1** | `stage-transform.ts`          | Contains all core math & coordinate transformation logic |
| **🥈 #2** | `stage-transform-analysis.md` | Complete understanding guide (my analysis)               |
| **🥉 #3** | `LogicLoaderBasic.ts`         | Shows how percentages convert to pixels                  |
| **4**     | `stage-pixi-adapter.ts`       | Pixi.js integration & DOM manipulation                   |
| **5**     | `LogicStage.tsx`              | Main React component using the system                    |

## 💡 **MODIFICATION POINTS**

**To Change Transform Behavior:**

- Edit `calculateStageTransform()` in `stage-transform.ts`
- Modify `StageTransformManager` class methods

**To Add New Effects:**

- Extend `LogicLoaderEffects.ts`
- Or create new loader following same pattern

**To Change Coordinate System:**

- Modify `STAGE_WIDTH`/`STAGE_HEIGHT` constants
- Update transform calculations accordingly

**To Add New Gestures:**

- Extend gesture system using `stage-gesture-adapter.ts` utilities
- Use coordinate transformation for proper stage mapping

This file structure represents a **sophisticated, production-ready system** for responsive interactive graphics that scales seamlessly across all device types and sizes.
