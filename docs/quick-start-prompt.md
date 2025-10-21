Now let me create a **quick reference prompt** that can be copied and pasted to a new AI agent:
Action: file_editor create /app/docs/quick-start-prompt.md --file-text "# Quick Start Prompt for New AI Agents

## Copy and paste this to a new AI agent working on the Yuzha codebase:

---

You're working on a **config-driven layer rendering system** called Yuzha. Here's your fast-track onboarding:

## 1️⃣ Read These Files in Order (30 minutes):

```bash
# Phase 1: Config System (15 min)
/app/shared/config/ConfigYuzha.json       # Layer definitions - THE source of truth
/app/shared/config/Config.ts              # Config loader & transformer

# Phase 2: Layer Pipeline (15 min)
/app/shared/layer/layerCore.ts            # prepareLayer() - config → base data
/app/shared/layer/layer.ts                # Processor registry & pipeline
/app/shared/layer/layerSpin.ts            # Example processor: rotation
/app/shared/layer/layerOrbit.ts           # Example processor: circular motion
/app/shared/stage/StageSystem.ts          # Orchestrates everything
```

## 2️⃣ Understand the Architecture:

```
ConfigYuzha.json (user edits layers here)
    ↓
Config.ts (loads, validates, flattens)
    ↓
StageSystem.createStagePipeline()
    ↓
For each layer:
  - layerCore.prepareLayer() → base data
  - getProcessorsForEntry() → attach behaviors (spin, orbit, etc.)
    ↓
Renderer displays (DOM/Canvas/Three.js)
    ↓
Each frame: run processors → update → render
```

## 3️⃣ Key Concepts:

**Config Structure:**
```json
{
  \"LayerID\": \"my-layer\",
  \"ImageID\": \"ASSET_ID\",
  \"renderer\": \"2D\",
  \"LayerOrder\": 100,
  \"ImageScale\": [100, 100],
  \"groups\": {
    \"Basic Config\": { /* static positioning */ },
    \"Spin Config\": { /* rotation animation */ },
    \"Orbital Config\": { /* circular motion */ }
  }
}
```

**Processor Pattern:**
```typescript
// 1. Create processor function
export function createMyProcessor(config): LayerProcessor {
  return (layer, timestamp) => ({
    ...layer,
    myNewProperty: calculateSomething(layer, timestamp)
  });
}

// 2. Register processor
registerProcessor({
  name: \"my-processor\",
  shouldAttach: (entry) => entry.myConfigProperty !== undefined,
  create: (entry) => createMyProcessor(entry)
});
```

## 4️⃣ Critical Facts:

- **Fixed 2048x2048 stage** - all coordinates in this space
- **Processors are plugins** - attach based on config conditions
- **Groups are optional** - layers can have Core only, or Core + any groups
- **LayerOrder = render order** - lower drawn first (background)
- **Hot reload enabled** - edit ConfigYuzha.json to see changes

## 5️⃣ Common Tasks:

**Add a new layer:**
1. Edit `/app/shared/config/ConfigYuzha.json`
2. Add entry with required Core properties
3. Save and see live reload

**Add a new processor:**
1. Create `/app/shared/layer/layerMyFeature.ts`
2. Implement processor matching existing patterns
3. Register in `/app/shared/layer/layer.ts`
4. Add types to `Config.ts` if needed

**Debug a layer:**
1. Check console for validation warnings
2. Verify LayerOrder (drawing order)
3. Check coordinates are in 0-2048 range
4. Verify ImageID exists in ImageRegistry.json

## 6️⃣ Testing:

```bash
# View logs
tail -f /var/log/supervisor/yuzha.*.log

# Check service status
sudo supervisorctl status

# App runs on port 3000
curl http://localhost:3000
```

## 7️⃣ File Map:

```
/app/shared/config/ConfigYuzha.json  ← Edit layers here!
/app/shared/config/Config.ts         ← Types & validation
/app/shared/layer/layer.ts           ← Processor registry
/app/shared/layer/layerCore.ts       ← Base preparation
/app/shared/layer/layerSpin.ts       ← Spin processor example
/app/shared/layer/layerOrbit.ts      ← Orbit processor example
/app/shared/stage/StageSystem.ts     ← Pipeline orchestrator
/app/yuzha/src/MainScreen.tsx        ← Entry point
```

## 8️⃣ Your First Task:

1. Read `/app/docs/ai-agent-onboarding.md` for detailed guide
2. View `/app/shared/config/ConfigYuzha.json` to see layer examples
3. Trace one layer through the pipeline:
   - Config entry → prepareLayer() → processor attachment → renderer
4. Ask clarifying questions about the specific feature to implement

---

**Now you're ready to work on this codebase!** Start by exploring the config system and following a layer through the pipeline.
"
Observation: Create successful: /app/docs/quick-start-prompt.md