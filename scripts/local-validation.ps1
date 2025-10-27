#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete local validation suite before PR
.DESCRIPTION
    Runs build, Lighthouse CI, Axe A11y, and smoke tests
    Generates evidence artifacts for PR
.EXAMPLE
    .\scripts\local-validation.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Local Validation Suite...`n" -ForegroundColor Cyan

# Step 1: Build
Write-Host "📦 Step 1/5: Building production bundle..." -ForegroundColor Yellow
pnpm -F web-next build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed`n" -ForegroundColor Green

# Step 2: Start server
Write-Host "🌐 Step 2/5: Starting production server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-Command", "pnpm -F web-next start -- -p 3003" -WindowStyle Hidden
Write-Host "Waiting for server warmup (30s)..." -ForegroundColor Gray
npx wait-on http://127.0.0.1:3003 --timeout 30000
Start-Sleep -Seconds 20
Write-Host "✅ Server ready`n" -ForegroundColor Green

# Step 3: Smoke test
Write-Host "🧪 Step 3/5: Running smoke test..." -ForegroundColor Yellow
pwsh scripts/smoke-ui.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Smoke test failed!" -ForegroundColor Red
    exit 1
}
Write-Host "`n"

# Step 4: Lighthouse CI
Write-Host "💡 Step 4/5: Running Lighthouse CI (5 pages)..." -ForegroundColor Yellow
npx @lhci/cli autorun --config=.lighthouserc.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Lighthouse failed - check scores in .lighthouseci/" -ForegroundColor Red
    # Don't exit - continue to Axe
}
Write-Host "✅ Lighthouse completed (check .lighthouseci/ for reports)`n" -ForegroundColor Green

# Step 5: Axe A11y
Write-Host "♿ Step 5/5: Running Axe accessibility tests..." -ForegroundColor Yellow
pnpm exec playwright install --with-deps 2>&1 | Out-Null
pnpm exec playwright test tests/a11y/axe.spec.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Axe tests failed - check test-results/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Axe tests passed`n" -ForegroundColor Green

# Summary
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 LOCAL VALIDATION COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📂 Evidence artifacts:" -ForegroundColor Yellow
Write-Host "   - Lighthouse reports: .lighthouseci/*.json" -ForegroundColor Gray
Write-Host "   - Axe results: test-results/" -ForegroundColor Gray
Write-Host "   - Build output: apps/web-next/.next/" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Take screenshots of 5 pages" -ForegroundColor Gray
Write-Host "   2. Create PR with docs/PR_SUMMARY.md as body" -ForegroundColor Gray
Write-Host "   3. Attach evidence artifacts" -ForegroundColor Gray
Write-Host "   4. Wait for CI to pass" -ForegroundColor Gray
Write-Host "   5. Mark as 'Ready for review'" -ForegroundColor Gray
Write-Host ""

# Cleanup: Stop server
Get-Process | Where-Object { $_.CommandLine -like "*next start*" } | Stop-Process -Force 2>&1 | Out-Null

exit 0

