# Post-Cutover D+1 Plan
# Day 1 Tasks and Monitoring
Write-Host "📅 POST-CUTOVER D+1 PLAN" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Day 1 Tasks:" -ForegroundColor Cyan
Write-Host ""

# Task 1: Canary Trend Report
Write-Host "1️⃣  Canary Trend Report" -ForegroundColor Yellow
Write-Host "   - Collect 24h metric summary" -ForegroundColor White
Write-Host "   - Calculate PASS/FAIL percentages" -ForegroundColor White
Write-Host "   - Analyze P95 latency trends" -ForegroundColor White
Write-Host "   - Document canary success rate" -ForegroundColor White

Write-Host ""
Write-Host "   Commands:" -ForegroundColor Gray
Write-Host "   - Check GitHub Actions: Receipts Gate runs" -ForegroundColor White
Write-Host "   - Download artifacts: canary_resp.json" -ForegroundColor White
Write-Host "   - Analyze logs: pm2 logs --lines 1000" -ForegroundColor White

Write-Host ""

# Task 2: Nginx Log Analysis
Write-Host "2️⃣  Nginx Log Analysis" -ForegroundColor Yellow
Write-Host "   - Analyze access/error logs for 5xx errors" -ForegroundColor White
Write-Host "   - Check WebSocket upgrade success rate" -ForegroundColor White
Write-Host "   - Monitor proxy performance" -ForegroundColor White
Write-Host "   - Identify any connection issues" -ForegroundColor White

Write-Host ""
Write-Host "   Commands:" -ForegroundColor Gray
Write-Host "   - Access logs: tail -f /var/log/nginx/access.log" -ForegroundColor White
Write-Host "   - Error logs: tail -f /var/log/nginx/error.log" -ForegroundColor White
Write-Host "   - 5xx analysis: grep ' 5[0-9][0-9] ' /var/log/nginx/access.log" -ForegroundColor White

Write-Host ""

# Task 3: UI/Executor Error Rate Review
Write-Host "3️⃣  UI/Executor Error Rate Review" -ForegroundColor Yellow
Write-Host "   - Monitor error rates and patterns" -ForegroundColor White
Write-Host "   - Check for timeout issues" -ForegroundColor White
Write-Host "   - Review retry backoff effectiveness" -ForegroundColor White
Write-Host "   - Plan minor tuning if needed" -ForegroundColor White

Write-Host ""
Write-Host "   Commands:" -ForegroundColor Gray
Write-Host "   - PM2 logs: pm2 logs --lines 500" -ForegroundColor White
Write-Host "   - Error filtering: pm2 logs | grep -i error" -ForegroundColor White
Write-Host "   - Health monitoring: .\scripts\monitoring-24h.ps1" -ForegroundColor White

Write-Host ""

# Task 4: Canary Alarm Threshold Calibration
Write-Host "4️⃣  Canary Alarm Threshold Calibration" -ForegroundColor Yellow
Write-Host "   - Analyze false positive/negative ratio" -ForegroundColor White
Write-Host "   - Adjust alarm thresholds" -ForegroundColor White
Write-Host "   - Fine-tune notification rules" -ForegroundColor White
Write-Host "   - Optimize alert sensitivity" -ForegroundColor White

Write-Host ""
Write-Host "   Commands:" -ForegroundColor Gray
Write-Host "   - Review canary history: GitHub Actions" -ForegroundColor White
Write-Host "   - Check alert logs: ops/automation/" -ForegroundColor White
Write-Host "   - Update thresholds: evidence/local/github/" -ForegroundColor White

Write-Host ""

# Performance Optimization
Write-Host "🚀 Performance Optimization:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Fine-tune reconnection logic:" -ForegroundColor Yellow
Write-Host "   - Adjust backoff intervals" -ForegroundColor White
Write-Host "   - Optimize ping/pong timing" -ForegroundColor White
Write-Host "   - Improve error handling" -ForegroundColor White

Write-Host ""
Write-Host "Optimize latency thresholds:" -ForegroundColor Yellow
Write-Host "   - Review P95 measurements" -ForegroundColor White
Write-Host "   - Adjust timeout values" -ForegroundColor White
Write-Host "   - Fine-tune buffer sizes" -ForegroundColor White

Write-Host ""
Write-Host "Document lessons learned:" -ForegroundColor Yellow
Write-Host "   - Create post-mortem report" -ForegroundColor White
Write-Host "   - Update runbook procedures" -ForegroundColor White
Write-Host "   - Share insights with team" -ForegroundColor White

Write-Host ""

# Monitoring Commands
Write-Host "📊 Monitoring Commands:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Real-time monitoring:" -ForegroundColor Yellow
Write-Host "   pm2 monit" -ForegroundColor White
Write-Host "   pm2 logs --lines 200" -ForegroundColor White

Write-Host ""
Write-Host "Health checks:" -ForegroundColor Yellow
Write-Host "   .\scripts\quick-go-no-go-check.ps1" -ForegroundColor White
Write-Host "   .\scripts\monitoring-24h.ps1" -ForegroundColor White

Write-Host ""
Write-Host "Performance analysis:" -ForegroundColor Yellow
Write-Host "   pm2 logs | grep -i latency" -ForegroundColor White
Write-Host "   pm2 logs | grep -i reconnect" -ForegroundColor White

Write-Host ""

# Success Criteria
Write-Host "✅ Success Criteria:" -ForegroundColor Cyan
Write-Host ""

Write-Host "24-Hour Targets:" -ForegroundColor Yellow
Write-Host "   - Health rate: ≥ 99.5%" -ForegroundColor White
Write-Host "   - Canary PASS: ≥ 95%" -ForegroundColor White
Write-Host "   - WS latency P95: < 1s" -ForegroundColor White
Write-Host "   - No continuous reconnect loops" -ForegroundColor White

Write-Host ""
Write-Host "Performance Indicators:" -ForegroundColor Yellow
Write-Host "   - Stable WebSocket connections" -ForegroundColor White
Write-Host "   - Consistent data flow" -ForegroundColor White
Write-Host "   - Low error rates" -ForegroundColor White
Write-Host "   - Responsive UI" -ForegroundColor White

Write-Host ""
Write-Host "📋 Action Items:" -ForegroundColor Cyan
Write-Host "1. Run canary trend analysis" -ForegroundColor White
Write-Host "2. Review Nginx logs for issues" -ForegroundColor White
Write-Host "3. Monitor error rates and patterns" -ForegroundColor White
Write-Host "4. Calibrate alarm thresholds" -ForegroundColor White
Write-Host "5. Document lessons learned" -ForegroundColor White
Write-Host "6. Plan next optimization cycle" -ForegroundColor White

Write-Host ""
Write-Host "🎉 D+1 Plan ready for execution!" -ForegroundColor Green
