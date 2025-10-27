# Feeds Smoke Test - PowerShell
# PowerShell, no emoji

$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:4005"  # marketdata port (varsayılan)

Write-Host "Feeds Smoke Test Started" -ForegroundColor Green

# Test canary endpoint
Write-Host "Testing canary endpoint..." -ForegroundColor Yellow
try {
    $canaryResponse = Invoke-RestMethod -Uri "$base/feeds/canary?dry=true" -Method GET
    if ($canaryResponse.ok -ne $true) {
        throw "Canary test failed: ok=$($canaryResponse.ok)"
    }
    Write-Host "Canary test PASS" -ForegroundColor Green
} catch {
    Write-Host "Canary test FAIL: $_" -ForegroundColor Red
    exit 1
}

# Test health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$base/feeds/health" -Method GET
    if ($healthResponse.status -ne "ok") {
        throw "Health check failed: status=$($healthResponse.status)"
    }
    
    # Check for lastEventTs and lastDbWriteTs fields
    $btcturkHealth = $healthResponse.sources.btcturk
    $bistHealth = $healthResponse.sources.bist
    
    if (-not $btcturkHealth.lastEventTs -or -not $bistHealth.lastEventTs) {
        throw "Health response missing lastEventTs fields"
    }
    
    if (-not $btcturkHealth.lastDbWriteTs -or -not $bistHealth.lastDbWriteTs) {
        throw "Health response missing lastDbWriteTs fields"
    }
    
    Write-Host "Health test PASS" -ForegroundColor Green
} catch {
    Write-Host "Health test FAIL: $_" -ForegroundColor Red
    exit 1
}

# Test metrics endpoint
Write-Host "Testing metrics endpoint..." -ForegroundColor Yellow
try {
    $metricsResponse = Invoke-RestMethod -Uri "$base/metrics" -Method GET
    $metricsText = $metricsResponse.ToString()
    
    if ($metricsText -notmatch "feed_events_total" -or 
        $metricsText -notmatch "ws_reconnects_total" -or 
        $metricsText -notmatch "feed_latency_ms" -or
        $metricsText -notmatch "event_to_db_ms") {
        throw "Feed metrics missing from metrics endpoint"
    }
    Write-Host "Metrics test PASS" -ForegroundColor Green
} catch {
    Write-Host "Metrics test FAIL: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Feeds Smoke Test PASS" -ForegroundColor Green
Write-Host "All tests completed successfully" -ForegroundColor Green
