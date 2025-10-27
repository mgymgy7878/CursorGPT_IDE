#!/usr/bin/env pwsh
<#
.SYNOPSIS
    UI Smoke Test - Quick health check for all pages
.DESCRIPTION
    Tests that all core pages return 200 OK status
    Used for rapid deployment validation
.EXAMPLE
    .\scripts\smoke-ui.ps1
    .\scripts\smoke-ui.ps1 -BaseUrl "http://localhost:3003"
#>

param(
    [string]$BaseUrl = "http://127.0.0.1:3003"
)

$pages = @(
    "/",
    "/portfolio",
    "/strategies",
    "/running",
    "/settings",
    "/api/health"
)

Write-Host "🧪 Starting UI Smoke Test..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Gray

$allPassed = $true
$startTime = Get-Date

foreach ($page in $pages) {
    $url = "$BaseUrl$page"
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ OK   $page" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL $page (Status: $($response.StatusCode))" -ForegroundColor Red
            $allPassed = $false
        }
    }
    catch {
        Write-Host "❌ FAIL $page (Error: $($_.Exception.Message))" -ForegroundColor Red
        $allPassed = $false
    }
}

$duration = (Get-Date) - $startTime
Write-Host "`n⏱️  Duration: $($duration.TotalSeconds.ToString('F2'))s" -ForegroundColor Gray

if ($allPassed) {
    Write-Host "`n🎉 All pages passed smoke test!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n💥 Some pages failed. Check server logs." -ForegroundColor Red
    exit 1
}

