$modulesBase = "c:\Users\manis\OneDrive\Desktop\ahealthcare\gobal-backend\apps\web\src\modules"
$modules = @("auth","users","blogs","media","seo","analytics","settings","shared")
foreach ($m in $modules) {
    $dir = Join-Path $modulesBase $m
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $file = Join-Path $dir "index.js"
    if (-not (Test-Path $file)) {
        Set-Content -Path $file -Value "// $m module"
    }
}
Write-Host "Modules created"
