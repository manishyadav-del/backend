$files = @(
    "c:\Users\manis\OneDrive\Desktop\ahealthcare\gobal-backend\apps\web\src\app\(website)\contact\page.tsx",
    "c:\Users\manis\OneDrive\Desktop\ahealthcare\gobal-backend\apps\web\src\app\(website)\blogs\page.tsx",
    "c:\Users\manis\OneDrive\Desktop\ahealthcare\gobal-backend\apps\web\src\app\(website)\about-us\page.tsx"
)

$oldImport = "import { DynamicRenderer, SchemaScript, AnalyticsScripts } from '@global/global-backend-next';"
$newImport = @"
import dynamic from 'next/dynamic';

// Dynamically load SDK components that depend on next/script to avoid SSR failures
const DynamicRenderer = dynamic(
  () => import('@global/global-backend-next').then(m => ({ default: m.DynamicRenderer })),
  { ssr: false }
);
const SchemaScript = dynamic(
  () => import('@global/global-backend-next').then(m => ({ default: m.SchemaScript })),
  { ssr: false }
);
const AnalyticsScripts = dynamic(
  () => import('@global/global-backend-next').then(m => ({ default: m.AnalyticsScripts })),
  { ssr: false }
);
"@

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file -Raw
    if ($content.Contains($oldImport)) {
        $newContent = $content.Replace($oldImport, $newImport)
        Set-Content -LiteralPath $file -Value $newContent -NoNewline
        Write-Host "Patched: $file"
    }
}

Write-Host "All SDK dynamic imports applied"
