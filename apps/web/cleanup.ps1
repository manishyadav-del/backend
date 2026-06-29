$base = "c:\Users\manis\OneDrive\Desktop\ahealthcare\gobal-backend\apps\web\src\app"

# 1. Rename blog -> blogs
$blogSrc = Join-Path $base "dashboard\blog"
$blogDest = Join-Path $base "dashboard\blogs"
if ((Test-Path -LiteralPath $blogSrc) -and -not (Test-Path -LiteralPath $blogDest)) {
    Rename-Item -LiteralPath $blogSrc -NewName "blogs" -Force
    Write-Host "Renamed blog -> blogs"
}

# 2. Delete the old (dashboard) route group
$oldDash = Join-Path $base "(dashboard)"
if (Test-Path -LiteralPath $oldDash) {
    Remove-Item -LiteralPath $oldDash -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Deleted (dashboard) route group"
} else {
    Write-Host "(dashboard) already removed"
}

Write-Host "Rename and cleanup complete"
