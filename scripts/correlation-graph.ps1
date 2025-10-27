# Root-Cause Correlation Graph Generator
param(
    [int]$AnalysisHours = 24,
    [string]$OutputFormat = "json",
    [string]$OutputFile = "evidence/runner/correlation-analysis.json"
)

$ErrorActionPreference = "Continue"

function Get-CorrelationData {
    param([int]$Hours)
    
    $cutoffTime = (Get-Date).AddHours(-$Hours)
    Write-Host "Cutoff time: $cutoffTime" -ForegroundColor Gray
    Write-Host "Current time: $(Get-Date)" -ForegroundColor Gray
    $events = @()
    
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        foreach ($event in $allEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                Write-Host "Event time: $eventTime" -ForegroundColor Gray
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

function Analyze-Correlations {
    param([array]$Events)
    
    $correlations = @{
        root_cause_environment = @{}
        root_cause_command_type = @{}
        root_cause_host = @{}
        environment_command_type = @{}
        environment_host = @{}
        command_type_host = @{}
        triple_correlations = @{}
    }
    
    foreach ($event in $Events) {
        $rootCause = if ($event.rootCause) { $event.rootCause } else { "unknown" }
        $environment = if ($event.environment) { $event.environment } else { "unknown" }
        $commandType = if ($event.commandType) { $event.commandType } else { "unknown" }
        $host = if ($event.host) { $event.host } else { "unknown" }
        
        # Root-cause + Environment
        $key = "$rootCause|$environment"
        if (-not $correlations.root_cause_environment.ContainsKey($key)) {
            $correlations.root_cause_environment[$key] = 0
        }
        $correlations.root_cause_environment[$key]++
        
        # Root-cause + Command Type
        $key = "$rootCause|$commandType"
        if (-not $correlations.root_cause_command_type.ContainsKey($key)) {
            $correlations.root_cause_command_type[$key] = 0
        }
        $correlations.root_cause_command_type[$key]++
        
        # Root-cause + Host
        $key = "$rootCause|$host"
        if (-not $correlations.root_cause_host.ContainsKey($key)) {
            $correlations.root_cause_host[$key] = 0
        }
        $correlations.root_cause_host[$key]++
        
        # Environment + Command Type
        $key = "$environment|$commandType"
        if (-not $correlations.environment_command_type.ContainsKey($key)) {
            $correlations.environment_command_type[$key] = 0
        }
        $correlations.environment_command_type[$key]++
        
        # Environment + Host
        $key = "$environment|$host"
        if (-not $correlations.environment_host.ContainsKey($key)) {
            $correlations.environment_host[$key] = 0
        }
        $correlations.environment_host[$key]++
        
        # Command Type + Host
        $key = "$commandType|$host"
        if (-not $correlations.command_type_host.ContainsKey($key)) {
            $correlations.command_type_host[$key] = 0
        }
        $correlations.command_type_host[$key]++
        
        # Triple correlation: Root-cause + Environment + Command Type
        $key = "$rootCause|$environment|$commandType"
        if (-not $correlations.triple_correlations.ContainsKey($key)) {
            $correlations.triple_correlations[$key] = 0
        }
        $correlations.triple_correlations[$key]++
    }
    
    return $correlations
}

function Generate-CorrelationInsights {
    param([hashtable]$Correlations, [int]$TotalEvents)
    
    $insights = @()
    
    # Find top root-cause patterns
    $topRootCauseEnv = $Correlations.root_cause_environment.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5
    foreach ($item in $topRootCauseEnv) {
        $parts = $item.Key -split '\|'
        $percentage = [math]::Round(($item.Value / $TotalEvents) * 100, 1)
        $insights += @{
            type = "root_cause_environment"
            root_cause = $parts[0]
            environment = $parts[1]
            count = $item.Value
            percentage = $percentage
            insight = "Root cause '$($parts[0])' occurs $($item.Value) times in environment '$($parts[1])' ($percentage%)"
        }
    }
    
    # Find top command type patterns
    $topCommandType = $Correlations.root_cause_command_type.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5
    foreach ($item in $topCommandType) {
        $parts = $item.Key -split '\|'
        $percentage = [math]::Round(($item.Value / $TotalEvents) * 100, 1)
        $insights += @{
            type = "root_cause_command_type"
            root_cause = $parts[0]
            command_type = $parts[1]
            count = $item.Value
            percentage = $percentage
            insight = "Root cause '$($parts[0])' occurs $($item.Value) times with command type '$($parts[1])' ($percentage%)"
        }
    }
    
    # Find top host patterns
    $topHost = $Correlations.root_cause_host.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5
    foreach ($item in $topHost) {
        $parts = $item.Key -split '\|'
        $percentage = [math]::Round(($item.Value / $TotalEvents) * 100, 1)
        $insights += @{
            type = "root_cause_host"
            root_cause = $parts[0]
            host = $parts[1]
            count = $item.Value
            percentage = $percentage
            insight = "Root cause '$($parts[0])' occurs $($item.Value) times on host '$($parts[1])' ($percentage%)"
        }
    }
    
    # Find triple correlations
    $topTriple = $Correlations.triple_correlations.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3
    foreach ($item in $topTriple) {
        $parts = $item.Key -split '\|'
        $percentage = [math]::Round(($item.Value / $TotalEvents) * 100, 1)
        $insights += @{
            type = "triple_correlation"
            root_cause = $parts[0]
            environment = $parts[1]
            command_type = $parts[2]
            count = $item.Value
            percentage = $percentage
            insight = "Triple pattern: '$($parts[0])' + '$($parts[1])' + '$($parts[2])' occurs $($item.Value) times ($percentage%)"
        }
    }
    
    return $insights
}

function Generate-CorrelationGraph {
    param(
        [hashtable]$Correlations,
        [array]$Insights,
        [int]$TotalEvents
    )
    
    $graph = @{
        metadata = @{
            generated_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            analysis_hours = $AnalysisHours
            total_events = $TotalEvents
            correlation_types = $Correlations.Keys
        }
        correlations = $Correlations
        insights = $Insights
        recommendations = @()
    }
    
    # Generate recommendations based on insights
    $highFrequencyInsights = $Insights | Where-Object { $_.percentage -gt 10 }
    foreach ($insight in $highFrequencyInsights) {
        switch ($insight.type) {
            "root_cause_environment" {
                $graph.recommendations += "Consider environment-specific timeout tuning for '$($insight.environment)' to address '$($insight.root_cause)' issues"
            }
            "root_cause_command_type" {
                $graph.recommendations += "Review command type '$($insight.command_type)' configuration to prevent '$($insight.root_cause)' issues"
            }
            "root_cause_host" {
                $graph.recommendations += "Investigate host '$($insight.host)' for potential hardware/network issues causing '$($insight.root_cause)'"
            }
            "triple_correlation" {
                $graph.recommendations += "High correlation detected: '$($insight.root_cause)' in '$($insight.environment)' with '$($insight.command_type)' - consider targeted optimization"
            }
        }
    }
    
    return $graph
}

# Main execution
Write-Host "## Root-Cause Correlation Analysis - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Analysis period: $AnalysisHours hours" -ForegroundColor Cyan
Write-Host "Output format: $OutputFormat" -ForegroundColor Cyan
Write-Host "Output file: $OutputFile" -ForegroundColor Cyan

# Get correlation data
$events = Get-CorrelationData -Hours $AnalysisHours
Write-Host "Events found: $($events.Count)" -ForegroundColor Green

if ($events.Count -eq 0) {
    Write-Host "⚠️  No events found in the specified time period" -ForegroundColor Yellow
    exit 0
}

# Analyze correlations
$correlations = Analyze-Correlations -Events $events
Write-Host "Correlation analysis completed" -ForegroundColor Green

# Generate insights
$insights = Generate-CorrelationInsights -Correlations $correlations -TotalEvents $events.Count
Write-Host "Generated $($insights.Count) insights" -ForegroundColor Green

# Generate correlation graph
$graph = Generate-CorrelationGraph -Correlations $correlations -Insights $insights -TotalEvents $events.Count

# Output results
if ($OutputFormat -eq "json") {
    $graph | ConvertTo-Json -Depth 5 | Out-File $OutputFile -Encoding UTF8
    Write-Host "Correlation graph saved to: $OutputFile" -ForegroundColor Green
} else {
    Write-Host "`n## Top Correlations:" -ForegroundColor Cyan
    foreach ($insight in $insights | Sort-Object percentage -Descending | Select-Object -First 10) {
        Write-Host "  $($insight.insight)" -ForegroundColor White
    }
    
    Write-Host "`n## Recommendations:" -ForegroundColor Cyan
    foreach ($recommendation in $graph.recommendations) {
        Write-Host "  - $recommendation" -ForegroundColor Yellow
    }
}

# Log correlation analysis event
$correlationEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "correlation_analysis"
    analysis_hours = $AnalysisHours
    total_events = $events.Count
    insights_count = $insights.Count
    recommendations_count = $graph.recommendations.Count
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $correlationEvent

Write-Host "`n## Correlation analysis completed" -ForegroundColor Green
