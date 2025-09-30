# 🚀 Quick Command Reference

## Development Commands

### Start Development Server
```bash
npm run dev              # Auto-detect port (3000 Emergent / 5000 Replit)
npm run dev:3000         # Force port 3000
npm run dev:5000         # Force port 5000
npm run dev:debug        # Debug mode with verbose Vite logs
npm run dev:host         # Expose to network
```

### Build Commands
```bash
npm run build            # Full build with TypeScript checking
npm run build:fast       # Fast production build (skip TypeScript)
npm run build:analyze    # Build with bundle analysis
```

### Preview Production Build
```bash
npm run preview          # Preview build (auto-detect port)
npm run preview:3000     # Preview on port 3000
npm run preview:5000     # Preview on port 5000
npm run preview:prod     # Build and preview in one command
```

## Code Quality

### Linting
```bash
npm run lint             # Lint all files
npm run lint:fix         # Fix linting issues automatically
npm run lint:shared      # Lint shared files only
npm run lint:shared:fix  # Fix shared files linting
```

### Type Checking
```bash
npm run typecheck        # Type check all files
npm run typecheck:shared # Type check shared files only
```

### Formatting
```bash
npm run format           # Check formatting
npm run format:fix       # Fix formatting issues
```

## Testing

```bash
npm run test             # Run tests once
npm run test:watch       # Watch mode for tests
npm run test:cov         # Run tests with coverage report
```

## Maintenance

### Clean Commands
```bash
npm run clean            # Clean build artifacts and cache
npm run clean:cache      # Clean Vite cache only
npm run clean:all        # Clean everything including node_modules
```

### Dependency Management
```bash
npm install              # Install dependencies
npm run deps:update      # Update dependencies and check outdated
npm run deps:audit       # Security audit and fix
```

### Image Registry
```bash
npm run sync:image       # Sync image registry
```

## Supervisor (Emergent Only)

### Service Control
```bash
sudo supervisorctl status yuzha          # Check app status
sudo supervisorctl start yuzha           # Start app
sudo supervisorctl stop yuzha            # Stop app
sudo supervisorctl restart yuzha         # Restart app
sudo supervisorctl restart all           # Restart all services
```

### View Logs
```bash
# Real-time logs
tail -f /var/log/supervisor/yuzha.out.log
tail -f /var/log/supervisor/yuzha.err.log

# Last 50 lines
tail -n 50 /var/log/supervisor/yuzha.out.log
tail -n 50 /var/log/supervisor/yuzha.err.log

# View all logs
cat /var/log/supervisor/yuzha.out.log
cat /var/log/supervisor/yuzha.err.log
```

### Service Management
```bash
sudo supervisorctl reread                # Reload config
sudo supervisorctl update                # Apply config changes
sudo supervisorctl status                # All services status
```

## Environment Detection

The app automatically detects your platform:

| Platform | Detection | Default Port |
|----------|-----------|--------------|
| **Emergent** | `KUBERNETES_SERVICE_HOST` | 3000 |
| **Replit** | `REPL_ID` or `REPL_SLUG` | 5000 |
| **Local** | Neither detected | 3000 |

### Manual Port Override
```bash
PORT=8080 npm run dev    # Use any port
```

## Troubleshooting

### App Not Starting
```bash
# Check logs
tail -f /var/log/supervisor/yuzha.err.log

# Clear cache and restart
npm run clean:cache
sudo supervisorctl restart yuzha
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Hot Reload Not Working
```bash
# Restart Vite dev server
sudo supervisorctl restart yuzha

# Or clear cache first
npm run clean:cache && sudo supervisorctl restart yuzha
```

### Build Errors
```bash
# Clean everything and reinstall
npm run clean:all
npm install
npm run build
```

### TypeScript Errors
```bash
# Check types
npm run typecheck

# Sometimes cache causes issues
rm -rf **/*.tsbuildinfo
npm run typecheck
```

## Workspace Commands

Since this is a monorepo, you can run commands in specific workspaces:

```bash
# Run in yuzha workspace
npm run dev --workspace yuzha
npm run build --workspace yuzha

# Or use workspace prefix (same as above)
npm run dev         # Automatically runs in yuzha
```

## CI/CD Commands

```bash
npm run ci:verify    # Full verification (lint + typecheck + test + build)
```

## Quick Development Workflows

### Fresh Start
```bash
git pull
npm install
npm run dev
```

### Before Committing
```bash
npm run format:fix
npm run lint:fix
npm run typecheck
npm run test
```

### Production Build & Test
```bash
npm run build:fast
npm run preview:prod
```

### Debug Performance Issues
```bash
npm run dev:debug
npm run build:analyze
```

## Environment Variables

### Check Current Environment
```bash
echo "Platform: $KUBERNETES_SERVICE_HOST (Emergent) or $REPL_ID (Replit)"
echo "Port: $PORT"
echo "Node Env: $NODE_ENV"
```

### Set Environment Variables
```bash
# For current session
export PORT=3000
export NODE_ENV=production

# For single command
PORT=3000 NODE_ENV=production npm run dev
```

## Useful Aliases (Optional)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias ydev="npm run dev"
alias ybuild="npm run build:fast"
alias ylogs="tail -f /var/log/supervisor/yuzha.out.log"
alias yerr="tail -f /var/log/supervisor/yuzha.err.log"
alias yrestart="sudo supervisorctl restart yuzha"
alias ystatus="sudo supervisorctl status yuzha"
```

## Platform-Specific Tips

### Emergent
- App runs on port 3000 by default
- Managed by supervisor (auto-restart enabled)
- Logs in `/var/log/supervisor/`
- Use `sudo supervisorctl` for service management

### Replit
- App runs on port 5000 by default
- Use "Run" button or `npm start`
- Hot reload works automatically
- Check Replit console for logs

### Local Development
- Default port 3000
- Run `npm run dev` directly
- Logs in terminal
- Manual restart needed

## Performance Tips

1. **Use cache:** Build cache is enabled by default
2. **Skip TypeScript in dev:** Use `build:fast` for quick builds
3. **Clean cache if slow:** `npm run clean:cache`
4. **Parallel operations:** Use `concurrently` for multiple tasks

## Getting Help

- Check logs: `tail -f /var/log/supervisor/yuzha.err.log`
- Check status: `sudo supervisorctl status yuzha`
- Clear cache: `npm run clean:cache`
- Fresh install: `npm run clean:all && npm install`

---

**Last Updated:** January 2025  
**Version:** 0.1.0