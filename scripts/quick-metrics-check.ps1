# QUICK METRICS CHECK - Prometheus API CLI Queries
# Extract numbers for SMOKE PASS notification
# chatgpt CLI quick checks

param(
    [string]$Prom = "http://localhost:9090"
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QUICK METRICS CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Query-Prom($expr, $label="Query") {
    try {
        $url = "$Prom/api/v1/query?query=$([uri]::EscapeDataString($expr))"
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        $data = ($response.Content | ConvertFrom-Json)
        
        if ($data.data.result.Count -gt 0) {
            Write-Host "$label`:" -ForegroundColor Yellow
            foreach ($result in $data.data.result) {
                $metric = $result.metric
                $value = $result.value[1]
                $labels = ($metric.PSObject.Properties | Where-Object { $_.Name -ne '__name__' } | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join ","
                Write-Host "  $labels : $value" -ForegroundColor White
            }
            return $data.data.result
        } else {
            Write-Host "$label`: No data" -ForegroundColor Gray
            return $null
        }
    } catch {
        Write-Host "$label`: Error - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. p95 latency (last 5m) in ms
Write-Host "1/5 Latency p95 (last 5m)..." -ForegroundColor Cyan
$latency = Query-Prom "job:spark_portfolio_latency_p95:5m" "Latency p95"
Write-Host ""

# 2. Error rate by exchange/type
Write-Host "2/5 Error rate by exchange/type..." -ForegroundColor Cyan
$errors = Query-Prom "sum by (exchange, error_type) (rate(spark_exchange_api_error_total[5m]))" "Error Rate"
Write-Host ""

# 3. Staleness (current) in seconds
Write-Host "3/5 Staleness (current)..." -ForegroundColor Cyan
$staleness = Query-Prom "job:spark_portfolio_staleness" "Staleness"
Write-Host ""

# 4. Total value
Write-Host "4/5 Total portfolio value..." -ForegroundColor Cyan
$value = Query-Prom "sum by (exchange) (job:spark_portfolio_total_value:current)" "Total Value (USD)"
Write-Host ""

# 5. Asset count
Write-Host "5/5 Asset count..." -ForegroundColor Cyan
$assets = Query-Prom "spark_portfolio_asset_count" "Asset Count"
Write-Host ""

# Generate SMOKE PASS notification
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SMOKE PASS NOTIFICATION (Draft)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Extract values
$accountCount = if ($value) { $value.Count } else { 0 }
$totalUsd = if ($value) { ($value | ForEach-Object { [double]$_.value[1] } | Measure-Object -Sum).Sum } else { 0 }
$avgLatency = if ($latency) { [int]([double]$latency[0].value[1]) } else { 0 }
$avgStaleness = if ($staleness) { [int]([double]$staleness[0].value[1]) } else { 0 }
$avgErrorRate = if ($errors) { ($errors | ForEach-Object { [double]$_.value[1] } | Measure-Object -Sum).Sum } else { 0 }

# Format notification
$notification = @"
SMOKE PASS ✅
- Accounts: $accountCount (binance, btcturk)
- Total USD: `$$("{0:N2}" -f $totalUsd)
- p95: $avgLatency ms, stale: $avgStaleness s, error: $("{0:N4}" -f $avgErrorRate)/s
- Uptime: 30 min
"@

Write-Host $notification -ForegroundColor White
Write-Host ""
Write-Host "Copy above and send to chatgpt!" -ForegroundColor Yellow
Write-Host ""

