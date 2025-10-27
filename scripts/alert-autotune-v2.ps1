# ALERT AUTO-TUNING V2 - Multi-Day Averaging + Per-Exchange Thresholds
# Queries 24h/3d/7d metrics and generates adaptive thresholds
# Includes per-exchange rules for fine-grained alerting
# chatgpt + cursor collaboration

param(
    [string]$Prom = "http://localhost:9090",
    [string]$EnvRegex = ".*",
    [string]$ServiceRegex = "executor",
    [string]$ExchangeRegex = ".*",
    [string]$RulesFile = "prometheus\alerts\spark-portfolio-tuned.rules.yml",
    [switch]$DryRun,
    [switch]$PerExchange
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALERT AUTO-TUNING V2" -ForegroundColor Cyan
Write-Host "  (Multi-Day + Per-Exchange)" -ForegroundColor Cyan
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
            return $result.data.result[0].value[1]
        }
        return $null
    } catch {
        return $null
    }
}

Write-Host "Querying Prometheus for multi-day metrics..." -ForegroundColor Yellow
Write-Host "  Prometheus: $Prom" -ForegroundColor Gray
Write-Host "  Environment: $EnvRegex" -ForegroundColor Gray
Write-Host "  Lookback: 24h, 3d, 7d" -ForegroundColor Gray
Write-Host ""

# === MULTI-DAY LATENCY (Robust averaging) ===
Write-Host "1/3 Multi-day latency analysis..." -ForegroundColor Yellow

$latP95_24h = Query-Prometheus 'quantile_over_time(0.95, job:spark_portfolio_latency_p95:5m{environment=~"' + $EnvRegex + '",service=~"' + $ServiceRegex + '"}[24h])'
$latP95_3d = Query-Prometheus 'quantile_over_time(0.95, job:spark_portfolio_latency_p95:5m{environment=~"' + $EnvRegex + '",service=~"' + $ServiceRegex + '"}[3d])'
$latP95_7d = Query-Prometheus 'quantile_over_time(0.95, job:spark_portfolio_latency_p95:5m{environment=~"' + $EnvRegex + '",service=~"' + $ServiceRegex + '"}[7d])'

$latP95_24h = if ($latP95_24h) { [int]([double]$latP95_24h) } else { 1200 }
$latP95_3d = if ($latP95_3d) { [int]([double]$latP95_3d) } else { $latP95_24h }
$latP95_7d = if ($latP95_7d) { [int]([double]$latP95_7d) } else { $latP95_24h }

# Robust baseline: max of multi-day p95s (prevents false negatives from one-day anomaly)
$robustP95 = [int]([math]::Max($latP95_24h, [math]::Max($latP95_3d, $latP95_7d)))

Write-Host "  24h p95: $latP95_24h ms" -ForegroundColor Gray
Write-Host "  3d p95:  $latP95_3d ms" -ForegroundColor Gray
Write-Host "  7d p95:  $latP95_7d ms" -ForegroundColor Gray
Write-Host "  Robust baseline: $robustP95 ms" -ForegroundColor Cyan

# === MULTI-DAY ERROR RATE (Robust averaging) ===
Write-Host "2/3 Multi-day error rate analysis..." -ForegroundColor Yellow

$err95_24h = Query-Prometheus 'quantile_over_time(0.95, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '"}[5m]))[24h:5m])'
$err99_24h = Query-Prometheus 'quantile_over_time(0.99, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '"}[5m]))[24h:5m])'
$err95_3d = Query-Prometheus 'quantile_over_time(0.95, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '"}[5m]))[3d:5m])'
$err99_3d = Query-Prometheus 'quantile_over_time(0.99, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '"}[5m]))[3d:5m])'
$err95_7d = Query-Prometheus 'quantile_over_time(0.95, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '"}[5m]))[7d:5m])'
$err99_7d = Query-Prometheus 'quantile_over_time(0.99, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '"}[5m]))[7d:5m])'

$err95_24h = if ($err95_24h) { [double]$err95_24h } else { 0.005 }
$err99_24h = if ($err99_24h) { [double]$err99_24h } else { 0.01 }
$err95_3d = if ($err95_3d) { [double]$err95_3d } else { $err95_24h }
$err99_3d = if ($err99_3d) { [double]$err99_3d } else { $err99_24h }
$err95_7d = if ($err95_7d) { [double]$err95_7d } else { $err95_24h }
$err99_7d = if ($err99_7d) { [double]$err99_7d } else { $err99_24h }

$robustErr95 = [math]::Max($err95_24h, [math]::Max($err95_3d, $err95_7d))
$robustErr99 = [math]::Max($err99_24h, [math]::Max($err99_3d, $err99_7d))

