# EMBED DASHBOARD SCREENSHOTS - Grafana Render API
# Captures PNG screenshots of all panels and embeds them in 24h report
# chatgpt + cursor collaboration

param(
    [string]$Grafana = "http://localhost:3005",
    [string]$ApiKey = "",                         # Optional: Grafana API Key (Header: Authorization: Bearer ...)
    [string]$Uid = "spark-portfolio",
    [string]$From = "now-24h",
    [string]$To = "now",
    [string]$OutDir = "evidence\portfolio",
    [int]$Width = 1200,
    [int]$Height = 600,
    [string]$Theme = "dark"                       # dark or light
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GRAFANA SCREENSHOT EMBEDDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root "..")
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$dir = Join-Path $repo "$OutDir\$ts\grafana_panels"

Write-Host "Creating screenshots directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Write-Host "  Location: $dir" -ForegroundColor Gray
Write-Host ""

# Panel IDs (adjust based on your actual dashboard)
# To find panel IDs: Open dashboard → Panel → Inspect → Panel JSON → look for "id" field
$panels = @(
    @{ id = 1; name = "latency_p95" },
    @{ id = 2; name = "error_rate" },
    @{ id = 3; name = "total_value" },
    @{ id = 4; name = "staleness" },
    @{ id = 5; name = "asset_count" }
)

Write-Host "Grafana settings:" -ForegroundColor Yellow
Write-Host "  URL: $Grafana" -ForegroundColor Gray
Write-Host "  Dashboard UID: $Uid" -ForegroundColor Gray
Write-Host "  Time range: $From to $To" -ForegroundColor Gray
Write-Host "  Resolution: ${Width}x${Height}" -ForegroundColor Gray
Write-Host "  Theme: $Theme" -ForegroundColor Gray
Write-Host ""

# Setup headers
$headers = @{}
if ($ApiKey -ne "") {
    $headers["Authorization"] = "Bearer $ApiKey"
    Write-Host "Using API key authentication" -ForegroundColor Yellow
} else {
    Write-Host "Using anonymous access (local only)" -ForegroundColor Yellow
}
Write-Host ""

# Capture each panel
Write-Host "Capturing panel screenshots..." -ForegroundColor Yellow
$captured = 0
$failed = 0

foreach ($panel in $panels) {
    $panelId = $panel.id
    $panelName = $panel.name
    
    try {
        # Construct Grafana render URL
        # Format: /render/d-solo/{uid}/{slug}?panelId={id}&from={from}&to={to}&width={w}&height={h}&theme={theme}&tz=Europe/Istanbul
        $url = "$Grafana/render/d-solo/$Uid/_?panelId=$panelId&from=$From&to=$To&width=$Width&height=$Height&theme=$Theme&tz=Europe%2FIstanbul"
        
        $png = Join-Path $dir "panel_${panelId}_${panelName}.png"
        
        Write-Host "  [$($captured + 1)/$($panels.Count)] Capturing panel $panelId ($panelName)..." -ForegroundColor Gray
        
        Invoke-WebRequest -Uri $url -Headers $headers -OutFile $png -UseBasicParsing -TimeoutSec 30
        
        $fileSize = (Get-Item $png).Length
        if ($fileSize -lt 1000) {
            Write-Host "    ⚠ Warning: Small file size ($fileSize bytes), may be error page" -ForegroundColor Yellow
        } else {
            Write-Host "    ✓ Saved: $png ($([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
        }
        
        $captured++
    } catch {
        Write-Host "    ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""

# Generate markdown embeddings
Write-Host "Generating markdown embeddings..." -ForegroundColor Yellow
$mdFile = Join-Path $dir "panels_embed.md"
$markdown = @"
# Grafana Dashboard Screenshots

**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Dashboard**: $Uid  
**Time Range**: $From to $To

---

"@

foreach ($panel in $panels) {
    $panelId = $panel.id
    $panelName = $panel.name
    $pngFile = "panel_${panelId}_${panelName}.png"
    $pngPath = Join-Path $dir $pngFile
    
    if (Test-Path $pngPath) {
        # Relative path for markdown
        $relPath = "grafana_panels/$pngFile"
        $markdown += @"
## Panel $panelId: $panelName

![Panel $panelName]($relPath)

---

"@
    }
}

$markdown | Set-Content $mdFile -Encoding UTF8

Write-Host "  ✓ Markdown file: $mdFile" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SCREENSHOT CAPTURE COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  Captured: $captured/$($panels.Count) panels" -ForegroundColor White
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "White" })
Write-Host "  Output: $dir" -ForegroundColor White
Write-Host ""

if ($captured -eq 0) {
    Write-Host "⚠ WARNING: No screenshots captured!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. Grafana not running or not accessible" -ForegroundColor White
    Write-Host "  2. Dashboard UID incorrect (current: $Uid)" -ForegroundColor White
    Write-Host "  3. Panel IDs don't match dashboard" -ForegroundColor White
    Write-Host "  4. Authentication required (use -ApiKey parameter)" -ForegroundColor White
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  • Check Grafana: start http://localhost:3005" -ForegroundColor White
    Write-Host "  • Verify dashboard: start http://localhost:3005/d/$Uid" -ForegroundColor White
    Write-Host "  • Test render: start $Grafana/render/d-solo/$Uid/_?panelId=1" -ForegroundColor White
} else {
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Review screenshots: explorer $dir" -ForegroundColor White
    Write-Host "  2. Run 24h report: .\scripts\render-24h-report.ps1" -ForegroundColor White
    Write-Host "  3. Screenshots will be auto-embedded in REPORT_24H.md" -ForegroundColor White
}

Write-Host ""

