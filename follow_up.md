# Stage2048 Display Centering Issue - Handover Document

## Issue Summary
Clock/celestial diagram not displaying centered correctly in Chrome DevTools device mode, especially on narrow/portrait viewports.

## Root Cause
The `stage2048.ts` transform system had incorrect centering logic that didn't properly implement CSS "cover" behavior for responsive scaling.

---

## Technical Context

### System Architecture
- **Design Space:** Fixed 2048×2048 coordinate system
- **Renderers:** Two renderers (Canvas 2D & Three.js WebGL) share same transform
- **Transform Layer:** `stage2048.ts` handles all viewport-to-stage coordinate conversion
- **Location:** `/app/shared/utils/stage2048.ts`

### How It Works
1. All content positioned in 2048×2048 space (center = [1024, 1024])
2. `computeCoverTransform()` calculates scale to fill viewport
3. `createStageTransformer()` applies CSS transforms to container
4. Content automatically centers and scales proportionally

---

## Changes Made

### File Modified: `/app/shared/utils/stage2048.ts`

#### 1. Fixed `computeCoverTransform()` function (lines 35-52)

**Before:**
```typescript
const scale = Math.max(viewportWidth / STAGE_SIZE, viewportHeight / STAGE_SIZE);
// But applyTransform wasn't using offsetX/offsetY correctly
```

**After:**
```typescript
export function computeCoverTransform(
  viewportWidth: number,
  viewportHeight: number
): StageTransform {
  // Cover behavior: scale to fill viewport (use larger scale to cover)
  const scaleX = viewportWidth / STAGE_SIZE;
  const scaleY = viewportHeight / STAGE_SIZE;
  const scale = Math.max(scaleX, scaleY); // Use larger scale for cover
  
  const width = STAGE_SIZE * scale;
  const height = STAGE_SIZE * scale;
  
  return {
    scale,
    offsetX: (viewportWidth - width) / 2,
    offsetY: (viewportHeight - height) / 2,
    width,
    height,
  };
}
```

**Key:** `Math.max(scaleX, scaleY)` ensures viewport is always filled.

#### 2. Fixed `applyTransform()` function (lines 94-109)

**Before:**
```typescript
// Used 50% positioning with translate(-50%, -50%)
container.style.left = "50%";
container.style.top = "50%";
container.style.transformOrigin = "center center";
container.style.transform = `translate(-50%, -50%) scale(${scale})`;
```

**After:**
```typescript
const applyTransform = () => {
  const { innerWidth, innerHeight } = window;
  const { scale, offsetX, offsetY } = computeCoverTransform(innerWidth, innerHeight);
  
  // Set canvas size
  canvas.style.width = `${STAGE_SIZE}px`;
  canvas.style.height = `${STAGE_SIZE}px`;
  
  // Set container size and transform
  container.style.width = `${STAGE_SIZE}px`;
  container.style.height = `${STAGE_SIZE}px`;
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.transformOrigin = "top left";
  container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
};
```

**Key Changes:**
- Position from top-left (0, 0) instead of center (50%, 50%)
- Transform origin: `top left` instead of `center center`
- Use calculated `offsetX` and `offsetY` for precise centering
- Transform: `translate(offsetX, offsetY) scale(scale)`

---

## Reference Implementation

User provided working implementation: `stage2048Module.ts`

**Key difference identified:**
- Working version uses `translate(offsetX, offsetY)` with top-left origin
- Previous code tried to use `translate(-50%, -50%)` which didn't account for different viewport aspect ratios

---

## Testing Results

### Verified Viewports:
✅ iPhone Portrait (375×667) - Centered
✅ iPhone Portrait (390×844) - Centered
✅ iPad Portrait (768×1024) - Centered
✅ iPad Portrait (820×1180) - Centered
✅ Desktop (1920×1080) - Centered
✅ Landscape Phone (667×375) - Centered
✅ Landscape (844×390) - Centered
✅ Square (1024×1024) - Centered
✅ Ultra-wide (2560×1080) - Centered

### Behavior Confirmed:
- ✅ Portrait: Fills height, crops width edges
- ✅ Landscape: Fills width, crops height edges
- ✅ Content scales proportionally (no distortion)
- ✅ Center point [1024, 1024] always visible and centered

---

## How Content Scaling Works

### Question: Does stage2048 convert inputs correctly?
**Answer:** YES
- All layer configs use 2048×2048 coordinates
- Example: `ConfigYuzha.json` sets position: `[1024, 1024]` (center)
- No conversion needed in individual files
- Stage system handles all viewport transformation automatically

### Question: Does it scale to viewport correctly?
**Answer:** YES
- `Math.max(scaleX, scaleY)` ensures viewport is always covered
- Calculates single scale factor based on viewport dimensions
- Applies uniform scale to entire 2048×2048 canvas

### Question: Does content scale proportionally?
**Answer:** YES
- Single scale value applied to entire stage
- All content maintains aspect ratio
- No distortion regardless of viewport shape

