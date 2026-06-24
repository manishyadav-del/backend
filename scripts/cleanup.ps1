# Windows-compatible cleanup script for Next.js/Turborepo projects
# Fixes EINVAL readlink errors and OneDrive sync issues

param(
    [switch]$Force,
    [switch]$SkipOneDriveWarning
)

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next.js/Turborepo Cache Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from OneDrive
$currentPath = Get-Location
if ($currentPath.Path -like "*OneDrive*" -and -not $SkipOneDriveWarning) {
    Write-Host "WARNING: Project is located in OneDrive directory!" -ForegroundColor Yellow
    Write-Host "OneDrive can cause file locking and sync issues with Node.js." -ForegroundColor Yellow
    Write-Host "Consider moving your project outside OneDrive for better stability." -ForegroundColor Yellow
    Write-Host ""
    if (-not $Force) {
        $response = Read-Host "Do you want to continue anyway? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Host "Cleanup cancelled." -ForegroundColor Red
            exit 1
        }
    }
}

# Stop any running Node.js processes
Write-Host "[1/6] Stopping Node.js processes..." -ForegroundColor Green
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✓ Node.js processes stopped" -ForegroundColor Green
Write-Host ""

# Clear Next.js cache
Write-Host "[2/6] Clearing Next.js cache (.next)..." -ForegroundColor Green
$nextDirs = Get-ChildItem -Path . -Directory -Filter ".next" -Recurse -Depth 2 -ErrorAction SilentlyContinue
foreach ($dir in $nextDirs) {
    Write-Host "  Removing: $($dir.FullName)" -ForegroundColor Gray
    Remove-Item $dir.FullName -Recurse -Force
}
Write-Host "✓ Next.js cache cleared" -ForegroundColor Green
Write-Host ""

# Clear Turborepo cache
Write-Host "[3/6] Clearing Turborepo cache (.turbo)..." -ForegroundColor Green
$turboDirs = Get-ChildItem -Path . -Directory -Filter ".turbo" -Recurse -Depth 2 -ErrorAction SilentlyContinue
foreach ($dir in $turboDirs) {
    Write-Host "  Removing: $($dir.FullName)" -ForegroundColor Gray
    Remove-Item $dir.FullName -Recurse -Force
}
Write-Host "✓ Turborepo cache cleared" -ForegroundColor Green
Write-Host ""

# Clear npm cache
Write-Host "[4/6] Clearing npm cache..." -ForegroundColor Green
npm cache clean --force 2>&1 | Out-Null
Write-Host "✓ npm cache cleared" -ForegroundColor Green
Write-Host ""

# Clear node_modules/.cache
Write-Host "[5/6] Clearing node_modules cache..." -ForegroundColor Green
$cacheDirs = Get-ChildItem -Path . -Directory -Filter "node_modules" -Recurse -Depth 2 -ErrorAction SilentlyContinue
foreach ($dir in $cacheDirs) {
    $cachePath = Join-Path $dir.FullName ".cache"
    if (Test-Path $cachePath) {
        Write-Host "  Removing: $cachePath" -ForegroundColor Gray
        Remove-Item $cachePath -Recurse -Force
    }
}
Write-Host "✓ node_modules cache cleared" -ForegroundColor Green
Write-Host ""

# Clear temporary files
Write-Host "[6/6] Clearing temporary build artifacts..." -ForegroundColor Green
$tempPatterns = @("*.tmp", "*.temp", "*.log", ".DS_Store", "Thumbs.db")
foreach ($pattern in $tempPatterns) {
    Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
}
Write-Host "✓ Temporary files cleared" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Cleanup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'npm install' to reinstall dependencies" -ForegroundColor White
Write-Host "  2. Run 'npm run db:generate --workspace=apps/web' to regenerate Prisma client" -ForegroundColor White
Write-Host "  3. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host ""
Write-Host "If you continue to experience issues, consider:" -ForegroundColor Yellow
Write-Host "  - Moving the project outside OneDrive" -ForegroundColor Yellow
Write-Host "  - Disabling OneDrive sync for the project directory" -ForegroundColor Yellow
Write-Host "  - Adding the project to OneDrive's excluded folders list" -ForegroundColor Yellow