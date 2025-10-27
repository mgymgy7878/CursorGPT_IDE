# Quick Go/No-Go Check
# D0 Final Validation Before Go-Live
Write-Host "🎯 GO/NO-GO QUICK CHECK" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

$allChecksPass = $true

# 1. Environment Flags Check
Write-Host ""
Write-Host "1️⃣  Environment Flags Check..." -ForegroundColor Cyan
if ($Env:NODE_ENV -eq "production" -and $Env:NEXT_PUBLIC_WS_ENABLED -eq "true") {
    Write-Host "✅ Environment: NODE_ENV=$Env:NODE_ENV, WS_ENABLED=$Env:NEXT_PUBLIC_WS_ENABLED" -ForegroundColor Green
}
else {
    Write-Host "❌ Environment flags not set correctly" -ForegroundColor Red
    $allChecksPass = $false
}

# 2. Service Health Check
Write-Host ""
Write-Host "2️⃣  Service Health Check..." -ForegroundColor Cyan

# Executor Health
try {
    $executorResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -TimeoutSec 5
    if ($executorResponse.StatusCode -eq 200) {
        $executorData = $executorResponse.Content | ConvertFrom-Json
        if ($executorData.ok) {
            Write-Host "✅ Executor Health: OK ($($executorData.mode))" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Executor Health: Not OK" -ForegroundColor Red
            $allChecksPass = $false
        }
    }
    else {
        Write-Host "❌ Executor Health: HTTP $($executorResponse.StatusCode)" -ForegroundColor Red
        $allChecksPass = $false
    }
}
catch {
    Write-Host "❌ Executor Health: FAILED" -ForegroundColor Red
    $allChecksPass = $false
}

# UI Health
try {
    $uiResponse = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/public/health" -TimeoutSec 5
    if ($uiResponse.StatusCode -eq 200) {
        $uiData = $uiResponse.Content | ConvertFrom-Json
        if ($uiData.ok) {
            Write-Host "✅ UI Health: OK" -ForegroundColor Green
        }
        else {
            Write-Host "❌ UI Health: Not OK" -ForegroundColor Red
            $allChecksPass = $false
        }
    }
    else {
        Write-Host "❌ UI Health: HTTP $($uiResponse.StatusCode)" -ForegroundColor Red
        $allChecksPass = $false
    }
}
catch {
    Write-Host "❌ UI Health: FAILED" -ForegroundColor Red
    $allChecksPass = $false
}

# 3. BTCTurk Ticker Check
Write-Host ""
Write-Host "3️⃣  BTCTurk Ticker Check..." -ForegroundColor Cyan
try {
    $tickerResponse = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY" -TimeoutSec 5
    if ($tickerResponse.StatusCode -eq 200) {
        $tickerData = $tickerResponse.Content | ConvertFrom-Json
        if ($tickerData.ok) {
            if ($tickerData.mock) {
                Write-Host "⚠️  BTCTurk Ticker: Mock data (check WS/endpoint chain)" -ForegroundColor Yellow
            }
            else {
                Write-Host "✅ BTCTurk Ticker: Real data (production ready)" -ForegroundColor Green
            }
            Write-Host "   Symbol: $($tickerData.data.symbol), Last: $($tickerData.data.last)" -ForegroundColor Gray
        }
        else {
            Write-Host "❌ BTCTurk Ticker: Not OK" -ForegroundColor Red
            $allChecksPass = $false
        }
    }
    else {
        Write-Host "❌ BTCTurk Ticker: HTTP $($tickerResponse.StatusCode)" -ForegroundColor Red
        $allChecksPass = $false
    }
}
catch {
    Write-Host "❌ BTCTurk Ticker: FAILED" -ForegroundColor Red
    $allChecksPass = $false
}

# 4. PM2 Status Check
Write-Host ""
Write-Host "4️⃣  PM2 Status Check..." -ForegroundColor Cyan
try {
    $pm2Status = pm2 status --no-colors 2>$null
    if ($pm2Status -match "online") {
        Write-Host "✅ PM2 Services: Online" -ForegroundColor Green
    }
    else {
        Write-Host "❌ PM2 Services: Not all online" -ForegroundColor Red
        $allChecksPass = $false
    }
}
catch {
    Write-Host "❌ PM2 Status: FAILED" -ForegroundColor Red
    $allChecksPass = $false
}

# 5. Recent Logs Check
Write-Host ""
Write-Host "5️⃣  Recent Logs Check..." -ForegroundColor Cyan
try {
    $recentLogs = pm2 logs --lines 50 --no-colors 2>$null
    if ($recentLogs -match "error|fatal|exception" -and $recentLogs -notmatch "warn") {
        Write-Host "⚠️  Recent Logs: Some errors detected" -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ Recent Logs: Clean" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Recent Logs: FAILED" -ForegroundColor Red
    $allChecksPass = $false
}

# Final Decision
Write-Host ""
Write-Host "🎯 GO/NO-GO DECISION" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

if ($allChecksPass) {
    Write-Host "✅ GO - All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Navigate to http://127.0.0.1:3003/btcturk" -ForegroundColor White
    Write-Host "2. Verify WebSocket status pill: OPEN (green)" -ForegroundColor White
    Write-Host "3. Trigger canary: GitHub Actions → Receipts Gate" -ForegroundColor White
    Write-Host "4. Start 24h monitoring: pm2 monit" -ForegroundColor White
}
else {
    Write-Host "❌ NO-GO - Issues detected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Check service logs: pm2 logs" -ForegroundColor White
    Write-Host "2. Verify environment flags" -ForegroundColor White
    Write-Host "3. Check network connectivity" -ForegroundColor White
    Write-Host "4. Run rollback if needed: .\scripts\rollback-procedures.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 Evidence saved to: evidence/local/github/" -ForegroundColor Gray
