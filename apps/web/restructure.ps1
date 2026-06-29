$base = "c:\Users\manis\OneDrive\Desktop\ahealthcare\gobal-backend\apps\web\src\app"
$dashSrc = Join-Path $base "(dashboard)"
$dashDest = Join-Path $base "dashboard"

# Use robocopy to copy locked folders
function RoboCopyDir($from, $to) {
    if (Test-Path -LiteralPath $from) {
        robocopy $from $to /E /COPYALL /R:0 /W:0 | Out-Null
    }
}

# 1. Create top-level dashboard folder
New-Item -ItemType Directory -Path $dashDest -Force | Out-Null

# 2. Copy layout
$layoutSrc = Join-Path $dashSrc "layout.jsx"
if (Test-Path -LiteralPath $layoutSrc) {
    Copy-Item -LiteralPath $layoutSrc -Destination (Join-Path $dashDest "layout.jsx") -Force
}

# 3. Copy all folders from (dashboard)/dashboard/* to dashboard/ using robocopy
$innerDash = Join-Path $dashSrc "dashboard"
Get-ChildItem -LiteralPath $innerDash | ForEach-Object {
    $destPath = Join-Path $dashDest $_.Name
    if ($_.PSIsContainer) {
        RoboCopyDir $_.FullName $destPath
    } else {
        Copy-Item -LiteralPath $_.FullName -Destination $destPath -Force
    }
}

# 4. Copy (dashboard)/users, projects, user-dashboard to dashboard/
@("users", "projects", "user-dashboard") | ForEach-Object {
    $p = Join-Path $dashSrc $_
    $dest = Join-Path $dashDest $_
    if (Test-Path -LiteralPath $p) {
        RoboCopyDir $p $dest
    }
}

Write-Host "Dashboard restructuring complete"
