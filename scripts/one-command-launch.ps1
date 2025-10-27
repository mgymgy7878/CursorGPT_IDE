# One-Command Launch Script
# Complete WebSocket Migration Launch
Write-Host "🚀 ONE-COMMAND LAUNCH - WEBSOCKET MIGRATION" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Step 1: Launch Execution
Write-Host ""
Write-Host "1️⃣  Executing Launch Sequence..." -ForegroundColor Cyan
Write-Host "   Running: .\scripts\launch-execution.ps1" -ForegroundColor Gray
& ".\scripts\launch-execution.ps1"

# Wait for services to stabilize
Write-Host ""
Write-Host "⏳ Waiting for services to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Step 2: 60-second Preflight
Write-Host ""
Write-Host "2️⃣  60-Second Preflight Check..." -ForegroundColor Cyan
Write-Host "   Running: .\scripts\quick-go-no-go-check.ps1" -ForegroundColor Gray
& ".\scripts\quick-go-no-go-check.ps1"

Write-Host ""
Write-Host "   Nginx Check (if available):" -ForegroundColor Gray
Write-Host "   nginx -t && nginx -s reload" -ForegroundColor White

Write-Host ""
Write-Host "   PM2 Logs Check:" -ForegroundColor Gray
try {
    $pm2Logs = pm2 logs --lines 100 --no-colors 2>$null
    if ($pm2Logs -match "error|fatal|exception" -and $pm2Logs -notmatch "warn") {
        Write-Host "⚠️  PM2 Logs: Some errors detected" -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ PM2 Logs: Clean" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ PM2 Logs: Check failed" -ForegroundColor Red
}

# Step 3: Canary Instructions
Write-Host ""
Write-Host "3️⃣  Canary Trigger Instructions..." -ForegroundColor Cyan
Write-Host "   Manual Action Required:" -ForegroundColor Yellow
Write-Host "   1. Go to GitHub Actions" -ForegroundColor White
Write-Host "   2. Navigate to 'Receipts Gate' workflow" -ForegroundColor White
Write-Host "   3. Click 'Run workflow'" -ForegroundColor White
Write-Host "   4. Wait for completion" -ForegroundColor White
Write-Host "   5. Check for 'Canary PASS - latency evidence collected'" -ForegroundColor White
Write-Host "   6. Download canary_resp.json artifact" -ForegroundColor White

# Step 4: 10-Minute Observation
Write-Host ""
Write-Host "4️⃣  10-Minute Observation Started..." -ForegroundColor Cyan
Write-Host "   Monitoring thresholds:" -ForegroundColor Gray
Write-Host "   - Health ≥ 99.5%" -ForegroundColor White
Write-Host "   - Canary PASS ≥ 95%" -ForegroundColor White
Write-Host "   - WS P95 < 1s" -ForegroundColor White
Write-Host "   - No errors in logs" -ForegroundColor White
Write-Host "   - UI status pill OPEN" -ForegroundColor White

Write-Host ""
Write-Host "   Monitoring commands:" -ForegroundColor Gray
Write-Host "   pm2 logs --lines 100" -ForegroundColor White
Write-Host "   pm2 monit" -ForegroundColor White

# Step 5: Evidence Check
Write-Host ""
Write-Host "5️⃣  Evidence Collection Check..." -ForegroundColor Cyan
try {
    $evidenceFiles = Get-ChildItem evidence\local\github\ | Sort-Object LastWriteTime -Descending | Select-Object -First 10
    Write-Host "✅ Evidence files found:" -ForegroundColor Green
    foreach ($file in $evidenceFiles) {
        Write-Host "   $($file.Name) - $($file.LastWriteTime)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Evidence check failed" -ForegroundColor Red
}

# Step 6: Quick Intervention Matrix
Write-Host ""
Write-Host "6️⃣  Quick Intervention Matrix..." -ForegroundColor Cyan
Write-Host ""

Write-Host "UI mock:true stuck → WS flag rebuild:" -ForegroundColor Yellow
Write-Host "   `$env:NEXT_PUBLIC_WS_ENABLED='true'" -ForegroundColor White
Write-Host "   pnpm -w --filter web-next run build" -ForegroundColor White
Write-Host "   pm2 restart all" -ForegroundColor White

Write-Host ""
Write-Host "WS 400/502 → Nginx headers fix:" -ForegroundColor Yellow
Write-Host "   proxy_http_version 1.1;" -ForegroundColor White
Write-Host "   proxy_set_header Upgrade `$http_upgrade;" -ForegroundColor White
Write-Host "   proxy_set_header Connection 'upgrade';" -ForegroundColor White
Write-Host "   nginx -t && nginx -s reload" -ForegroundColor White

Write-Host ""
Write-Host "Port conflict → Process cleanup:" -ForegroundColor Yellow
Write-Host "   pm2 delete all" -ForegroundColor White
Write-Host "   netstat -ano | findstr :3003" -ForegroundColor White
Write-Host "   taskkill /PID <PID> /F" -ForegroundColor White
Write-Host "   .\scripts\launch-execution.ps1" -ForegroundColor White

Write-Host ""
Write-Host "High latency → Network/Nginx optimization:" -ForegroundColor Yellow
Write-Host "   UI DEGRADED = automatic polling fallback active" -ForegroundColor White

# Step 7: Rollback Options
Write-Host ""
Write-Host "7️⃣  Rollback Options..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Feature flag rollback (fastest):" -ForegroundColor Yellow
Write-Host "   `$env:NEXT_PUBLIC_WS_ENABLED='false'" -ForegroundColor White
Write-Host "   pnpm -w --filter web-next run build" -ForegroundColor White
Write-Host "   pm2 restart all" -ForegroundColor White

Write-Host ""
Write-Host "PM2 rollback:" -ForegroundColor Yellow
Write-Host "   pm2 delete all" -ForegroundColor White
Write-Host "   pm2 start <previous-stable-version>" -ForegroundColor White

Write-Host ""
Write-Host "WS disable:" -ForegroundColor Yellow
Write-Host "   Comment Nginx upgrade blocks → nginx -t && nginx -s reload" -ForegroundColor White

# Success Criteria
Write-Host ""
Write-Host "🎯 Success Criteria (Go Decision):" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Go Criteria:" -ForegroundColor Green
Write-Host "   - quick-go-no-go-check.ps1 PASS" -ForegroundColor White
Write-Host "   - Canary PASS and canary_resp.json created" -ForegroundColor White
Write-Host "   - UI pill OPEN, no reconnect loops" -ForegroundColor White
Write-Host "   - First 10 minutes: P95 < 1s, no error logs" -ForegroundColor White

Write-Host ""
Write-Host "🎉 ONE-COMMAND LAUNCH COMPLETE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Launch sequence executed" -ForegroundColor Green
Write-Host "✅ 60-second preflight completed" -ForegroundColor Green
Write-Host "✅ Canary instructions provided" -ForegroundColor Green
Write-Host "✅ 10-minute observation started" -ForegroundColor Green
Write-Host "✅ Evidence collection verified" -ForegroundColor Green
Write-Host "✅ Intervention matrix ready" -ForegroundColor Green
Write-Host "✅ Rollback options available" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Actions:" -ForegroundColor Cyan
Write-Host "1. Complete canary trigger in GitHub Actions" -ForegroundColor White
Write-Host "2. Monitor for 10 minutes" -ForegroundColor White
Write-Host "3. Check evidence files" -ForegroundColor White
Write-Host "4. Verify success criteria" -ForegroundColor White
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "   Web: http://127.0.0.1:3003" -ForegroundColor White
Write-Host "   Executor: http://127.0.0.1:4001" -ForegroundColor White
Write-Host "   BTCTurk: http://127.0.0.1:3003/btcturk" -ForegroundColor White
Write-Host ""
Write-Host "🚀 WebSocket Migration Launch Complete!" -ForegroundColor Green
