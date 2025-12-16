# Counter2 - Standalone Workspace

Optimized counter application with Canvas2D rendering and automatic device detection.

## Features
- Tap counting with haptic feedback
- Customizable button/display size and position
- Stage-based coordinate system (2048×2048)
- Automatic low-end device optimization
- Persistent count storage
- Position controls for button and display elements

## Development

### Run within Yuzha (integrated)
Counter2 is accessible from the main yuzha launcher on port 3000.
- Long press on screen → Counter2 button
- Right-click Counter2 button → Opens standalone version in new tab

### Run standalone
```bash
npm run dev:counter2
# Access at http://localhost:3002
```

Or using supervisor:
```bash
sudo supervisorctl start counter2
```

### Build
```bash
npm run build:counter2
```

### Preview
```bash
npm run preview:counter2
```

## Deployment
Counter2 can be deployed independently from yuzha workspace.

- **Standalone URL**: Port 3002
- **Integrated**: Available via yuzha mainscreen on port 3000

## Architecture
- **Framework**: React 18 + TypeScript + Vite
- **Rendering**: Canvas2D with shared layer pipeline
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Device Detection**: Automatic performance optimization

## Settings
All settings are accessible via the settings button:
- Haptic Feedback (vibration on tap)
- Sound Effects (audio on tap)
- Button Size (150-400px)
- Display Size (150-400px)
- Font Size (40-150px)
- Text Color (color picker)
- Button Position (X/Y coordinates 0-2048)
- Display Position (X/Y coordinates 0-2048)

## Files Structure
```
/app/counter2/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles
│   ├── counter2Screen.tsx          # Main screen component
│   ├── counter2Settings.tsx        # Settings modal
│   ├── counter2Floating.tsx        # Floating info panel
│   ├── counter2FloatingButton.tsx  # Counter button
│   ├── counter2CountDisplay.tsx    # Count display
│   └── counter2Buttons.tsx         # Control buttons
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## Navigation
- **Back/Home Button**: Returns to yuzha mainscreen (when integrated) or redirects to localhost:3000 (when standalone)
- **Settings Button**: Opens settings modal
- **Reset Button**: Resets count to 0
- **Info Button**: Shows floating information panel
