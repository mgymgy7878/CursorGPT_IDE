# WebSocket Stability Test
# BTCTurk WS - 60 minute soak test
# Tracks: reconnects, errors, max staleness, message rate

param(
    [Parameter()]
    [int]$DurationMinutes = 60
)

$ErrorActionPreference = 'Continue'

Write-Host "🔌 WEBSOCKET STABILITY TEST" -ForegroundColor Cyan
Write-Host "Duration: ${DurationMinutes} minutes" -ForegroundColor Yellow
Write-Host ""

$healthUrl = "http://localhost:3003/api/healthz"
$startTime = Get-Date
$endTime = $startTime.AddMinutes($DurationMinutes)

$stats = @{
    Checks = 0
    Errors = 0
    MaxStaleness = 0
    AvgStaleness = 0
    TotalStaleness = 0
    StatusChanges = 0
    LastStatus = "UNKNOWN"
}

Write-Host "Start: $($startTime.ToString('HH:mm:ss'))" -ForegroundColor Gray
Write-Host "End:   $($endTime.ToString('HH:mm:ss'))" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitoring BTCTurk WebSocket staleness..." -ForegroundColor Cyan
Write-Host ""

while ((Get-Date) -lt $endTime) {
    $now = Get-Date
    $elapsed = ($now - $startTime).TotalMinutes
    $remaining = ($endTime - $now).TotalMinutes
    
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 5 -UseBasicParsing
        $health = $response.Content | ConvertFrom-Json
        
        if ($health.venues -and $health.venues.btcturk) {
            $staleness = $health.venues.btcturk.stalenessSec
            $status = $health.venues.btcturk.status
            
            $stats.Checks++
            $stats.TotalStaleness += $staleness
            $stats.AvgStaleness = [math]::Round($stats.TotalStaleness / $stats.Checks, 2)
            
            if ($staleness -gt $stats.MaxStaleness) {
                $stats.MaxStaleness = $staleness
            }
            
            if ($stats.LastStatus -ne $status) {
                $stats.StatusChanges++
                $stats.LastStatus = $status
            }
            
            $icon = if ($staleness -lt 5) { "✅" } elseif ($staleness -lt 15) { "⚠️" } else { "❌" }
            $color = if ($staleness -lt 5) { "Green" } elseif ($staleness -lt 15) { "Yellow" } else { "Red" }
            
            Write-Host "[$($now.ToString('HH:mm:ss'))] $icon Staleness: ${staleness}s | Status: $status | Avg: $($stats.AvgStaleness)s | Max: $($stats.MaxStaleness)s | Elapsed: $([math]::Round($elapsed, 1))m" -ForegroundColor $color
        }
        
    } catch {
        $stats.Errors++
        Write-Host "[$($now.ToString('HH:mm:ss'))] ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Progress bar
    $progress = [math]::Round(($elapsed / $DurationMinutes) * 100)
    $remainingMin = [math]::Round($remaining, 1)
    $statusMsg = "$progress% Complete ($remainingMin m remaining)"
    Write-Progress -Activity "WS Stability Test" -Status $statusMsg -PercentComplete $progress
    
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Duration: ${DurationMinutes} minutes" -ForegroundColor White
Write-Host "Checks: $($stats.Checks)" -ForegroundColor White
Write-Host "Errors: $($stats.Errors)" -ForegroundColor $(if ($stats.Errors -eq 0) { "Green" } else { "Red" })
Write-Host "Max Staleness: $($stats.MaxStaleness)s" -ForegroundColor $(if ($stats.MaxStaleness -lt 15) { "Green" } else { "Red" })
Write-Host "Avg Staleness: $($stats.AvgStaleness)s" -ForegroundColor $(if ($stats.AvgStaleness -lt 5) { "Green" } else { "Yellow" })
Write-Host "Status Changes: $($stats.StatusChanges)" -ForegroundColor White
Write-Host ""

$passRate = if ($stats.Checks -gt 0) { (($stats.Checks - $stats.Errors) / $stats.Checks) * 100 } else { 0 }

$passRateRounded = [math]::Round($passRate, 1)
$passRateMsg = "Pass Rate: $passRateRounded percent"

if ($stats.Errors -eq 0 -and $stats.MaxStaleness -lt 30) {
    Write-Host "✅ STABILITY TEST PASSED" -ForegroundColor Green
    Write-Host "   $passRateMsg" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ STABILITY TEST: WARNINGS" -ForegroundColor Yellow
    Write-Host "   $passRateMsg" -ForegroundColor Yellow
    exit 1
}

