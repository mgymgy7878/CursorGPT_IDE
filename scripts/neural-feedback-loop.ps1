# Neural Feedback Loop - Self-Learning Threshold System
param(
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [int]$AnalysisDays = 7,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-HistoricalThresholds {
    param([int]$Days)
    
    $thresholdHistory = @()
    $cutoffTime = (Get-Date).AddDays(-$Days)
    
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        foreach ($event in $allEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                if ($eventObj.event -eq "adaptive_thresholds") {
                    $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                    if ($eventTime -gt $cutoffTime) {
                        $thresholdHistory += @{
                            timestamp = $eventTime
                            fast_burn = $eventObj.thresholds.fast_burn_threshold
                            slow_burn = $eventObj.thresholds.slow_burn_threshold
                            confidence = $eventObj.thresholds.confidence
                            data_points = $eventObj.thresholds.data_points
                        }
                    }
                }
            } catch {
                # Skip invalid JSON
            }
        }
    }
    
    return $thresholdHistory
}

function Calculate-ThresholdDrift {
    param([array]$ThresholdHistory)
    
    if ($ThresholdHistory.Count -lt 2) {
        return @{
            fast_burn_drift = 0
            slow_burn_drift = 0
            drift_confidence = "low"
            trend_direction = "stable"
        }
    }
    
    # Calculate linear regression for threshold drift
    $fastBurnValues = $ThresholdHistory | ForEach-Object { $_.fast_burn }
    $slowBurnValues = $ThresholdHistory | ForEach-Object { $_.slow_burn }
    
    # Simple linear regression slope calculation
    $n = $fastBurnValues.Count
    $sumX = 0; $sumY = 0; $sumXY = 0; $sumXX = 0
    
    for ($i = 0; $i -lt $n; $i++) {
        $x = $i
        $y = $fastBurnValues[$i]
        $sumX += $x
        $sumY += $y
        $sumXY += $x * $y
        $sumXX += $x * $x
    }
    
    $fastBurnSlope = if ($n -gt 1) { ($n * $sumXY - $sumX * $sumY) / ($n * $sumXX - $sumX * $sumX) } else { 0 }
    
    # Calculate for slow burn
    $sumX = 0; $sumY = 0; $sumXY = 0; $sumXX = 0
    for ($i = 0; $i -lt $n; $i++) {
        $x = $i
        $y = $slowBurnValues[$i]
        $sumX += $x
        $sumY += $y
        $sumXY += $x * $y
        $sumXX += $x * $x
    }
    
    $slowBurnSlope = if ($n -gt 1) { ($n * $sumXY - $sumX * $sumY) / ($n * $sumXX - $sumX * $sumX) } else { 0 }
    
    # Determine trend direction
    $avgSlope = ($fastBurnSlope + $slowBurnSlope) / 2
    $trendDirection = if ($avgSlope -gt 0.01) { "increasing" } elseif ($avgSlope -lt -0.01) { "decreasing" } else { "stable" }
    
    # Calculate confidence based on data points and consistency
    $confidence = [math]::Min(1.0, [math]::Max(0.0, ($ThresholdHistory | Measure-Object -Property data_points -Average).Average / 100))
    
    return @{
        fast_burn_drift = $fastBurnSlope
        slow_burn_drift = $slowBurnSlope
        drift_confidence = if ($confidence -gt 0.7) { "high" } elseif ($confidence -gt 0.4) { "medium" } else { "low" }
        trend_direction = $trendDirection
        data_points_avg = ($ThresholdHistory | Measure-Object -Property data_points -Average).Average
        analysis_period_days = $AnalysisDays
    }
}

function Calculate-ConfidenceScore {
    param(
        [hashtable]$DriftAnalysis,
        [array]$ThresholdHistory
    )
    
    # Base confidence from data quality
    $dataQualityScore = [math]::Min(1.0, $ThresholdHistory.Count / 7)  # Max score with 7 days of data
    
    # Stability score (lower drift = higher stability)
    $stabilityScore = [math]::Max(0.0, 1.0 - [math]::Abs($DriftAnalysis.fast_burn_drift) - [math]::Abs($DriftAnalysis.slow_burn_drift))
    
    # Consistency score (how consistent are the thresholds)
    $fastBurnStdDev = if ($ThresholdHistory.Count -gt 1) {
        $values = $ThresholdHistory | ForEach-Object { $_.fast_burn }
        $mean = ($values | Measure-Object -Average).Average
        $variance = ($values | ForEach-Object { [math]::Pow($_ - $mean, 2) } | Measure-Object -Average).Average
        [math]::Sqrt($variance)
    } else { 0 }
    
    $consistencyScore = [math]::Max(0.0, 1.0 - $fastBurnStdDev)
    
    # Overall confidence score
    $confidenceScore = ($dataQualityScore * 0.4 + $stabilityScore * 0.3 + $consistencyScore * 0.3)
    
    return @{
        overall_score = [math]::Round($confidenceScore, 3)
        data_quality = [math]::Round($dataQualityScore, 3)
        stability = [math]::Round($stabilityScore, 3)
        consistency = [math]::Round($consistencyScore, 3)
        trend_direction = $DriftAnalysis.trend_direction
        drift_confidence = $DriftAnalysis.drift_confidence
    }
}

