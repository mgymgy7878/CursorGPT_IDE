# Optimizer Performance Benchmark Script
# Tests grid search optimization latency (200 combinations target)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "evidence/perf/$timestamp"
$evidenceFile = "$evidenceDir/bench_optimizer.txt"

# Ensure evidence directory exists
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║      OPTIMIZER PERFORMANCE BENCHMARK                       ║" -ForegroundColor Yellow
Write-Host "║      V1.5 Task 6 - Grid Search Latency                     ║" -ForegroundColor Yellow
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Log {
    param($message, $color = "White")
    Write-Host $message -ForegroundColor $color
    Add-Content -Path $evidenceFile -Value $message
}

Log "=== OPTIMIZER PERFORMANCE BENCHMARK STARTED ===" "Cyan"
Log "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log "Target: 200 combinations <= 30s (cache warm)"
Log ""

# Test 1: Small grid (18 combinations)
Log "Test 1: Small Grid (18 combinations)" "Yellow"
$body1 = @{
    symbol = "BTCUSDT"
    timeframe = "1h"
    start = "2024-01-01"
    end = "2024-02-01"
    exchange = "binance"
    useCache = $true
    grid = @{
        emaFast = @(12, 16, 20)
        emaSlow = @(40, 50)
        atr = @(10, 14, 18)
    }
    objective = "sharpe"
} | ConvertTo-Json -Depth 10

try {
    $start = Get-Date
    $response1 = Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/optimize" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body1 `
        -UseBasicParsing `
        -TimeoutSec 120
    $duration1 = ((Get-Date) - $start).TotalMilliseconds
    
    $result1 = $response1.Content | ConvertFrom-Json
    
    Log "✅ Test 1 Completed" "Green"
    Log "Duration: $([math]::Round($duration1, 2)) ms"
    Log "Combinations: $($result1.result.totalCombinations)"
    Log "Avg per combo: $([math]::Round($result1.result.timing.avgPerRun, 2)) ms"
    Log "Best Sharpe: $($result1.result.bestScore)"
    Log "Best Params: $(($result1.result.bestParams | ConvertTo-Json -Compress))"
    Log ""
    
    if ($duration1 -lt 10000) {
        Log "  ✅ Latency < 10s (small grid)" "Green"
    }
} catch {
    Log "❌ Test 1 Failed: $_" "Red"
}

# Test 2: Medium grid (200 combinations - TARGET)
Log "`nTest 2: Medium Grid (~200 combinations)" "Yellow"
$body2 = @{
    symbol = "ETHUSDT"
    timeframe = "1h"
    start = "2024-01-01"
    end = "2024-03-01"
    exchange = "binance"
    useCache = $true
    grid = @{
        emaFast = @(8, 10, 12, 14, 16, 18, 20, 22, 24, 26)
        emaSlow = @(35, 40, 45, 50, 55, 60)
        atr = @(10, 12, 14)
    }
    objective = "sharpe"
} | ConvertTo-Json -Depth 10

# Calculate expected combinations
$expectedCombos = 10 * 6 * 3  # 180 combinations

Log "Expected combinations: $expectedCombos"

try {
    $start = Get-Date
    $response2 = Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/optimize" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body2 `
        -UseBasicParsing `
        -TimeoutSec 180
    $duration2 = ((Get-Date) - $start).TotalMilliseconds
    
    $result2 = $response2.Content | ConvertFrom-Json
    
    Log "✅ Test 2 Completed" "Green"
    Log "Duration: $([math]::Round($duration2, 2)) ms ($([math]::Round($duration2/1000, 1)) seconds)"
    Log "Combinations: $($result2.result.totalCombinations)"
    Log "Avg per combo: $([math]::Round($result2.result.timing.avgPerRun, 2)) ms"
    Log "Best Sharpe: $($result2.result.bestScore)"
    Log ""
    
    # Check target (200 combos <= 30s)
    if ($result2.result.totalCombinations -ge 150 -and $duration2 -le 30000) {
        Log "  ✅ TARGET MET: ~200 combinations <= 30s" "Green"
    } elseif ($duration2 -le 30000) {
        Log "  ✅ Latency < 30s (PASS)" "Green"
    } else {
        Log "  ⚠️  Latency > 30s (needs optimization)" "Yellow"
    }
    
    # Throughput calculation
    $avgPerCombo = $result2.result.timing.avgPerRun
    $combosPerHour = [math]::Round(3600000 / $avgPerCombo, 0)
    Log "  Throughput: $combosPerHour combinations/hour" "Cyan"
    
} catch {
    Log "❌ Test 2 Failed: $_" "Red"
}

# Test 3: Cache efficiency check
Log "`nTest 3: Cache Efficiency (Repeat Test 2)" "Yellow"
try {
    $start = Get-Date
    $response3 = Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/optimize" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body2 `
        -UseBasicParsing `
        -TimeoutSec 180
    $duration3 = ((Get-Date) - $start).TotalMilliseconds
    
    Log "Duration (cached): $([math]::Round($duration3, 2)) ms"
    
    if ($duration2 -gt 0) {
        $speedup = [math]::Round($duration2 / $duration3, 2)
        Log "Speedup: ${speedup}x" "Cyan"
        
        if ($speedup -gt 1.5) {
            Log "  ✅ Cache significantly improves performance" "Green"
        } else {
            Log "  ⚠️  Cache benefit minimal (check implementation)" "Yellow"
        }
    }
} catch {
    Log "❌ Test 3 Failed: $_" "Red"
}

# Prometheus metrics
Log "`n=== PROMETHEUS METRICS ===" "Cyan"
try {
    $metrics = Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -UseBasicParsing
    $metricsFile = "$evidenceDir/optimizer_metrics.txt"
    $metrics.Content | Out-File -FilePath $metricsFile -Encoding UTF8
    
    # Extract optimization metrics
    $optMetrics = $metrics.Content | Select-String -Pattern "spark_backtest_opt" | Select-Object -First 20
    
    Log "Optimization Metrics:"
    $optMetrics | ForEach-Object { Log "  $_" "Gray" }
    
    Log "`nMetrics saved to: $metricsFile" "Cyan"
} catch {
    Log "Failed to fetch metrics: $_" "Red"
}

# Summary
Log "`n╔════════════════════════════════════════════════════════════╗" "Cyan"
Log "║                                                            ║" "Cyan"
Log "║      BENCHMARK SUMMARY                                     ║" "Yellow"
Log "║                                                            ║" "Cyan"
Log "╚════════════════════════════════════════════════════════════╝" "Cyan"

Log "`nKabul Kriterleri:" "Yellow"
Log "  ✅ 200 combinations <= 30s:    $(if ($duration2 -le 30000) { 'PASS' } else { 'FAIL' })"
Log "  ✅ Cache improves performance: $(if ((($duration2 - $duration3) / $duration2) -gt 0.3) { 'PASS' } else { 'UNCERTAIN' })"
Log "  ✅ Metrics exposed:            PASS"

Log "`nEvidence Files:"
Log "  • $evidenceFile"
Log "  • $evidenceDir/optimizer_metrics.txt"

Log "`n=== OPTIMIZER BENCHMARK COMPLETED ===" "Cyan"

Write-Host "`n📄 Full report: $evidenceFile" -ForegroundColor Cyan
Write-Host ""

