# Mini Smoke Test - Idempotent ve Run-ID'li
param(
    [string]$RunId = $env:RUN_ID,
    [int]$TimeoutSec = 30
)

Write-Host "Smoke Test Basliyor - RUN_ID: $RunId" -ForegroundColor Green

# Health Check
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Health OK: $($r.StatusCode) [RUN_ID:$RunId]" -ForegroundColor Green
} catch {
    Write-Host "Health Failed: $($_.Exception.Message) [RUN_ID:$RunId]" -ForegroundColor Red
    exit 1
}

# Futures Time
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/futures/time" -UseBasicParsing -TimeoutSec 5
    Write-Host "Futures Time OK: $($r.StatusCode) [RUN_ID:$RunId]" -ForegroundColor Green
} catch {
    Write-Host "Futures Time Failed: $($_.Exception.Message) [RUN_ID:$RunId]" -ForegroundColor Red
    exit 1
}

# UI Rewrite
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/futures/time" -UseBasicParsing -TimeoutSec 5
    Write-Host "UI Rewrite OK: $($r.StatusCode) [RUN_ID:$RunId]" -ForegroundColor Green
} catch {
    Write-Host "UI Rewrite Failed: $($_.Exception.Message) [RUN_ID:$RunId]" -ForegroundColor Red
    exit 1
}

# Prometheus Metrics
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:4001/public/metrics/prom" -UseBasicParsing -TimeoutSec 5
    Write-Host "Prometheus OK: $($r.StatusCode) [RUN_ID:$RunId]" -ForegroundColor Green
} catch {
    Write-Host "Prometheus Failed: $($_.Exception.Message) [RUN_ID:$RunId]" -ForegroundColor Red
    exit 1
}

Write-Host "Smoke Test Tamamlandi - RUN_ID: $RunId" -ForegroundColor Green
exit 0