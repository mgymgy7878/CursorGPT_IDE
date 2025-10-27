# APPLY DASHBOARD ENHANCEMENTS - After-Takeoff Kit
# Adds annotations, comparison panels, tooltips to dashboard
# chatgpt + cursor collaboration

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DASHBOARD ENHANCEMENTS APPLICATOR" -ForegroundColor Cyan
Write-Host "  (After-Takeoff Kit)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root "..")

# Load enhancement files
$annotationsFile = Join-Path $repo "monitoring\grafana\enhancements\dashboard-annotations.json"
$comparisonFile = Join-Path $repo "monitoring\grafana\enhancements\comparison-panel.json"
$timelineFile = Join-Path $repo "monitoring\grafana\enhancements\alert-timeline-panel.json"
$tooltipsFile = Join-Path $repo "monitoring\grafana\enhancements\panel-tooltips.json"
$dashboardFile = Join-Path $repo "monitoring\grafana\dashboards\spark-portfolio.dashboard.json"

Write-Host "Checking enhancement files..." -ForegroundColor Yellow

if (-not (Test-Path $dashboardFile)) {
    Write-Host "✗ Dashboard not found. Run .\scripts\build-grafana-dashboard.ps1 first" -ForegroundColor Red
    exit 1
}

# Load files
$annotations = Get-Content $annotationsFile -Raw | ConvertFrom-Json
$comparison = Get-Content $comparisonFile -Raw | ConvertFrom-Json
$timeline = Get-Content $timelineFile -Raw | ConvertFrom-Json
$tooltips = Get-Content $tooltipsFile -Raw | ConvertFrom-Json
$dashboard = Get-Content $dashboardFile -Raw | ConvertFrom-Json

Write-Host "✓ All files loaded" -ForegroundColor Green
Write-Host ""

# Apply enhancements
Write-Host "Applying enhancements..." -ForegroundColor Yellow

# 1. Merge annotations
Write-Host "  1/4 Adding global annotations..." -ForegroundColor Gray
if (-not $dashboard.annotations) {
    $dashboard | Add-Member -MemberType NoteProperty -Name "annotations" -Value @{ list = @() }
}
$dashboard.annotations.list += $annotations.annotations.list
Write-Host "    ✓ Added $($annotations.annotations.list.Count) annotation queries" -ForegroundColor Green

# 2. Add comparison panel
Write-Host "  2/4 Adding Today vs Yesterday panel..." -ForegroundColor Gray
$comparison | Add-Member -MemberType NoteProperty -Name "id" -Value ($dashboard.panels.Count + 1)
$comparison | Add-Member -MemberType NoteProperty -Name "gridPos" -Value @{ x=0; y=20; w=12; h=8 }
$dashboard.panels += $comparison
Write-Host "    ✓ Comparison panel added" -ForegroundColor Green

# 3. Add alert timeline panel
Write-Host "  3/4 Adding alert timeline panel..." -ForegroundColor Gray
$timeline | Add-Member -MemberType NoteProperty -Name "id" -Value ($dashboard.panels.Count + 1)
$timeline | Add-Member -MemberType NoteProperty -Name "gridPos" -Value @{ x=12; y=20; w=12; h=8 }
$dashboard.panels += $timeline
Write-Host "    ✓ Alert timeline panel added" -ForegroundColor Green

# 4. Apply panel tooltips
Write-Host "  4/4 Applying panel descriptions..." -ForegroundColor Gray
$tooltipCount = 0
foreach ($panel in $dashboard.panels) {
    $panelTitle = $panel.title
    if ($panelTitle -match "Latency.*p95") {
        $panel.description = $tooltips.panel_descriptions.latency_p95.description
        $tooltipCount++
    } elseif ($panelTitle -match "Error") {
        $panel.description = $tooltips.panel_descriptions.error_rate.description
        $tooltipCount++
    } elseif ($panelTitle -match "Total.*Value") {
        $panel.description = $tooltips.panel_descriptions.total_value.description
        $tooltipCount++
    } elseif ($panelTitle -match "Staleness") {
        $panel.description = $tooltips.panel_descriptions.staleness.description
        $tooltipCount++
    } elseif ($panelTitle -match "Asset.*Count") {
        $panel.description = $tooltips.panel_descriptions.asset_count.description
        $tooltipCount++
    }
}
Write-Host "    ✓ Updated $tooltipCount panel descriptions" -ForegroundColor Green

Write-Host ""

# Save enhanced dashboard
Write-Host "Saving enhanced dashboard..." -ForegroundColor Yellow
($dashboard | ConvertTo-Json -Depth 100) | Set-Content $dashboardFile -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ENHANCEMENTS APPLIED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Enhanced dashboard: $dashboardFile" -ForegroundColor Green
Write-Host "  - Annotations: $($annotations.annotations.list.Count) added" -ForegroundColor Gray
Write-Host "  - Comparison panel: Today vs Yesterday" -ForegroundColor Gray
Write-Host "  - Alert timeline: State visualization" -ForegroundColor Gray
Write-Host "  - Panel tooltips: $tooltipCount panels updated" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart Grafana: docker compose restart grafana" -ForegroundColor White
Write-Host "  2. View dashboard: start http://localhost:3005/d/spark-portfolio" -ForegroundColor White
Write-Host "  3. Verify annotations overlay on all panels" -ForegroundColor White
Write-Host "  4. Check new panels (Today vs Yesterday, Alert Timeline)" -ForegroundColor White
Write-Host ""