function Send-NeuralMetrics {
    param(
        [hashtable]$ConfidenceScore,
        [hashtable]$DriftAnalysis,
        [string]$Endpoint
    )
    
    try {
        # Send confidence score
        $confidenceBody = @{
            name = 'spark_runner_confidence_score'
            value = $ConfidenceScore.overall_score
            'label_type' = 'threshold'
            'label_period' = '7d'
        }
        $confidenceString = ($confidenceBody.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
        Invoke-RestMethod -Uri "$Endpoint/api/metrics/gauge?$confidenceString" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        # Send threshold drift
        $driftBody = @{
            name = 'spark_runner_threshold_drift'
            value = [math]::Abs($DriftAnalysis.fast_burn_drift)
            'label_threshold_type' = 'fast_burn'
            'label_drift_direction' = $DriftAnalysis.trend_direction
        }
        $driftString = ($driftBody.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
        Invoke-RestMethod -Uri "$Endpoint/api/metrics/gauge?$driftString" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        Write-Host "✅ Neural feedback metrics sent" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  Failed to send neural feedback metrics: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Generate-LearningInsights {
    param(
        [hashtable]$ConfidenceScore,
        [hashtable]$DriftAnalysis
    )
    
    $insights = @()
    
    # Confidence-based insights
    if ($ConfidenceScore.overall_score -lt 0.5) {
        $insights += "Low confidence score ($($ConfidenceScore.overall_score)) - consider increasing data collection period"
    } elseif ($ConfidenceScore.overall_score -gt 0.8) {
        $insights += "High confidence score ($($ConfidenceScore.overall_score)) - threshold learning is effective"
    }
    
    # Stability insights
    if ($ConfidenceScore.stability -lt 0.5) {
        $insights += "Low stability detected - thresholds may need more frequent adjustment"
    }
    
    # Trend insights
    switch ($DriftAnalysis.trend_direction) {
        "increasing" {
            $insights += "Thresholds trending upward - system may be becoming more sensitive"
        }
        "decreasing" {
            $insights += "Thresholds trending downward - system may be becoming more tolerant"
        }
        "stable" {
            $insights += "Thresholds are stable - good learning consistency"
        }
    }
    
    return $insights
}

# Main execution
Write-Host "## Neural Feedback Loop - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Analysis period: $AnalysisDays days" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get historical threshold data
$thresholdHistory = Get-HistoricalThresholds -Days $AnalysisDays
Write-Host "Historical threshold data points: $($thresholdHistory.Count)" -ForegroundColor Green

if ($thresholdHistory.Count -eq 0) {
    Write-Host "⚠️  No historical threshold data found" -ForegroundColor Yellow
    exit 0
}

# Calculate threshold drift
$driftAnalysis = Calculate-ThresholdDrift -ThresholdHistory $thresholdHistory
Write-Host "Threshold drift analysis completed" -ForegroundColor Green

# Calculate confidence score
$confidenceScore = Calculate-ConfidenceScore -DriftAnalysis $driftAnalysis -ThresholdHistory $thresholdHistory

Write-Host "`nNeural Learning Results:" -ForegroundColor Green
Write-Host "  Overall Confidence: $($confidenceScore.overall_score)" -ForegroundColor White
Write-Host "  Data Quality: $($confidenceScore.data_quality)" -ForegroundColor White
Write-Host "  Stability: $($confidenceScore.stability)" -ForegroundColor White
Write-Host "  Consistency: $($confidenceScore.consistency)" -ForegroundColor White
Write-Host "  Trend Direction: $($confidenceScore.trend_direction)" -ForegroundColor White
Write-Host "  Fast Burn Drift: $($driftAnalysis.fast_burn_drift)" -ForegroundColor White
Write-Host "  Slow Burn Drift: $($driftAnalysis.slow_burn_drift)" -ForegroundColor White

# Generate learning insights
$insights = Generate-LearningInsights -ConfidenceScore $confidenceScore -DriftAnalysis $driftAnalysis
if ($insights.Count -gt 0) {
    Write-Host "`nLearning Insights:" -ForegroundColor Cyan
    foreach ($insight in $insights) {
        Write-Host "  - $insight" -ForegroundColor Yellow
    }
}

# Send metrics if not dry run
if (-not $DryRun) {
    $metricsSent = Send-NeuralMetrics -ConfidenceScore $confidenceScore -DriftAnalysis $driftAnalysis -Endpoint $MetricsEndpoint
}

# Log neural feedback event
$neuralEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "neural_feedback_loop"
    analysis_days = $AnalysisDays
    confidence_score = $confidenceScore
    drift_analysis = $driftAnalysis
    insights = $insights
    metrics_sent = if ($DryRun) { $false } else { $metricsSent }
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $neuralEvent

Write-Host "`n## Neural feedback loop completed" -ForegroundColor Green
