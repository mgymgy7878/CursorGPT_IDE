# SPARK — CANARY LIVE RUN — SMOKE TEST
# PowerShell script for live canary testing with real keys

param(
    [string]$BinanceApiKey = "",
    [string]$BinanceApiSecret = "",
    [string]$ExecutorToken = "dev-secret-change-me"
)

Write-Host "🚀 SPARK CANARY LIVE RUN - SMOKE TEST" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Create logs directory
$logsDir = "logs"
if (!(Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$logFile = "$logsDir/live-smoke-$timestamp.json"
$metricsFile = "$logsDir/metrics-$timestamp.txt"

# 1. ENV Setup
Write-Host "📋 Setting up environment variables..." -ForegroundColor Yellow
$env:BINANCE_MAINNET_API_KEY = $BinanceApiKey
$env:BINANCE_MAINNET_API_SECRET = $BinanceApiSecret
$env:EXECUTOR_TOKEN = $ExecutorToken
$env:TRADE_WHITELIST = "BTCUSDT"
$env:LIVE_MAX_NOTIONAL = "20"
$env:TRADE_WINDOW = "07:00-23:30"
$env:TRADING_KILL_SWITCH = "0"

# Initialize results object
$results = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    environment = @{
        trade_whitelist = $env:TRADE_WHITELIST
        live_max_notional = $env:LIVE_MAX_NOTIONAL
        trade_window = $env:TRADE_WINDOW
        trading_kill_switch = $env:TRADING_KILL_SWITCH
        has_api_keys = !([string]::IsNullOrEmpty($BinanceApiKey) -or [string]::IsNullOrEmpty($BinanceApiSecret))
        has_executor_token = ![string]::IsNullOrEmpty($ExecutorToken)
    }
    tests = @{}
}

# 2. Preflight Health Check
Write-Host "🔍 Preflight health check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/public/live/health" -Method GET
    $results.tests.preflight_health = @{
        status = "PASSED"
        response = $healthResponse
    }
    Write-Host "Health Status: $($healthResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
    
    if ($healthResponse.exchange -eq "up" -and $healthResponse.ws -eq "up" -and $healthResponse.drift -eq 0) {
        Write-Host "✅ Preflight check PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Preflight check FAILED" -ForegroundColor Red
        $results.tests.preflight_health.status = "FAILED"
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.tests.preflight_health = @{
        status = "FAILED"
        error = $_.Exception.Message
    }
    exit 1
}

# 3. Preflight Snapshot Check
Write-Host "📸 Preflight snapshot check..." -ForegroundColor Yellow
try {
    $snapshotResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/public/live/snapshot" -Method GET
    $results.tests.preflight_snapshot = @{
        status = "PASSED"
        response = $snapshotResponse
    }
    Write-Host "Snapshot Status: $($snapshotResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
    
    # Check environment readiness
    if ($snapshotResponse.envReady) {
        $envReady = $snapshotResponse.envReady
        Write-Host "Environment Readiness:" -ForegroundColor Cyan
        Write-Host "  - Has API Keys: $($envReady.hasKeys)" -ForegroundColor $(if($envReady.hasKeys){"Green"}else{"Red"})
        Write-Host "  - Has Token: $($envReady.hasToken)" -ForegroundColor $(if($envReady.hasToken){"Green"}else{"Red"})
        Write-Host "  - Whitelist OK: $($envReady.whitelistOk)" -ForegroundColor $(if($envReady.whitelistOk){"Green"}else{"Red"})
        Write-Host "  - Window Now: $($envReady.windowNow)" -ForegroundColor $(if($envReady.windowNow){"Green"}else{"Red"})
        
        if ($envReady.hasKeys -and $envReady.hasToken -and $envReady.whitelistOk -and $envReady.windowNow) {
            Write-Host "✅ Environment ready for canary run" -ForegroundColor Green
        } else {
            Write-Host "❌ Environment not ready for canary run" -ForegroundColor Red
            $results.tests.preflight_snapshot.status = "FAILED"
            exit 1
        }
    }
    
} catch {
    Write-Host "❌ Snapshot check failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.tests.preflight_snapshot = @{
        status = "FAILED"
        error = $_.Exception.Message
    }
    exit 1
}

# 4. ARM Test (Shadow Mode)
Write-Host "🛡️ ARM Test (Shadow Mode)..." -ForegroundColor Yellow
$env:LIVE_TRADING = "1"
$env:SHADOW_MODE = "1"

