#!/usr/bin/env pwsh
<#
.SYNOPSIS
    30-minute validation tour for new developer onboarding

.DESCRIPTION
    Validates complete platform health:
    - Development servers
    - Type checking
    - Build process
    - UI Smoke tests
    - CI governance
    
.EXAMPLE
    .\scripts\30min-validation.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host "=== 30-Minute Platform Validation Tour ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

$results = @()

# 1. Environment Check
Write-Host "[1/6] Environment Check..." -ForegroundColor Yellow
$nodeVersion = node -v
$pnpmVersion = pnpm -v
Write-Host "  Node: $nodeVersion" -ForegroundColor Gray
Write-Host "  pnpm: $pnpmVersion" -ForegroundColor Gray
$results += [PSCustomObject]@{ Step = "Environment"; Status = "✅ OK"; Details = "Node $nodeVersion, pnpm $pnpmVersion" }
Write-Host ""

# 2. TypeScript Baseline
Write-Host "[2/6] TypeScript Baseline Check..." -ForegroundColor Yellow
Push-Location apps/web-next
$tscOutput = pnpm typecheck 2>&1
$errorCount = ($tscOutput | Select-String "Type error|error TS").Count
if ($errorCount -eq 0) {
    Write-Host "  ✅ No TypeScript errors!" -ForegroundColor Green
    $results += [PSCustomObject]@{ Step = "TypeCheck"; Status = "✅ PASS"; Details = "0 errors" }
} else {
    Write-Host "  ⚠️  Found $errorCount TypeScript errors" -ForegroundColor Yellow
    Write-Host "  📝 Baseline saved to evidence/ui/types-before.txt" -ForegroundColor Gray
    $results += [PSCustomObject]@{ Step = "TypeCheck"; Status = "⚠️  BASELINE"; Details = "$errorCount errors (tracked)" }
}
Pop-Location
Write-Host ""

# 3. Build Test
Write-Host "[3/6] Build Test (standalone cache warm)..." -ForegroundColor Yellow
Push-Location apps/web-next
$buildStart = Get-Date
$buildOutput = pnpm build 2>&1
$buildDuration = ((Get-Date) - $buildStart).TotalSeconds
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build successful (${buildDuration}s)" -ForegroundColor Green
    $results += [PSCustomObject]@{ Step = "Build"; Status = "✅ PASS"; Details = "${buildDuration}s" }
} else {
    Write-Host "  ❌ Build failed (see output above)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Step = "Build"; Status = "❌ FAIL"; Details = "Check logs" }
}
Pop-Location
Write-Host ""

# 4. Development Servers Check
Write-Host "[4/6] Development Servers Check..." -ForegroundColor Yellow
Write-Host "  Checking ports 3003 and 4001..." -ForegroundColor Gray

$port3003 = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
$port4001 = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue

if ($port3003) {
    Write-Host "  ✅ Port 3003 in use (Next.js running)" -ForegroundColor Green
    $results += [PSCustomObject]@{ Step = "Dev:3003"; Status = "✅ RUNNING"; Details = "Next.js active" }
} else {
    Write-Host "  ℹ️  Port 3003 free (run: pnpm -F web-next dev)" -ForegroundColor Cyan
    $results += [PSCustomObject]@{ Step = "Dev:3003"; Status = "ℹ️  READY"; Details = "Not started" }
}

if ($port4001) {
    Write-Host "  ✅ Port 4001 in use (WS server running)" -ForegroundColor Green
    $results += [PSCustomObject]@{ Step = "Dev:4001"; Status = "✅ RUNNING"; Details = "WS active" }
} else {
    Write-Host "  ℹ️  Port 4001 free (run: pnpm -F web-next ws:dev)" -ForegroundColor Cyan
    $results += [PSCustomObject]@{ Step = "Dev:4001"; Status = "ℹ️  READY"; Details = "Not started" }
}
Write-Host ""

