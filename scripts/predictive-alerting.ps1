# Predictive Alerting System - Trend Detection and Future Anomaly Prediction
param(
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [int]$AnalysisHours = 6,
    [int]$PredictionWindowMinutes = 60,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-TrendData {
    param([int]$Hours)
    
    $cutoffTime = (Get-Date).AddHours(-$Hours)
    $events = @()
    
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        foreach ($event in $allEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                if ($eventTime -gt $cutoffTime -and $eventObj.event -match "timeout|killed") {
                    $events += @{
                        timestamp = $eventTime
                        event = $eventObj.event
                        rootCause = if ($eventObj.rootCause) { $eventObj.rootCause } else { "unknown" }
                        environment = if ($eventObj.environment) { $eventObj.environment } else { "unknown" }
                        host = if ($eventObj.host) { $eventObj.host } else { "unknown" }
                    }
                }
            } catch {
                # Skip invalid JSON
            }
        }
    }
    
    return $events
}

function Calculate-TrendSlope {
    param([array]$Events, [int]$WindowMinutes)
    
    if ($Events.Count -lt 3) {
        return @{
            slope = 0
            confidence = 0
            trend_direction = "insufficient_data"
            prediction_accuracy = 0
        }
    }
    
    # Group events by time windows
    $windowSize = [TimeSpan]::FromMinutes($WindowMinutes)
    $windows = @{}
    
    foreach ($event in $Events) {
        $windowKey = $event.timestamp.ToString("yyyy-MM-dd HH:mm")
        if (-not $windows.ContainsKey($windowKey)) {
            $windows[$windowKey] = 0
        }
        $windows[$windowKey]++
    }
    
    # Calculate linear regression slope
    $sortedWindows = $windows.GetEnumerator() | Sort-Object Name
    $n = $sortedWindows.Count
    
    if ($n -lt 2) {
        return @{
            slope = 0
            confidence = 0
            trend_direction = "insufficient_data"
            prediction_accuracy = 0
        }
    }
    
    $sumX = 0; $sumY = 0; $sumXY = 0; $sumXX = 0
    
    for ($i = 0; $i -lt $n; $i++) {
        $x = $i
        $y = $sortedWindows[$i].Value
        $sumX += $x
        $sumY += $y
        $sumXY += $x * $y
        $sumXX += $x * $x
    }
    
    $slope = if ($n -gt 1) { ($n * $sumXY - $sumX * $sumY) / ($n * $sumXX - $sumX * $sumX) } else { 0 }
    
    # Calculate confidence based on data consistency
    $values = $sortedWindows | ForEach-Object { $_.Value }
    $mean = ($values | Measure-Object -Average).Average
    $variance = ($values | ForEach-Object { [math]::Pow($_ - $mean, 2) } | Measure-Object -Average).Average
    $stdDev = [math]::Sqrt($variance)
    
    $confidence = [math]::Max(0.0, 1.0 - ($stdDev / [math]::Max(1, $mean)))
    
    # Determine trend direction
    $trendDirection = if ($slope -gt 0.1) { "increasing" } elseif ($slope -lt -0.1) { "decreasing" } else { "stable" }
    
    return @{
        slope = [math]::Round($slope, 4)
        confidence = [math]::Round($confidence, 3)
        trend_direction = $trendDirection
        prediction_accuracy = [math]::Round($confidence * 0.8, 3)  # Conservative accuracy estimate
        data_points = $n
        mean_rate = [math]::Round($mean, 2)
    }
}

function Predict-FutureAnomalies {
    param(
        [hashtable]$TrendAnalysis,
        [int]$PredictionWindowMinutes
    )
    
    $predictions = @()
    
    if ($TrendAnalysis.trend_direction -eq "increasing" -and $TrendAnalysis.confidence -gt 0.6) {
        # Calculate estimated breach time
        $currentRate = $TrendAnalysis.mean_rate
        $slope = $TrendAnalysis.slope
        $threshold = 0.2  # Stall rate threshold
        
        if ($slope -gt 0) {
            $estimatedBreachMinutes = if ($slope -gt 0) { [math]::Max(1, ($threshold - $currentRate) / $slope) } else { 999 }
            $estimatedBreachTime = (Get-Date).AddMinutes($estimatedBreachMinutes)
            
            $predictions += @{
                alert_type = "stall_rate_breach"
                estimated_breach_time = $estimatedBreachTime.ToString("yyyy-MM-dd HH:mm:ss")
                estimated_breach_minutes = [math]::Round($estimatedBreachMinutes, 1)
                confidence = $TrendAnalysis.confidence
                current_slope = $TrendAnalysis.slope
                current_rate = $currentRate
                threshold = $threshold
                message = "Predictive Warning: Stall rate trending ↑ (slope=+$($TrendAnalysis.slope)/min). Estimated breach in $([math]::Round($estimatedBreachMinutes, 0)) min (confidence $($TrendAnalysis.confidence))"
            }
        }
    }
    
    # Predict based on trend acceleration
    if ($TrendAnalysis.slope -gt 0.05 -and $TrendAnalysis.confidence -gt 0.7) {
        $predictions += @{
            alert_type = "trend_acceleration"
            confidence = $TrendAnalysis.confidence
            slope = $TrendAnalysis.slope
            message = "Trend acceleration detected: Slope +$($TrendAnalysis.slope)/min with $($TrendAnalysis.confidence) confidence"
        }
    }
    
    return $predictions
}

