# Troubleshooting Quick Fixes
# Common Issues and Solutions
Write-Host "🔧 TROUBLESHOOTING QUICK FIXES" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

Write-Host ""
Write-Host "🚨 Common Issues & Solutions:" -ForegroundColor Cyan
Write-Host ""

# Issue 1: WS Handshake 400/502
Write-Host "1️⃣  WS Handshake 400/502" -ForegroundColor Yellow
Write-Host "   Problem: WebSocket connection failing" -ForegroundColor White
Write-Host "   Solution:" -ForegroundColor Gray
Write-Host "   - Check Nginx headers:" -ForegroundColor White
Write-Host "     proxy_set_header Upgrade `$http_upgrade;" -ForegroundColor Gray
Write-Host "     proxy_set_header Connection 'upgrade';" -ForegroundColor Gray
Write-Host "     proxy_http_version 1.1;" -ForegroundColor Gray
Write-Host "   - Verify reverse proxy target port (3003)" -ForegroundColor White
Write-Host "   - Reload Nginx: nginx -s reload" -ForegroundColor White

Write-Host ""

# Issue 2: UI Ticker mock:true
Write-Host "2️⃣  UI Ticker mock:true Stuck" -ForegroundColor Yellow
Write-Host "   Problem: Mock data instead of real data" -ForegroundColor White
Write-Host "   Solution:" -ForegroundColor Gray
Write-Host "   - Rebuild with WS flag: NEXT_PUBLIC_WS_ENABLED=true" -ForegroundColor White
Write-Host "   - Check executor market endpoint access" -ForegroundColor White
Write-Host "   - Verify firewall rules" -ForegroundColor White
Write-Host "   - Run: pnpm --filter web-next run build" -ForegroundColor White

Write-Host ""

# Issue 3: UI Pill DEGRADED/CLOSED
Write-Host "3️⃣  UI Pill DEGRADED/CLOSED" -ForegroundColor Yellow
Write-Host "   Problem: WebSocket connection issues" -ForegroundColor White
Write-Host "   Solution:" -ForegroundColor Gray
Write-Host "   - Check store wsStatus in browser console" -ForegroundColor White
Write-Host "   - Review PM2 logs: pm2 logs" -ForegroundColor White
Write-Host "   - Verify WebSocket endpoint accessibility" -ForegroundColor White
Write-Host "   - Check network connectivity" -ForegroundColor White

Write-Host ""

# Issue 4: Port/Process Conflict
Write-Host "4️⃣  Port/Process Conflict" -ForegroundColor Yellow
Write-Host "   Problem: Ports 3003/4001 already in use" -ForegroundColor White
Write-Host "   Solution:" -ForegroundColor Gray
Write-Host "   - Clean PM2: pm2 delete all" -ForegroundColor White
Write-Host "   - Check ports: netstat -ano | findstr ':3003'" -ForegroundColor White
Write-Host "   - Kill processes: taskkill /PID <PID> /F" -ForegroundColor White
Write-Host "   - Restart services: pm2 start ecosystem.config.js" -ForegroundColor White

Write-Host ""

# Issue 5: High Latency/Dropped Frames
Write-Host "5️⃣  High Latency/Dropped Frames" -ForegroundColor Yellow
Write-Host "   Problem: Performance issues" -ForegroundColor White
Write-Host "   Solution:" -ForegroundColor Gray
Write-Host "   - Check network/bandwidth" -ForegroundColor White
Write-Host "   - Verify Nginx buffers and timeouts" -ForegroundColor White
Write-Host "   - Monitor proxy_read_timeout values" -ForegroundColor White
Write-Host "   - Check for UI polling fallback (DEGRADED)" -ForegroundColor White

Write-Host ""

# Quick Diagnostic Commands
Write-Host "🔍 Quick Diagnostic Commands:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Service Status:" -ForegroundColor Yellow
Write-Host "   pm2 status" -ForegroundColor White
Write-Host "   pm2 logs --lines 50" -ForegroundColor White

Write-Host ""
Write-Host "Health Checks:" -ForegroundColor Yellow
Write-Host "   curl http://127.0.0.1:4001/health" -ForegroundColor White
Write-Host "   curl http://127.0.0.1:3003/api/public/health" -ForegroundColor White

Write-Host ""
Write-Host "Port Check:" -ForegroundColor Yellow
Write-Host "   netstat -ano | findstr ':3003'" -ForegroundColor White
Write-Host "   netstat -ano | findstr ':4001'" -ForegroundColor White

Write-Host ""
Write-Host "Environment Check:" -ForegroundColor Yellow
Write-Host "   echo `$Env:NODE_ENV" -ForegroundColor White
Write-Host "   echo `$Env:NEXT_PUBLIC_WS_ENABLED" -ForegroundColor White

Write-Host ""
Write-Host "🔄 Rollback Commands:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Feature Flag Rollback:" -ForegroundColor Yellow
Write-Host "   `$Env:NEXT_PUBLIC_WS_ENABLED='false'" -ForegroundColor White
Write-Host "   pnpm --filter web-next run build" -ForegroundColor White
Write-Host "   pm2 restart all" -ForegroundColor White

Write-Host ""
Write-Host "PM2 Rollback:" -ForegroundColor Yellow
Write-Host "   pm2 delete all" -ForegroundColor White
Write-Host "   pm2 start <previous-ecosystem-version>" -ForegroundColor White

Write-Host ""
Write-Host "Emergency Script:" -ForegroundColor Yellow
Write-Host "   .\scripts\rollback-procedures.ps1" -ForegroundColor White

Write-Host ""
Write-Host "✅ Troubleshooting guide ready!" -ForegroundColor Green
Write-Host "   Use these commands for quick issue resolution." -ForegroundColor Gray
