# Adaptive Thresholding System
param(
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [int]$LookbackHours = 24,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-HistoricalStallRates {
    param([int]$Hours)
    
    $cutoffTime = (Get-Date).AddHours(-$Hours)
    $events = @()
    
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        foreach ($event in $allEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                if ($eventTime -gt $cutoffTime) {
                    $events += $eventObj
                }
            } catch {
                # Skip invalid JSON
            }
        }
    }
    
    return $events
}

function Calculate-AdaptiveThresholds {
    param([array]$Events)
    
    if ($Events.Count -eq 0) {
        return @{
            fast_burn_threshold = 0.2
            slow_burn_threshold = 0.05
            confidence = "low"
            reason = "no_historical_data"
        }
    }
    
    # Group events by hour for rate calculation
    $hourlyGroups = $Events | Group-Object { 
        [DateTime]::ParseExact($_.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null).ToString("yyyy-MM-dd HH:00")
    }
    
    $hourlyRates = @()
    foreach ($group in $hourlyGroups) {
        $hourlyRates += $group.Count
    }
    
    # Calculate median and percentiles
    $sortedRates = $hourlyRates | Sort-Object
    $count = $sortedRates.Count
    
    if ($count -eq 0) {
        return @{
            fast_burn_threshold = 0.2
            slow_burn_threshold = 0.05
            confidence = "low"
            reason = "no_hourly_data"
        }
    }
    
    # Calculate percentiles
    $median = if ($count % 2 -eq 0) { 
        ($sortedRates[$count/2-1] + $sortedRates[$count/2]) / 2 
    } else { 
        $sortedRates[[math]::Floor($count/2)] 
    }
    
    $p75 = $sortedRates[[math]::Floor($count * 0.75)]
    $p90 = $sortedRates[[math]::Floor($count * 0.90)]
    
    # Adaptive thresholds based on historical data
    $fastBurnThreshold = [math]::Max(0.1, [math]::Min(1.0, $p90 / 60))  # Max 1.0, min 0.1
    $slowBurnThreshold = [math]::Max(0.02, [math]::Min(0.2, $median / 60))  # Max 0.2, min 0.02
    
    $confidence = if ($count -ge 12) { "high" } elseif ($count -ge 6) { "medium" } else { "low" }
    
    return @{
        fast_burn_threshold = $fastBurnThreshold
        slow_burn_threshold = $slowBurnThreshold
        confidence = $confidence
        reason = "historical_analysis"
        data_points = $count
        median = $median
        p75 = $p75
        p90 = $p90
    }
}

function Send-AdaptiveThresholds {
    param(
        [hashtable]$Thresholds,
        [string]$Endpoint
    )
    
    try {
        # Send fast burn threshold
        $fastBurnBody = @{
            name = 'spark_runner_adaptive_thresholds'
            value = $Thresholds.fast_burn_threshold
            'label_threshold_type' = 'fast_burn'
            'label_period' = '24h'
        }
        $fastBurnString = ($fastBurnBody.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
        Invoke-RestMethod -Uri "$Endpoint/api/metrics/gauge?$fastBurnString" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        # Send slow burn threshold
        $slowBurnBody = @{
            name = 'spark_runner_adaptive_thresholds'
            value = $Thresholds.slow_burn_threshold
            'label_threshold_type' = 'slow_burn'
            'label_period' = '24h'
        }
        $slowBurnString = ($slowBurnBody.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
        Invoke-RestMethod -Uri "$Endpoint/api/metrics/gauge?$slowBurnString" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        Write-Host "✅ Adaptive thresholds sent to metrics endpoint" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  Failed to send adaptive thresholds: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Update-PrometheusRules {
    param(
        [hashtable]$Thresholds,
        [string]$RulesFile = "config/prometheus/rules/spark-runner.rules.yml"
    )
    
    if (-not (Test-Path $RulesFile)) {
        Write-Host "⚠️  Prometheus rules file not found: $RulesFile" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $rulesContent = Get-Content $RulesFile -Raw
        
        # Update fast burn threshold
        $rulesContent = $rulesContent -replace 'rate\(spark_runner_stalls_total\[5m\]\) > 0\.2', "rate(spark_runner_stalls_total[5m]) > $($Thresholds.fast_burn_threshold)"
        
        # Update slow burn threshold  
        $rulesContent = $rulesContent -replace 'rate\(spark_runner_stalls_total\[1h\]\) > 0\.05', "rate(spark_runner_stalls_total[1h]) > $($Thresholds.slow_burn_threshold)"
        
        Set-Content -Path $RulesFile -Value $rulesContent -Encoding UTF8
        Write-Host "✅ Prometheus rules updated with adaptive thresholds" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to update Prometheus rules: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "## Adaptive Thresholding - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Lookback period: $LookbackHours hours" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get historical events
$historicalEvents = Get-HistoricalStallRates -Hours $LookbackHours
Write-Host "Historical events found: $($historicalEvents.Count)" -ForegroundColor Green

# Calculate adaptive thresholds
$thresholds = Calculate-AdaptiveThresholds -Events $historicalEvents

Write-Host "`nAdaptive Thresholds:" -ForegroundColor Green
Write-Host "  Fast Burn: $($thresholds.fast_burn_threshold)" -ForegroundColor White
Write-Host "  Slow Burn: $($thresholds.slow_burn_threshold)" -ForegroundColor White
Write-Host "  Confidence: $($thresholds.confidence)" -ForegroundColor White
Write-Host "  Data Points: $($thresholds.data_points)" -ForegroundColor White
Write-Host "  Reason: $($thresholds.reason)" -ForegroundColor White

if ($thresholds.data_points -gt 0) {
    Write-Host "`nHistorical Analysis:" -ForegroundColor Green
    Write-Host "  Median: $($thresholds.median)" -ForegroundColor White
    Write-Host "  P75: $($thresholds.p75)" -ForegroundColor White
    Write-Host "  P90: $($thresholds.p90)" -ForegroundColor White
}

if (-not $DryRun) {
    # Send metrics
    $metricsSent = Send-AdaptiveThresholds -Thresholds $thresholds -Endpoint $MetricsEndpoint
    
    # Update Prometheus rules
    $rulesUpdated = Update-PrometheusRules -Thresholds $thresholds
    
    # Log adaptive threshold event
    $adaptiveEvent = @{
        ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        event = "adaptive_thresholds"
        thresholds = $thresholds
        metrics_sent = $metricsSent
        rules_updated = $rulesUpdated
    } | ConvertTo-Json
    
    Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $adaptiveEvent
}

Write-Host "`n## Adaptive thresholding completed" -ForegroundColor Green
