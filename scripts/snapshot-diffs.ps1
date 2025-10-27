# Snapshot Diffs and Anomaly Detection
param(
    [string]$ManifestFile = "evidence/runner/daily_report_manifest.json",
    [string]$PreviousManifestFile = "evidence/runner/daily_report_manifest_previous.json",
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Get-CurrentManifest {
    param([string]$ManifestPath)
    
    if (-not (Test-Path $ManifestPath)) {
        return $null
    }
    
    try {
        $manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
        return $manifest
    } catch {
        Write-Host "❌ Failed to parse manifest: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Compare-Manifests {
    param(
        [object]$Current,
        [object]$Previous
    )
    
    if ($null -eq $Current -or $null -eq $Previous) {
        return @{
            status = "no_comparison"
            reason = if ($null -eq $Current) { "current_missing" } else { "previous_missing" }
            diffs = @()
            anomalies = @()
        }
    }
    
    $diffs = @()
    $anomalies = @()
    
    # Compare file counts
    $currentFileCount = $Current.files.Count
    $previousFileCount = $Previous.files.Count
    $fileCountDiff = $currentFileCount - $previousFileCount
    
    if ($fileCountDiff -ne 0) {
        $diffs += @{
            type = "file_count"
            current = $currentFileCount
            previous = $previousFileCount
            difference = $fileCountDiff
            severity = if ([math]::Abs($fileCountDiff) -gt 5) { "high" } else { "medium" }
        }
    }
    
    # Compare total size
    $currentSize = $Current.total_size_mb
    $previousSize = $Previous.total_size_mb
    $sizeDiff = $currentSize - $previousSize
    $sizeChangePercent = if ($previousSize -gt 0) { [math]::Round(($sizeDiff / $previousSize) * 100, 2) } else { 0 }
    
    if ([math]::Abs($sizeChangePercent) -gt 50) {
        $diffs += @{
            type = "size_change"
            current = $currentSize
            previous = $previousSize
            difference = $sizeDiff
            change_percent = $sizeChangePercent
            severity = if ([math]::Abs($sizeChangePercent) -gt 100) { "high" } else { "medium" }
        }
    }
    
    # Compare individual files
    $currentFiles = $Current.files | Group-Object name -AsHashTable
    $previousFiles = $Previous.files | Group-Object name -AsHashTable
    
    foreach ($fileName in $currentFiles.Keys) {
        $currentFile = $currentFiles[$fileName]
        $previousFile = if ($previousFiles.ContainsKey($fileName)) { $previousFiles[$fileName] } else { $null }
        
        if ($null -eq $previousFile) {
            $diffs += @{
                type = "file_added"
                file_name = $fileName
                current_size = $currentFile.size_mb
                severity = "low"
            }
        } else {
            # Compare file sizes
            $sizeDiff = $currentFile.size_mb - $previousFile.size_mb
            $sizeChangePercent = if ($previousFile.size_mb -gt 0) { [math]::Round(($sizeDiff / $previousFile.size_mb) * 100, 2) } else { 0 }
            
            if ([math]::Abs($sizeChangePercent) -gt 20) {
                $diffs += @{
                    type = "file_size_change"
                    file_name = $fileName
                    current_size = $currentFile.size_mb
                    previous_size = $previousFile.size_mb
                    difference = $sizeDiff
                    change_percent = $sizeChangePercent
                    severity = if ([math]::Abs($sizeChangePercent) -gt 100) { "high" } else { "medium" }
                }
            }
            
            # Compare file hashes
            if ($currentFile.hash -ne $previousFile.hash) {
                $diffs += @{
                    type = "file_hash_change"
                    file_name = $fileName
                    current_hash = $currentFile.hash
                    previous_hash = $previousFile.hash
                    severity = "high"
                }
            }
        }
    }
    
    # Check for deleted files
    foreach ($fileName in $previousFiles.Keys) {
        if (-not $currentFiles.ContainsKey($fileName)) {
            $diffs += @{
                type = "file_deleted"
                file_name = $fileName
                previous_size = $previousFiles[$fileName].size_mb
                severity = "medium"
            }
        }
    }
    
    # Detect anomalies
    $highSeverityDiffs = $diffs | Where-Object { $_.severity -eq "high" }
    if ($highSeverityDiffs.Count -gt 0) {
        $anomalies += @{
            type = "high_severity_changes"
            count = $highSeverityDiffs.Count
            files = $highSeverityDiffs | ForEach-Object { $_.file_name }
        }
    }
    
    # Detect unexpected growth
    if ($sizeChangePercent -gt 200) {
        $anomalies += @{
            type = "unexpected_growth"
            growth_percent = $sizeChangePercent
            size_increase_mb = $sizeDiff
        }
    }
    
    # Detect file count anomalies
    if ([math]::Abs($fileCountDiff) -gt 10) {
        $anomalies += @{
            type = "file_count_anomaly"
            count_change = $fileCountDiff
            current_count = $currentFileCount
            previous_count = $previousFileCount
        }
    }
    
    return @{
        status = "comparison_complete"
        diffs = $diffs
        anomalies = $anomalies
        summary = @{
            total_diffs = $diffs.Count
            high_severity = ($diffs | Where-Object { $_.severity -eq "high" }).Count
            medium_severity = ($diffs | Where-Object { $_.severity -eq "medium" }).Count
            low_severity = ($diffs | Where-Object { $_.severity -eq "low" }).Count
            total_anomalies = $anomalies.Count
        }
    }
}

function Send-SnapshotDiffMetrics {
    param(
        [hashtable]$Comparison,
        [string]$Endpoint
    )
    
    try {
        foreach ($diff in $Comparison.diffs) {
            $body = @{
                name = 'spark_runner_snapshot_diffs_total'
                value = 1
                'label_diff_type' = $diff.type
                'label_severity' = $diff.severity
            }
            $bodyString = ($body.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
            Invoke-RestMethod -Uri "$Endpoint/api/metrics/counter?$bodyString" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        }
        
        Write-Host "✅ Snapshot diff metrics sent" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  Failed to send snapshot diff metrics: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Generate-AnomalyReport {
    param([hashtable]$Comparison)
    
    $report = @"
## Snapshot Diff Analysis Report
**Timestamp:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status:** $($Comparison.status)

### 📊 Summary
- **Total Diffs:** $($Comparison.summary.total_diffs)
- **High Severity:** $($Comparison.summary.high_severity)
- **Medium Severity:** $($Comparison.summary.medium_severity)
- **Low Severity:** $($Comparison.summary.low_severity)
- **Anomalies:** $($Comparison.summary.total_anomalies)

### 🔍 Detailed Changes
"@

    if ($Comparison.diffs.Count -gt 0) {
        foreach ($diff in $Comparison.diffs) {
            $severityIcon = switch ($diff.severity) {
                "high" { "HIGH" }
                "medium" { "MEDIUM" }
                "low" { "LOW" }
                default { "UNKNOWN" }
            }
            
            $report += "`n**$severityIcon $($diff.type)**"
            if ($diff.file_name) { $report += " - $($diff.file_name)" }
            if ($diff.difference) { $report += " - Change: $($diff.difference)" }
            if ($diff.change_percent) { $report += " ($($diff.change_percent) percent)" }
        }
    } else {
        $report += "`nNo significant changes detected."
    }

    if ($Comparison.anomalies.Count -gt 0) {
        $report += "`n`n### ⚠️ Anomalies Detected`n"
        foreach ($anomaly in $Comparison.anomalies) {
            $report += "- **$($anomaly.type):** $($anomaly | ConvertTo-Json -Compress)`n"
        }
    }

    return $report
}

# Main execution
Write-Host "## Snapshot Diffs Analysis - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Current manifest: $ManifestFile" -ForegroundColor Cyan
Write-Host "Previous manifest: $PreviousManifestFile" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

# Get current and previous manifests
$currentManifest = Get-CurrentManifest -ManifestPath $ManifestFile
$previousManifest = Get-CurrentManifest -ManifestPath $PreviousManifestFile

if ($null -eq $currentManifest) {
    Write-Host "❌ Current manifest not found or invalid" -ForegroundColor Red
    exit 1
}

# Compare manifests
$comparison = Compare-Manifests -Current $currentManifest -Previous $previousManifest

Write-Host "`nComparison Results:" -ForegroundColor Green
Write-Host "  Status: $($comparison.status)" -ForegroundColor White
Write-Host "  Total Diffs: $($comparison.summary.total_diffs)" -ForegroundColor White
Write-Host "  High Severity: $($comparison.summary.high_severity)" -ForegroundColor White
Write-Host "  Anomalies: $($comparison.summary.total_anomalies)" -ForegroundColor White

# Generate anomaly report
$anomalyReport = Generate-AnomalyReport -Comparison $comparison
Write-Host "`n$anomalyReport" -ForegroundColor White

# Send metrics if not dry run
if (-not $DryRun) {
    $metricsSent = Send-SnapshotDiffMetrics -Comparison $comparison -Endpoint $MetricsEndpoint
}

# Save current manifest as previous for next comparison
if (-not $DryRun) {
    try {
        Copy-Item $ManifestFile $PreviousManifestFile -Force
        Write-Host "✅ Current manifest saved as previous for next comparison" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Failed to save previous manifest: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Log snapshot diff event
$snapshotEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "snapshot_diff_analysis"
    comparison = $comparison
    metrics_sent = if ($DryRun) { $false } else { $metricsSent }
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $snapshotEvent

Write-Host "`n## Snapshot diffs analysis completed" -ForegroundColor Green
