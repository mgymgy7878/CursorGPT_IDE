# Canary Dry-Run Script
# Spark Platform - Health & Smoke Test
# Usage: .\scripts\canary-dry-run.ps1 [-Mode mock|real] [-AutoOk]

param(
    [Parameter()]
    [ValidateSet('mock', 'real')]
    [string]$Mode = 'mock',
    
    [Parameter()]
    [switch]$AutoOk
)

$ErrorActionPreference = 'Continue'

Write-Host "🚀 CANARY DRY-RUN - SPARK PLATFORM" -ForegroundColor Cyan
Write-Host "Mode: $Mode | Auto-OK: $AutoOk" -ForegroundColor Yellow
Write-Host ""

# Test URLs
$urls = @(
    @{Path="/"; Name="Root"},
    @{Path="/dashboard"; Name="Dashboard"},
    @{Path="/portfolio"; Name="Portfolio"},
    @{Path="/strategies"; Name="Strategies"},
    @{Path="/settings"; Name="Settings"},
    @{Path="/api/healthz"; Name="Health Check"}
)

$baseUrl = "http://localhost:3003"
$results = @()

Write-Host "=== SMOKE TEST ===" -ForegroundColor Cyan
Write-Host ""

# Execute tests
foreach ($endpoint in $urls) {
    $url = "$baseUrl$($endpoint.Path)"
    
    try {
        $start = Get-Date
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -UseBasicParsing
        $duration = [int]((Get-Date) - $start).TotalMilliseconds
        
        $result = [PSCustomObject]@{
            Endpoint = $endpoint.Name
            Path = $endpoint.Path
            Status = $response.StatusCode
            Time = "${duration}ms"
            Result = "PASS"
        }
        
        $results += $result
        Write-Host "✅ $($endpoint.Name) → $($response.StatusCode) (${duration}ms)" -ForegroundColor Green
        
    } catch {
        $result = [PSCustomObject]@{
            Endpoint = $endpoint.Name
            Path = $endpoint.Path
            Status = "ERROR"
            Time = "N/A"
            Result = "FAIL"
        }
        
        $results += $result
        Write-Host "❌ $($endpoint.Name) → ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== SLO METRICS ===" -ForegroundColor Cyan
Write-Host ""

# Check SLO metrics
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/api/healthz" -Method GET -UseBasicParsing
    $health = $healthResponse.Content | ConvertFrom-Json
    
    $slo = $health.slo
    $thresholds = $health.thresholds
    
    # P95 Latency
    $p95Status = if ($slo.latencyP95 -eq $null) {
        "⚪"
    } elseif ($slo.latencyP95 -le $thresholds.latencyP95Target) {
        "✅"
    } elseif ($slo.latencyP95 -le $thresholds.latencyP95Target * 1.5) {
        "⚠️"
    } else {
        "❌"
    }
    
    Write-Host "$p95Status P95 Latency: $($slo.latencyP95)ms (Target: <$($thresholds.latencyP95Target)ms)"
    
    # Staleness
    $stalenessStatus = if ($slo.stalenessSec -le $thresholds.stalenessTarget) {
        "✅"
    } elseif ($slo.stalenessSec -le $thresholds.stalenessTarget * 1.5) {
        "⚠️"
    } else {
        "❌"
    }
    
    Write-Host "$stalenessStatus Staleness: $($slo.stalenessSec)s (Target: <$($thresholds.stalenessTarget)s)"
    
    # Error Rate
    $errorRateStatus = if ($slo.errorRate -le $thresholds.errorRateTarget) {
        "✅"
    } elseif ($slo.errorRate -le $thresholds.errorRateTarget * 1.5) {
        "⚠️"
    } else {
        "❌"
    }
    
    Write-Host "$errorRateStatus Error Rate: $($slo.errorRate)% (Target: <$($thresholds.errorRateTarget)%)"
    
    # Uptime
    Write-Host "✅ Uptime: $($slo.uptimeMin) minutes"
    
    # Executor Status
    $execStatus = $health.services.executor.status
    $execIcon = switch ($execStatus) {
        "UP" { "✅" }
        "DEGRADED" { "⚠️" }
        "DOWN" { "❌" }
        default { "⚪" }
    }
    
    Write-Host "$execIcon Executor: $execStatus (Latency: $($health.services.executor.latency)ms)"
    
} catch {
    Write-Host "❌ Failed to fetch SLO metrics: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

$passCount = ($results | Where-Object {$_.Result -eq "PASS"}).Count
$totalCount = $results.Count
$passRate = [math]::Round(($passCount / $totalCount) * 100, 1)

Write-Host "Results: $passCount/$totalCount PASS ($passRate%)" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($passCount -eq $totalCount) {
    Write-Host "✅ ALL TESTS PASSED - CANARY READY" -ForegroundColor Green
    $exitCode = 0
} else {
    Write-Host "⚠️ SOME TESTS FAILED - REVIEW REQUIRED" -ForegroundColor Yellow
    $exitCode = 1
}

Write-Host ""

# Auto-OK decision
if ($AutoOk) {
    if ($passCount -eq $totalCount) {
        Write-Host "🚀 AUTO-OK: Proceeding with deployment" -ForegroundColor Green
    } else {
        Write-Host "🛑 AUTO-OK: Blocking deployment (failures detected)" -ForegroundColor Red
        $exitCode = 1
    }
} else {
    Write-Host "Manual approval required (use -AutoOk for automatic decision)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Mode: $Mode | Exit Code: $exitCode" -ForegroundColor Cyan

exit $exitCode

