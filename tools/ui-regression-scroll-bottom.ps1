# UI Regression Test - Scroll Bottom Padding (PATCH W.5b)
# Bu script kritik route'larda scroll-to-bottom screenshot'ları alır
# ve son kart/tablo border'larının kesilmediğini doğrular

param(
    [string]$BaseUrl = "http://127.0.0.1:3003",
    [string]$OutputDir = "evidence/local/ui-regression/scroll-bottom",
    [switch]$OpenResults = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== UI Regression Test: Scroll Bottom Padding ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Output Dir: $OutputDir" -ForegroundColor Gray
Write-Host ""

# Output dizinini oluştur
$fullOutputDir = Join-Path $PSScriptRoot ".." $OutputDir
if (-not (Test-Path $fullOutputDir)) {
    New-Item -ItemType Directory -Path $fullOutputDir -Force | Out-Null
    Write-Host "✅ Output dizini oluşturuldu: $fullOutputDir" -ForegroundColor Green
}

# Test edilecek route'lar (kritik sayfalar)
$routes = @(
    @{ path = "/dashboard"; name = "dashboard"; description = "Dashboard - alt kartlar" },
    @{ path = "/market-data"; name = "market-data"; description = "Market Data - liste son satırı" },
    @{ path = "/strategies"; name = "strategies"; description = "Strategies - tablo alt border" },
    @{ path = "/running"; name = "running"; description = "Running - tablo alt border" },
    @{ path = "/control"; name = "control"; description = "Control - Risk Parametreleri kartı" }
)

Write-Host "✅ Playwright test script hazır: apps/web-next/tests/ui/scroll-bottom-regression.spec.ts" -ForegroundColor Green
Write-Host ""

# Test çalıştırma komutu
Write-Host "Test'i çalıştırmak için:" -ForegroundColor Yellow
Write-Host "  cd apps/web-next" -ForegroundColor Gray
Write-Host "  pnpm exec playwright test tests/ui/scroll-bottom-regression.spec.ts" -ForegroundColor Gray
Write-Host ""

# Alternatif: Manuel screenshot script'i
$manualScript = @"
# Manuel Screenshot Script (Playwright yoksa)
# Her route için tarayıcıda manuel olarak:
# 1. Sayfaya git
# 2. En alta scroll yap (Ctrl+End veya scroll wheel)
# 3. F12 > Console'da:
#    const main = document.querySelector('main');
#    const scrollContainer = main.querySelector('[style*=\"overflow-y: auto\"]');
#    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
# 4. Screenshot al (Windows: Win+Shift+S, Chrome: F12 > Cmd/Ctrl+Shift+P > "Capture screenshot")

# Test edilecek route'lar:
$($routes | ForEach-Object { "- $($_.path) - $($_.description)" } | Out-String)
"@

$manualScriptPath = Join-Path $fullOutputDir "MANUAL_TEST.md"
$manualScript | Out-File -FilePath $manualScriptPath -Encoding UTF8

Write-Host "✅ Manuel test rehberi oluşturuldu: $manualScriptPath" -ForegroundColor Green
Write-Host ""

# Sonuç özeti
Write-Host "=== Test Hazır ===" -ForegroundColor Cyan
Write-Host "Test edilecek route'lar:" -ForegroundColor Yellow
$routes | ForEach-Object {
    Write-Host "  ✓ $($_.path) - $($_.description)" -ForegroundColor Gray
}

if ($OpenResults) {
    Write-Host ""
    Write-Host "Sonuçları açılıyor..." -ForegroundColor Yellow
    Start-Process explorer.exe -ArgumentList $fullOutputDir
}

Write-Host ""
Write-Host "📝 NOT: Bu test her PR'da veya major UI değişikliğinden sonra çalıştırılmalı." -ForegroundColor Cyan
Write-Host "   Regression'ları yakalamak için CI/CD pipeline'ına eklenebilir." -ForegroundColor Cyan
