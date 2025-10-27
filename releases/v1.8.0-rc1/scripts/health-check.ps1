# Spark Platform Health Check Script (PowerShell)
# Checks: Web (3003), Executor (4001), Streams (4001)

Write-Host "[*] Spark Platform Health Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Web health check
Write-Host "[*] probing web health (port 3003)..." -ForegroundColor Yellow
try {
    $webResponse = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/public/healthz" -UseBasicParsing -TimeoutSec 5
    if ($webResponse.Content -match "ok") {
        Write-Host "✅ Web: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Web: FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Web: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Executor health check
Write-Host "[*] probing executor health (port 4001)..." -ForegroundColor Yellow
try {
    $executorResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -UseBasicParsing -TimeoutSec 5
    if ($executorResponse.Content -match "ok") {
        Write-Host "✅ Executor: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Executor: FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Executor: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Streams health check
Write-Host "[*] probing streams metrics (port 4001)..." -ForegroundColor Yellow
try {
    $streamsResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -UseBasicParsing -TimeoutSec 5
    if ($streamsResponse.Content -match "ws_msgs_total|ingest_latency_ms_bucket") {
        Write-Host "✅ Streams: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Streams: FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Streams: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Optimizer service health check
Write-Host "[*] probing optimizer health (port 4001)..." -ForegroundColor Yellow
try {
    $optimizerResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/optimizer/health" -UseBasicParsing -TimeoutSec 5
    if ($optimizerResponse.Content -match "healthy") {
        Write-Host "✅ Optimizer: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Optimizer: FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Optimizer: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Drift Gates service health check
Write-Host "[*] probing drift gates status (port 4001)..." -ForegroundColor Yellow
try {
    $gatesResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/gates/status" -UseBasicParsing -TimeoutSec 5
    if ($gatesResponse.Content -match "gateState") {
        Write-Host "✅ Drift Gates: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Drift Gates: FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Drift Gates: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 All services healthy!" -ForegroundColor Green
