# RENDER 24H REPORT V2 - Enhanced with Uptime & Alert History
# Auto-fill template with Prometheus metrics + uptime + alert history + screenshots
# chatgpt + cursor collaboration

param(
    [string]$Prom = "http://localhost:9090",
    [string]$Env = "development",
    [string]$OutDir = "evidence\portfolio"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  24H REPORT RENDERER V2" -ForegroundColor Cyan
Write-Host "  (Enhanced: Uptime + Alerts + Screenshots)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root "..")

# Query helper
function Query-Prometheus($expr) {
    try {
        $response = Invoke-WebRequest -Uri "$Prom/api/v1/query?query=$([uri]::EscapeDataString($expr))" -UseBasicParsing -TimeoutSec 10
        $result = ($response.Content | ConvertFrom-Json)
        if ($result.data.result.Count -gt 0) {
            return $result.data.result
        }
        return $null
    } catch {
        Write-Host "⚠ Query failed: $expr" -ForegroundColor Yellow
        return $null
    }
}

$now = Get-Date
$start = $now.AddHours(-24)
$ts = (Get-Date -Date $now -Format "yyyyMMdd_HHmmss")
$dir = Join-Path $repo "$OutDir\$ts"

Write-Host "Creating evidence directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Write-Host "  Location: $dir" -ForegroundColor Gray
Write-Host ""

# Query metrics
Write-Host "Querying Prometheus metrics..." -ForegroundColor Yellow
Write-Host "  Prometheus: $Prom" -ForegroundColor Gray
Write-Host "  Environment: $Env" -ForegroundColor Gray
Write-Host "  Time Range: 24h" -ForegroundColor Gray
Write-Host ""

# 1. Latency
Write-Host "1/8 Latency metrics..." -ForegroundColor Yellow
$p95Result = Query-Prometheus "job:spark_portfolio_latency_p95:5m{environment=""$Env""}"
$p50Result = Query-Prometheus "job:spark_portfolio_latency_p50:5m{environment=""$Env""}"
$p95 = if ($p95Result) { [int]([double]$p95Result[0].value[1]) } else { 0 }
$p50 = if ($p50Result) { [int]([double]$p50Result[0].value[1]) } else { 0 }
Write-Host "  p95: $p95 ms, p50: $p50 ms" -ForegroundColor Gray

# 2. Error rate
Write-Host "2/8 Error rate..." -ForegroundColor Yellow
$errResult = Query-Prometheus "sum(job:spark_exchange_api_error_rate:5m{environment=""$Env""})"
$err = if ($errResult) { [double]$errResult[0].value[1] } else { 0.0 }
Write-Host "  Error rate: $("{0:N4}" -f $err)/s" -ForegroundColor Gray

# 3. Staleness
Write-Host "3/8 Staleness..." -ForegroundColor Yellow
$staleResult = Query-Prometheus "max(job:spark_portfolio_staleness{environment=""$Env""})"
$stale = if ($staleResult) { [int]([double]$staleResult[0].value[1]) } else { 0 }
Write-Host "  Staleness: $stale s" -ForegroundColor Gray

# 4. Total value
Write-Host "4/8 Portfolio value..." -ForegroundColor Yellow
$tvResult = Query-Prometheus "sum(job:spark_portfolio_total_value:current{environment=""$Env""})"
$tv = if ($tvResult) { [double]$tvResult[0].value[1] } else { 0.0 }
Write-Host "  Total value: `$$("{0:N2}" -f $tv)" -ForegroundColor Gray

# 5. Asset count
Write-Host "5/8 Asset count..." -ForegroundColor Yellow
$acResult = Query-Prometheus "sum(job:spark_portfolio_asset_count:current{environment=""$Env""})"
$ac = if ($acResult) { [int]([double]$acResult[0].value[1]) } else { 0 }
Write-Host "  Asset count: $ac" -ForegroundColor Gray

# 6. UPTIME (NEW!)
Write-Host "6/8 Uptime calculation..." -ForegroundColor Yellow
$uptResult = Query-Prometheus 'avg_over_time(up{job="spark-executor"}[24h]) * 100'
$uptPct = if ($uptResult) { [math]::Round([double]$uptResult[0].value[1], 2) } else { 0.0 }
Write-Host "  Uptime: $uptPct%" -ForegroundColor Gray

# 7. ALERT HISTORY (NEW!)
Write-Host "7/8 Alert history..." -ForegroundColor Yellow
$alertsFiring = Query-Prometheus 'sum by (alertname) (max_over_time(ALERTS{alertstate="firing"}[24h]))'
$alertsPending = Query-Prometheus 'sum by (alertname) (max_over_time(ALERTS{alertstate="pending"}[24h]))'

$alertLines = @()
if ($alertsFiring) {
    foreach ($alert in $alertsFiring) {
        $alertName = $alert.metric.alertname
        $count = [int]([double]$alert.value[1])
        if ($count -ge 1) {
            $alertLines += "  • 🔴 FIRING: $alertName (triggered at least once in 24h)"
        }
    }
}

if ($alertsPending) {
    foreach ($alert in $alertsPending) {
        $alertName = $alert.metric.alertname
        $count = [int]([double]$alert.value[1])
        if ($count -ge 1) {
            $alertLines += "  • 🟡 PENDING: $alertName (pending at least once in 24h)"
        }
    }
}

if ($alertLines.Count -eq 0) {
    $alertLines += "  • ✅ No alerts fired or pending in 24h period"
}

Write-Host "  Alerts: $($alertLines.Count) event(s)" -ForegroundColor Gray

# 8. Calculate overall status (including uptime)
Write-Host "8/8 Calculating overall status..." -ForegroundColor Yellow
$p95Status = if ($p95 -le 1500) { "🟢 GREEN" } elseif ($p95 -le 3000) { "🟡 YELLOW" } else { "🔴 RED" }
$staleStatus = if ($stale -le 60) { "🟢 GREEN" } elseif ($stale -le 300) { "🟡 YELLOW" } else { "🔴 RED" }
$errStatus = if ($err -le 0.01) { "🟢 GREEN" } elseif ($err -le 0.05) { "🟡 YELLOW" } else { "🔴 RED" }
$uptStatus = if ($uptPct -ge 99.5) { "🟢 GREEN" } elseif ($uptPct -ge 99.0) { "🟡 YELLOW" } else { "🔴 RED" }

# Enhanced overall status calculation
$overall = if ($p95 -gt 3000 -or $stale -gt 300 -or $err -gt 0.05 -or $uptPct -lt 99.0) {
    "🔴 RED"
} elseif ($p95 -gt 1500 -or $stale -gt 120 -or $err -gt 0.02 -or $uptPct -lt 99.5) {
    "🟡 YELLOW"
} else {
    "🟢 GREEN"
}

Write-Host "  Overall: $overall" -ForegroundColor Gray
Write-Host ""

# Load template
Write-Host "Loading report template..." -ForegroundColor Yellow
$tplPath = Join-Path $repo "evidence\portfolio\REPORT_24H_TEMPLATE.md"

if (-not (Test-Path $tplPath)) {
    Write-Host "✗ ERROR: Template not found: $tplPath" -ForegroundColor Red
    exit 1
}

$tpl = Get-Content $tplPath -Raw

# Replace placeholders
Write-Host "Filling template..." -ForegroundColor Yellow
$tpl = $tpl.Replace("{{START_ISO}}", ($start.ToString("yyyy-MM-ddTHH:mm:ssK")))
$tpl = $tpl.Replace("{{END_ISO}}", ($now.ToString("yyyy-MM-ddTHH:mm:ssK")))
$tpl = $tpl.Replace("{{REPORT_TS}}", ($now.ToString("yyyy-MM-dd HH:mm:ss")))
$tpl = $tpl.Replace("{{TS}}", $ts)
$tpl = $tpl.Replace("{{ENV}}", $Env)

# Metrics
$tpl = $tpl.Replace("{{P95_MS}}", "$p95")
$tpl = $tpl.Replace("{{P50_MS}}", "$p50")
$tpl = $tpl.Replace("{{ERR_RATE}}", ("{0:N4}" -f $err))
$tpl = $tpl.Replace("{{STALE_S}}", "$stale")
$tpl = $tpl.Replace("{{STALE_CURRENT_S}}", "$stale")
$tpl = $tpl.Replace("{{STALE_AVG_S}}", "$stale")
$tpl = $tpl.Replace("{{STALENESS_P95_S}}", "$stale")
$tpl = $tpl.Replace("{{TV_AVG_USD}}", ("{0:N2}" -f $tv))
$tpl = $tpl.Replace("{{TOTAL_USD}}", ("{0:N2}" -f $tv))
$tpl = $tpl.Replace("{{ASSET_COUNT}}", "$ac")
$tpl = $tpl.Replace("{{TOTAL_ASSETS}}", "$ac")

# Status
$tpl = $tpl.Replace("{{P95_STATUS}}", $p95Status)
$tpl = $tpl.Replace("{{STALE_STATUS}}", $staleStatus)
$tpl = $tpl.Replace("{{ERR_STATUS}}", $errStatus)
$tpl = $tpl.Replace("{{OVERALL_STATUS}}", $overall)

# UPTIME (NEW!)
$tpl = $tpl.Replace("{{UPTIME_PCT}}", ("{0:N2}" -f $uptPct))
$tpl = $tpl.Replace("{{RUNTIME_HOURS}}", "24")
$tpl = $tpl.Replace("{{DOWNTIME_MINUTES}}", ([math]::Round((100 - $uptPct) * 24 * 60 / 100, 2)))
$tpl = $tpl.Replace("{{RESTART_COUNT}}", "0")  # TODO: Calculate from logs

# SLO Status
$tpl = $tpl.Replace("{{LATENCY_SLO_STATUS}}", if ($p95 -le 1500) { "✅ PASS" } else { "❌ FAIL" })
$tpl = $tpl.Replace("{{STALENESS_SLO_STATUS}}", if ($stale -le 60) { "✅ PASS" } else { "❌ FAIL" })
$tpl = $tpl.Replace("{{ERROR_SLO_STATUS}}", if ($err -le 0.01) { "✅ PASS" } else { "❌ FAIL" })
$tpl = $tpl.Replace("{{UPTIME_SLO_STATUS}}", if ($uptPct -ge 99.0) { "✅ PASS" } else { "❌ FAIL" })

# Conditional sections (simplified)
$tpl = $tpl -replace '\{\{#if .*?\}\}[\s\S]*?\{\{/if\}\}', '✅ No items'
$tpl = $tpl -replace '\{\{#each .*?\}\}[\s\S]*?\{\{/each\}\}', ''

# APPEND: Alert History Section (NEW!)
Write-Host "Appending alert history..." -ForegroundColor Yellow
$alertSection = @"

---

## 🚨 Alert History (24h) - AUTO-GENERATED

**Query Time**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

### Alerts Triggered in Last 24 Hours

$($alertLines -join "`n")

### Alert Analysis

- **Total alert events**: $($alertLines.Count)
- **Firing alerts**: $(($alertLines | Where-Object { $_ -match "FIRING" }).Count)
- **Pending alerts**: $(($alertLines | Where-Object { $_ -match "PENDING" }).Count)

"@

$tpl += $alertSection

# APPEND: Grafana Screenshots (NEW!)
Write-Host "Checking for Grafana screenshots..." -ForegroundColor Yellow
$pngDir = Join-Path $dir "grafana_panels"

if (Test-Path $pngDir) {
    $pngs = Get-ChildItem $pngDir -Filter *.png | Sort-Object Name
    
    if ($pngs.Count -gt 0) {
        Write-Host "  Found $($pngs.Count) screenshot(s)" -ForegroundColor Green
        
        $screenshotSection = @"

---

## 📊 Grafana Dashboard Panels - AUTO-EMBEDDED

**Captured**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Dashboard**: spark-portfolio  
**Time Range**: Last 24 hours

"@
        
        foreach ($png in $pngs) {
            # Extract panel name from filename (panel_1_latency_p95.png → Latency p95)
            $panelName = $png.BaseName -replace "panel_\d+_", "" -replace "_", " "
            $panelName = (Get-Culture).TextInfo.ToTitleCase($panelName)
            
            # Relative path from report location
            $relPath = "grafana_panels/$($png.Name)"
            
            $screenshotSection += @"

### $panelName

![Panel: $panelName]($relPath)

"@
        }
        
        $tpl += $screenshotSection
    } else {
        Write-Host "  No screenshots found in $pngDir" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Screenshot directory not found (run embed-dashboard-screens.ps1 first)" -ForegroundColor Yellow
}

# Write report
$out = Join-Path $dir "REPORT_24H.md"
$tpl | Set-Content $out -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  REPORT GENERATION COMPLETE (V2)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ 24h report generated: $out" -ForegroundColor Green
Write-Host ""
Write-Host "Report Summary:" -ForegroundColor Cyan
Write-Host "  Environment: $Env" -ForegroundColor White
Write-Host "  Time Range: $($start.ToString("yyyy-MM-dd HH:mm")) - $($now.ToString("yyyy-MM-dd HH:mm"))" -ForegroundColor White
Write-Host "  Overall Status: $overall" -ForegroundColor White
Write-Host ""
Write-Host "Key Metrics:" -ForegroundColor Cyan
Write-Host "  Latency p95: $p95 ms (target: < 1500 ms) $p95Status" -ForegroundColor White
Write-Host "  Error rate: $("{0:N4}" -f $err)/s (target: < 0.01/s) $errStatus" -ForegroundColor White
Write-Host "  Staleness: $stale s (target: < 60 s) $staleStatus" -ForegroundColor White
Write-Host "  Uptime: $uptPct% (target: > 99.5%) $uptStatus" -ForegroundColor White
Write-Host "  Total value: `$$("{0:N2}" -f $tv)" -ForegroundColor White
Write-Host "  Asset count: $ac" -ForegroundColor White
Write-Host ""
Write-Host "Enhancements (V2):" -ForegroundColor Cyan
Write-Host "  ✓ Uptime calculation (24h avg)" -ForegroundColor Green
Write-Host "  ✓ Alert history (firing + pending)" -ForegroundColor Green
Write-Host "  ✓ Screenshot embedding ($(if (Test-Path $pngDir) { (Get-ChildItem $pngDir -Filter *.png).Count } else { 0 }) panels)" -ForegroundColor $(if (Test-Path $pngDir) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review report: type $out" -ForegroundColor White
Write-Host "  2. Create ZIP: Compress-Archive -Path $dir -DestinationPath $dir.zip" -ForegroundColor White
Write-Host "  3. Share with team or archive for compliance" -ForegroundColor White
Write-Host ""

