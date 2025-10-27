# Quick Cache Smoke Test
# Tests DuckDB cache performance (cold vs warm runs)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "evidence/cache"
$evidenceFile = "$evidenceDir/cache_smoke_$timestamp.txt"

# Ensure evidence directory exists
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║      QUICK CACHE SMOKE TEST                                ║" -ForegroundColor Yellow
Write-Host "║      V1.5 - DuckDB Cache Layer Verification                ║" -ForegroundColor Yellow
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Log function
function Log {
    param($message, $color = "White")
    Write-Host $message -ForegroundColor $color
    Add-Content -Path $evidenceFile -Value $message
}

Log "=== CACHE SMOKE TEST STARTED ===" "Cyan"
Log "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log "Evidence File: $evidenceFile"
Log ""

# Step 1: Restart services
Log "Step 1: Restarting services..." "Yellow"
try {
    & .\durdur.ps1 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    & .\basla.ps1 2>&1 | Out-Null
    Log "Services restart initiated" "Green"
    Log "Waiting 20 seconds for services to be ready..."
    Start-Sleep -Seconds 20
} catch {
    Log "Error restarting services: $_" "Red"
}

# Step 2: Health check
Log "`nStep 2: Health check..." "Yellow"
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -UseBasicParsing -TimeoutSec 5
    Log "Health check: OK (Status: $($health.StatusCode))" "Green"
} catch {
    Log "Health check: FAILED - $_" "Red"
    Log "`nAborting test - executor not responding"
    exit 1
}

# Test configuration
$testBody = @{
    symbol = "BTCUSDT"
    timeframe = "1h"
    start = "2024-01-01"
    end = "2024-01-07"
    exchange = "binance"
    useCache = $true
} | ConvertTo-Json

Log "`nTest Configuration:" "Cyan"
Log "  Symbol: BTCUSDT"
Log "  Timeframe: 1h"
Log "  Range: 2024-01-01 to 2024-01-07"
Log "  Cache: Enabled"

# Step 3: Cold run (first time)
Log "`nStep 3: Cold Run (First Backtest)..." "Yellow"
try {
    $coldStart = Get-Date
    $coldResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/run" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testBody `
        -UseBasicParsing
    $coldEnd = Get-Date
    $coldDuration = ($coldEnd - $coldStart).TotalMilliseconds
    
    Log "Cold run completed" "Green"
    Log "Duration: $([math]::Round($coldDuration, 2)) ms" "Cyan"
    
    if ($coldDuration -lt 10000) {
        Log "Status: ✅ PASS (< 10s)" "Green"
    } else {
        Log "Status: ⚠️ SLOW (> 10s)" "Yellow"
    }
} catch {
    Log "Cold run FAILED: $_" "Red"
    $coldDuration = 0
}

# Wait a bit before warm run
Start-Sleep -Seconds 2

# Step 4: Warm run (second time - should hit cache)
Log "`nStep 4: Warm Run (Cache Hit Expected)..." "Yellow"
try {
    $warmStart = Get-Date
    $warmResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/run" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testBody `
        -UseBasicParsing
    $warmEnd = Get-Date
    $warmDuration = ($warmEnd - $warmStart).TotalMilliseconds
    
    Log "Warm run completed" "Green"
    Log "Duration: $([math]::Round($warmDuration, 2)) ms" "Cyan"
    
    if ($warmDuration -lt 1000) {
        Log "Status: ✅ EXCELLENT (< 1s)" "Green"
    } elseif ($warmDuration -lt 3000) {
        Log "Status: ✅ GOOD (< 3s)" "Green"
    } else {
        Log "Status: ⚠️ NEEDS OPTIMIZATION (> 3s)" "Yellow"
    }
    
    # Calculate speedup
    if ($coldDuration -gt 0) {
        $speedup = [math]::Round($coldDuration / $warmDuration, 2)
        Log "Speedup: ${speedup}x faster!" "Cyan"
        
        if ($speedup -ge 5) {
            Log "Cache Performance: ✅ EXCELLENT (${speedup}x)" "Green"
        } elseif ($speedup -ge 2) {
            Log "Cache Performance: ✅ GOOD (${speedup}x)" "Green"
        } else {
            Log "Cache Performance: ⚠️ POOR (${speedup}x)" "Yellow"
        }
    }
} catch {
    Log "Warm run FAILED: $_" "Red"
    $warmDuration = 0
}

