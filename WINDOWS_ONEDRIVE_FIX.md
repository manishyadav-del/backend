# Windows & OneDrive Compatibility Fix

## Problem Diagnosis

The `EINVAL: invalid argument, readlink` error was caused by:

1. **OneDrive File Locking**: OneDrive's real-time sync creates file locks that interfere with Node.js file system operations
2. **Corrupted Build Caches**: Invalid symlinks in `.next` and `.turbo` directories
3. **Windows Path Limitations**: Long paths in OneDrive directories exceed Windows defaults
4. **Webpack File Watching**: Network/synced drives cause file watcher issues

## Root Cause

```
EINVAL: invalid argument, readlink 'apps/web/.next/server/interception-route-rewrite-manifest.js'
```

This error occurs when:
- OneDrive locks files during sync operations
- Next.js tries to read symlinks that OneDrive has locked
- Turborepo cache contains corrupted file references
- Webpack's file watcher encounters network drive latency

## Solutions Implemented

### 1. Next.js Configuration (`apps/web/next.config.mjs`)

```javascript
// Windows and OneDrive compatibility fixes
outputFileTracing: false,  // Disable file tracing that causes readlink errors
cacheHandlers: undefined,   // Disable custom cache handlers
serverExternalPackages: ['@prisma/client', 'bcryptjs'],  // Externalize native modules
webpack: (config, { dev }) => {
  if (dev) {
    config.watchOptions = {
      poll: 1000,           // Use polling for file watching
      aggregateTimeout: 300 // Wait for file changes to settle
    };
  }
  return config;
}
```

**Why these settings work:**
- `outputFileTracing: false` prevents Next.js from creating symlinks that OneDrive locks
- `serverExternalPackages` keeps native modules outside the build process
- `watchOptions.poll` uses polling instead of native file system events, which works better on network drives

### 2. NPM Configuration (`.npmrc` and `apps/web/.npmrc`)

```ini
# Use hoisted layout to prevent symlink issues on Windows
node-linker=hoisted

# Disable package-lock to avoid file locking issues
package-lock=false

# Increase network timeouts for OneDrive sync delays
fetch-timeout=60000
fetch-retry-maxtimeout=120000
```

**Why these settings work:**
- `node-linker=hoisted` avoids symlinks in `node_modules` that OneDrive tries to sync
- Disabling package-lock prevents file locking during install
- Increased timeouts accommodate OneDrive's sync delays

### 3. Cache Clearing Scripts

#### NPM Scripts (in `package.json`)

```json
{
  "clean": "powershell -Command \"if (Test-Path .turbo) { Remove-Item .turbo -Recurse -Force }; if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }; Get-ChildItem -Path . -Directory -Filter .next | ForEach-Object { Remove-Item $_.FullName -Recurse -Force }\"",
  "clean:web": "powershell -Command \"if (Test-Path apps/web/.next) { Remove-Item apps/web/.next -Recurse -Force }; if (Test-Path apps/web/.turbo) { Remove-Item apps/web/.turbo -Recurse -Force }; if (Test-Path apps/web/node_modules) { Remove-Item apps/web/node_modules -Recurse -Force }\"",
  "clean:all": "npm run clean:web && npm run clean",
  "reinstall": "npm run clean:all && npm install && npm run db:generate --workspace=apps/web",
  "clean:script": "powershell -ExecutionPolicy Bypass -File scripts/cleanup.ps1",
  "clean:script:force": "powershell -ExecutionPolicy Bypass -File scripts/cleanup.ps1 -Force"
}
```

#### PowerShell Script (`scripts/cleanup.ps1`)

A comprehensive cleanup script that:
- Stops all Node.js processes
- Clears `.next` caches recursively
- Clears `.turbo` caches recursively
- Clears npm cache
- Clears `node_modules/.cache`
- Removes temporary files
- Provides OneDrive warnings

### 4. Gitignore Updates

Added patterns for OneDrive lock files:
```
# OneDrive sync issues
*.tmp
*.temp
~$*
.~lock.*
.~lock.*#
```

## Usage

### Quick Cleanup

```bash
# Clean all caches
npm run clean:all

# Or use the PowerShell script for more control
npm run clean:script

# Force cleanup without OneDrive warning
npm run clean:script:force
```

### Full Reinstall

```bash
# Clean everything and reinstall
npm run reinstall
```

### Manual Cleanup

