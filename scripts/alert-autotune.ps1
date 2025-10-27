# ALERT AUTO-TUNING - Adaptive Thresholds Based on Live Traffic
# Queries last 24h metrics from Prometheus and adjusts alert thresholds
# chatgpt + cursor collaboration

param(
    [string]$Prom = "http://localhost:9090",
    [string]$EnvRegex = ".*",          # e.g., "development|staging|prod"
    [string]$ServiceRegex = "executor",
    [string]$ExchangeRegex = ".*",
    [string]$RulesFile = "prometheus\alerts\spark-portfolio-tuned.rules.yml",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALERT AUTO-TUNING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root "..")

# Query helper
function Query-Prometheus($expr) {
    try {
        $response = Invoke-WebRequest -Uri "$Prom/api/v1/query?query=$([uri]::EscapeDataString($expr))" -UseBasicParsing -TimeoutSec 10
        return ($response.Content | ConvertFrom-Json)
    } catch {
        Write-Host "⚠ Query failed: $expr" -ForegroundColor Yellow
        return $null
    }
}

Write-Host "Querying Prometheus for 24h metrics..." -ForegroundColor Yellow
Write-Host "  Prometheus: $Prom" -ForegroundColor Gray
Write-Host "  Environment: $EnvRegex" -ForegroundColor Gray
Write-Host "  Service: $ServiceRegex" -ForegroundColor Gray
Write-Host "  Exchange: $ExchangeRegex" -ForegroundColor Gray
Write-Host ""

# 1. Latency p95 (24h)
Write-Host "1/4 Querying latency p95 (24h)..." -ForegroundColor Yellow
$latExpr = 'quantile_over_time(0.95, job:spark_portfolio_latency_p95:5m{environment=~"' + $EnvRegex + '",service=~"' + $ServiceRegex + '",exchange=~"' + $ExchangeRegex + '"}[24h])'
$latResult = Query-Prometheus $latExpr
$latP95 = if ($latResult -and $latResult.data.result.Count -gt 0) {
    [int]([double]($latResult.data.result[0].value[1]))
} else {
    1200  # Fallback
}

if ($latP95 -le 0) { $latP95 = 1200 }
Write-Host "  Current p95: $latP95 ms" -ForegroundColor Gray

# 2. Error rate p95/p99 (24h)
Write-Host "2/4 Querying error rate (24h)..." -ForegroundColor Yellow
$errExpr95 = 'quantile_over_time(0.95, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '",service=~"' + $ServiceRegex + '",exchange=~"' + $ExchangeRegex + '"}[5m]))[24h:5m])'
$errExpr99 = 'quantile_over_time(0.99, sum(rate(spark_exchange_api_error_total{environment=~"' + $EnvRegex + '",service=~"' + $ServiceRegex + '",exchange=~"' + $ExchangeRegex + '"}[5m]))[24h:5m])'

$err95Result = Query-Prometheus $errExpr95
$err99Result = Query-Prometheus $errExpr99

$err95 = if ($err95Result -and $err95Result.data.result.Count -gt 0) {
    [double]($err95Result.data.result[0].value[1])
} else {
    0.005
}

$err99 = if ($err99Result -and $err99Result.data.result.Count -gt 0) {
    [double]($err99Result.data.result[0].value[1])
} else {
    0.01
}

if ($err95 -le 0) { $err95 = 0.005 }
if ($err99 -le 0) { $err99 = 0.01 }

Write-Host "  Current error p95: $("{0:N4}" -f $err95)/s" -ForegroundColor Gray
Write-Host "  Current error p99: $("{0:N4}" -f $err99)/s" -ForegroundColor Gray

# 3. Staleness p99 (24h)
Write-Host "3/4 Querying staleness (24h)..." -ForegroundColor Yellow
$staleExpr99 = 'quantile_over_time(0.99, job:spark_portfolio_staleness{environment=~"' + $EnvRegex + '",service=~"' + $ServiceRegex + '",exchange=~"' + $ExchangeRegex + '"}[24h])'
$staleResult = Query-Prometheus $staleExpr99

$stale99 = if ($staleResult -and $staleResult.data.result.Count -gt 0) {
    [int]([double]($staleResult.data.result[0].value[1]))
} else {
    120
}