try {
    $armBody = @{
        symbol = "BTCUSDT"
        side = "BUY"
        type = "MARKET"
        qty = 0.0002
    } | ConvertTo-Json -Compress

    $armResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/public/strategy/deploy-live" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $env:EXECUTOR_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $armBody

    Write-Host "❌ ARM test should have failed with 403" -ForegroundColor Red
    $results.tests.arm_test = @{
        status = "FAILED"
        response = $armResponse
    }
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ ARM test PASSED - Order blocked as expected" -ForegroundColor Green
        $results.tests.arm_test = @{
            status = "PASSED"
            expected_status = 403
            actual_status = $_.Exception.Response.StatusCode
        }
    } else {
        Write-Host "❌ ARM test failed with unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $results.tests.arm_test = @{
            status = "FAILED"
            expected_status = 403
            actual_status = $_.Exception.Response.StatusCode
        }
        exit 1
    }
}

# 5. CONFIRM Test (Live Canary)
Write-Host "🎯 CONFIRM Test (Live Canary)..." -ForegroundColor Yellow
$env:LIVE_TRADING = "2"
$env:SHADOW_MODE = "0"

try {
    $canaryBody = @{
        symbol = "BTCUSDT"
        side = "BUY"
        type = "MARKET"
        qty = 0.0002
        confirmPhrase = "CONFIRM LIVE TRADE"
    } | ConvertTo-Json -Compress

    $canaryResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/public/strategy/deploy-live" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $env:EXECUTOR_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $canaryBody

    Write-Host "✅ Canary order submitted: $($canaryResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
    $results.tests.confirm_test = @{
        status = "PASSED"
        response = $canaryResponse
    }
    
    # Wait for execution
    Write-Host "⏳ Waiting 5 seconds for order execution..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
} catch {
    Write-Host "❌ Canary test failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.tests.confirm_test = @{
        status = "FAILED"
        error = $_.Exception.Message
    }
    exit 1
}

# 6. Post-Canary Snapshot
Write-Host "📸 Post-canary snapshot..." -ForegroundColor Yellow
try {
    $snapshot = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/public/live/snapshot" -Method GET
    $results.tests.post_canary_snapshot = @{
        status = "PASSED"
        response = $snapshot
    }
    Write-Host "Post-Canary Snapshot: $($snapshot | ConvertTo-Json -Compress)" -ForegroundColor Green
    
    if ($snapshot.drift -eq 0 -and $snapshot.ws -eq "up") {
        Write-Host "✅ Post-canary snapshot PASSED" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Post-canary snapshot WARNING: drift=$($snapshot.drift), ws=$($snapshot.ws)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Post-canary snapshot failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.tests.post_canary_snapshot = @{
        status = "FAILED"
        error = $_.Exception.Message
    }
}

# 7. Metrics Snapshot
Write-Host "📊 Metrics snapshot..." -ForegroundColor Yellow
try {
    $metrics = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/public/live/metrics" -Method GET
    $results.tests.metrics_snapshot = @{
        status = "PASSED"
        response = $metrics
    }
    Write-Host "📊 Metrics snapshot captured" -ForegroundColor Green
    
    # Save metrics to file
    $metrics | Out-File -FilePath $metricsFile -Encoding UTF8
    Write-Host "📁 Metrics saved to: $metricsFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Metrics check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    $results.tests.metrics_snapshot = @{
        status = "FAILED"
        error = $_.Exception.Message
    }
}

# 8. Rollback Test (Optional)
Write-Host "🔄 Rollback test..." -ForegroundColor Yellow
$env:TRADING_KILL_SWITCH = "1"

try {
    $rollbackTest = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/public/strategy/deploy-live" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $env:EXECUTOR_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $armBody

    Write-Host "❌ Rollback test should have failed with 503" -ForegroundColor Red
    $results.tests.rollback_test = @{
        status = "FAILED"
        response = $rollbackTest
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 503) {
        Write-Host "✅ Rollback test PASSED - Kill switch active" -ForegroundColor Green
        $results.tests.rollback_test = @{
            status = "PASSED"
            expected_status = 503
            actual_status = $_.Exception.Response.StatusCode
        }
    } else {
        Write-Host "⚠️ Rollback test unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        $results.tests.rollback_test = @{
            status = "WARNING"
            expected_status = 503
            actual_status = $_.Exception.Response.StatusCode
        }
    }
}

# Reset kill switch
$env:TRADING_KILL_SWITCH = "0"

# Save results to log file
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $logFile -Encoding UTF8
Write-Host "📁 Results saved to: $logFile" -ForegroundColor Green

Write-Host "🎉 CANARY LIVE RUN SMOKE TEST COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "📁 Log file: $logFile" -ForegroundColor Cyan
Write-Host "📁 Metrics file: $metricsFile" -ForegroundColor Cyan 