# Step 5: Fetch metrics
Log "`nStep 5: Fetching Prometheus Metrics..." "Yellow"
try {
    $metrics = Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -UseBasicParsing
    $metricsText = $metrics.Content
    
    # Extract cache metrics
    $cacheHit = ($metricsText | Select-String -Pattern "spark_backtest_cache_hit_total" -AllMatches).Matches
    $cacheMiss = ($metricsText | Select-String -Pattern "spark_backtest_cache_miss_total" -AllMatches).Matches
    
    Log "`nCache Metrics:" "Cyan"
    if ($cacheHit.Count -gt 0) {
        Log "Cache Hits:" "White"
        $cacheHit | ForEach-Object { Log "  $_" }
    } else {
        Log "Cache Hits: (none)" "Yellow"
    }
    
    if ($cacheMiss.Count -gt 0) {
        Log "`nCache Misses:" "White"
        $cacheMiss | ForEach-Object { Log "  $_" }
    } else {
        Log "Cache Misses: (none)" "Yellow"
    }
    
} catch {
    Log "Failed to fetch metrics: $_" "Red"
}

# Step 6: Cache stats endpoint
Log "`nStep 6: Cache Statistics..." "Yellow"
try {
    $stats = Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/cache/stats" -UseBasicParsing
    $statsJson = $stats.Content | ConvertFrom-Json
    
    Log "Total Candles: $($statsJson.stats.totalCandles)" "Cyan"
    Log "Exchanges: $($statsJson.stats.exchanges)" "Cyan"
    Log "Symbols: $($statsJson.stats.symbols)" "Cyan"
} catch {
    Log "Failed to fetch cache stats: $_" "Red"
}

# Summary
Log "`n╔════════════════════════════════════════════════════════════╗" "Cyan"
Log "║                                                            ║" "Cyan"
Log "║      TEST SUMMARY                                          ║" "Yellow"
Log "║                                                            ║" "Cyan"
Log "╚════════════════════════════════════════════════════════════╝" "Cyan"

Log "`nCold Run:  $([math]::Round($coldDuration, 2)) ms"
Log "Warm Run:  $([math]::Round($warmDuration, 2)) ms"

if ($coldDuration -gt 0 -and $warmDuration -gt 0) {
    $speedup = [math]::Round($coldDuration / $warmDuration, 2)
    Log "Speedup:   ${speedup}x" "Green"
    
    # Final verdict
    if ($speedup -ge 5 -and $warmDuration -lt 2000) {
        Log "`n✅ CACHE TEST: PASSED" "Green"
        Log "Cache layer is working excellently!" "Green"
    } elseif ($speedup -ge 2) {
        Log "`n✅ CACHE TEST: PASSED (with warnings)" "Yellow"
        Log "Cache is working but could be optimized" "Yellow"
    } else {
        Log "`n❌ CACHE TEST: FAILED" "Red"
        Log "Cache is not providing expected speedup" "Red"
    }
} else {
    Log "`n⚠️  CACHE TEST: INCONCLUSIVE" "Yellow"
    Log "Unable to calculate speedup due to errors" "Yellow"
}

Log "`nEvidence saved to: $evidenceFile" "Cyan"
Log "`n=== CACHE SMOKE TEST COMPLETED ===" "Cyan"
Log "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "`n📄 Full report: $evidenceFile" -ForegroundColor Cyan
Write-Host "📊 View metrics: http://127.0.0.1:4001/metrics" -ForegroundColor Cyan
Write-Host ""

