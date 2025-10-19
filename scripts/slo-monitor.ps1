# SLO Monitor Script
# Spark Platform - Continuous SLO Monitoring
# Usage: .\scripts\slo-monitor.ps1 [-IntervalSec 30] [-AlertLogPath "logs/slo-alerts.log"]

param(
    [Parameter()]
    [int]$IntervalSec = 30,
    
    [Parameter()]
    [string]$AlertLogPath = "logs/slo-alerts.log"
)

$ErrorActionPreference = 'Continue'

# Ensure log directory exists
$logDir = Split-Path -Parent $AlertLogPath
if ($logDir -and !(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

Write-Host "🔍 SLO MONITOR STARTED" -ForegroundColor Cyan
Write-Host "Interval: ${IntervalSec}s | Alert Log: $AlertLogPath" -ForegroundColor Yellow
Write-Host ""

$healthUrl = "http://localhost:3003/api/healthz"
$iteration = 0

while ($true) {
    $iteration++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 5 -UseBasicParsing
        $health = $response.Content | ConvertFrom-Json
        
        $slo = $health.slo
        $thresholds = $health.thresholds
        $alerts = @()
        
        # Check P95 Latency
        if ($slo.latencyP95 -ne $null -and $slo.latencyP95 -gt $thresholds.latencyP95Target) {
            $alerts += [PSCustomObject]@{
                Type = "SLO_BREACH"
                Metric = "latencyP95"
                Value = "$($slo.latencyP95)ms"
                Threshold = "$($thresholds.latencyP95Target)ms"
                Severity = if ($slo.latencyP95 -gt $thresholds.latencyP95Target * 1.5) { "CRITICAL" } else { "WARNING" }
            }
        }
        
        # Check Error Rate
        if ($slo.errorRate -gt $thresholds.errorRateTarget) {
            $alerts += [PSCustomObject]@{
                Type = "SLO_BREACH"
                Metric = "errorRate"
                Value = "$($slo.errorRate)%"
                Threshold = "$($thresholds.errorRateTarget)%"
                Severity = if ($slo.errorRate -gt $thresholds.errorRateTarget * 1.5) { "CRITICAL" } else { "WARNING" }
            }
        }
        
        # Check Staleness
        if ($slo.stalenessSec -gt $thresholds.stalenessTarget) {
            $alerts += [PSCustomObject]@{
                Type = "SLO_BREACH"
                Metric = "staleness"
                Value = "$($slo.stalenessSec)s"
                Threshold = "$($thresholds.stalenessTarget)s"
                Severity = "WARNING"
            }
        }
        
        # Check Executor Status
        if ($health.services.executor.status -ne "UP") {
            $alerts += [PSCustomObject]@{
                Type = "SERVICE_DOWN"
                Metric = "executor"
                Value = $health.services.executor.status
                Threshold = "UP"
                Severity = "CRITICAL"
            }
        }
        
        # Display status
        if ($alerts.Count -eq 0) {
            Write-Host "[$timestamp] ✅ Iteration $iteration - All SLO OK" -ForegroundColor Green
            Write-Host "  P95: $($slo.latencyP95)ms | Errors: $($slo.errorRate)% | Staleness: $($slo.stalenessSec)s | Executor: $($health.services.executor.status)" -ForegroundColor Gray
        } else {
            Write-Host "[$timestamp] ⚠️ Iteration $iteration - $($alerts.Count) Alert(s)" -ForegroundColor Yellow
            
            foreach ($alert in $alerts) {
                $color = if ($alert.Severity -eq "CRITICAL") { "Red" } else { "Yellow" }
                Write-Host "  $($alert.Severity): $($alert.Metric) = $($alert.Value) (Threshold: $($alert.Threshold))" -ForegroundColor $color
                
                # Log to file
                $logEntry = "$timestamp | $($alert.Severity) | $($alert.Type) | $($alert.Metric)=$($alert.Value) (threshold: $($alert.Threshold))"
                Add-Content -Path $AlertLogPath -Value $logEntry
            }
        }
        
    } catch {
        Write-Host "[$timestamp] ❌ Iteration $iteration - Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        
        # Log failure
        $logEntry = "$timestamp | ERROR | HEALTH_CHECK_FAILED | $($_.Exception.Message)"
        Add-Content -Path $AlertLogPath -Value $logEntry
    }
    
    # Sleep until next iteration
    Start-Sleep -Seconds $IntervalSec
}

