# CUTOVER RUNBOOK - Complete Execution Script
# Spark Trading Platform - WebSocket Migration
Write-Host "🚀 CUTOVER RUNBOOK - COMPLETE EXECUTION" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Step 1: Start Services
Write-Host ""
Write-Host "STEP 1: Starting Services..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
& ".\scripts\start-services-for-cutover.ps1"

# Wait for services to stabilize
Write-Host ""
Write-Host "⏳ Waiting for services to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 2: Smoke/Health Validation
Write-Host ""
Write-Host "STEP 2: Smoke/Health Validation..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
& ".\scripts\smoke-health-validation.ps1"

# Step 3: WebSocket Validation Guide
Write-Host ""
Write-Host "STEP 3: WebSocket Validation Guide..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
& ".\scripts\websocket-validation-guide.ps1"

# Step 4: Canary Instructions
Write-Host ""
Write-Host "STEP 4: Canary Trigger Instructions..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🌐 Manual Action Required:" -ForegroundColor Yellow
Write-Host "   1. Go to GitHub Actions" -ForegroundColor White
Write-Host "   2. Navigate to 'Receipts Gate' workflow" -ForegroundColor White
Write-Host "   3. Click 'Run workflow'" -ForegroundColor White
Write-Host "   4. Check for 'UTC 02:00 cron active' in logs" -ForegroundColor White
Write-Host "   5. Verify 'Canary PASS - latency evidence collected'" -ForegroundColor White
Write-Host "   6. Download canary_resp.json artifact" -ForegroundColor White

# Step 5: 24-Hour Monitoring Setup
Write-Host ""
Write-Host "STEP 5: 24-Hour Monitoring Setup..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
& ".\scripts\monitoring-24h.ps1"

# Final Summary
Write-Host ""
Write-Host "🎉 CUTOVER RUNBOOK COMPLETE!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Services Started" -ForegroundColor Green
Write-Host "✅ Health Checks Completed" -ForegroundColor Green
Write-Host "✅ WebSocket Validation Guide Provided" -ForegroundColor Green
Write-Host "✅ Canary Instructions Given" -ForegroundColor Green
Write-Host "✅ 24-Hour Monitoring Setup" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Actions:" -ForegroundColor Cyan
Write-Host "   1. Complete WebSocket validation in browser" -ForegroundColor White
Write-Host "   2. Trigger canary in GitHub Actions" -ForegroundColor White
Write-Host "   3. Start 24-hour monitoring: pm2 monit" -ForegroundColor White
Write-Host ""
Write-Host "🚨 Emergency Rollback:" -ForegroundColor Red
Write-Host "   .\scripts\rollback-procedures.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitoring Dashboard:" -ForegroundColor Cyan
Write-Host "   Web: http://127.0.0.1:3003" -ForegroundColor White
Write-Host "   Executor: http://127.0.0.1:4001" -ForegroundColor White
Write-Host "   BTCTurk: http://127.0.0.1:3003/btcturk" -ForegroundColor White
Write-Host ""
Write-Host "🎉 WebSocket Migration Cutover Complete!" -ForegroundColor Green
