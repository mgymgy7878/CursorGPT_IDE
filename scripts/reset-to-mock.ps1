#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Reset web-next to mock mode (no backend dependencies)

.DESCRIPTION
    Fixes "Internal Server Error" by:
    - Cleaning .env.local (remove ENGINE_URL, PROMETHEUS_URL)
    - Clearing Next.js cache
    - Reinstalling dependencies
    - Providing verification steps

.EXAMPLE
    .\scripts\reset-to-mock.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Reset to Mock Mode ===" -ForegroundColor Cyan
Write-Host "Fixing Internal Server Error by removing backend dependencies" -ForegroundColor Gray
Write-Host ""

# 1. Stop running processes
Write-Host "[1/5] Checking for running dev servers..." -ForegroundColor Yellow
$port3003 = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
$port4001 = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue

if ($port3003) {
    Write-Host "  ⚠️  Port 3003 in use - please stop 'pnpm dev' manually" -ForegroundColor Yellow
    Write-Host "  Press Ctrl+C in the terminal running the dev server" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter when dev server is stopped"
}

if ($port4001) {
    Write-Host "  ⚠️  Port 4001 in use - please stop 'pnpm ws:dev' manually" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter when WS server is stopped"
}

# 2. Clean .env.local
Write-Host "[2/5] Cleaning .env.local (mock mode)..." -ForegroundColor Yellow
$envPath = "apps/web-next/.env.local"

$mockEnv = @"
# Spark Trading Platform — Mock Mode Configuration
# Frontend URLs (UI only, no backend needed)

NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml

# Backend Integration (REMOVED for mock mode)
# Uncomment and set these ONLY when real backend is running:
# ENGINE_URL=http://127.0.0.1:3001
# PROMETHEUS_URL=http://localhost:9090
"@

$mockEnv | Out-File $envPath -Encoding utf8 -Force
Write-Host "  ✅ .env.local updated (ENGINE_URL and PROMETHEUS_URL removed)" -ForegroundColor Green
Write-Host ""

# 3. Clear Next.js cache
Write-Host "[3/5] Clearing Next.js cache..." -ForegroundColor Yellow
Push-Location apps/web-next

if (Test-Path .next) {
    Remove-Item .next -Recurse -Force
    Write-Host "  ✅ .next cache cleared" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No cache to clear" -ForegroundColor Gray
}

# 4. Reinstall dependencies
Write-Host "[4/5] Reinstalling dependencies..." -ForegroundColor Yellow
pnpm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Install issues detected (non-critical)" -ForegroundColor Yellow
}

Pop-Location
Write-Host ""

# 5. Verification instructions
Write-Host "[5/5] Ready to start!" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start dev servers:" -ForegroundColor White
Write-Host "   Terminal 1: pnpm -F web-next ws:dev" -ForegroundColor Gray
Write-Host "   Terminal 2: pnpm -F web-next dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify mock endpoints:" -ForegroundColor White
Write-Host "   http://127.0.0.1:3003/api/public/engine-health" -ForegroundColor Gray
Write-Host "   http://127.0.0.1:3003/api/public/error-budget" -ForegroundColor Gray
Write-Host ""
Write-Host "   Expected response:" -ForegroundColor White
Write-Host "   { ""status"": ""OK"", ""source"": ""mock"", ... }" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open dashboard:" -ForegroundColor White
Write-Host "   http://127.0.0.1:3003/dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "   Status bar should show:" -ForegroundColor White
Write-Host "   API ✅  WS ✅  Engine ✅  (all from mock)" -ForegroundColor Gray
Write-Host ""
Write-Host "=== If Still Seeing 500 Error ===" -ForegroundColor Red
Write-Host ""
Write-Host "Check terminal output for the first error line, then:" -ForegroundColor White
Write-Host "1. Verify .env.local has NO ENGINE_URL or PROMETHEUS_URL" -ForegroundColor Gray
Write-Host "2. Check apps/web-next terminal for import/path errors" -ForegroundColor Gray
Write-Host "3. See TROUBLESHOOTING.md section 'Internal Server Error'" -ForegroundColor Gray
Write-Host ""
Write-Host "=== To Enable Real Backend Later ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start backend services (ports 3001, 4001, 9090)" -ForegroundColor Gray
Write-Host "2. Add to .env.local:" -ForegroundColor Gray
Write-Host "   ENGINE_URL=http://127.0.0.1:3001" -ForegroundColor Gray
Write-Host "   PROMETHEUS_URL=http://localhost:9090" -ForegroundColor Gray
Write-Host "3. Restart: pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Reset complete! Start dev servers now." -ForegroundColor Green