Write-Host "  24h error p95: $("{0:N4}" -f $err95_24h)/s, p99: $("{0:N4}" -f $err99_24h)/s" -ForegroundColor Gray
Write-Host "  3d error p95:  $("{0:N4}" -f $err95_3d)/s, p99: $("{0:N4}" -f $err99_3d)/s" -ForegroundColor Gray
Write-Host "  7d error p95:  $("{0:N4}" -f $err95_7d)/s, p99: $("{0:N4}" -f $err99_7d)/s" -ForegroundColor Gray
Write-Host "  Robust baseline p95: $("{0:N4}" -f $robustErr95)/s, p99: $("{0:N4}" -f $robustErr99)/s" -ForegroundColor Cyan

# === STALENESS ===
Write-Host "3/3 Staleness analysis..." -ForegroundColor Yellow

$stale99_24h = Query-Prometheus 'quantile_over_time(0.99, job:spark_portfolio_staleness{environment=~"' + $EnvRegex + '"}[24h])'
$stale99_24h = if ($stale99_24h) { [int]([double]$stale99_24h) } else { 120 }

Write-Host "  Staleness p99 (24h): $stale99_24h s" -ForegroundColor Gray
Write-Host ""

# === CALCULATE ADAPTIVE THRESHOLDS ===
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ADAPTIVE THRESHOLD CALCULATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Latency: max(1200ms, robustP95 * 1.25) -- chatgpt's v2 heuristic
$newLatency = [int]([math]::Max(1200, $robustP95 * 1.25))

# Error: max(0.02/s, max(robustErr99 * 2.0, robustErr95 * 3.0))
$newErr = [math]::Max(0.02, [math]::Max($robustErr99 * 2.0, $robustErr95 * 3.0))

# Staleness: 240s if p99 < 90s, else 300s
$newStale = if ($stale99_24h -lt 90) { 240 } else { 300 }

Write-Host "New thresholds (global):" -ForegroundColor Green
Write-Host "  Latency: $newLatency ms (formula: max(1200, robust_p95 * 1.25))" -ForegroundColor White
Write-Host "  Error rate: $("{0:N3}" -f $newErr)/s (formula: max(0.02, max(p99*2, p95*3)))" -ForegroundColor White
Write-Host "  Staleness: $newStale s (formula: 240 if p99<90s else 300)" -ForegroundColor White
Write-Host ""

# === PER-EXCHANGE THRESHOLDS (if flag enabled) ===
$perExchangeRules = ""

if ($PerExchange) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  PER-EXCHANGE THRESHOLD CALCULATION" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $exchanges = @("binance", "btcturk")
    $perExchangeRules = @"

# --- AUTO-GENERATED PER-EXCHANGE RULES ---
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Lookback: 24h, adaptive thresholds

"@
    
    foreach ($ex in $exchanges) {
        Write-Host "Calculating thresholds for: $ex" -ForegroundColor Yellow
        
        # Exchange-specific latency
        $latEx = Query-Prometheus "quantile_over_time(0.95, job:spark_portfolio_latency_p95:5m{exchange=""$ex""}[24h])"
        $latEx = if ($latEx) { [int]([double]$latEx) } else { $robustP95 }
        $latExThr = [int]([math]::Max(1200, $latEx * 1.3))
        
        # Exchange-specific error rate
        $errEx95 = Query-Prometheus "quantile_over_time(0.95, sum(rate(spark_exchange_api_error_total{exchange=""$ex""}[5m]))[24h:5m])"
        $errEx99 = Query-Prometheus "quantile_over_time(0.99, sum(rate(spark_exchange_api_error_total{exchange=""$ex""}[5m]))[24h:5m])"
        $errEx95 = if ($errEx95) { [double]$errEx95 } else { $robustErr95 }
        $errEx99 = if ($errEx99) { [double]$errEx99 } else { $robustErr99 }
        $errExThr = [math]::Max(0.02, [math]::Max($errEx99 * 2.0, $errEx95 * 3.0))
        
        Write-Host "  $ex - Latency: $latEx ms → threshold: $latExThr ms" -ForegroundColor Gray
        Write-Host "  $ex - Error: $("{0:N4}" -f $errEx95)/s → threshold: $("{0:N3}" -f $errExThr)/s" -ForegroundColor Gray
        
        $perExchangeRules += @"

      - alert: PortfolioRefreshLatencyHighP95_$ex
        expr: |
          histogram_quantile(0.95, 
            sum by (le, exchange) (
              rate(spark_portfolio_refresh_latency_ms_bucket{exchange="$ex"}[5m])
            )
          ) > $latExThr
        for: 5m
        labels:
          severity: warning
          service: executor
          exchange: "$ex"
          component: portfolio
        annotations:
          summary: "p95 latency yüksek ($ex - exchange-specific)"
          description: "Exchange $ex için p95 latency eşiği aşıldı (threshold: $latExThr ms)"
          action: "$ex API durumu ve ağ gecikmesini kontrol et"
          
      - alert: ExchangeApiErrorRateHigh_$ex
        expr: |
          sum by (exchange) (
            rate(spark_exchange_api_error_total{exchange="$ex"}[5m])
          ) > $("{0:N3}" -f $errExThr)
        for: 3m
        labels:
          severity: critical
          service: executor
          exchange: "$ex"
          component: portfolio
        annotations:
          summary: "API error rate yüksek ($ex - exchange-specific)"
          description: "Exchange $ex error rate: > $("{0:N3}" -f $errExThr)/s"
          action: "$ex API key izinlerini ve rate limit durumunu kontrol et"

"@
    }
    
    Write-Host ""
}

