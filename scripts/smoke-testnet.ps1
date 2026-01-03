# Smoke Test - Testnet Mode Validation
# Windows PowerShell script for testnet mode smoke test

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Spark Testnet Mode Smoke Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
$healthUrl = "http://localhost:3003/api/health"
$klinesUrl = "http://localhost:3003/api/binance/klines?symbol=BTCUSDT&interval=1m&limit=10"

Write-Host "[1/3] Checking dev server health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 5
    $healthData = $healthResponse.Content | ConvertFrom-Json
    
    Write-Host "  ✓ Health endpoint responded" -ForegroundColor Green
    Write-Host "  - sparkMode: $($healthData.sparkMode)" -ForegroundColor $(if ($healthData.sparkMode -eq 'testnet') { 'Green' } else { 'Red' })
    Write-Host "  - buildCommit: $($healthData.buildCommit)" -ForegroundColor Gray
    Write-Host "  - requestId: $($healthData.requestId)" -ForegroundColor Gray
    
    if ($healthData.sparkMode -ne 'testnet') {
        Write-Host "  ⚠ WARNING: sparkMode is not 'testnet'" -ForegroundColor Yellow
        Write-Host "    Make sure to set: SPARK_MODE=testnet NEXT_PUBLIC_SPARK_MODE=testnet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Make sure dev server is running: pnpm --filter web-next dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/3] Testing Binance Testnet klines endpoint..." -ForegroundColor Yellow
try {
    $klinesResponse = Invoke-WebRequest -Uri $klinesUrl -Method GET -UseBasicParsing -TimeoutSec 10
    $klinesData = $klinesResponse.Content | ConvertFrom-Json
    
    Write-Host "  ✓ Klines endpoint responded" -ForegroundColor Green
    Write-Host "  - symbol: $($klinesData.symbol)" -ForegroundColor Gray
    Write-Host "  - interval: $($klinesData.interval)" -ForegroundColor Gray
    Write-Host "  - klines count: $($klinesData.klines.Count)" -ForegroundColor $(if ($klinesData.klines.Count -gt 0) { 'Green' } else { 'Red' })
    Write-Host "  - requestId: $($klinesData.requestId)" -ForegroundColor Gray
    
    if ($klinesData.klines.Count -eq 0) {
        Write-Host "  ⚠ WARNING: No klines data received" -ForegroundColor Yellow
    } else {
        # Save sample klines to evidence
        $evidenceDir = "evidence"
        if (-not (Test-Path $evidenceDir)) {
            New-Item -ItemType Directory -Path $evidenceDir | Out-Null
        }
        $klinesData | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir\klines_testnet_10.json" -Encoding UTF8
        Write-Host "  ✓ Sample klines saved to evidence\klines_testnet_10.json" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Klines endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "    Error response: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[3/3] Saving health response to evidence..." -ForegroundColor Yellow
try {
    $evidenceDir = "evidence"
    if (-not (Test-Path $evidenceDir)) {
        New-Item -ItemType Directory -Path $evidenceDir | Out-Null
    }
    $healthData | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir\health_testnet.json" -Encoding UTF8
    Write-Host "  ✓ Health response saved to evidence\health_testnet.json" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to save health response: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smoke Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check UI: Status bar should show TESTNET badge" -ForegroundColor Gray
Write-Host "  2. Check Strategy Lab: Pipeline Market Data step should work" -ForegroundColor Gray
Write-Host "  3. Review evidence files:" -ForegroundColor Gray
Write-Host "     - evidence\health_testnet.json" -ForegroundColor Gray
Write-Host "     - evidence\klines_testnet_10.json" -ForegroundColor Gray
Write-Host ""