### Coordinate Flow:
```
Design (2048×2048) → computeCoverTransform() → CSS Transform → Viewport Display
   [1024, 1024]         scale + offsets           browser          Centered
```

---

## Files Involved

### Core Transform:
- `/app/shared/utils/stage2048.ts` - Transform calculations & CSS application

### Renderers (both use same transform):
- `/app/shared/stages/StageCanvas.tsx` - Canvas 2D renderer
- `/app/shared/stages/StageThree.tsx` - Three.js WebGL renderer

### Layer System:
- `/app/shared/config/ConfigYuzha.json` - Layer positions (all at [1024, 1024])
- `/app/shared/layer/LayerCore.ts` - Layer transform calculations
- `/app/shared/layer/LayerEngineCanvas.ts` - Canvas rendering with centering
- `/app/shared/layer/LayerEngineThree.ts` - Three.js rendering with centering

### Application:
- `/app/yuzha/src/MainScreen.tsx` - Main component mounting stage
- `/app/yuzha/src/App.tsx` - Root app component

---

## Setup Information

### Project Structure:
```
/app/
├── yuzha/                    # Main application source
│   ├── src/
│   │   ├── App.tsx
│   │   ├── MainScreen.tsx
│   │   └── index.css
│   └── package.json
├── shared/                   # Shared utilities
│   ├── utils/
│   │   └── stage2048.ts     # ← FIXED FILE
│   ├── stages/
│   │   ├── StageCanvas.tsx
│   │   └── StageThree.tsx
│   ├── layer/
│   └── config/
└── package.json              # Root package.json

```

### Running the App:
```bash
cd /app
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
```

### Supervisor (Production):
```bash
sudo supervisorctl restart yuzha
sudo supervisorctl status yuzha
```

---

## Key Learnings

### What Worked:
1. **Math.max() for cover behavior** - Always use larger scale factor
2. **Top-left origin** - More predictable than center-based transforms
3. **Calculated offsets** - Use offsetX/offsetY from transform calculation
4. **Single transform function** - Both renderers use same centering logic

### What Didn't Work:
1. **Orientation-based logic** - Manually checking portrait vs landscape
2. **Percentage-based centering** - `translate(-50%, -50%)` without proper offset
3. **Center origin transforms** - Less predictable with different aspect ratios

### Why Cover Behavior Matters:
- **Cover:** Always fills viewport, may crop edges (like CSS `background-size: cover`)
- **Contain:** Always shows full content, may leave empty space (not used here)
- This app needs **cover** so celestial clock always fills screen

---

## Troubleshooting

### If centering breaks again:

1. **Check `computeCoverTransform()`:**
   - Must use `Math.max(scaleX, scaleY)`
   - Must calculate offsetX and offsetY correctly
   - Must return all 5 values: scale, offsetX, offsetY, width, height

2. **Check `applyTransform()`:**
   - Must use offsetX and offsetY (not just scale)
   - Must set `transformOrigin: "top left"`
   - Must position container at left: 0, top: 0
   - Must apply `translate(${offsetX}px, ${offsetY}px) scale(${scale})`

3. **Check container overflow:**
   - Parent must have `overflow: hidden` to clip scaled content
   - `.app-shell` in `index.css` should have this

4. **Browser cache:**
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Clear browser cache
   - Check if Vite HMR is working

### Debug Tips:
```javascript
// Add to applyTransform() for debugging:
console.log('Transform:', {
  viewport: `${innerWidth}×${innerHeight}`,
  scale: scale.toFixed(3),
  offset: `${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}`
});
```

---

## Next Steps (If Issues Persist)

1. **Verify hot reload is working** - Changes should appear immediately
2. **Check browser console** - Look for errors or warnings
3. **Test with cache disabled** - DevTools → Network → Disable cache
4. **Compare with reference** - Use provided `stage2048Module.ts` as reference
5. **Check layer positioning** - Verify ConfigYuzha.json has [1024, 1024]

---

## Contact Points

### Key Questions to Ask:
- "Is the issue in all browsers or just Chrome DevTools?"
- "Does hard refresh fix it temporarily?"
- "Are there any console errors?"
- "Which viewport size specifically shows the problem?"

### Files to Check:
1. `/app/shared/utils/stage2048.ts` (transform logic)
2. `/app/yuzha/src/index.css` (overflow settings)
3. `/app/shared/config/ConfigYuzha.json` (layer positions)

---

## Summary

**Problem:** Clock not centered in device viewports
**Solution:** Fixed transform calculation to use proper cover behavior with calculated offsets
**Result:** Clock centered in all tested viewports (portrait, landscape, square, ultra-wide)
**Impact:** Both Canvas and Three.js renderers now display correctly across all device sizes

The stage2048 system now correctly:
- ✅ Scales 2048×2048 design to any viewport size
- ✅ Maintains proportional content scaling
- ✅ Centers content using CSS cover behavior
- ✅ Works across all device orientations and aspect ratios
