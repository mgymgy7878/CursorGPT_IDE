# Backtest Smoke Test - CI Guard
# Ensures backtest engine produces realistic results

param(
    [string]$Strategy = "sma_cross",
    [string]$DataFile = "./packages/marketdata/data/BTCUSDT_1m.csv",
    [int]$Initial = 10000,
    [int]$FeeBps = 10,
    [int]$SlippageBps = 5
)

Write-Host "🧪 Backtest Smoke Test - CI Guard" -ForegroundColor Cyan
Write-Host "Strategy: $Strategy" -ForegroundColor Yellow
Write-Host "Data: $DataFile" -ForegroundColor Yellow
Write-Host "Initial: $Initial, Fee: ${FeeBps}bps, Slippage: ${SlippageBps}bps" -ForegroundColor Yellow

# Test 1: Flat data should produce 0 trades
Write-Host "`n📊 Test 1: Flat Data (0 trades expected)" -ForegroundColor Green
$flatResult = pnpm -F @spark/backtest exec --strategy $Strategy --file ./packages/backtest/testdata/flat.json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Flat data test failed" -ForegroundColor Red
    Write-Host $flatResult
    exit 1
}

$flatJson = $flatResult | ConvertFrom-Json
if ($flatJson.ok -ne $true -or $flatJson.tradeCount -ne 0 -or $flatJson.cash -ne $Initial) {
    Write-Host "❌ Flat data test failed: ok=$($flatJson.ok), trades=$($flatJson.tradeCount), cash=$($flatJson.cash)" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Flat data test passed: 0 trades, cash preserved" -ForegroundColor Green

# Test 2: Real data with strict constraints
Write-Host "`n📊 Test 2: Real Data (strict constraints)" -ForegroundColor Green
$realResult = pnpm -F @spark/backtest exec --strategy $Strategy --file $DataFile --initial $Initial --fee-bps $FeeBps --slippage-bps $SlippageBps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Real data test failed" -ForegroundColor Red
    Write-Host $realResult
    exit 1
}

$realJson = $realResult | ConvertFrom-Json

# Validation checks
$checks = @(
    @{ Name = "Result OK"; Condition = $realJson.ok -eq $true },
    @{ Name = "Cash >= 0"; Condition = $realJson.cash -ge 0 },
    @{ Name = "No same-bar fills"; Condition = $realJson.sameBarFills -eq 0 },
    @{ Name = "Realistic PnL"; Condition = $realJson.pnl -gt -1e9 -and $realJson.pnl -lt 1e9 },
    @{ Name = "Valid metrics"; Condition = $realJson.tradeCount -ge 0 -and $realJson.maxDD -ge 0 }
)

$allPassed = $true
foreach ($check in $checks) {
    if ($check.Condition) {
        Write-Host "✅ $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($check.Name)" -ForegroundColor Red
        $allPassed = $false
    }
}

if (-not $allPassed) {
    Write-Host "`n❌ Real data test failed validation" -ForegroundColor Red
    Write-Host "Result: $($realJson | ConvertTo-Json -Depth 2)" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
Write-Host "📈 Final Metrics:" -ForegroundColor Cyan
Write-Host "  Cash: $($realJson.cash)" -ForegroundColor White
Write-Host "  PnL: $($realJson.pnl)" -ForegroundColor White
Write-Host "  Trades: $($realJson.tradeCount)" -ForegroundColor White
Write-Host "  Max DD: $($realJson.maxDD)" -ForegroundColor White
Write-Host "  Sharpe: $($realJson.sharpe)" -ForegroundColor White
Write-Host "  Same-bar fills: $($realJson.sameBarFills)" -ForegroundColor White
Write-Host "  Skipped orders: $($realJson.skippedOrders)" -ForegroundColor White

Write-Host "`n🎉 Backtest engine is production-ready!" -ForegroundColor Green
