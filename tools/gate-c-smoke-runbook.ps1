# Gate C Smoke Test Runbook
# Otomatik test rehberi ve evidence toplama

$ErrorActionPreference = "Stop"

Write-Host "=== Gate C Smoke Test Runbook ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Metadata toplama
$metadata = @{
    DateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Machine = $env:COMPUTERNAME
    OS = (Get-CimInstance Win32_OperatingSystem).Caption
    PowerShell = $PSVersionTable.PSVersion.ToString()
    GitCommit = (git rev-parse HEAD)
    URL = "http://localhost:3003?debugLive=1"
    SSEEndpoint = "/api/copilot/chat"
}

Write-Host "`nMetadata:" -ForegroundColor Yellow
$metadata.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray }

# Browser detection
$edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"

$browserName = ""
if (Test-Path $edgePath) {
    $browserName = "Edge"
} elseif (Test-Path $chromePath) {
    $browserName = "Chrome"
} else {
    Write-Host "`nWARNING: Edge/Chrome not detected" -ForegroundColor Yellow
    $browserName = "Unknown"
}

Write-Host "`nBrowser: $browserName" -ForegroundColor Yellow

# Artifacts klasörü
$artifactsDir = "artifacts/gateC"
if (-not (Test-Path $artifactsDir)) {
    New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null
    Write-Host "Created: $artifactsDir" -ForegroundColor Green
}

Write-Host "`n=== Test Instructions ===" -ForegroundColor Cyan
Write-Host "`n[TEST 1] Dual Panel Single Stream" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:3003?debugLive=1" -ForegroundColor Gray
Write-Host "2. Open DevTools (F12) -> Network tab" -ForegroundColor Gray
Write-Host "3. Filter: event-stream" -ForegroundColor Gray
Write-Host "4. Open CopilotDock and send a message" -ForegroundColor Gray
Write-Host "5. While streaming, open/close StatusBar panel" -ForegroundColor Gray
Write-Host "6. Verify: Only ONE api/copilot/chat SSE connection" -ForegroundColor Green
Write-Host "7. Check LiveDebugBadge: activeStreams=1, requestId stable" -ForegroundColor Green
Write-Host "8. Take Network tab screenshot -> $artifactsDir/t1_network.png" -ForegroundColor Gray
Write-Host "9. Record evidence in: evidence/gateC_dual_panel_single_stream.txt" -ForegroundColor Gray

Write-Host "`n[TEST 2] Abort Determinism" -ForegroundColor Yellow
Write-Host "1. Start a stream in CopilotDock" -ForegroundColor Gray
Write-Host "2. While streaming, click Cancel/Stop" -ForegroundColor Gray
Write-Host "3. Verify: LiveDebugBadge shows state=idle (not error)" -ForegroundColor Green
Write-Host "4. Check Console: No 'error event' for AbortError" -ForegroundColor Green
Write-Host "5. Check Network: Stream closes (FIN/closed)" -ForegroundColor Green
Write-Host "6. Copy Console logs -> $artifactsDir/t2_console.txt" -ForegroundColor Gray
Write-Host "7. Record evidence in: evidence/gateC_abort_idle_no_error_event.txt" -ForegroundColor Gray

Write-Host "`n[TEST 3] Limits Enforce" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:3003?debugLive=1&liveMaxDurationMs=5000" -ForegroundColor Gray
Write-Host "2. Start a stream in CopilotDock" -ForegroundColor Gray
Write-Host "3. Wait for maxDuration (5s) to trigger" -ForegroundColor Gray
Write-Host "4. Verify: Stream closes with DURATION_LIMIT_EXCEEDED" -ForegroundColor Green
Write-Host "5. Check Console: Error code logged" -ForegroundColor Green
Write-Host "6. Take screenshot -> $artifactsDir/t3_limits.png" -ForegroundColor Gray
Write-Host "7. Record evidence in: evidence/gateC_limits_enforced.txt" -ForegroundColor Gray

Write-Host "`n=== NetLog Option (SMOKE-1 için) ===" -ForegroundColor Cyan
Write-Host "Run: .\tools\gate-c-netlog.ps1" -ForegroundColor Gray
Write-Host "Then perform TEST 1 in the NetLog browser instance" -ForegroundColor Gray
Write-Host "NetLog file will be saved to: $artifactsDir/netlog_gateC_*.json" -ForegroundColor Gray

Write-Host "`n=== Evidence Files ===" -ForegroundColor Cyan
Write-Host "Fill these files with test results:" -ForegroundColor Gray
Write-Host "  - evidence/gateC_dual_panel_single_stream.txt" -ForegroundColor Gray
Write-Host "  - evidence/gateC_abort_idle_no_error_event.txt" -ForegroundColor Gray
Write-Host "  - evidence/gateC_limits_enforced.txt" -ForegroundColor Gray
Write-Host "  - evidence/gateC_smoke_test_summary.txt" -ForegroundColor Gray

Write-Host "`n=== PASS Criteria ===" -ForegroundColor Cyan
Write-Host "✅ All 3 evidence files have PASS status" -ForegroundColor Green
Write-Host "✅ At least 1 Network screenshot (SMOKE-1)" -ForegroundColor Green
Write-Host "✅ Abort test: 'error event yok' kanıtlı" -ForegroundColor Green
Write-Host "✅ Limit enforce davranışı kanıtlı" -ForegroundColor Green
Write-Host "✅ gateC_smoke_test_summary.txt updated" -ForegroundColor Green

Write-Host "`n✅ Runbook ready. Start manual tests now." -ForegroundColor Green