function Send-PredictiveAlerts {
    param(
        [array]$Predictions,
        [string]$Endpoint
    )
    
    try {
        foreach ($prediction in $Predictions) {
            $alertBody = @{
                name = 'spark_runner_predictive_alerts_total'
                value = 1
                'label_alert_type' = $prediction.alert_type
                'label_confidence_level' = if ($prediction.confidence -gt 0.8) { "high" } elseif ($prediction.confidence -gt 0.6) { "medium" } else { "low" }
            }
            $alertString = ($alertBody.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
            Invoke-RestMethod -Uri "$Endpoint/api/metrics/counter?$alertString" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        }
        
        Write-Host "✅ Predictive alerts sent to metrics" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  Failed to send predictive alerts: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Generate-PredictiveReport {
    param(
        [hashtable]$TrendAnalysis,
        [array]$Predictions
    )
    
    $report = @"
## Predictive Alerting Report
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Analysis Window:** $AnalysisHours hours
**Prediction Window:** $PredictionWindowMinutes minutes

### Trend Analysis
- **Slope:** $($TrendAnalysis.slope) events/minute
- **Confidence:** $($TrendAnalysis.confidence)
- **Direction:** $($TrendAnalysis.trend_direction)
- **Data Points:** $($TrendAnalysis.data_points)
- **Mean Rate:** $($TrendAnalysis.mean_rate) events/window

### Predictive Alerts
"@

    if ($Predictions.Count -gt 0) {
        foreach ($prediction in $Predictions) {
            $report += "`n#### $($prediction.alert_type)`n"
            $report += "- **Message:** $($prediction.message)`n"
            $report += "- **Confidence:** $($prediction.confidence)`n"
            if ($prediction.estimated_breach_time) {
                $report += "- **Estimated Breach:** $($prediction.estimated_breach_time)`n"
            }
        }
    } else {
        $report += "`nNo predictive alerts generated.`n"
    }
    
    return $report
}

# Main execution
Write-Host "## Predictive Alerting - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Analysis window: $AnalysisHours hours" -ForegroundColor Cyan
Write-Host "Prediction window: $PredictionWindowMinutes minutes" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get trend data
$trendEvents = Get-TrendData -Hours $AnalysisHours
Write-Host "Trend events found: $($trendEvents.Count)" -ForegroundColor Green

if ($trendEvents.Count -lt 3) {
    Write-Host "⚠️  Insufficient data for trend analysis" -ForegroundColor Yellow
    exit 0
}

# Calculate trend slope
$trendAnalysis = Calculate-TrendSlope -Events $trendEvents -WindowMinutes 15
Write-Host "Trend analysis completed" -ForegroundColor Green

# Predict future anomalies
$predictions = Predict-FutureAnomalies -TrendAnalysis $trendAnalysis -PredictionWindowMinutes $PredictionWindowMinutes

Write-Host "`nTrend Analysis Results:" -ForegroundColor Green
Write-Host "  Slope: $($trendAnalysis.slope) events/minute" -ForegroundColor White
Write-Host "  Confidence: $($trendAnalysis.confidence)" -ForegroundColor White
Write-Host "  Direction: $($trendAnalysis.trend_direction)" -ForegroundColor White
Write-Host "  Data Points: $($trendAnalysis.data_points)" -ForegroundColor White
Write-Host "  Mean Rate: $($trendAnalysis.mean_rate)" -ForegroundColor White

Write-Host "`nPredictive Alerts: $($predictions.Count)" -ForegroundColor Green
foreach ($prediction in $predictions) {
    Write-Host "  - $($prediction.message)" -ForegroundColor Yellow
}

# Generate predictive report
$predictiveReport = Generate-PredictiveReport -TrendAnalysis $trendAnalysis -Predictions $predictions
Write-Host "`n$predictiveReport" -ForegroundColor White

# Send metrics if not dry run
if (-not $DryRun) {
    $metricsSent = Send-PredictiveAlerts -Predictions $predictions -Endpoint $MetricsEndpoint
}

# Log predictive alerting event
$predictiveEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "predictive_alerting"
    analysis_hours = $AnalysisHours
    prediction_window_minutes = $PredictionWindowMinutes
    trend_analysis = $trendAnalysis
    predictions = $predictions
    metrics_sent = if ($DryRun) { $false } else { $metricsSent }
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $predictiveEvent

Write-Host "`n## Predictive alerting completed" -ForegroundColor Green
