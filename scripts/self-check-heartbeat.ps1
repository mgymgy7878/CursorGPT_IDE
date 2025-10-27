# Self-Check Heartbeat System
param(
    [string]$CheckType = "heartbeat",
    [string]$Status = "success",
    [string]$MetricsEndpoint = "http://127.0.0.1:4001"
)

$ErrorActionPreference = "Continue"

function Send-SelfCheckMetric {
    param(
        [string]$CheckType,
        [string]$Status,
        [string]$Endpoint
    )
    
    try {
        $body = @{
            name = 'spark_runner_self_check_total'
            value = 1
            'label_check_type' = $CheckType
            'label_status' = $Status
        }
        
        $bodyString = ($body.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
        $url = "$Endpoint/api/metrics/counter?$bodyString"
        
        Invoke-RestMethod -Uri $url -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Host "✅ Self-check metric sent: $CheckType/$Status" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  Self-check metric failed: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Test-RunnerHealth {
    # Test evidence directory accessibility
    $evidenceDir = "evidence/runner"
    if (-not (Test-Path $evidenceDir)) {
        New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
    }
    
    # Test config file accessibility
    $configFile = "config/runner.json"
    if (-not (Test-Path $configFile)) {
        Write-Host "❌ Config file missing: $configFile" -ForegroundColor Red
        return "config_missing"
    }
    
    # Test stall events file
    $stallEventsFile = "evidence/runner/stall-events.jsonl"
    if (-not (Test-Path $stallEventsFile)) {
        # Create empty file if missing
        New-Item -ItemType File -Path $stallEventsFile -Force | Out-Null
    }
    
    # Test file write permissions
    try {
        $testContent = @{
            ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            event = "self_check"
            check_type = $CheckType
            status = $Status
        } | ConvertTo-Json
        
        Add-Content -Path $stallEventsFile -Value $testContent -ErrorAction Stop
        Write-Host "✅ File write test passed" -ForegroundColor Green
    } catch {
        Write-Host "❌ File write test failed: $($_.Exception.Message)" -ForegroundColor Red
        return "write_failed"
    }
    
    return "success"
}

function Get-RunnerStats {
    $stats = @{
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        evidence_dir_exists = Test-Path "evidence/runner"
        config_file_exists = Test-Path "config/runner.json"
        stall_events_count = 0
        last_event_time = $null
        evidence_size_mb = 0
    }
    
    # Count stall events
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $events = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
        $stats.stall_events_count = $events.Count
        
        if ($events.Count -gt 0) {
            try {
                $lastEvent = $events[-1] | ConvertFrom-Json
                $stats.last_event_time = $lastEvent.ts
            } catch {
                $stats.last_event_time = "parse_error"
            }
        }
    }
    
    # Calculate evidence directory size
    if (Test-Path "evidence/runner") {
        $stats.evidence_size_mb = [math]::Round((Get-ChildItem "evidence/runner" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    }
    
    return $stats
}

# Main execution
Write-Host "## Runner Self-Check Heartbeat - $(Get-Date)" -ForegroundColor Cyan

# Test runner health
$healthStatus = Test-RunnerHealth
if ($healthStatus -ne "success") {
    Write-Host "❌ Health check failed: $healthStatus" -ForegroundColor Red
    Send-SelfCheckMetric -CheckType $CheckType -Status "failed" -Endpoint $MetricsEndpoint
    exit 1
}

# Get runner statistics
$stats = Get-RunnerStats
Write-Host "Runner Stats:" -ForegroundColor Green
Write-Host "  Evidence Dir: $($stats.evidence_dir_exists)" -ForegroundColor White
Write-Host "  Config File: $($stats.config_file_exists)" -ForegroundColor White
Write-Host "  Stall Events: $($stats.stall_events_count)" -ForegroundColor White
Write-Host "  Last Event: $($stats.last_event_time)" -ForegroundColor White
Write-Host "  Evidence Size: $($stats.evidence_size_mb) MB" -ForegroundColor White

# Send self-check metric
$metricSent = Send-SelfCheckMetric -CheckType $CheckType -Status $Status -Endpoint $MetricsEndpoint

# Log self-check event
$selfCheckEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "self_check"
    check_type = $CheckType
    status = $Status
    health_status = $healthStatus
    stats = $stats
    metric_sent = $metricSent
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $selfCheckEvent

Write-Host "## Self-check completed successfully" -ForegroundColor Green
exit 0
