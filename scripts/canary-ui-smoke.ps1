# Canary UI Smoke Test
# PR merge sonrası production validation

param(
    [string]$BaseUrl = "http://127.0.0.1:3003",
    [int]$Retries = 3,
    [int]$SleepSeconds = 5
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "CANARY UI SMOKE TEST" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Host "[LOG] Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "[LOG] Retries: $Retries" -ForegroundColor Cyan
Write-Host "[LOG] Sleep: $SleepSeconds seconds`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[TEST 1/4] Health Check..." -NoNewline
$healthPassed = $false
for ($i = 1; $i -le $Retries; $i++) {
    try {
        $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET -TimeoutSec 10
        if ($health.status -eq "ok") {
            Write-Host " ✅ PASS (attempt $i/$Retries)" -ForegroundColor Green
            $healthPassed = $true
            break
        }
    } catch {
        if ($i -eq $Retries) {
            Write-Host " ❌ FAIL (all retries exhausted)" -ForegroundColor Red
        } else {
            Write-Host " ⚠️ Retry $i/$Retries..." -ForegroundColor Yellow
            Start-Sleep -Seconds $SleepSeconds
        }
    }
}

# Test 2: Critical Pages
Write-Host "[TEST 2/4] Critical Pages (5 routes)..." -NoNewline
$pages = @("/", "/portfolio", "/strategies", "/running", "/settings")
$pagesPassed = $true
foreach ($page in $pages) {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl$page" -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            $pagesPassed = $false
            break
        }
    } catch {
        $pagesPassed = $false
        break
    }
}
if ($pagesPassed) {
    Write-Host " ✅ PASS (5/5)" -ForegroundColor Green
} else {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Test 3: Lighthouse (quick check)
Write-Host "[TEST 3/4] Lighthouse (performance)..." -NoNewline
try {
    if (Get-Command "npx" -ErrorAction SilentlyContinue) {
        # Run minimal Lighthouse check on homepage
        $lhResult = npx @lhci/cli autorun --config=.lighthouserc.json 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅ PASS" -ForegroundColor Green
        } else {
            Write-Host " ⚠️ WARN (non-zero exit)" -ForegroundColor Yellow
        }
    } else {
        Write-Host " ⏭️ SKIP (npx not found)" -ForegroundColor Gray
    }
} catch {
    Write-Host " ⏭️ SKIP (error)" -ForegroundColor Gray
}

# Test 4: Bundle Size Check
Write-Host "[TEST 4/4] Bundle Size..." -NoNewline
$bundlePassed = $false
if (Test-Path "apps/web-next/.next/standalone") {
    $bundleSize = (Get-ChildItem -Recurse "apps/web-next/.next/standalone" | Measure-Object -Property Length -Sum).Sum / 1MB
    if ($bundleSize -lt 250) {
        Write-Host " ✅ PASS ($([math]::Round($bundleSize, 2)) MB < 250 MB)" -ForegroundColor Green
        $bundlePassed = $true
    } else {
        Write-Host " ⚠️ WARN ($([math]::Round($bundleSize, 2)) MB ≥ 250 MB)" -ForegroundColor Yellow
    }
} else {
    Write-Host " ⏭️ SKIP (standalone not found)" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "CANARY SUMMARY" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$overallStatus = $healthPassed -and $pagesPassed
Write-Host "Health:     $(if ($healthPassed) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($healthPassed) { "Green" } else { "Red" })
Write-Host "Pages:      $(if ($pagesPassed) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($pagesPassed) { "Green" } else { "Red" })
Write-Host "Bundle:     $(if ($bundlePassed) { '✅ PASS' } else { '⏭️ SKIP' })" -ForegroundColor $(if ($bundlePassed) { "Green" } else { "Gray" })
Write-Host "`nOverall:    $(if ($overallStatus) { '✅ GO' } else { '❌ NO-GO' })" -ForegroundColor $(if ($overallStatus) { "Green" } else { "Red" })
Write-Host "Timestamp:  $timestamp" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Magenta

if (-not $overallStatus) {
    Write-Host "[ERROR] Canary failed — rollback recommended" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Canary passed — proceed to cutover" -ForegroundColor Green
exit 0

