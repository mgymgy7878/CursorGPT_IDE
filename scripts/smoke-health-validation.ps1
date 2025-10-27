# Smoke/Health Validation Script
# Post-Cutover Health Checks
Write-Host "🏥 SMOKE/HEALTH VALIDATION" -ForegroundColor Green

# Executor Health
Write-Host "⚡ Checking Executor Health..." -ForegroundColor Blue
try {
    $executorResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:4001/health" -TimeoutSec 10
    Write-Host "✅ Executor Health: $($executorResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Content: $($executorResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Executor Health: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# UI General Health
Write-Host "📱 Checking UI Health..." -ForegroundColor Blue
try {
    $uiResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:3003/api/public/health" -TimeoutSec 10
    Write-Host "✅ UI Health: $($uiResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Content: $($uiResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ UI Health: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# BTCTurk Ticker (observe mock status)
Write-Host "📈 Checking BTCTurk Ticker..." -ForegroundColor Blue
try {
    $tickerResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY" -TimeoutSec 10
    Write-Host "✅ BTCTurk Ticker: $($tickerResponse.StatusCode)" -ForegroundColor Green
    
    $tickerData = $tickerResponse.Content | ConvertFrom-Json
    if ($tickerData.mock) {
        Write-Host "   ⚠️  Mock Data: true (expected in dev, should be false in prod)" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Real Data: false (production ready)" -ForegroundColor Green
    }
    Write-Host "   Symbol: $($tickerData.data.symbol)" -ForegroundColor Gray
    Write-Host "   Last: $($tickerData.data.last)" -ForegroundColor Gray
} catch {
    Write-Host "❌ BTCTurk Ticker: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Expected Results:" -ForegroundColor Cyan
Write-Host "  ✅ 200 OK responses" -ForegroundColor White
Write-Host "  ✅ JSON with ok:true" -ForegroundColor White
Write-Host "  ✅ mock:false preferred for production" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Next: Navigate to http://127.0.0.1:3003/btcturk for WebSocket validation" -ForegroundColor Green
