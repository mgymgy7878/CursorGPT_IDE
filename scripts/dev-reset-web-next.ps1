# Dev Reset Script for web-next
# Solves: MIME type errors, .next cache corruption, port conflicts
#
# Usage: 
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\dev-reset-web-next.ps1
# Or via npm script:
#   pnpm dev:web-next:reset

Write-Host "🔄 Spark Trading - Web Next Dev Reset" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Step 1: Kill any process using port 3003
Write-Host "`n[1/4] Checking port 3003..." -ForegroundColor Yellow
$port3003 = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($port3003) {
    $pids = $port3003 | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        Write-Host "  Killing process PID: $pid" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "  ✅ Port 3003 freed" -ForegroundColor Green
} else {
    Write-Host "  ✅ Port 3003 already free" -ForegroundColor Green
}

# Step 2: Remove .next cache
Write-Host "`n[2/4] Clearing .next cache..." -ForegroundColor Yellow
$nextDir = Join-Path $PSScriptRoot "..\apps\web-next\.next"
if (Test-Path $nextDir) {
    Remove-Item -Recurse -Force $nextDir -ErrorAction SilentlyContinue
    Write-Host "  ✅ .next cache cleared" -ForegroundColor Green
} else {
    Write-Host "  ✅ No .next cache found" -ForegroundColor Green
}

# Step 3: Clear node_modules/.cache (optional but helps)
Write-Host "`n[3/4] Clearing node_modules cache..." -ForegroundColor Yellow
$cacheDir = Join-Path $PSScriptRoot "..\apps\web-next\node_modules\.cache"
if (Test-Path $cacheDir) {
    Remove-Item -Recurse -Force $cacheDir -ErrorAction SilentlyContinue
    Write-Host "  ✅ node_modules/.cache cleared" -ForegroundColor Green
} else {
    Write-Host "  ✅ No node_modules cache found" -ForegroundColor Green
}

# Step 4: Start dev server
Write-Host "`n[4/4] Starting dev server on port 3003..." -ForegroundColor Yellow
Write-Host "  → Press Ctrl+C to stop`n" -ForegroundColor Gray

Set-Location (Join-Path $PSScriptRoot "..")
$env:NODE_OPTIONS = "--max-old-space-size=4096"
pnpm --filter web-next dev -- --port 3003

