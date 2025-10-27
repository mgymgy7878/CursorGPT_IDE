# BUILD GRAFANA DASHBOARD - Single File Unified
# Merges variables.json + portfolio-panels.json → spark-portfolio.dashboard.json
# chatgpt + cursor collaboration

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GRAFANA DASHBOARD BUILDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root "..")

# Load source files
Write-Host "Loading source files..." -ForegroundColor Yellow
$panelsFile = Join-Path $repo "monitoring\grafana\panels\portfolio-panels.json"
$varsFile = Join-Path $repo "monitoring\grafana\panels\variables.json"

if (-not (Test-Path $panelsFile)) {
    Write-Host "✗ ERROR: $panelsFile not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $varsFile)) {
    Write-Host "✗ ERROR: $varsFile not found" -ForegroundColor Red
    exit 1
}

$panels = Get-Content $panelsFile -Raw | ConvertFrom-Json
$vars = Get-Content $varsFile -Raw | ConvertFrom-Json

Write-Host "✓ Loaded panels: $($panels.panels.Count) panels" -ForegroundColor Green
Write-Host "✓ Loaded variables: $($vars.templating.list.Count) variables" -ForegroundColor Green
Write-Host ""

# Build unified dashboard
Write-Host "Building unified dashboard..." -ForegroundColor Yellow

$dashboard = [ordered]@{
    uid = "spark-portfolio"
    title = "Spark • Portfolio Performance"
    tags = @("spark", "portfolio", "real-data", "v1.9-p3")
    description = "Portfolio real data integration monitoring - Production ready"
    editable = $true
    graphTooltip = 1
    links = @()
    time = @{
        "from" = "now-1h"
        "to" = "now"
    }
    timezone = "browser"
    templating = $vars.templating
    panels = $panels.panels
    refresh = "10s"
    schemaVersion = 39
    version = 1
    style = "dark"
    timepicker = @{
        refresh_intervals = @("5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h")
        time_options = @("5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d", "30d")
    }
}

# Validate panel queries contain variable filters (optional hardening)
Write-Host "Validating panel queries..." -ForegroundColor Yellow
$validationIssues = @()

foreach ($panel in $dashboard.panels) {
    if ($panel.targets) {
        foreach ($target in $panel.targets) {
            if ($target.expr) {
                # Check if query uses template variables
                if ($target.expr -notmatch '\$env' -and $target.expr -notmatch '\$exchange' -and $target.expr -notmatch '\$service') {
                    $validationIssues += "Panel '$($panel.title)' query does not use template variables"
                }
            }
        }
    }
}

if ($validationIssues.Count -gt 0) {
    Write-Host "⚠ Validation warnings:" -ForegroundColor Yellow
    foreach ($issue in $validationIssues) {
        Write-Host "  - $issue" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Create output directory
$outDir = Join-Path $repo "monitoring\grafana\dashboards"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Write unified dashboard
$outFile = Join-Path $outDir "spark-portfolio.dashboard.json"
($dashboard | ConvertTo-Json -Depth 100) | Set-Content $outFile -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DASHBOARD BUILD COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Created: monitoring\grafana\dashboards\spark-portfolio.dashboard.json" -ForegroundColor Green
Write-Host "  UID: spark-portfolio" -ForegroundColor Gray
Write-Host "  Panels: $($panels.panels.Count)" -ForegroundColor Gray
Write-Host "  Variables: $($vars.templating.list.Count)" -ForegroundColor Gray
Write-Host "  Schema Version: 39" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Grafana auto-provision enabled (docker-compose.yml)" -ForegroundColor White
Write-Host "  2. Dashboard will auto-import on Grafana restart" -ForegroundColor White
Write-Host "  3. Or manually import: http://localhost:3005/dashboard/import" -ForegroundColor White
Write-Host "  4. Dashboard URL: http://localhost:3005/d/spark-portfolio" -ForegroundColor White
Write-Host ""

