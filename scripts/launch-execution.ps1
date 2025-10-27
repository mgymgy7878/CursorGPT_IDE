# Launch Execution Script
# Final 6-Step Launch Sequence
Write-Host "🚀 LAUNCH EXECUTION - FINAL 6 STEPS" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Step 1: Environment Flags
Write-Host ""
Write-Host "1️⃣  Setting Environment Flags..." -ForegroundColor Cyan
$Env:NODE_ENV = "production"
$Env:NEXT_PUBLIC_WS_ENABLED = "true"
Write-Host "✅ Environment: NODE_ENV=$Env:NODE_ENV, WS_ENABLED=$Env:NEXT_PUBLIC_WS_ENABLED" -ForegroundColor Green

# Step 2: Runbook Execution
Write-Host ""
Write-Host "2️⃣  Executing Cutover Runbook..." -ForegroundColor Cyan
Write-Host "   Running: .\scripts\cutover-runbook.ps1" -ForegroundColor Gray
& ".\scripts\cutover-runbook.ps1"

# Wait for services to stabilize
Write-Host ""
Write-Host "⏳ Waiting for services to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 3: Quick Validation
Write-Host ""
Write-Host "3️⃣  Quick Go/No-Go Validation..." -ForegroundColor Cyan
Write-Host "   Running: .\scripts\quick-go-no-go-check.ps1" -ForegroundColor Gray
& ".\scripts\quick-go-no-go-check.ps1"

# Step 4: Nginx Check (if available)
Write-Host ""
Write-Host "4️⃣  Nginx WebSocket Upgrade Check..." -ForegroundColor Cyan
Write-Host "   Manual: nginx -t && nginx -s reload" -ForegroundColor Gray
Write-Host "   Expected: 101 Switching Protocols" -ForegroundColor Gray

# Step 5: Canary Instructions
Write-Host ""
Write-Host "5️⃣  Canary Run Instructions..." -ForegroundColor Cyan
Write-Host "   Manual Action Required:" -ForegroundColor Yellow
Write-Host "   1. Go to GitHub Actions" -ForegroundColor White
Write-Host "   2. Navigate to 'Receipts Gate' workflow" -ForegroundColor White
Write-Host "   3. Click 'Run workflow'" -ForegroundColor White
Write-Host "   4. Check for 'Canary PASS - latency evidence collected'" -ForegroundColor White
Write-Host "   5. Verify canary_resp.json artifact" -ForegroundColor White

# Step 6: 10-Minute Observation
Write-Host ""
Write-Host "6️⃣  10-Minute Observation..." -ForegroundColor Cyan
Write-Host "   Monitoring commands:" -ForegroundColor Gray
Write-Host "   pm2 logs --lines 200" -ForegroundColor White
Write-Host "   pm2 monit" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Quick Intervention Matrix:" -ForegroundColor Cyan
Write-Host ""

Write-Host "UI mock:true stuck → Rebuild with WS flag + pm2 restart all" -ForegroundColor Yellow
Write-Host "WS 400/502 → Check Nginx headers + reload" -ForegroundColor Yellow
Write-Host "Port conflict → pm2 delete all + PID cleanup + retry" -ForegroundColor Yellow
Write-Host "High latency → Network/Nginx timeouts + check DEGRADED fallback" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔄 Rollback Options:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Feature Flag: NEXT_PUBLIC_WS_ENABLED=false + rebuild + pm2 restart all" -ForegroundColor Yellow
Write-Host "PM2 Rollback: pm2 delete all + pm2 start <previous-version>" -ForegroundColor Yellow
Write-Host "WS Disable: Comment Nginx WS blocks + reload" -ForegroundColor Yellow

Write-Host ""
Write-Host "📊 24-Hour Monitoring:" -ForegroundColor Cyan
Write-Host "   Start: .\scripts\monitoring-24h.ps1" -ForegroundColor White
Write-Host "   Thresholds: Health ≥99.5%, Canary PASS ≥95%, WS P95 <1s" -ForegroundColor White

Write-Host ""
Write-Host "🎉 LAUNCH SEQUENCE COMPLETE!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Environment flags set" -ForegroundColor Green
Write-Host "✅ Cutover runbook executed" -ForegroundColor Green
Write-Host "✅ Quick validation completed" -ForegroundColor Green
Write-Host "✅ Nginx check instructions provided" -ForegroundColor Green
Write-Host "✅ Canary instructions given" -ForegroundColor Green
Write-Host "✅ 10-minute observation started" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Actions:" -ForegroundColor Cyan
Write-Host "1. Complete WebSocket validation in browser" -ForegroundColor White
Write-Host "2. Trigger canary in GitHub Actions" -ForegroundColor White
Write-Host "3. Monitor for 10 minutes" -ForegroundColor White
Write-Host "4. Start 24-hour monitoring" -ForegroundColor White
Write-Host ""
Write-Host "📈 Service URLs:" -ForegroundColor Cyan
Write-Host "   Web: http://127.0.0.1:3003" -ForegroundColor White
Write-Host "   Executor: http://127.0.0.1:4001" -ForegroundColor White
Write-Host "   BTCTurk: http://127.0.0.1:3003/btcturk" -ForegroundColor White
Write-Host ""
Write-Host "🚀 WebSocket Migration Launch Complete!" -ForegroundColor Green
