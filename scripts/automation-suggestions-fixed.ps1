# Automation Suggestions - Low Maintenance Operations
param(
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [int]$AnalysisDays = 7,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-AutomationMetrics {
    param([int]$Days)
    
    $cutoffTime = (Get-Date).AddDays(-$Days)
    $metrics = @{
        self_check_events = 0
        confidence_scores = @()
        threshold_adjustments = 0
        predictive_alerts = 0
        incident_resolutions = 0
        anomaly_detections = 0
    }
    
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        foreach ($event in $allEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                if ($eventTime -gt $cutoffTime) {
                    switch ($eventObj.event) {
                        "self_check" { $metrics.self_check_events++ }
                        "neural_feedback_loop" { 
                            if ($eventObj.confidence_score) {
                                $metrics.confidence_scores += $eventObj.confidence_score.overall_score
                            }
                        }
                        "adaptive_thresholds" { $metrics.threshold_adjustments++ }
                        "predictive_alerting" { 
                            if ($eventObj.predictions) {
                                $metrics.predictive_alerts += $eventObj.predictions.Count
                            }
                        }
                        "incident_summary" { $metrics.incident_resolutions++ }
                        "snapshot_diff_analysis" { $metrics.anomaly_detections++ }
                    }
                }
            } catch {
                # Skip invalid JSON
            }
        }
    }
    
    return $metrics
}

function Analyze-AutomationEffectiveness {
    param([hashtable]$Metrics)
    
    $analysis = @{
        self_check_frequency = 0
        confidence_trend = "stable"
        automation_coverage = 0
        maintenance_burden = "low"
        recommendations = @()
    }
    
    # Self-check frequency analysis
    $analysis.self_check_frequency = $Metrics.self_check_events / $AnalysisDays
    
    # Confidence trend analysis
    if ($Metrics.confidence_scores.Count -gt 1) {
        $firstHalf = $Metrics.confidence_scores[0..([math]::Floor($Metrics.confidence_scores.Count / 2) - 1)]
        $secondHalf = $Metrics.confidence_scores[[math]::Floor($Metrics.confidence_scores.Count / 2)..($Metrics.confidence_scores.Count - 1)]
        
        $firstAvg = ($firstHalf | Measure-Object -Average).Average
        $secondAvg = ($secondHalf | Measure-Object -Average).Average
        
        if ($secondAvg -gt $firstAvg + 0.1) {
            $analysis.confidence_trend = "improving"
        } elseif ($secondAvg -lt $firstAvg - 0.1) {
            $analysis.confidence_trend = "declining"
        }
    }
    
    # Automation coverage calculation
    $totalEvents = $Metrics.self_check_events + $Metrics.threshold_adjustments + $Metrics.predictive_alerts + $Metrics.incident_resolutions + $Metrics.anomaly_detections
    $analysis.automation_coverage = if ($totalEvents -gt 0) { [math]::Round(($Metrics.self_check_events + $Metrics.threshold_adjustments) / $totalEvents, 3) } else { 0 }
    
    # Maintenance burden assessment
    if ($analysis.automation_coverage -gt 0.8) {
        $analysis.maintenance_burden = "very_low"
    } elseif ($analysis.automation_coverage -gt 0.6) {
        $analysis.maintenance_burden = "low"
    } elseif ($analysis.automation_coverage -gt 0.4) {
        $analysis.maintenance_burden = "medium"
    } else {
        $analysis.maintenance_burden = "high"
    }
    
    # Generate recommendations
    if ($analysis.self_check_frequency -lt 1) {
        $analysis.recommendations += "Increase self-check frequency: Currently $([math]::Round($analysis.self_check_frequency, 2)) checks/day, recommend ≥1/day"
    }
    
    if ($analysis.confidence_trend -eq "declining") {
        $analysis.recommendations += "Confidence declining: Review threshold learning parameters and data quality"
    }
    
    if ($analysis.automation_coverage -lt 0.6) {
        $analysis.recommendations += "Low automation coverage: Consider implementing more automated responses"
    }
    
    if ($analysis.maintenance_burden -eq "high") {
        $analysis.recommendations += "High maintenance burden: Implement weekly confidence review cron and incident auto-closure"
    }
    
    return $analysis
}

# Main execution
Write-Host "## Automation Suggestions - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Analysis period: $AnalysisDays days" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get automation metrics
$automationMetrics = Get-AutomationMetrics -Days $AnalysisDays
Write-Host "Automation metrics collected" -ForegroundColor Green

# Analyze automation effectiveness
$effectivenessAnalysis = Analyze-AutomationEffectiveness -Metrics $automationMetrics

Write-Host "`nAutomation Analysis Results:" -ForegroundColor Green
Write-Host "  Self-Check Frequency: $([math]::Round($effectivenessAnalysis.self_check_frequency, 2)) checks/day" -ForegroundColor White
Write-Host "  Confidence Trend: $($effectivenessAnalysis.confidence_trend)" -ForegroundColor White
Write-Host "  Automation Coverage: $($effectivenessAnalysis.automation_coverage)" -ForegroundColor White
Write-Host "  Maintenance Burden: $($effectivenessAnalysis.maintenance_burden)" -ForegroundColor White

if ($effectivenessAnalysis.recommendations.Count -gt 0) {
    Write-Host "`nRecommendations:" -ForegroundColor Cyan
    foreach ($recommendation in $effectivenessAnalysis.recommendations) {
        Write-Host "  - $recommendation" -ForegroundColor Yellow
    }
}

# Log automation suggestions event
$automationEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "automation_suggestions"
    analysis_days = $AnalysisDays
    metrics = $automationMetrics
    effectiveness = $effectivenessAnalysis
    scripts_generated = $false
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $automationEvent

Write-Host "`n## Automation suggestions completed" -ForegroundColor Green