if ($stale99 -le 0) { $stale99 = 120 }
Write-Host "  Current staleness p99: $stale99 s" -ForegroundColor Gray

Write-Host ""

# Calculate new thresholds using chatgpt's heuristics
Write-Host "4/4 Calculating adaptive thresholds..." -ForegroundColor Yellow

# Latency: max(1200ms, p95_24h * 1.3)
$newLatency = [int]([math]::Max(1200, $latP95 * 1.3))

# Error Rate: max(0.02/s, max(err_p99_24h * 2.0, err_p95_24h * 3.0))
$newErr = [math]::Max(0.02, [math]::Max($err99 * 2.0, $err95 * 3.0))

# Staleness: if p99 < 90s, use 240s; else keep 300s
$newStale = if ($stale99 -lt 90) { 240 } else { 300 }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ADAPTIVE THRESHOLDS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current (24h observed):" -ForegroundColor Yellow
Write-Host "  Latency p95: $latP95 ms" -ForegroundColor White
Write-Host "  Error p95: $("{0:N4}" -f $err95)/s" -ForegroundColor White
Write-Host "  Error p99: $("{0:N4}" -f $err99)/s" -ForegroundColor White
Write-Host "  Staleness p99: $stale99 s" -ForegroundColor White
Write-Host ""
Write-Host "New thresholds (adaptive):" -ForegroundColor Green
Write-Host "  Latency alert: $newLatency ms (was: 1500 ms)" -ForegroundColor White
Write-Host "  Error alert: $("{0:N3}" -f $newErr)/s (was: 0.05/s)" -ForegroundColor White
Write-Host "  Staleness alert: $newStale s (was: 300 s)" -ForegroundColor White
Write-Host ""

# Update rules file
$path = Join-Path $repo $RulesFile

if (-not (Test-Path $path)) {
    Write-Host "✗ ERROR: Rules file not found: $path" -ForegroundColor Red
    exit 1
}

Write-Host "Reading rules file..." -ForegroundColor Yellow
$txt = Get-Content $path -Raw

# Apply patches (simple text replacement; production should use YAML parser)
Write-Host "Applying threshold patches..." -ForegroundColor Yellow

# Patch 1: PortfolioRefreshLatencyHighP95
$txt = $txt -replace '(?ms)(alert:\s*PortfolioRefreshLatencyHighP95.*?expr:\s*\|[\r\n\s]*)(.*?)(\r?\n\s*for:)', "`$1histogram_quantile(0.95, `n            sum by (le, exchange) (`n              rate(spark_portfolio_refresh_latency_ms_bucket[5m])`n            )`n          ) > $newLatency`$3"

# Patch 2: ExchangeApiErrorRateHigh
$txt = $txt -replace '(?ms)(alert:\s*ExchangeApiErrorRateHigh.*?expr:\s*\|[\r\n\s]*)(.*?)(\r?\n\s*for:)', "`$1sum by (exchange) (`n            rate(spark_exchange_api_error_total[5m])`n          ) > $("{0:N3}" -f $newErr)`$3"

# Patch 3: PortfolioDataStale
$txt = $txt -replace '(?ms)(alert:\s*PortfolioDataStale.*?expr:\s*\|[\r\n\s]*)(.*?)(\r?\n\s*for:)', "`$1(time() - spark_portfolio_last_update_timestamp) > $newStale`$3"

if ($DryRun) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  DRY RUN - NEW RULES (Preview)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $txt
    Write-Host ""
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Cyan
    exit 0
}

# Write updated rules
$txt | Set-Content $path -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  AUTO-TUNING COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Updated rules: $RulesFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Reload Prometheus: curl -X POST http://localhost:9090/-/reload" -ForegroundColor White
Write-Host "  2. Verify rules: http://localhost:9090/rules" -ForegroundColor White
Write-Host "  3. Check alerts: http://localhost:9090/alerts" -ForegroundColor White
Write-Host ""
Write-Host "Changes:" -ForegroundColor Yellow
Write-Host "  - Latency threshold: 1500ms → $newLatency ms" -ForegroundColor White
Write-Host "  - Error threshold: 0.05/s → $("{0:N3}" -f $newErr)/s" -ForegroundColor White
Write-Host "  - Staleness threshold: 300s → $newStale s" -ForegroundColor White
Write-Host ""

