# Cognitive Memory System - Short vs Long-term Pattern Recognition
param(
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [int]$ShortTermHours = 24,
    [int]$LongTermDays = 30,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-MemoryData {
    param(
        [int]$Hours,
        [string]$MemoryType
    )
    
    $cutoffTime = (Get-Date).AddHours(-$Hours)
    $events = @()
    
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        foreach ($event in $allEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                if ($eventTime -gt $cutoffTime -and $eventObj.event -match "timeout|killed|exit") {
                    $events += $eventObj
                }
            } catch {
                # Skip invalid JSON
            }
        }
    }
    
    return $events
}

function Analyze-HostBehaviorPatterns {
    param([array]$Events)
    
    $hostPatterns = @{}
    
    foreach ($event in $Events) {
        $host = if ($event.host) { $event.host } else { "unknown" }
        $rootCause = if ($event.rootCause) { $event.rootCause } else { "unknown" }
        $environment = if ($event.environment) { $event.environment } else { "unknown" }
        
        if (-not $hostPatterns.ContainsKey($host)) {
            $hostPatterns[$host] = @{
                total_events = 0
                root_causes = @{}
                environments = @{}
                command_types = @{}
                behavior_signature = ""
                reliability_score = 0
            }
        }
        
        $hostPatterns[$host].total_events++
        
        # Root cause distribution
        if (-not $hostPatterns[$host].root_causes.ContainsKey($rootCause)) {
            $hostPatterns[$host].root_causes[$rootCause] = 0
        }
        $hostPatterns[$host].root_causes[$rootCause]++
        
        # Environment distribution
        if (-not $hostPatterns[$host].environments.ContainsKey($environment)) {
            $hostPatterns[$host].environments[$environment] = 0
        }
        $hostPatterns[$host].environments[$environment]++
        
        # Command type distribution
        $commandType = if ($event.commandType) { $event.commandType } else { "unknown" }
        if (-not $hostPatterns[$host].command_types.ContainsKey($commandType)) {
            $hostPatterns[$host].command_types[$commandType] = 0
        }
        $hostPatterns[$host].command_types[$commandType]++
    }
    
    # Calculate behavior signatures and reliability scores
    foreach ($host in $hostPatterns.Keys) {
        $pattern = $hostPatterns[$host]
        
        # Find dominant root cause
        $dominantRootCause = ($pattern.root_causes.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Name
        $dominantEnvironment = ($pattern.environments.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Name
        
        # Create behavior signature
        $pattern.behavior_signature = "$dominantRootCause-in-$dominantEnvironment"
        
        # Calculate reliability score (lower event count = higher reliability)
        $pattern.reliability_score = [math]::Max(0.0, 1.0 - ($pattern.total_events / 100))
    }
    
    return $hostPatterns
}

function Compare-MemoryTypes {
    param(
        [hashtable]$ShortTermPatterns,
        [hashtable]$LongTermPatterns
    )
    
    $comparison = @{
        pattern_consistency = @{}
        behavior_drift = @{}
        reliability_trends = @{}
        insights = @()
    }
    
    # Compare patterns for each host
    $allHosts = @($ShortTermPatterns.Keys + $LongTermPatterns.Keys) | Sort-Object | Get-Unique
    
    foreach ($host in $allHosts) {
        $shortTerm = if ($ShortTermPatterns.ContainsKey($host)) { $ShortTermPatterns[$host] } else { $null }
        $longTerm = if ($LongTermPatterns.ContainsKey($host)) { $LongTermPatterns[$host] } else { $null }
        
        if ($shortTerm -and $longTerm) {
            # Pattern consistency
            $shortDominant = ($shortTerm.root_causes.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Name
            $longDominant = ($longTerm.root_causes.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Name
            
            $consistency = if ($shortDominant -eq $longDominant) { 1.0 } else { 0.0 }
            $comparison.pattern_consistency[$host] = $consistency
            
            # Behavior drift
            $shortSignature = $shortTerm.behavior_signature
            $longSignature = $longTerm.behavior_signature
            $drift = if ($shortSignature -eq $longSignature) { 0.0 } else { 1.0 }
            $comparison.behavior_drift[$host] = $drift
            
            # Reliability trends
            $reliabilityChange = $shortTerm.reliability_score - $longTerm.reliability_score
            $comparison.reliability_trends[$host] = $reliabilityChange
            
            # Generate insights
            if ($consistency -lt 0.5) {
                $comparison.insights += "Host '$host' shows inconsistent behavior patterns between short and long-term memory"
            }
            
            if ($drift -gt 0.5) {
                $comparison.insights += "Host '$host' behavior signature has drifted: $longSignature → $shortSignature"
            }
            
            if ($reliabilityChange -lt -0.2) {
                $comparison.insights += "Host '$host' reliability has decreased significantly"
            } elseif ($reliabilityChange -gt 0.2) {
                $comparison.insights += "Host '$host' reliability has improved"
            }
        }
    }
    
    return $comparison
}

function Send-MemoryMetrics {
    param(
        [hashtable]$HostPatterns,
        [hashtable]$Comparison,
        [string]$Endpoint
    )
    
    try {
        foreach ($host in $HostPatterns.Keys) {
            $pattern = $HostPatterns[$host]
            
            # Send memory pattern metrics
            $patternBody = @{
                name = 'spark_runner_memory_patterns_total'
                value = $pattern.total_events
                'label_memory_type' = 'short_term'
                'label_host' = $host
                'label_pattern_type' = $pattern.behavior_signature
            }
            $patternString = ($patternBody.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
            Invoke-RestMethod -Uri "$Endpoint/api/metrics/counter?$patternString" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        }
        
        Write-Host "✅ Memory pattern metrics sent" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  Failed to send memory metrics: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Generate-MemoryReport {
    param(
        [hashtable]$ShortTermPatterns,
        [hashtable]$LongTermPatterns,
        [hashtable]$Comparison
    )
    
    $report = @"
## Cognitive Memory Analysis Report
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Short-term Memory:** Last 24 hours
**Long-term Memory:** Last 30 days

### Host Behavior Signatures
"@

    # Short-term patterns
    $report += "`n#### Short-term Patterns (24h)`n"
    foreach ($host in $ShortTermPatterns.Keys) {
        $pattern = $ShortTermPatterns[$host]
        $report += "- **$host**: $($pattern.behavior_signature) (reliability: $([math]::Round($pattern.reliability_score, 2)))`n"
    }
    
    # Long-term patterns
    $report += "`n#### Long-term Patterns (30d)`n"
    foreach ($host in $LongTermPatterns.Keys) {
        $pattern = $LongTermPatterns[$host]
        $report += "- **$host**: $($pattern.behavior_signature) (reliability: $([math]::Round($pattern.reliability_score, 2)))`n"
    }
    
    # Comparison insights
    if ($Comparison.insights.Count -gt 0) {
        $report += "`n### Memory Insights`n"
        foreach ($insight in $Comparison.insights) {
            $report += "- $insight`n"
        }
    }
    
    return $report
}

# Main execution
Write-Host "## Cognitive Memory Analysis - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Short-term memory: $ShortTermHours hours" -ForegroundColor Cyan
Write-Host "Long-term memory: $LongTermDays days" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get short-term memory data
$shortTermEvents = Get-MemoryData -Hours $ShortTermHours -MemoryType "short_term"
Write-Host "Short-term events: $($shortTermEvents.Count)" -ForegroundColor Green

# Get long-term memory data
$longTermEvents = Get-MemoryData -Hours ($LongTermDays * 24) -MemoryType "long_term"
Write-Host "Long-term events: $($longTermEvents.Count)" -ForegroundColor Green

# Analyze host behavior patterns
$shortTermPatterns = Analyze-HostBehaviorPatterns -Events $shortTermEvents
$longTermPatterns = Analyze-HostBehaviorPatterns -Events $longTermEvents

Write-Host "Short-term hosts: $($shortTermPatterns.Keys.Count)" -ForegroundColor Green
Write-Host "Long-term hosts: $($longTermPatterns.Keys.Count)" -ForegroundColor Green

# Compare memory types
$comparison = Compare-MemoryTypes -ShortTermPatterns $shortTermPatterns -LongTermPatterns $longTermPatterns

# Generate memory report
$memoryReport = Generate-MemoryReport -ShortTermPatterns $shortTermPatterns -LongTermPatterns $longTermPatterns -Comparison $comparison
Write-Host "`n$memoryReport" -ForegroundColor White

# Send metrics if not dry run
if (-not $DryRun) {
    $metricsSent = Send-MemoryMetrics -HostPatterns $shortTermPatterns -Comparison $comparison -Endpoint $MetricsEndpoint
}

# Log cognitive memory event
$memoryEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "cognitive_memory_analysis"
    short_term_hours = $ShortTermHours
    long_term_days = $LongTermDays
    short_term_events = $shortTermEvents.Count
    long_term_events = $longTermEvents.Count
    host_patterns = @{
        short_term = $shortTermPatterns
        long_term = $longTermPatterns
    }
    comparison = $comparison
    metrics_sent = if ($DryRun) { $false } else { $metricsSent }
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $memoryEvent

Write-Host "`n## Cognitive memory analysis completed" -ForegroundColor Green
