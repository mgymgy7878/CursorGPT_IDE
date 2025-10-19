# CI Health Gate Script
# Spark Platform - Pre-deployment Health Check
# Usage: .\scripts\ci-health-gate.ps1 [-ExitOnFail]

param(
    [Parameter()]
    [switch]$ExitOnFail
)

$ErrorActionPreference = 'Stop'

Write-Host "🚦 CI HEALTH GATE" -ForegroundColor Cyan
Write-Host ""

$statusUrl = "http://localhost:3003/api/tools/status"

try {
    $response = Invoke-WebRequest -Uri $statusUrl -Method GET -TimeoutSec 10 -UseBasicParsing
    $status = $response.Content | ConvertFrom-Json
    
    Write-Host "=== HEALTH CHECKS ===" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($check in $status.checks) {
        $icon = if ($check.pass) { "✅" } else { "❌" }
        $color = if ($check.pass) { "Green" } else { "Red" }
        
        Write-Host "$icon $($check.name): $($check.value) (Expected: $($check.expected))" -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Status: $($status.status)" -ForegroundColor $(if ($status.status -eq "PASS") { "Green" } else { "Red" })
    Write-Host "Passed: $($status.passCount)/$($status.totalChecks) checks"
    
    if ($status.failedChecks.Count -gt 0) {
        Write-Host ""
        Write-Host "Failed Checks:" -ForegroundColor Red
        foreach ($failed in $status.failedChecks) {
            Write-Host "  - $failed" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    if ($status.status -eq "PASS") {
        Write-Host "✅ HEALTH GATE: PASSED - Ready for deployment" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ HEALTH GATE: FAILED - Blocking deployment" -ForegroundColor Red
        
        if ($ExitOnFail) {
            exit 1
        } else {
            Write-Host "(Use -ExitOnFail to block CI pipeline)" -ForegroundColor Yellow
            exit 0
        }
    }
    
} catch {
    Write-Host "❌ HEALTH GATE: ERROR - $($_.Exception.Message)" -ForegroundColor Red
    
    if ($ExitOnFail) {
        exit 1
    } else {
        Write-Host "(Use -ExitOnFail to block CI pipeline)" -ForegroundColor Yellow
        exit 0
    }
}

