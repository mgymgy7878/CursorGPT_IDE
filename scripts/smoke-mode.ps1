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
Write-Host "[4/6] Testing Backtest Job (if paper mode)..." -ForegroundColor Yellow
$backtestStatus = $null
if ($healthData.sparkMode -eq 'paper') {
    try {
        # Start backtest job
        $backtestRunResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/backtest/run" -Method POST -UseBasicParsing -ContentType "application/json" -Body '{"symbol":"BTCUSDT","interval":"1h"}' -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($backtestRunResponse.StatusCode -eq 200) {
            $backtestRunData = $backtestRunResponse.Content | ConvertFrom-Json
            $backtestJobId = $backtestRunData.jobId
            Write-Host "  ✓ Backtest job started: $backtestJobId" -ForegroundColor Green

            # Poll for completion (max 10 seconds)
            $maxWait = 10
            $waited = 0
            while ($waited -lt $maxWait) {
                Start-Sleep -Seconds 1
                $waited++
                $backtestStatusResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/backtest/status?jobId=$backtestJobId" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($backtestStatusResponse.StatusCode -eq 200) {
                    $backtestStatus = $backtestStatusResponse.Content | ConvertFrom-Json
                    if ($backtestStatus.status -eq 'success' -or $backtestStatus.status -eq 'error') {
                        Write-Host "  ✓ Backtest job completed: $($backtestStatus.status)" -ForegroundColor Green
                        if ($backtestStatus.result) {
                            Write-Host "    - Trades: $($backtestStatus.result.trades), Win Rate: $($backtestStatus.result.winRate)%" -ForegroundColor Gray
                        }
                        break
                    }
                }
            }

            # Save backtest status to evidence
            if ($backtestStatus) {
                $evidenceDir = "evidence"
                if (-not (Test-Path $evidenceDir)) {
                    New-Item -ItemType Directory -Path $evidenceDir | Out-Null
                }
                $backtestStatus | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir\backtest_status.json" -Encoding UTF8
                Write-Host "  ✓ Backtest status saved to evidence\backtest_status.json" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "  ⚠ Backtest job test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⏭ Skipped (not in paper mode)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[5/6] Testing Optimize Job (if paper mode)..." -ForegroundColor Yellow
$optimizeStatus = $null
if ($healthData.sparkMode -eq 'paper') {
    try {
        # Start optimize job
        $optimizeRunResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/optimize/run" -Method POST -UseBasicParsing -ContentType "application/json" -Body '{"symbol":"BTCUSDT","interval":"1h"}' -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($optimizeRunResponse.StatusCode -eq 200) {
            $optimizeRunData = $optimizeRunResponse.Content | ConvertFrom-Json
            $optimizeJobId = $optimizeRunData.jobId
            Write-Host "  ✓ Optimize job started: $optimizeJobId" -ForegroundColor Green

            # Poll for completion (max 10 seconds)
            $maxWait = 10
            $waited = 0
            while ($waited -lt $maxWait) {
                Start-Sleep -Seconds 1
                $waited++
                $optimizeStatusResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/optimize/status?jobId=$optimizeJobId" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($optimizeStatusResponse.StatusCode -eq 200) {
                    $optimizeStatus = $optimizeStatusResponse.Content | ConvertFrom-Json
                    if ($optimizeStatus.status -eq 'success' -or $optimizeStatus.status -eq 'error') {
                        Write-Host "  ✓ Optimize job completed: $($optimizeStatus.status)" -ForegroundColor Green
                        if ($optimizeStatus.result) {
                            Write-Host "    - Trades: $($optimizeStatus.result.trades), Win Rate: $($optimizeStatus.result.winRate)%" -ForegroundColor Gray
                        }
                        break
                    }
                }
            }

            # Save optimize status to evidence
            if ($optimizeStatus) {
                $evidenceDir = "evidence"
                if (-not (Test-Path $evidenceDir)) {
                    New-Item -ItemType Directory -Path $evidenceDir | Out-Null
                }
                $optimizeStatus | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir\optimize_status.json" -Encoding UTF8
                Write-Host "  ✓ Optimize status saved to evidence\optimize_status.json" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "  ⚠ Optimize job test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⏭ Skipped (not in paper mode)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[6/7] Full Pipeline Run (if paper mode)..." -ForegroundColor Yellow
$pipelineResults = @{
    marketData = "SKIP"
    backtest = "SKIP"
    optimize = "SKIP"
    paperReset = "SKIP"
    paperOrder = "SKIP"
    paperState = "SKIP"
}

if ($healthData.sparkMode -eq 'paper') {
    try {
        # 1. Market Data (klines)
        Write-Host "  [1/5] Market Data..." -ForegroundColor Gray
        $klinesResponse = Invoke-WebRequest -Uri $klinesUrl -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($klinesResponse.StatusCode -eq 200) {
            $pipelineResults.marketData = "PASS ($($klinesResponse.StatusCode))"
        } else {
            $pipelineResults.marketData = "FAIL ($($klinesResponse.StatusCode))"
        }

        # 2. Backtest (already done above, reuse result)
        if ($backtestStatus -and $backtestStatus.status -eq 'success') {
            $pipelineResults.backtest = "PASS (status=$($backtestStatus.status))"
        } elseif ($backtestStatus) {
            $pipelineResults.backtest = "FAIL (status=$($backtestStatus.status))"
        }

        # 3. Optimize (already done above, reuse result)
        if ($optimizeStatus -and $optimizeStatus.status -eq 'success') {
            $pipelineResults.optimize = "PASS (status=$($optimizeStatus.status))"
        } elseif ($optimizeStatus) {
            $pipelineResults.optimize = "FAIL (status=$($optimizeStatus.status))"
        }

        # 4. Paper Reset
        Write-Host "  [4/5] Paper Reset..." -ForegroundColor Gray
        $paperResetResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/paper/reset" -Method POST -UseBasicParsing -ContentType "application/json" -Body '{"initialCash":10000}' -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($paperResetResponse.StatusCode -eq 200) {
            $pipelineResults.paperReset = "PASS ($($paperResetResponse.StatusCode))"
        } else {
            $pipelineResults.paperReset = "FAIL ($($paperResetResponse.StatusCode))"
        }

        # 5. Paper Order (if we have market price)
        Write-Host "  [5/5] Paper Order..." -ForegroundColor Gray
        if ($klinesData -and $klinesData.klines.Count -gt 0) {
            $lastKline = $klinesData.klines[$klinesData.klines.Count - 1]
            $lastClose = $lastKline[4]
            $paperOrderBody = @{
                symbol = "BTCUSDT"
                side = "buy"
                qty = 0.001
                marketPrice = $lastClose
            } | ConvertTo-Json
            $paperOrderResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/paper/order" -Method POST -UseBasicParsing -ContentType "application/json" -Body $paperOrderBody -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($paperOrderResponse.StatusCode -eq 200) {
                $pipelineResults.paperOrder = "PASS ($($paperOrderResponse.StatusCode))"
            } else {
                $pipelineResults.paperOrder = "FAIL ($($paperOrderResponse.StatusCode))"
            }
        } else {
            $pipelineResults.paperOrder = "SKIP (no market data)"
        }

        # 6. Paper State (final check)
        $paperStateResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/paper/state" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($paperStateResponse.StatusCode -eq 200) {
            $pipelineResults.paperState = "PASS ($($paperStateResponse.StatusCode))"
        } else {
            $pipelineResults.paperState = "FAIL ($($paperStateResponse.StatusCode))"
        }

        Write-Host "  ✓ Pipeline run complete" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Pipeline run failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⏭ Skipped (not in paper mode)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[7/7] Generating smoke summary..." -ForegroundColor Yellow
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
Backtest Job: $(if ($backtestStatus) { "$($backtestStatus.status) - $($backtestStatus.jobId)" } else { 'N/A' })
Optimize Job: $(if ($optimizeStatus) { "$($optimizeStatus.status) - $($optimizeStatus.jobId)" } else { 'N/A' })

Full Pipeline Run (Paper Mode):
  Market Data: $($pipelineResults.marketData)
  Backtest: $($pipelineResults.backtest)
  Optimize: $($pipelineResults.optimize)
  Paper Reset: $($pipelineResults.paperReset)
  Paper Order: $($pipelineResults.paperOrder)
  Paper State: $($pipelineResults.paperState)
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
if ($backtestStatus) {
    Write-Host "  - evidence\backtest_status.json" -ForegroundColor Gray
}
if ($optimizeStatus) {
    Write-Host "  - evidence\optimize_status.json" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check UI: Status bar should show mode badge (TESTNET/PAPER)" -ForegroundColor Gray
Write-Host "  2. Check Strategy Lab: Pipeline steps should work" -ForegroundColor Gray
Write-Host ""
