# Counter2 Workspace Migration

## Changes Made

### Phase 1: Cleanup (Completed)
- Removed non-functional renderer settings from Counter2Settings
- Removed: Low-End Mode, Show Debug Info, FPS Limit toggles
- Kept: All functional settings and automatic device detection

### Phase 2: Position Controls (Completed)
- Added X/Y position controls for:
  - Floating button position
  - Display message position
- Stage coordinates: 0-2048 range
- Matches Counter feature parity (except demo effects)

### Phase 3: Workspace Separation (Completed)
- Created independent counter2 workspace
- Runs on port 3002
- Maintains integration with yuzha mainscreen
- Can be deployed separately

## File Structure
```
/app/
├── counter2/              (NEW - standalone workspace)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── counter2Screen.tsx
│   │   ├── counter2Settings.tsx
│   │   ├── counter2Floating.tsx
│   │   ├── counter2FloatingButton.tsx
│   │   ├── counter2Buttons.tsx
│   │   └── counter2CountDisplay.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
└── yuzha/                 (MODIFIED - links to counter2)
    └── src/
        └── counter2/      (original location, still functional)
```

## Testing Checklist
- [x] Counter2 works within yuzha (port 3000)
- [x] Counter2 works standalone (port 3002)
- [x] Position controls functional
- [x] Settings persist correctly
- [x] No console errors in logs
- [x] Both services running simultaneously
- [x] Right-click navigation to standalone added
- [x] Back/Home button behavior updated
- [x] Workspace configuration complete

## Service Status
- **Yuzha**: Running on port 3000 (pid 434)
- **Meng**: Running on port 3001 (pid 531)
- **Counter2**: Running on port 3002 (pid 1440)

## Implementation Details

### Changes to counter2Screen.tsx
- Updated Back button to show "Home" when onBack is undefined
- Added redirect to localhost:3000 for standalone mode
- Maintains backward compatibility with integrated mode

### Changes to MainScreenUtils.tsx
- Added onContextMenu handler to Counter2 button
- Right-click opens Counter2 in new tab (port 3002)
- Added tooltip: "Click: Open locally | Right-click: Open in new tab"

### Supervisor Configuration
Created `/app/counter2.conf`:
- Command: `npm run dev:counter2`
- Port: 3002
- Autostart: false (manual start only)
- Independent from yuzha service

### Package.json Updates
- Added counter2 to workspaces array
- Scripts already present:
  - `dev:counter2`: Run development server
  - `build:counter2`: Build for production
  - `preview:counter2`: Preview production build

## Usage

### Start Counter2 Standalone
```bash
sudo supervisorctl start counter2
# Access at http://localhost:3002
```

### Stop Counter2
```bash
sudo supervisorctl stop counter2
```

### Check Status
```bash
sudo supervisorctl status
```

### View Logs
```bash
tail -f /var/log/supervisor/counter2.out.log
tail -f /var/log/supervisor/counter2.err.log
```

## Migration Complete ✅
All phases completed successfully. Counter2 now operates as both:
1. Integrated feature within yuzha (port 3000)
2. Standalone application (port 3002)

Both modes share the same codebase with intelligent navigation handling.
