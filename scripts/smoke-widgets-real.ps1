# Widget Real Data Smoke Test
# 5-minute continuous test with SLO validation

param(
    [Parameter()]
    [int]$DurationSeconds = 300  # 5 minutes
)

$ErrorActionPreference = 'Continue'

Write-Host "🧪 WIDGET REAL DATA SMOKE TEST" -ForegroundColor Cyan
Write-Host "Duration: ${DurationSeconds} seconds (5 minutes)" -ForegroundColor Yellow
Write-Host ""

$dashboardUrl = "http://localhost:3003/dashboard"
$healthUrl = "http://localhost:3003/api/healthz"
$startTime = Get-Date
$endTime = $startTime.AddSeconds($DurationSeconds)

$stats = @{
    DashboardChecks = 0
    DashboardErrors = 0
    HealthChecks = 0
    HealthErrors = 0
    SLOBreaches = 0
}

Write-Host "Testing widgets continuously..." -ForegroundColor Cyan
Write-Host ""

while ((Get-Date) -lt $endTime) {
    $now = Get-Date
    $elapsed = ($now - $startTime).TotalSeconds
    $remaining = ($endTime - $now).TotalSeconds
    
    # Test dashboard
    try {
        $dash = Invoke-WebRequest -Uri $dashboardUrl -Method GET -TimeoutSec 5 -UseBasicParsing
        $stats.DashboardChecks++
        
        if ($dash.StatusCode -ne 200) {
            $stats.DashboardErrors++
        }
    } catch {
        $stats.DashboardErrors++
    }
    
    # Test health + SLO
    try {
        $health = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 5 -UseBasicParsing
        $healthData = $health.Content | ConvertFrom-Json
        $stats.HealthChecks++
        
        $slo = $healthData.slo
        $thresholds = $healthData.thresholds
        
        # Check SLO breaches
        $breaches = @()
        
        if ($slo.latencyP95 -ne $null -and $slo.latencyP95 -gt $thresholds.latencyP95Target) {
            $breaches += "P95: $($slo.latencyP95)ms"
        }
        
        if ($slo.errorRate -gt $thresholds.errorRateTarget) {
            $breaches += "ErrorRate: $($slo.errorRate)%"
        }
        
        if ($healthData.venues.btcturk.stalenessSec -gt 30) {
            $breaches += "BTCTurk staleness: $($healthData.venues.btcturk.stalenessSec)s"
        }
        
        if ($breaches.Count -gt 0) {
            $stats.SLOBreaches++
            Write-Host "[$([math]::Round($elapsed))s] ⚠️ SLO Breach: $($breaches -join ', ')" -ForegroundColor Yellow
        } else {
            Write-Host "[$([math]::Round($elapsed))s] ✅ Dashboard + SLO OK (P95: $($slo.latencyP95)ms, Errors: $($slo.errorRate)%)" -ForegroundColor Green
        }
    } catch {
        $stats.HealthErrors++
        Write-Host "[$([math]::Round($elapsed))s] ❌ Health check failed" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard Checks: $($stats.DashboardChecks)" -ForegroundColor White
Write-Host "Dashboard Errors: $($stats.DashboardErrors)" -ForegroundColor $(if ($stats.DashboardErrors -eq 0) { "Green" } else { "Red" })
Write-Host "Health Checks: $($stats.HealthChecks)" -ForegroundColor White
Write-Host "Health Errors: $($stats.HealthErrors)" -ForegroundColor $(if ($stats.HealthErrors -eq 0) { "Green" } else { "Red" })
Write-Host "SLO Breaches: $($stats.SLOBreaches)" -ForegroundColor $(if ($stats.SLOBreaches -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

$totalChecks = $stats.DashboardChecks + $stats.HealthChecks
$totalErrors = $stats.DashboardErrors + $stats.HealthErrors
$passRate = if ($totalChecks -gt 0) { (($totalChecks - $totalErrors) / $totalChecks) * 100 } else { 0 }

if ($totalErrors -eq 0 -and $stats.SLOBreaches -eq 0) {
    Write-Host "✅ WIDGET TEST PASSED (Pass Rate: $([math]::Round($passRate, 1))%)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ WIDGET TEST: WARNINGS (Pass Rate: $([math]::Round($passRate, 1))%)" -ForegroundColor Yellow
    exit 1
}

