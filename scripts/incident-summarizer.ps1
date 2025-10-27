# Incident Summarizer Bot
param(
    [string]$OutputFormat = "markdown",
    [string]$WebhookUrl = "",
    [int]$AnalysisHours = 24,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-IncidentSummary {
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

function Analyze-RootCauses {
    param([array]$Events)
    
    $rootCauses = $Events | Where-Object { $_.rootCause } | ForEach-Object { $_.rootCause } | Group-Object | Sort-Object Count -Descending
    $environments = $Events | Where-Object { $_.environment } | ForEach-Object { $_.environment } | Group-Object | Sort-Object Count -Descending
    $commandTypes = $Events | Where-Object { $_.commandType } | ForEach-Object { $_.commandType } | Group-Object | Sort-Object Count -Descending
    $hosts = $Events | Where-Object { $_.host } | ForEach-Object { $_.host } | Group-Object | Sort-Object Count -Descending
    
    return @{
        root_causes = $rootCauses
        environments = $environments
        command_types = $commandTypes
        hosts = $hosts
        total_events = $Events.Count
    }
}

function Calculate-SLODeviations {
    param([array]$Events)
    
    $stallEvents = $Events | Where-Object { $_.event -match "timeout|killed" }
    $successEvents = $Events | Where-Object { $_.event -eq "exit" -and $_.code -eq 0 }
    $failedEvents = $Events | Where-Object { $_.event -eq "exit" -and $_.code -ne 0 }
    $skippedEvents = $Events | Where-Object { $_.event -eq "auto_skip" }
    
    $totalExecutions = $successEvents.Count + $failedEvents.Count + $stallEvents.Count
    $stallRate = if ($totalExecutions -gt 0) { [math]::Round(($stallEvents.Count / $totalExecutions) * 100, 2) } else { 0 }
    $failureRate = if ($totalExecutions -gt 0) { [math]::Round(($failedEvents.Count / $totalExecutions) * 100, 2) } else { 0 }
    $skipRate = if ($totalExecutions -gt 0) { [math]::Round(($skippedEvents.Count / $totalExecutions) * 100, 2) } else { 0 }
    
    # SLO targets
    $stallRateTarget = 2.0  # 2%
    $failureRateTarget = 20.0  # 20%
    $skipRateTarget = 3.0  # 3 events per 24h
    
    return @{
        stall_rate = $stallRate
        failure_rate = $failureRate
        skip_rate = $skipRate
        stall_rate_target = $stallRateTarget
        failure_rate_target = $failureRateTarget
        skip_rate_target = $skipRateTarget
        stall_rate_deviation = $stallRate - $stallRateTarget
        failure_rate_deviation = $failureRate - $failureRateTarget
        skip_rate_deviation = $skipRate - $skipRateTarget
        total_executions = $totalExecutions
        stall_events = $stallEvents.Count
        failed_events = $failedEvents.Count
        skipped_events = $skippedEvents.Count
    }
}

function Generate-MarkdownSummary {
    param(
        [hashtable]$Analysis,
        [hashtable]$SLO,
        [int]$Hours
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $severity = if ($SLO.stall_rate_deviation -gt 5 -or $SLO.failure_rate_deviation -gt 10) { "CRITICAL" } 
                elseif ($SLO.stall_rate_deviation -gt 2 -or $SLO.failure_rate_deviation -gt 5) { "WARNING" }
                else { "NORMAL" }
    
    $markdown = @"
## Runner Watchdog Incident Summary
**Time:** $timestamp  
**Period:** Last $Hours hours  
**Status:** $severity

### SLO Deviations
- Stall Rate: $($SLO.stall_rate)% (target: $($SLO.stall_rate_target)%) - Deviation: $($SLO.stall_rate_deviation)%
- Failure Rate: $($SLO.failure_rate)% (target: $($SLO.failure_rate_target)%) - Deviation: $($SLO.failure_rate_deviation)%
- Skip Rate: $($SLO.skip_rate)% (target: $($SLO.skip_rate_target)%) - Deviation: $($SLO.skip_rate_deviation)%

### Root Cause Analysis
"@

    if ($Analysis.root_causes.Count -gt 0) {
        $markdown += "`nTop Root Causes:`n"
        foreach ($rc in $Analysis.root_causes) {
            $percentage = [math]::Round(($rc.Count / $Analysis.total_events) * 100, 1)
            $markdown += "- $($rc.Name): $($rc.Count) events ($percentage%)`n"
        }
    }

    if ($Analysis.environments.Count -gt 0) {
        $markdown += "`nEnvironment Breakdown:`n"
        foreach ($env in $Analysis.environments) {
            $percentage = [math]::Round(($env.Count / $Analysis.total_events) * 100, 1)
            $markdown += "- $($env.Name): $($env.Count) events ($percentage%)`n"
        }
    }

    if ($Analysis.command_types.Count -gt 0) {
        $markdown += "`nCommand Type Breakdown:`n"
        foreach ($cmd in $Analysis.command_types) {
            $percentage = [math]::Round(($cmd.Count / $Analysis.total_events) * 100, 1)
            $markdown += "- $($cmd.Name): $($cmd.Count) events ($percentage%)`n"
        }
    }

    if ($Analysis.hosts.Count -gt 0) {
        $markdown += "`nHost Breakdown:`n"
        foreach ($host in $Analysis.hosts) {
            $percentage = [math]::Round(($host.Count / $Analysis.total_events) * 100, 1)
            $markdown += "- $($host.Name): $($host.Count) events ($percentage%)`n"
        }
    }

    $markdown += "`n### Execution Summary`n"
    $markdown += "- Total Events: $($Analysis.total_events)`n"
    $markdown += "- Total Executions: $($SLO.total_executions)`n"
    $markdown += "- Stall Events: $($SLO.stall_events)`n"
    $markdown += "- Failed Events: $($SLO.failed_events)`n"
    $markdown += "- Skipped Events: $($SLO.skipped_events)`n"

    $markdown += "`n### Recommendations`n"
    if ($SLO.stall_rate_deviation -gt 0) {
        $markdown += "- Stall rate exceeds target by $($SLO.stall_rate_deviation)%`n"
    }
    if ($SLO.failure_rate_deviation -gt 0) {
        $markdown += "- Failure rate exceeds target by $($SLO.failure_rate_deviation)%`n"
    }
    if ($SLO.skip_rate_deviation -gt 0) {
        $markdown += "- Skip rate exceeds target by $($SLO.skip_rate_deviation)%`n"
    }
    if ($SLO.stall_rate_deviation -le 0 -and $SLO.failure_rate_deviation -le 0 -and $SLO.skip_rate_deviation -le 0) {
        $markdown += "- All SLO targets met`n"
    }

    return $markdown
}

function Send-Webhook {
    param(
        [string]$Content,
        [string]$WebhookUrl
    )
    
    if ([string]::IsNullOrEmpty($WebhookUrl)) {
        Write-Host "⚠️  No webhook URL provided, skipping webhook send" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $body = @{
            text = $Content
            username = "Runner Watchdog Bot"
            icon_emoji = ":robot_face:"
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri $WebhookUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        Write-Host "✅ Webhook sent successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Webhook send failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "## Incident Summarizer Bot - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Analysis period: $AnalysisHours hours" -ForegroundColor Cyan
Write-Host "Output format: $OutputFormat" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get recent events
$recentEvents = Get-IncidentSummary -Hours $AnalysisHours
Write-Host "Recent events found: $($recentEvents.Count)" -ForegroundColor Green

# Analyze events
$analysis = Analyze-RootCauses -Events $recentEvents
$sloDeviations = Calculate-SLODeviations -Events $recentEvents

# Generate summary
$summary = Generate-MarkdownSummary -Analysis $analysis -SLO $sloDeviations -Hours $AnalysisHours

# Output summary
if ($OutputFormat -eq "markdown") {
    Write-Host "`n$summary" -ForegroundColor White
} else {
    Write-Host "Summary generated (format: $OutputFormat)" -ForegroundColor Green
}

# Send webhook if configured
if (-not $DryRun -and -not [string]::IsNullOrEmpty($WebhookUrl)) {
    $webhookSent = Send-Webhook -Content $summary -WebhookUrl $WebhookUrl
}

# Log summarizer event
$summarizerEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "incident_summary"
    analysis_hours = $AnalysisHours
    total_events = $analysis.total_events
    slo_deviations = $sloDeviations
    webhook_sent = if ($DryRun) { $false } else { $webhookSent }
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $summarizerEvent

Write-Host "`n## Incident summarizer completed" -ForegroundColor Green