```bash
# Stop Node.js processes first
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove caches
if (Test-Path .turbo) { Remove-Item .turbo -Recurse -Force }
if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }
Get-ChildItem -Path . -Directory -Filter .next | ForEach-Object { Remove-Item $_.FullName -Recurse -Force }

# Reinstall
npm install
npm run db:generate --workspace=apps/web
```

## Starting the Development Server

### Option 1: Using Turborepo (Recommended)

```bash
npm run dev
```

This runs all packages in the Turborepo workspace.

### Option 2: Direct Next.js

```bash
cd apps/web
npm run dev
```

### Option 3: Using Next.js CLI

```bash
cd apps/web
npx next dev
```

## Prevention

### Best Practices

1. **Move Project Outside OneDrive** (Recommended)
   ```
   # Bad: OneDrive sync causes issues
   C:\Users\manis\OneDrive\Desktop\gobal-backend
   
   # Good: Local development directory
   C:\Projects\gobal-backend
   ```

2. **Exclude from OneDrive Sync**
   - Right-click project folder
   - Select "Always keep on this device" → OFF
   - Or add to OneDrive excluded folders

3. **Regular Cache Clearing**
   ```bash
   # Run this if you experience issues
   npm run clean:web
   ```

4. **Close VS Code Before Cleaning**
   - Ensure no processes are locking files
   - Run cleanup scripts from a different terminal

## Troubleshooting

### If EINVAL Error Persists (OneDrive `readlink` lockups)

Next.js in development mode (`next dev`) creates files like `.next/package.json` or `.next/app-build-manifest.json`. As soon as they are created, OneDrive sync client locks them. On subsequent startups, Next.js calls `readlink` on them, which fails with `EINVAL` because OneDrive has processed them as cloud reparse points.

To resolve this permanently, we have updated the `dev` script in both projects to automatically clean the `.next` directory using a cross-platform Node.js command before starting Next.js:

```json
"dev": "node -e \"try { require('fs').rmSync('.next', { recursive: true, force: true }); } catch (e) {}\" && next dev"
```

This ensures the development server always starts with a fresh `.next` directory, bypassing the `readlink` error entirely.

1. **Force manual cleanup and reinstall (if files are heavily locked):**
   ```bash
   npm run reinstall
   ```

2. **Check for file locks:**
   ```powershell
   # Find processes locking files
   Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*code*"}
   ```

3. **Disable OneDrive temporarily:**
   - Right-click OneDrive icon in system tray
   - Select "Pause syncing" → 2 hours
   - Run cleanup and start dev server

4. **Check path length:**
   ```powershell
   # Windows has 260 character path limit by default
   # Enable long paths in Group Policy or Registry
   ```

### If Webpack Chunk Loading Errors Occur

1. Clear `.next` cache:
   ```bash
   npm run clean:web
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

### If Missing Module Errors Occur

1. Reinstall dependencies:
   ```bash
   npm run reinstall
   ```

2. Regenerate Prisma client:
   ```bash
   npm run db:generate --workspace=apps/web
   ```

## Technical Details

### Why OneDrive Causes Issues

OneDrive uses file system filters that:
- Lock files during upload/sync
- Create temporary lock files (`.~lock.*`)
- Monitor file changes in real-time
- Interfere with Node.js's file watchers

### Why Windows Needs Special Configuration

Windows has:
- Different path separators (`\` vs `/`)
- File locking semantics that differ from Unix
- Path length limitations (MAX_PATH = 260)
- Different symlink behavior requiring admin privileges

### Why Turborepo Needs Cache Clearing

Turborepo caches:
- Build outputs with file paths
- Hash-based cache keys
- Symlinked dependencies
- File system metadata

When OneDrive modifies these files, the cache becomes invalid but Turborepo doesn't detect the changes.

## Verification Checklist

- [ ] No `EINVAL readlink` errors in console
- [ ] No chunk loading errors in browser
- [ ] No missing module errors
- [ ] `npm run dev` starts successfully
- [ ] Turborepo runs all packages correctly
- [ ] Hot reload works in development
- [ ] Prisma client generates without errors
- [ ] Application loads in browser at `http://localhost:3000`

## Additional Resources

- [Next.js on Windows](https://nextjs.org/docs/advanced-features/compiler#windows)
- [Turborepo Cache](https://turbo.build/repo/docs/core-concepts/caching)
- [OneDrive and Node.js](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/long-polling)

## Support

If issues persist:
1. Run `npm run clean:script:force` to clean all caches
2. Move project outside OneDrive
3. Disable antivirus real-time scanning for the project directory
4. Check Windows Event Viewer for file system errors