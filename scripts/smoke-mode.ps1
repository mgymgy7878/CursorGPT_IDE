# Smoke Test - Spark Mode Validation (Testnet/Paper/Prod)
# Windows PowerShell script for mode validation smoke test

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Spark Mode Smoke Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
$healthUrl = "http://localhost:3003/api/health"
$klinesUrl = "http://localhost:3003/api/binance/klines?symbol=BTCUSDT&interval=1m&limit=10"

Write-Host "[1/4] Checking dev server health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 5
    $healthData = $healthResponse.Content | ConvertFrom-Json

    Write-Host "  ✓ Health endpoint responded" -ForegroundColor Green
    Write-Host "  - sparkMode: $($healthData.sparkMode)" -ForegroundColor $(if ($healthData.sparkMode -eq 'testnet' -or $healthData.sparkMode -eq 'paper') { 'Green' } else { 'Yellow' })
    Write-Host "  - buildCommit: $($healthData.buildCommit)" -ForegroundColor Gray
    Write-Host "  - requestId: $($healthData.requestId)" -ForegroundColor Gray

    $expectedMode = if ($env:SPARK_MODE) { $env:SPARK_MODE } else { 'testnet' }
    if ($healthData.sparkMode -ne $expectedMode) {
        Write-Host "  ⚠ WARNING: sparkMode mismatch (expected: $expectedMode, got: $($healthData.sparkMode))" -ForegroundColor Yellow
        Write-Host "    PowerShell: `$env:SPARK_MODE='$expectedMode'; `$env:NEXT_PUBLIC_SPARK_MODE='$expectedMode'" -ForegroundColor Yellow
        Write-Host "    CMD: set SPARK_MODE=$expectedMode && set NEXT_PUBLIC_SPARK_MODE=$expectedMode" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Make sure dev server is running: pnpm --filter web-next dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/4] Testing Binance klines endpoint..." -ForegroundColor Yellow
$klinesData = $null
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
Write-Host "[3/4] Testing Paper Ledger (if paper mode)..." -ForegroundColor Yellow
$paperState = $null
if ($healthData.sparkMode -eq 'paper') {
    try {
        $paperResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/paper/state" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($paperResponse.StatusCode -eq 200) {
            $paperState = $paperResponse.Content | ConvertFrom-Json
            Write-Host "  ✓ Paper ledger state available" -ForegroundColor Green
            Write-Host "  - cashBalance: `$$($paperState.cashBalance)" -ForegroundColor Gray
            Write-Host "  - positions: $($paperState.positions.Count)" -ForegroundColor Gray
            Write-Host "  - fills: $($paperState.fills.Count)" -ForegroundColor Gray
            
            # Save paper state to evidence
            $evidenceDir = "evidence"
            if (-not (Test-Path $evidenceDir)) {
                New-Item -ItemType Directory -Path $evidenceDir | Out-Null
            }
            $paperState | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir\paper_state.json" -Encoding UTF8
            Write-Host "  ✓ Paper state saved to evidence\paper_state.json" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠ Paper ledger not available (expected if not in paper mode)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⏭ Skipped (not in paper mode)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[4/4] Generating smoke summary..." -ForegroundColor Yellow
try {
    $evidenceDir = "evidence"
    if (-not (Test-Path $evidenceDir)) {
        New-Item -ItemType Directory -Path $evidenceDir | Out-Null
    }
    
    # Save health response
    $healthData | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir\health_testnet.json" -Encoding UTF8
    Write-Host "  ✓ Health response saved to evidence\health_testnet.json" -ForegroundColor Green

    $summary = @"
Spark Mode Smoke Test Summary
==============================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
sparkMode: $($healthData.sparkMode)
baseUrl: $(if ($healthData.sparkMode -eq 'testnet') { 'https://testnet.binance.vision/api' } elseif ($healthData.sparkMode -eq 'paper') { 'N/A (paper mode)' } else { 'https://api.binance.com' })
interval: 1m
HTTP Status: Health=$($healthResponse.StatusCode), Klines=$(if ($klinesData) { $klinesResponse.StatusCode } else { 'N/A' })
buildCommit: $($healthData.buildCommit)
requestId: $($healthData.requestId)
klinesCount: $(if ($klinesData) { $klinesData.klines.Count } else { 'N/A' })
Paper State: $(if ($paperState) { 'Available' } else { 'N/A' })
"@

    $summary | Out-File -FilePath "$evidenceDir\smoke_summary.txt" -Encoding UTF8
    Write-Host "  ✓ Smoke summary saved to evidence\smoke_summary.txt" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to save smoke summary: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smoke Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Evidence Package:" -ForegroundColor Yellow
Write-Host "  - evidence\smoke_summary.txt" -ForegroundColor Gray
Write-Host "  - evidence\health_testnet.json" -ForegroundColor Gray
if ($klinesData) {
    Write-Host "  - evidence\klines_testnet_10.json" -ForegroundColor Gray
}
if ($paperState) {
    Write-Host "  - evidence\paper_state.json" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check UI: Status bar should show mode badge (TESTNET/PAPER)" -ForegroundColor Gray
Write-Host "  2. Check Strategy Lab: Pipeline steps should work" -ForegroundColor Gray
Write-Host ""
