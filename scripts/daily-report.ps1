# Daily Report Generator - includes runner evidence
param(
    [string]$OutputDir = "evidence\reports",
    [switch]$IncludeRunnerEvidence = $true
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportDir = Join-Path $OutputDir "daily_$timestamp"
$zipFile = Join-Path $OutputDir "daily_report_$timestamp.zip"

# Create report directory
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

# 1. System Info
"# Daily Report - $timestamp" | Out-File "$reportDir\system_info.txt"
"Generated: $(Get-Date)" | Add-Content "$reportDir\system_info.txt"
"Node Version: $(node --version)" | Add-Content "$reportDir\system_info.txt"
"PNPM Version: $(pnpm --version)" | Add-Content "$reportDir\system_info.txt"

# 2. Project Status
"# Project Status" | Add-Content "$reportDir\system_info.txt"
"TypeScript Build: $(pnpm run build:types 2>&1 | Select-String 'error|success')" | Add-Content "$reportDir\system_info.txt"

# 3. Runner Evidence (if requested)
if ($IncludeRunnerEvidence -and (Test-Path "evidence\runner")) {
    "## Runner Evidence" | Add-Content "$reportDir\system_info.txt"
    
    # Copy runner evidence files
    Copy-Item "evidence\runner\*.jsonl" "$reportDir\" -ErrorAction SilentlyContinue
    Copy-Item "evidence\runner\*.txt" "$reportDir\" -ErrorAction SilentlyContinue
    
    # Summary
    $stallEvents = Get-Content "evidence\runner\stall-events.jsonl" -ErrorAction SilentlyContinue
    if ($stallEvents) {
        $stallCount = ($stallEvents | Where-Object { $_ -match '"event":"(idle-timeout|hard-timeout)"' }).Count
        "Runner Stalls Today: $stallCount" | Add-Content "$reportDir\system_info.txt"
    }
}

# 4. Logs Summary
if (Test-Path "logs") {
    "## Log Summary" | Add-Content "$reportDir\system_info.txt"
    Get-ChildItem "logs\*.log" -ErrorAction SilentlyContinue | ForEach-Object {
        $size = [math]::Round($_.Length / 1KB, 2)
        "$($_.Name): $size KB" | Add-Content "$reportDir\system_info.txt"
    }
}

# 5. Metrics Snapshot
try {
    $metrics = Invoke-RestMethod -Uri "http://127.0.0.1:4001/metrics" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $metrics | Out-File "$reportDir\metrics_snapshot.prom" -Encoding UTF8
    "Metrics snapshot captured" | Add-Content "$reportDir\system_info.txt"
} catch {
    "Metrics endpoint not available" | Add-Content "$reportDir\system_info.txt"
}

# 6. Create ZIP archive
try {
    Compress-Archive -Path "$reportDir\*" -DestinationPath $zipFile -Force
    "Report created: $zipFile" | Write-Host -ForegroundColor Green
    
    # Cleanup temp directory
    Remove-Item $reportDir -Recurse -Force
    
    return $zipFile
} catch {
    "Failed to create ZIP archive: $($_.Exception.Message)" | Write-Host -ForegroundColor Red
    return $reportDir
}