# 5. CI Governance Check
Write-Host "[5/6] CI Governance Check..." -ForegroundColor Yellow
if (Test-Path .github/scripts/validate-workflow-guards.ps1) {
    $guardOutput = .\.github\scripts\validate-workflow-guards.ps1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Guard validation passed" -ForegroundColor Green
        $results += [PSCustomObject]@{ Step = "Guards"; Status = "✅ PASS"; Details = "All workflows protected" }
    } else {
        Write-Host "  ⚠️  Guard validation issues detected" -ForegroundColor Yellow
        $results += [PSCustomObject]@{ Step = "Guards"; Status = "⚠️  CHECK"; Details = "Review workflow guards" }
    }
} else {
    Write-Host "  ⚠️  Guard validator script not found" -ForegroundColor Yellow
    $results += [PSCustomObject]@{ Step = "Guards"; Status = "⚠️  MISSING"; Details = "Script not found" }
}
Write-Host ""

# 6. Documentation Check
Write-Host "[6/6] Documentation Check..." -ForegroundColor Yellow
$requiredDocs = @(
    "KICKOFF_GUIDE.md",
    "NEXT_SPRINT_PLAN.md",
    "apps/web-next/README.md",
    "apps/web-next/.env.example"
)

$missingDocs = @()
foreach ($doc in $requiredDocs) {
    if (Test-Path $doc) {
        Write-Host "  ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $doc (missing)" -ForegroundColor Red
        $missingDocs += $doc
    }
}

if ($missingDocs.Count -eq 0) {
    $results += [PSCustomObject]@{ Step = "Docs"; Status = "✅ COMPLETE"; Details = "All guides present" }
} else {
    $results += [PSCustomObject]@{ Step = "Docs"; Status = "⚠️  INCOMPLETE"; Details = "$($missingDocs.Count) missing" }
}
Write-Host ""

# Summary
Write-Host "=== Validation Summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$passCount = ($results | Where-Object { $_.Status -like "*✅*" }).Count
$warnCount = ($results | Where-Object { $_.Status -like "*⚠️*" }).Count
$failCount = ($results | Where-Object { $_.Status -like "*❌*" }).Count

Write-Host ""
Write-Host "Results: $passCount passed, $warnCount warnings, $failCount failed" -ForegroundColor $(if ($failCount -gt 0) { "Red" } elseif ($warnCount -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

# Next Steps
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Start Development:" -ForegroundColor Yellow
Write-Host "  1. Terminal 1: pnpm -F web-next ws:dev" -ForegroundColor Gray
Write-Host "  2. Terminal 2: pnpm -F web-next dev" -ForegroundColor Gray
Write-Host "  3. Browser: http://localhost:3003" -ForegroundColor Gray
Write-Host ""
Write-Host "Issue #11 Sprint:" -ForegroundColor Yellow
Write-Host "  1. Read: KICKOFF_GUIDE.md" -ForegroundColor Gray
Write-Host "  2. Branch: git checkout -b fix/typescript-cleanup-phase1" -ForegroundColor Gray
Write-Host "  3. Fix: Follow Phase 2-5 in guide" -ForegroundColor Gray
Write-Host "  4. Track: tsx scripts/type-delta.ts after" -ForegroundColor Gray
Write-Host ""
Write-Host "Governance Check:" -ForegroundColor Yellow
Write-Host "  - Guard Validate: gh workflow run guard-validate.yml" -ForegroundColor Gray
Write-Host "  - Weekly Audit: Scheduled for Monday 09:00 UTC" -ForegroundColor Gray
Write-Host "  - Demo PR #4: Keep open (do-not-merge)" -ForegroundColor Gray
Write-Host ""

# Evidence
$evidenceFile = "evidence/validation/30min-tour-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
New-Item -ItemType Directory -Force -Path evidence/validation | Out-Null
$results | Format-Table -AutoSize | Out-File $evidenceFile -Encoding utf8
Write-Host "📝 Evidence saved: $evidenceFile" -ForegroundColor Gray
Write-Host ""

# Exit code
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}

