# 24-Hour Monitoring Script
# Post-Cutover Performance Monitoring
Write-Host "📊 24-HOUR MONITORING SETUP" -ForegroundColor Green

Write-Host ""
Write-Host "🔍 PM2 Monitoring Commands:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Real-time monitoring:" -ForegroundColor Yellow
Write-Host "   pm2 monit" -ForegroundColor White
Write-Host "   (Shows CPU, Memory, Logs in real-time)" -ForegroundColor Gray

Write-Host ""
Write-Host "Log monitoring:" -ForegroundColor Yellow
Write-Host "   pm2 logs --lines 200" -ForegroundColor White
Write-Host "   (Shows last 200 lines of all services)" -ForegroundColor Gray

Write-Host ""
Write-Host "Service status:" -ForegroundColor Yellow
Write-Host "   pm2 status" -ForegroundColor White
Write-Host "   (Shows service health and uptime)" -ForegroundColor Gray

Write-Host ""
Write-Host "📈 Monitoring Thresholds:" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Success Criteria:" -ForegroundColor Green
Write-Host "   • Health 200 rate ≥ 99.5%" -ForegroundColor White
Write-Host "   • Canary PASS rate ≥ 95% (last 7 runs)" -ForegroundColor White
Write-Host "   • WS P95 latency < 1s" -ForegroundColor White
Write-Host "   • No continuous reconnect attempts" -ForegroundColor White

Write-Host ""
Write-Host "🚨 Alert Thresholds:" -ForegroundColor Red
Write-Host "   • Health rate < 99.5%" -ForegroundColor White
Write-Host "   • Canary PASS rate < 95%" -ForegroundColor White
Write-Host "   • WS latency P95 > 1s" -ForegroundColor White
Write-Host "   • Reconnect attempts > 10/minute" -ForegroundColor White
Write-Host "   • 5xx error spike detected" -ForegroundColor White

Write-Host ""
Write-Host "🔄 Quick Health Checks:" -ForegroundColor Cyan
Write-Host ""

# Quick health check function
function Test-HealthEndpoint {
    param($Url, $Name)
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Name : $($response.StatusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  $Name : $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $Name : FAILED" -ForegroundColor Red
        return $false
    }
}

Write-Host "Running quick health check..." -ForegroundColor Blue
$webHealth = Test-HealthEndpoint "http://127.0.0.1:3003/api/public/health" "Web Health"
$executorHealth = Test-HealthEndpoint "http://127.0.0.1:4001/health" "Executor Health"

Write-Host ""
Write-Host "📋 Monitoring Checklist:" -ForegroundColor Cyan
Write-Host ""

Write-Host "First 1 Hour:" -ForegroundColor Yellow
Write-Host "   • Check PM2 logs every 15 minutes" -ForegroundColor White
Write-Host "   • Verify WebSocket connections stable" -ForegroundColor White
Write-Host "   • Monitor UI responsiveness" -ForegroundColor White

Write-Host ""
Write-Host "First 6 Hours:" -ForegroundColor Yellow
Write-Host "   • Check health endpoints hourly" -ForegroundColor White
Write-Host "   • Monitor canary success rate" -ForegroundColor White
Write-Host "   • Watch for error spikes" -ForegroundColor White

Write-Host ""
Write-Host "First 24 Hours:" -ForegroundColor Yellow
Write-Host "   • Analyze performance trends" -ForegroundColor White
Write-Host "   • Document any issues" -ForegroundColor White
Write-Host "   • Plan optimizations if needed" -ForegroundColor White

Write-Host ""
Write-Host "🚨 Emergency Contacts:" -ForegroundColor Red
Write-Host "   • Technical Issues: Development Team" -ForegroundColor White
Write-Host "   • Infrastructure: DevOps Team" -ForegroundColor White
Write-Host "   • Business Impact: Product Team" -ForegroundColor White

Write-Host ""
Write-Host "🔄 Rollback Commands (if needed):" -ForegroundColor Cyan
Write-Host "   Feature Flag: NEXT_PUBLIC_WS_ENABLED=false + rebuild" -ForegroundColor White
Write-Host "   PM2 Rollback: pm2 delete all && pm2 start <previous-version>" -ForegroundColor White
Write-Host "   Emergency Script: .\scripts\rollback-procedures.ps1" -ForegroundColor White

Write-Host ""
Write-Host "✅ 24-hour monitoring setup complete!" -ForegroundColor Green
Write-Host "   Start monitoring with: pm2 monit" -ForegroundColor Cyan
