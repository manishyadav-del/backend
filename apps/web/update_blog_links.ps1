$srcRoot = "c:\Users\manis\OneDrive\Desktop\ahealthcare\gobal-backend\apps\web\src"

# Files to update - all .js, .jsx, .ts, .tsx files
$files = Get-ChildItem -LiteralPath $srcRoot -Recurse -Include "*.js","*.jsx","*.ts","*.tsx" -File

$replacements = 0
foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($content -match "'/dashboard/blog'" -or $content -match '"/dashboard/blog"') {
        $newContent = $content `
            -replace "'/dashboard/blog'", "'/dashboard/blogs'" `
            -replace '"/dashboard/blog"', '"/dashboard/blogs"'
        Set-Content -LiteralPath $file.FullName -Value $newContent -NoNewline
        $replacements++
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Total files updated: $replacements"
