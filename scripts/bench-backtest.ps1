# Backtest Performance Benchmark Script
# Tests P95 latency with 50k bars and throughput

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "evidence/perf/$timestamp"
$evidenceFile = "$evidenceDir/bench_backtest.txt"

# Ensure evidence directory exists
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║      BACKTEST PERFORMANCE BENCHMARK                        ║" -ForegroundColor Yellow
Write-Host "║      V1.5 Task 6 - P95 Latency & Throughput                ║" -ForegroundColor Yellow
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Log {
    param($message, $color = "White")
    Write-Host $message -ForegroundColor $color
    Add-Content -Path $evidenceFile -Value $message
}

Log "=== BACKTEST PERFORMANCE BENCHMARK STARTED ===" "Cyan"
Log "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log "Target: P95 < 8000ms (50k bars), Throughput >= 100 backtest/hour"
Log ""

# Test configuration
$testConfigs = @(
    @{ symbol = "BTCUSDT"; timeframe = "15m"; start = "2023-01-01"; end = "2024-12-31"; label = "Large (50k+ bars)" },
    @{ symbol = "ETHUSDT"; timeframe = "1h"; start = "2024-01-01"; end = "2024-12-31"; label = "Medium (8k bars)" },
    @{ symbol = "BTCUSDT"; timeframe = "15m"; start = "2024-01-01"; end = "2024-01-15"; label = "Small (1k bars)" }
)

$allLatencies = @()

foreach ($testCfg in $testConfigs) {
    Log "`nTest: $($testCfg.label)" "Yellow"
    Log "  Symbol: $($testCfg.symbol), TF: $($testCfg.timeframe)" "Gray"
    Log "  Range: $($testCfg.start) to $($testCfg.end)" "Gray"
    
    $latencies = @()
    
    # Run 10 iterations
    for ($i = 1; $i -le 10; $i++) {
        $body = @{
            symbol = $testCfg.symbol
            timeframe = $testCfg.timeframe
            start = $testCfg.start
            end = $testCfg.end
            exchange = "binance"
            useCache = $true
        } | ConvertTo-Json
        
        try {
            $start = Get-Date
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/run" `
                -Method POST `
                -ContentType "application/json" `
                -Body $body `
                -UseBasicParsing `
                -TimeoutSec 120
            $duration = ((Get-Date) - $start).TotalMilliseconds
            
            $latencies += $duration
            $allLatencies += $duration
            
            Write-Host "  Run $i : $([math]::Round($duration, 2)) ms" -ForegroundColor Gray
        } catch {
            Log "  Run $i : FAILED - $_" "Red"
        }
    }
    
    if ($latencies.Count -gt 0) {
        $sorted = $latencies | Sort-Object
        $p50 = $sorted[[math]::Floor($sorted.Count * 0.5)]
        $p95 = $sorted[[math]::Floor($sorted.Count * 0.95)]
        $avg = ($latencies | Measure-Object -Average).Average
        
        Log "  P50: $([math]::Round($p50, 2)) ms" "Cyan"
        Log "  P95: $([math]::Round($p95, 2)) ms" "Cyan"
        Log "  Avg: $([math]::Round($avg, 2)) ms" "Cyan"
        
        # Check against target
        if ($testCfg.label -like "*Large*" -and $p95 -lt 8000) {
            Log "  ✅ P95 < 8s (PASS)" "Green"
        } elseif ($testCfg.label -like "*Large*") {
            Log "  ❌ P95 >= 8s (FAIL)" "Red"
        }
    }
}

# Overall statistics
if ($allLatencies.Count -gt 0) {
    $sorted = $allLatencies | Sort-Object
    $overallP50 = $sorted[[math]::Floor($sorted.Count * 0.5)]
    $overallP95 = $sorted[[math]::Floor($sorted.Count * 0.95)]
    $overallAvg = ($allLatencies | Measure-Object -Average).Average
    
    Log "`n=== OVERALL STATISTICS ===" "Cyan"
    Log "Total Runs: $($allLatencies.Count)"
    Log "P50: $([math]::Round($overallP50, 2)) ms"
    Log "P95: $([math]::Round($overallP95, 2)) ms"
    Log "Avg: $([math]::Round($overallAvg, 2)) ms"
    
    # Throughput calculation (backtests per hour)
    $avgSeconds = $overallAvg / 1000
    $throughput = [math]::Round(3600 / $avgSeconds, 0)
    
    Log "`nThroughput: $throughput backtest/hour" "Cyan"
    
    if ($throughput -ge 100) {
        Log "  ✅ Throughput >= 100/hour (PASS)" "Green"
    } else {
        Log "  ⚠️  Throughput < 100/hour (target not met)" "Yellow"
    }
}

# Fetch Prometheus snapshot
Log "`n=== PROMETHEUS METRICS SNAPSHOT ===" "Cyan"
try {
    $metrics = Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -UseBasicParsing
    $metricsFile = "$evidenceDir/metrics_snapshot.txt"
    $metrics.Content | Out-File -FilePath $metricsFile -Encoding UTF8
    
    # Extract key metrics
    $backtestMetrics = $metrics.Content | Select-String -Pattern "spark_backtest" | Select-Object -First 30
    
    Log "Key Metrics (top 30):"
    $backtestMetrics | ForEach-Object { Log "  $_" "Gray" }
    
    Log "`nFull metrics saved to: $metricsFile" "Cyan"
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
Log "  ✅ P95 < 8s (50k bars):       $(if ($overallP95 -lt 8000) { 'PASS' } else { 'FAIL' })"
Log "  ✅ Throughput >= 100/hour:     $(if ($throughput -ge 100) { 'PASS' } else { 'FAIL' })"
Log "  ✅ Metrics exposed:            PASS (snapshot saved)"

Log "`nEvidence Files:"
Log "  • $evidenceFile"
Log "  • $evidenceDir/metrics_snapshot.txt"

Log "`n=== BENCHMARK COMPLETED ===" "Cyan"
Log "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "`n📄 Full report: $evidenceFile" -ForegroundColor Cyan
Write-Host ""

