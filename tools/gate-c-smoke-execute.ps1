# Gate C Smoke Test Execution Script
# 3 testi sırayla koşmak için rehber ve otomasyon yardımcıları

$ErrorActionPreference = "Stop"

Write-Host "=== Gate C Smoke Test Execution ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Artifact klasörü
$artifactsDir = "artifacts\gateC"
if (-not (Test-Path $artifactsDir)) {
    New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null
    Write-Host "Created: $artifactsDir" -ForegroundColor Green
}

# Dev server kontrolü
Write-Host "`n[CHECK] Dev server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Dev server: RUNNING (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Dev server: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Start with: pnpm --filter web-next dev -- --port 3003" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== TEST 1: Dual Panel Single Stream ===" -ForegroundColor Cyan
Write-Host "1. Open browser: http://localhost:3003?debugLive=1" -ForegroundColor Gray
Write-Host "2. Open DevTools (F12) -> Network tab" -ForegroundColor Gray
Write-Host "3. Filter: event-stream" -ForegroundColor Gray
Write-Host "4. Send long prompt in CopilotDock (e.g., 'Write a 2000+ word technical analysis')" -ForegroundColor Gray
Write-Host "5. While streaming, toggle StatusBar/panel open/close" -ForegroundColor Gray
Write-Host "6. Verify: Network shows ONLY ONE api/copilot/chat SSE connection" -ForegroundColor Green
Write-Host "7. Check LiveDebugBadge: activeStreams=1, requestId stable" -ForegroundColor Green
Write-Host "8. Take screenshot: Network tab -> Save as artifacts\gateC\t1_network.png" -ForegroundColor Yellow
Write-Host "9. Note requestId from LiveDebugBadge" -ForegroundColor Yellow
Write-Host "`nAfter test, run:" -ForegroundColor Cyan
Write-Host "   .\tools\gate-c-evidence-helper.ps1 -TestType dual_panel -Status PASS -RequestId `"<REQUEST_ID>`" -Screenshot `"artifacts\gateC\t1_network.png`" -Notes `"Network: 1 SSE; toggle sonrası yeni request yok; activeStreams=1 sabit`"" -ForegroundColor Gray

Write-Host "`n=== TEST 2: Abort Determinism ===" -ForegroundColor Cyan
Write-Host "1. Start a new stream in CopilotDock" -ForegroundColor Gray
Write-Host "2. While streaming, click Cancel/Stop" -ForegroundColor Gray
Write-Host "3. Verify: LiveDebugBadge shows state=idle (not error)" -ForegroundColor Green
Write-Host "4. Check Console: No 'error event' for AbortError" -ForegroundColor Green
Write-Host "5. Copy Console logs -> artifacts\gateC\t2_console.txt" -ForegroundColor Yellow
Write-Host "6. Note requestId from LiveDebugBadge" -ForegroundColor Yellow
Write-Host "`nAfter test, run:" -ForegroundColor Cyan
Write-Host "   .\tools\gate-c-evidence-helper.ps1 -TestType abort -Status PASS -RequestId `"<REQUEST_ID>`" -ConsoleLog `"artifacts\gateC\t2_console.txt`" -Notes `"Cancel sonrası idle; AbortError -> error event üretilmedi`"" -ForegroundColor Gray

Write-Host "`n=== TEST 3: Limits Enforce (5s duration) ===" -ForegroundColor Cyan
Write-Host "1. Open: http://localhost:3003?debugLive=1&liveMaxDurationMs=5000" -ForegroundColor Gray
Write-Host "2. Start a stream in CopilotDock" -ForegroundColor Gray
Write-Host "3. Wait 5+ seconds for duration limit to trigger" -ForegroundColor Gray
Write-Host "4. Verify: Stream closes with DURATION_LIMIT_EXCEEDED" -ForegroundColor Green
Write-Host "5. Check Console: Error code logged" -ForegroundColor Green
Write-Host "6. Take screenshot: LiveDebugBadge + state -> artifacts\gateC\t3_limits.png" -ForegroundColor Yellow
Write-Host "7. Note requestId from LiveDebugBadge" -ForegroundColor Yellow
Write-Host "`nAfter test, run:" -ForegroundColor Cyan
Write-Host "   .\tools\gate-c-evidence-helper.ps1 -TestType limits -Status PASS -RequestId `"<REQUEST_ID>`" -Screenshot `"artifacts\gateC\t3_limits.png`" -Notes `"liveMaxDurationMs=5000 tetiklendi; stream kontrollü kapandı`"" -ForegroundColor Gray

Write-Host "`n=== NetLog Option (TEST 1 için) ===" -ForegroundColor Cyan
Write-Host "For objective proof, run NetLog capture:" -ForegroundColor Gray
Write-Host "   .\tools\gate-c-netlog.ps1" -ForegroundColor Yellow
Write-Host "Then perform TEST 1 in the NetLog browser instance" -ForegroundColor Gray
Write-Host "NetLog file will be saved to: artifacts\gateC\netlog_gateC_*.json" -ForegroundColor Gray

Write-Host "`n=== Gate C PASS Criteria ===" -ForegroundColor Cyan
Write-Host "✅ All 3 evidence files have PASS status" -ForegroundColor Green
Write-Host "✅ artifacts\gateC\t1_network.png exists" -ForegroundColor Green
Write-Host "✅ artifacts\gateC\t2_console.txt exists" -ForegroundColor Green
Write-Host "✅ artifacts\gateC\t3_limits.png exists" -ForegroundColor Green
Write-Host "✅ evidence\gateC_smoke_test_summary.txt updated" -ForegroundColor Green

Write-Host "`n✅ Ready for manual tests. Follow steps above." -ForegroundColor Green

