# Incident Scope Analysis Script
param(
    [int]$TailCount = 50
)

$ErrorActionPreference = "Continue"

Write-Host "## Incident Scope Analysis - Last $TailCount Events" -ForegroundColor Cyan

if (-not (Test-Path "evidence/runner/stall-events.jsonl")) {
    Write-Host "❌ No stall events found" -ForegroundColor Red
    exit 1
}

try {
    $events = Get-Content "evidence/runner/stall-events.jsonl" -Tail $TailCount
    
    # Environment breakdown
    Write-Host "`nEnvironment breakdown:" -ForegroundColor Green
    $environments = $events | Where-Object { $_ -match '"environment"' } | ForEach-Object {
        try {
            ($_ | ConvertFrom-Json).environment
        } catch {
            "unknown"
        }
    } | Group-Object | Sort-Object Count -Descending
    
    foreach ($env in $environments) {
        $percentage = [math]::Round(($env.Count / $events.Count) * 100, 1)
        Write-Host "  $($env.Name): $($env.Count) ($percentage%)" -ForegroundColor White
    }
    
    # Host breakdown
    Write-Host "`nHost breakdown:" -ForegroundColor Green
    $hosts = $events | Where-Object { $_ -match '"host"' } | ForEach-Object {
        try {
            ($_ | ConvertFrom-Json).host
        } catch {
            "unknown"
        }
    } | Group-Object | Sort-Object Count -Descending
    
    foreach ($hostItem in $hosts) {
        $percentage = [math]::Round(($hostItem.Count / $events.Count) * 100, 1)
        Write-Host "  $($hostItem.Name): $($hostItem.Count) ($percentage%)" -ForegroundColor White
    }
    
    # Command type breakdown
    Write-Host "`nCommand type breakdown:" -ForegroundColor Green
    $commandTypes = $events | Where-Object { $_ -match '"commandType"' } | ForEach-Object {
        try {
            ($_ | ConvertFrom-Json).commandType
        } catch {
            "unknown"
        }
    } | Group-Object | Sort-Object Count -Descending
    
    foreach ($cmdType in $commandTypes) {
        $percentage = [math]::Round(($cmdType.Count / $events.Count) * 100, 1)
        Write-Host "  $($cmdType.Name): $($cmdType.Count) ($percentage%)" -ForegroundColor White
    }
    
    Write-Host "`nTotal events analyzed: $($events.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Scope analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
