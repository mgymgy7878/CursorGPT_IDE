# Fusion Integration - Signal Fusion Data Pipeline
param(
    [string]$FusionEndpoint = "http://127.0.0.1:5000",
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [int]$AnalysisHours = 24,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-RunnerMetrics {
    param([string]$Endpoint)
    
    try {
        $metricsUrl = "$Endpoint/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            $metrics = @{}
            
            # Extract specific metrics
            $patterns = @{
                "spark_runner_confidence_score" = "spark_runner_confidence_score{type=`"threshold`"} (\d+\.?\d*)"
                "spark_runner_predictive_alerts_total" = "spark_runner_predictive_alerts_total (\d+)"
                "spark_runner_stalls_total" = "spark_runner_stalls_total (\d+)"
                "spark_runner_executions_total" = "spark_runner_executions_total (\d+)"
            }
            
            foreach ($metric in $patterns.Keys) {
                if ($content -match $patterns[$metric]) {
                    $metrics[$metric] = [float]$matches[1]
                } else {
                    $metrics[$metric] = 0.0
                }
            }
            
            return $metrics
        } else {
            Write-Host "❌ Metrics endpoint returned status: $($response.StatusCode)" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Metrics extraction failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Get-RiskSignals {
    param([int]$Hours)
    
    $cutoffTime = (Get-Date).AddHours(-$Hours)
    $signals = @{
        stall_rate = 0.0
        failure_rate = 0.0
        confidence_trend = "stable"
        predictive_alerts = 0
        risk_score = 0.0
    }
    
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        $recentEvents = @()
        
        foreach ($event in $allEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                if ($eventTime -gt $cutoffTime) {
                    $recentEvents += $eventObj
                }
            } catch {
                # Skip invalid JSON
            }
        }
        
        # Calculate stall rate
        $stallEvents = $recentEvents | Where-Object { $_.event -match "timeout|killed" }
        $totalEvents = $recentEvents | Where-Object { $_.event -match "timeout|killed|exit" }
        $signals.stall_rate = if ($totalEvents.Count -gt 0) { [math]::Round(($stallEvents.Count / $totalEvents.Count) * 100, 2) } else { 0.0 }
        
        # Calculate failure rate
        $failedEvents = $recentEvents | Where-Object { $_.event -eq "exit" -and $_.code -ne 0 }
        $signals.failure_rate = if ($totalEvents.Count -gt 0) { [math]::Round(($failedEvents.Count / $totalEvents.Count) * 100, 2) } else { 0.0 }
        
        # Calculate confidence trend
        $confidenceEvents = $recentEvents | Where-Object { $_.event -eq "neural_feedback_loop" -and $_.confidence_score }
        if ($confidenceEvents.Count -gt 1) {
            $firstHalf = $confidenceEvents[0..([math]::Floor($confidenceEvents.Count / 2) - 1)]
            $secondHalf = $confidenceEvents[[math]::Floor($confidenceEvents.Count / 2)..($confidenceEvents.Count - 1)]
            
            $firstAvg = ($firstHalf | ForEach-Object { $_.confidence_score.overall_score } | Measure-Object -Average).Average
            $secondAvg = ($secondHalf | ForEach-Object { $_.confidence_score.overall_score } | Measure-Object -Average).Average
            
            if ($secondAvg -gt $firstAvg + 0.1) {
                $signals.confidence_trend = "improving"
            } elseif ($secondAvg -lt $firstAvg - 0.1) {
                $signals.confidence_trend = "declining"
            }
        }
        
        # Count predictive alerts
        $predictiveEvents = $recentEvents | Where-Object { $_.event -eq "predictive_alerting" -and $_.predictions }
        $signals.predictive_alerts = ($predictiveEvents | ForEach-Object { $_.predictions.Count } | Measure-Object -Sum).Sum
        
        # Calculate risk score (0-100)
        $stallImpact = [math]::Min(100, $signals.stall_rate * 2)
        $failureImpact = [math]::Min(100, $signals.failure_rate * 1.5)
        $confidenceImpact = if ($signals.confidence_trend -eq "declining") { 20 } else { 0 }
        $predictiveImpact = [math]::Min(100, $signals.predictive_alerts * 10)
        
        $riskFactors = @($stallImpact, $failureImpact, $confidenceImpact, $predictiveImpact)
        
        $signals.risk_score = [math]::Round(($riskFactors | Measure-Object -Average).Average, 2)
    }
    
    return $signals
}

function Send-ToFusion {
    param(
        [hashtable]$Metrics,
        [hashtable]$Signals,
        [string]$Endpoint
    )
    
    try {
        $fusionData = @{
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            source = "runner_watchdog"
            metrics = $Metrics
            signals = $Signals
            risk_assessment = @{
                risk_score = $Signals.risk_score
                risk_level = if ($Signals.risk_score -lt 30) { "LOW" } elseif ($Signals.risk_score -lt 70) { "MEDIUM" } else { "HIGH" }
                recommendations = @()
            }
        }
        
        # Generate recommendations based on risk level
        if ($Signals.risk_score -gt 70) {
            $fusionData.risk_assessment.recommendations += "HIGH RISK: Consider pausing trading strategies"
            $fusionData.risk_assessment.recommendations += "Review runner watchdog configuration"
        } elseif ($Signals.risk_score -gt 30) {
            $fusionData.risk_assessment.recommendations += "MEDIUM RISK: Monitor trading strategies closely"
            $fusionData.risk_assessment.recommendations += "Consider reducing position sizes"
        } else {
            $fusionData.risk_assessment.recommendations += "LOW RISK: Normal trading operations"
        }
        
        # Send to fusion endpoint
        $fusionUrl = "$Endpoint/fusion/risk/signal"
        $body = $fusionData | ConvertTo-Json -Depth 5
        
        $response = Invoke-WebRequest -Uri $fusionUrl -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Fusion integration successful" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  Fusion integration returned status: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Fusion integration failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Generate-FusionReport {
    param(
        [hashtable]$Metrics,
        [hashtable]$Signals,
        [bool]$FusionSent
    )
    
    $report = @"
## Fusion Integration Report
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Fusion Endpoint:** $FusionEndpoint
**Analysis Period:** $AnalysisHours hours

### Runner Metrics
- **Confidence Score:** $($Metrics.spark_runner_confidence_score)
- **Predictive Alerts:** $($Metrics.spark_runner_predictive_alerts_total)
- **Total Stalls:** $($Metrics.spark_runner_stalls_total)
- **Total Executions:** $($Metrics.spark_runner_executions_total)

### Risk Signals
- **Stall Rate:** $($Signals.stall_rate)%
- **Failure Rate:** $($Signals.failure_rate)%
- **Confidence Trend:** $($Signals.confidence_trend)
- **Predictive Alerts:** $($Signals.predictive_alerts)
- **Risk Score:** $($Signals.risk_score)/100

### Risk Assessment
- **Risk Level:** $(if ($Signals.risk_score -lt 30) { "LOW" } elseif ($Signals.risk_score -lt 70) { "MEDIUM" } else { "HIGH" })
- **Fusion Integration:** $(if ($FusionSent) { "SUCCESS" } else { "FAILED" })

### Recommendations
"@

    if ($Signals.risk_score -gt 70) {
        $report += "`n- HIGH RISK: Consider pausing trading strategies"
        $report += "`n- Review runner watchdog configuration"
    } elseif ($Signals.risk_score -gt 30) {
        $report += "`n- MEDIUM RISK: Monitor trading strategies closely"
        $report += "`n- Consider reducing position sizes"
    } else {
        $report += "`n- LOW RISK: Normal trading operations"
    }
    
    return $report
}

# Main execution
Write-Host "## Fusion Integration - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Fusion Endpoint: $FusionEndpoint" -ForegroundColor Cyan
Write-Host "Metrics Endpoint: $MetricsEndpoint" -ForegroundColor Cyan
Write-Host "Analysis Period: $AnalysisHours hours" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get runner metrics
$runnerMetrics = Get-RunnerMetrics -Endpoint $MetricsEndpoint
if ($null -eq $runnerMetrics) {
    Write-Host "❌ Failed to get runner metrics" -ForegroundColor Red
    exit 1
}

# Get risk signals
$riskSignals = Get-RiskSignals -Hours $AnalysisHours

Write-Host "`nRunner Metrics:" -ForegroundColor Green
Write-Host "  Confidence Score: $($runnerMetrics.spark_runner_confidence_score)" -ForegroundColor White
Write-Host "  Predictive Alerts: $($runnerMetrics.spark_runner_predictive_alerts_total)" -ForegroundColor White
Write-Host "  Total Stalls: $($runnerMetrics.spark_runner_stalls_total)" -ForegroundColor White
Write-Host "  Total Executions: $($runnerMetrics.spark_runner_executions_total)" -ForegroundColor White

Write-Host "`nRisk Signals:" -ForegroundColor Green
Write-Host "  Stall Rate: $($riskSignals.stall_rate)%" -ForegroundColor White
Write-Host "  Failure Rate: $($riskSignals.failure_rate)%" -ForegroundColor White
Write-Host "  Confidence Trend: $($riskSignals.confidence_trend)" -ForegroundColor White
Write-Host "  Predictive Alerts: $($riskSignals.predictive_alerts)" -ForegroundColor White
Write-Host "  Risk Score: $($riskSignals.risk_score)/100" -ForegroundColor White

# Send to fusion if not dry run
$fusionSent = $false
if (-not $DryRun) {
    $fusionSent = Send-ToFusion -Metrics $runnerMetrics -Signals $riskSignals -Endpoint $FusionEndpoint
}

# Generate fusion report
$fusionReport = Generate-FusionReport -Metrics $runnerMetrics -Signals $riskSignals -FusionSent $fusionSent
Write-Host "`n$fusionReport" -ForegroundColor White

# Log fusion integration event
$fusionEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "fusion_integration"
    fusion_endpoint = $FusionEndpoint
    metrics_endpoint = $MetricsEndpoint
    analysis_hours = $AnalysisHours
    runner_metrics = $runnerMetrics
    risk_signals = $riskSignals
    fusion_sent = $fusionSent
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $fusionEvent

Write-Host "`n## Fusion integration completed" -ForegroundColor Green
