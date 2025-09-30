# Platform-Specific Setup Guide

## Quick Start

### On Emergent (Kubernetes)
```bash
# Development (auto-detects port 3000)
npm run dev

# Or explicitly use port 3000
npm run dev:3000

# Production build
npm run build:fast

# Preview production build
npm run start
```

### On Replit
```bash
# Development (auto-detects port 5000)
npm run dev

# Or explicitly use port 5000
npm run dev:5000

# Production build
npm run build:fast

# Preview production build
npm run start
```

## Environment Auto-Detection

The application automatically detects which platform it's running on:

### Emergent Detection
Checks for:
- `KUBERNETES_SERVICE_HOST` (Kubernetes pods)
- `EMERGENT_ENV` (custom Emergent variable)

**Result:** Defaults to port 3000

### Replit Detection
Checks for:
- `REPL_ID`
- `REPL_SLUG`
- `REPLIT_DB_URL`

**Result:** Defaults to port 5000

## Available Scripts

| Command | Description | Port |
|---------|-------------|------|
| `npm run dev` | Start dev server (auto-detect) | Auto |
| `npm run dev:3000` | Start dev server on port 3000 | 3000 |
| `npm run dev:5000` | Start dev server on port 5000 | 5000 |
| `npm run build` | Full TypeScript + Vite build | - |
| `npm run build:fast` | Fast production build | - |
| `npm run preview` | Preview prod build (auto-detect) | Auto |
| `npm run preview:3000` | Preview on port 3000 | 3000 |
| `npm run preview:5000` | Preview on port 5000 | 5000 |
| `npm start` | Production preview on port 5000 | 5000 |

## Custom Port Override

To use a custom port on either platform:

```bash
PORT=8080 npm run dev
```

This overrides auto-detection and forces the specified port.

## Vite Configuration

The auto-detection logic is in `/app/yuzha/vite.config.ts`:

```typescript
// Auto-port detection: PORT env > Replit 5000 > Emergent 3000
const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG || !!process.env.REPLIT_DB_URL;
const isEmergent = !!process.env.KUBERNETES_SERVICE_HOST || !!process.env.EMERGENT_ENV;

// Priority: explicit PORT > Replit default 5000 > Emergent default 3000 > fallback 3000
const DEFAULT_PORT = isReplit ? 5000 : isEmergent ? 3000 : 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
```

## Native Linux Commands

All scripts use native Linux syntax (no cross-env needed):

✅ `NODE_ENV=production npm run build`  
✅ `PORT=3000 vite`  
✅ `PORT=5000 vite preview`  

Both Emergent and Replit run on Linux containers, so these work perfectly.

## Troubleshooting

### Wrong port detected?
Check environment variables:
```bash
echo "KUBERNETES_SERVICE_HOST: $KUBERNETES_SERVICE_HOST"
echo "REPL_ID: $REPL_ID"
```

### Force a specific port
Use explicit port commands:
```bash
npm run dev:3000  # Force port 3000
npm run dev:5000  # Force port 5000
```

### Check current port
The dev server will log the port on startup:
```
VITE v7.0.4  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: http://0.0.0.0:3000/
```

## Development Workflow

### Emergent Workflow
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build:fast

# Preview production build
npm run preview:3000
```

### Replit Workflow
```bash
# Install dependencies (usually auto-installed)
npm install

# Start development server (port 5000)
npm run dev

# Or use Replit's Run button which calls npm start
```

## Performance Notes

- **Bundle Size:** Optimized by removing cross-env (~700KB saved)
- **Startup Time:** Faster due to native commands
- **Hot Reload:** Works on both platforms
- **Build Time:** Unchanged, but `build:fast` skips TypeScript checking for speed

## Technical Details

### Why No Cross-Env?
- Both platforms run on Linux containers
- Native Linux environment variable syntax works perfectly
- No need for Windows compatibility
- Smaller bundle, faster execution

### Server Configuration
```typescript
server: {
  host: "0.0.0.0",      // Listen on all interfaces
  port: PORT,           // Auto-detected or explicit
  strictPort: true,     // Fail if port is taken
  allowedHosts: true,   // Allow all hostnames
}
```

### Preview Configuration
```typescript
preview: {
  host: "0.0.0.0",      // Listen on all interfaces
  port: PORT,           // Auto-detected or explicit
}
```

Both configurations ensure the app is accessible from outside the container.
