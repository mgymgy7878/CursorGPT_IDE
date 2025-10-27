# GENERATE RUNBOOK FROM DASHBOARD - One-Click Documentation
# Reads dashboard JSON and generates runbook documentation
# chatgpt + cursor collaboration

param(
    [string]$DashboardJson = "monitoring\grafana\dashboards\spark-portfolio.dashboard.json",
    [string]$OutFile = "docs\RUNBOOK_PORTFOLIO_GENERATED.md"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RUNBOOK GENERATOR" -ForegroundColor Cyan
Write-Host "  (One-Click Documentation)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root "..")
$dashPath = Join-Path $repo $DashboardJson
$outPath = Join-Path $repo $OutFile

# Check if dashboard exists
if (-not (Test-Path $dashPath)) {
    Write-Host "✗ ERROR: Dashboard not found: $dashPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this first: .\scripts\build-grafana-dashboard.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading dashboard..." -ForegroundColor Yellow
$dash = Get-Content $dashPath -Raw | ConvertFrom-Json

Write-Host "  Title: $($dash.title)" -ForegroundColor Gray
Write-Host "  UID: $($dash.uid)" -ForegroundColor Gray
Write-Host "  Panels: $($dash.panels.Count)" -ForegroundColor Gray
Write-Host ""

# Generate runbook
Write-Host "Generating runbook..." -ForegroundColor Yellow

$lines = @()
$lines += "# Spark • Portfolio Runbook (Auto-Generated)"
$lines += ""
$lines += "**Kaynak:** $($dash.title) (UID: $($dash.uid))"
$lines += "**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$lines += "**Scope:** env=`$env, exchange=`$exchange, service=`$service"
$lines += ""
$lines += "---"
$lines += ""
$lines += "## 📊 PANEL RUNBOOKS"
$lines += ""

$panelCount = 0

foreach ($panel in $dash.panels) {
    # Skip rows without content
    if (-not $panel.title) { continue }
    
    $panelCount++
    $lines += "### $panelCount️⃣ $($panel.title)"
    $lines += ""
    
    # Extract first query
    if ($panel.targets -and $panel.targets.Count -gt 0) {
        $expr = $panel.targets[0].expr
        if ($expr) {
            $lines += "**Query:**"
            $lines += '```promql'
            $lines += $expr
            $lines += '```'
            $lines += ""
        }
    }
    
    # Extract thresholds
    if ($panel.fieldConfig -and $panel.fieldConfig.defaults -and $panel.fieldConfig.defaults.thresholds) {
        $thresholds = $panel.fieldConfig.defaults.thresholds.steps
        if ($thresholds) {
            $thresholdText = @()
            foreach ($t in $thresholds) {
                if ($t.value -ne $null) {
                    $thresholdText += "$($t.color): $($t.value)"
                }
            }
            if ($thresholdText.Count -gt 0) {
                $lines += "**Thresholds:** $($thresholdText -join ', ')"
                $lines += ""
            }
        }
    }
    
    # Extract links
    if ($panel.links -and $panel.links.Count -gt 0) {
        $lines += "**Links:**"
        foreach ($link in $panel.links) {
            $lines += "- [$($link.title)]($($link.url))"
        }
        $lines += ""
    }
    
    # Add troubleshooting placeholder
    $lines += "**Kontrol Listesi**:"
    $lines += "1. [ ] Check executor health"
    $lines += "2. [ ] Review connector logs"
    $lines += "3. [ ] Verify API status"
    $lines += ""
    $lines += "**Hızlı Aksiyon:** TBD (customize per panel)"
    $lines += ""
    $lines += "---"
    $lines += ""
}

# Add auto-fix table (chatgpt's spec)
$lines += "## 🔧 OTOMATIK ÇÖZÜM ÖNERİLERİ (Alert → Fix)"
$lines += ""
$lines += "| Alert | Olası Neden | İlk Müdahale | Kalıcı Çözüm |"
$lines += "|-------|-------------|--------------|--------------|"
$lines += "| **PortfolioRefreshLatencyHighP95** | Ağ gecikmesi / rate-limit | refresh interval ↑ (60→120s) | Backoff + jitter, paralel istek azalt |"
$lines += "| **ExchangeApiErrorRateHigh{auth}** | API key izinleri / tarih | Key yenile, saat senkronu \`w32tm /resync\` | Key rotasyonu (90 gün), 401/403 özel retry |"
$lines += "| **ExchangeApiErrorRateHigh{ratelimit}** | Hızlı sorgu | İstekleri grupla, burst azalt | Global rate limiter + token bucket |"
$lines += "| **PortfolioDataStale** | Executor tıkandı / connector timeout | Executor restart, connector timeout ↑ | Health probe + circuit breaker |"
$lines += "| **PortfolioValueDropAnomaly** | Fiyat feed / piyasa hareketi | Ticker cache temizle, cross-check | Redundant source, price sanity checks |"
$lines += "| **PortfolioNoAssets** | API key yok / permission hatalı | .env kontrol, permission verify | API key validation on startup |"
$lines += ""

# Add rollback section
$lines += "---"
$lines += ""
$lines += "## 🚨 ROLLBACK KISA YOLU (< 2 dk)"
$lines += ""
$lines += "**Trigger**: ≥2 critical threshold violations for 15+ minutes"
$lines += ""
$lines += "**Procedure**:"
$lines += '```powershell'
$lines += "cd C:\dev\CursorGPT_IDE"
$lines += ".\durdur.ps1"
$lines += "cd services\executor; Copy-Item .env.backup.* .env -Force"
$lines += "cd ..\..\apps\web-next; Copy-Item .env.local.backup.* .env.local -Force"
$lines += "cd ..\..; .\basla.ps1"
$lines += '```'
$lines += ""

# Write output
$content = $lines -join "`n"
$content | Out-File $outPath -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  RUNBOOK GENERATION COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Generated runbook: $outPath" -ForegroundColor Green
Write-Host "  Panels documented: $panelCount" -ForegroundColor Gray
Write-Host "  Auto-fix table: Included" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review runbook: type $outPath" -ForegroundColor White
Write-Host "  2. Customize troubleshooting steps per panel" -ForegroundColor White
Write-Host "  3. Add panel links to dashboard JSON" -ForegroundColor White
Write-Host ""