# === UPDATE RULES FILE ===
$path = Join-Path $repo $RulesFile

if (-not (Test-Path $path)) {
    Write-Host "✗ ERROR: Rules file not found: $path" -ForegroundColor Red
    exit 1
}

Write-Host "Reading rules file..." -ForegroundColor Yellow
$txt = Get-Content $path -Raw

# Apply patches to global rules
Write-Host "Applying threshold patches (global rules)..." -ForegroundColor Yellow

# Patch: PortfolioRefreshLatencyHighP95 (global)
$txt = $txt -replace '(?ms)(alert:\s*PortfolioRefreshLatencyHighP95.*?expr:\s*\|[\r\n\s]*)(.*?)(\r?\n\s*for:)', "`$1histogram_quantile(0.95, `n            sum by (le, exchange) (`n              rate(spark_portfolio_refresh_latency_ms_bucket[5m])`n            )`n          ) > $newLatency`$3"

# Patch: ExchangeApiErrorRateHigh (global)
$txt = $txt -replace '(?ms)(alert:\s*ExchangeApiErrorRateHigh[^_].*?expr:\s*\|[\r\n\s]*)(.*?)(\r?\n\s*for:)', "`$1sum by (exchange) (`n            rate(spark_exchange_api_error_total[5m])`n          ) > $("{0:N3}" -f $newErr)`$3"

# Patch: PortfolioDataStale
$txt = $txt -replace '(?ms)(alert:\s*PortfolioDataStale.*?expr:\s*\|[\r\n\s]*)(.*?)(\r?\n\s*for:)', "`$1(time() - spark_portfolio_last_update_timestamp) > $newStale`$3"

# Append per-exchange rules if flag enabled
if ($PerExchange) {
    # Remove old per-exchange rules first (if any)
    $txt = $txt -replace '(?ms)\n# --- AUTO-GENERATED PER-EXCHANGE RULES ---.*$', ''
    
    # Append new per-exchange rules
    $txt += $perExchangeRules
}

# === DRY RUN OR APPLY ===
if ($DryRun) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  DRY RUN - PREVIEW" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Global Thresholds:" -ForegroundColor Cyan
    Write-Host "  Latency: $newLatency ms (24h: $latP95_24h, 3d: $latP95_3d, 7d: $latP95_7d → robust: $robustP95)" -ForegroundColor White
    Write-Host "  Error: $("{0:N3}" -f $newErr)/s" -ForegroundColor White
    Write-Host "  Staleness: $newStale s" -ForegroundColor White
    Write-Host ""
    
    if ($PerExchange) {
        Write-Host "Per-Exchange Rules:" -ForegroundColor Cyan
        Write-Host "  Added for: binance, btcturk" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "Preview (first 100 lines):" -ForegroundColor Yellow
    Write-Host ($txt | Select-Object -First 100)
    Write-Host ""
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Cyan
    exit 0
}

# Write updated rules
Write-Host "Writing updated rules..." -ForegroundColor Yellow
$txt | Set-Content $path -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  AUTO-TUNING V2 COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Updated rules: $RulesFile" -ForegroundColor Green
Write-Host ""
Write-Host "Changes Applied:" -ForegroundColor Cyan
Write-Host "  Global Rules:" -ForegroundColor Yellow
Write-Host "    - Latency threshold: → $newLatency ms (robust baseline: $robustP95 ms)" -ForegroundColor White
Write-Host "    - Error threshold: → $("{0:N3}" -f $newErr)/s" -ForegroundColor White
Write-Host "    - Staleness threshold: → $newStale s" -ForegroundColor White
Write-Host ""

if ($PerExchange) {
    Write-Host "  Per-Exchange Rules:" -ForegroundColor Yellow
    Write-Host "    - Added exchange-specific alerts for: binance, btcturk" -ForegroundColor White
    Write-Host "    - Total new rules: 4 (2 per exchange)" -ForegroundColor White
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Reload Prometheus: curl -X POST http://localhost:9090/-/reload" -ForegroundColor White
Write-Host "  2. Verify rules loaded: start http://localhost:9090/rules" -ForegroundColor White
Write-Host "  3. Check for any syntax errors in Prometheus logs" -ForegroundColor White
Write-Host ""
Write-Host "Improvement over V1:" -ForegroundColor Cyan
Write-Host "  ✓ Multi-day averaging (3d/7d) for robustness" -ForegroundColor Green
Write-Host "  ✓ Per-exchange thresholds (fine-grained alerting)" -ForegroundColor Green
Write-Host "  ✓ Reduced false positives from one-day anomalies" -ForegroundColor Green
Write-Host ""

