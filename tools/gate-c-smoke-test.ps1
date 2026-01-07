# Gate C Smoke Test Script
# Tests: Dual panel single stream, Abort determinism, Limits enforce

$ErrorActionPreference = "Stop"

Write-Host "=== Gate C Smoke Test ===" -ForegroundColor Cyan

# Test 1: Dual Panel Single Stream
Write-Host "`n[TEST 1] Dual Panel Single Stream" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3003" -ForegroundColor Gray
Write-Host "2. Open DevTools (F12) -> Network tab" -ForegroundColor Gray
Write-Host "3. Filter: event-stream" -ForegroundColor Gray
Write-Host "4. Open CopilotDock and send a message" -ForegroundColor Gray
Write-Host "5. While streaming, open/close StatusBar panel" -ForegroundColor Gray
Write-Host "6. Verify: Only ONE api/copilot/chat SSE connection in Network tab" -ForegroundColor Green
Write-Host "7. Check evidence/gateC_dual_panel_single_stream.txt for results" -ForegroundColor Gray

# Test 2: Abort Determinism
Write-Host "`n[TEST 2] Abort Determinism" -ForegroundColor Yellow
Write-Host "1. Start a stream in CopilotDock" -ForegroundColor Gray
Write-Host "2. While streaming, click Cancel/Stop" -ForegroundColor Gray
Write-Host "3. Verify: UI state becomes 'idle'" -ForegroundColor Green
Write-Host "4. Check Console: No 'error event' for AbortError" -ForegroundColor Green
Write-Host "5. Check Network: Stream closes (FIN/closed)" -ForegroundColor Green
Write-Host "6. Check evidence/gateC_abort_idle_no_error_event.txt for results" -ForegroundColor Gray

# Test 3: Limits Enforce
Write-Host "`n[TEST 3] Limits Enforce" -ForegroundColor Yellow
Write-Host "1. Start a very long stream (or modify maxDuration to test)" -ForegroundColor Gray
Write-Host "2. Wait for limit to be exceeded" -ForegroundColor Gray
Write-Host "3. Verify: Stream closes with limit error" -ForegroundColor Green
Write-Host "4. Verify: Evidence log is written" -ForegroundColor Green
Write-Host "5. Check evidence/gateC_limits_enforced.txt for results" -ForegroundColor Gray

Write-Host "`n=== Manual Test Checklist ===" -ForegroundColor Cyan
Write-Host "Run these tests manually and record results in evidence/ files" -ForegroundColor Gray

