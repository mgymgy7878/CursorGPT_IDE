# Incident Analysis Script
param(
    [int]$TailCount = 20
)

$ErrorActionPreference = "Continue"

Write-Host "## Root-Cause Analysis - Last $TailCount Events" -ForegroundColor Cyan

if (-not (Test-Path "evidence/runner/stall-events.jsonl")) {
    Write-Host "❌ No stall events found" -ForegroundColor Red
    exit 1
}

try {
    $events = Get-Content "evidence/runner/stall-events.jsonl" -Tail $TailCount | Where-Object { $_ -match '"rootCause"' }
    
    if ($events.Count -eq 0) {
        Write-Host "⚠️  No events with root-cause classification found" -ForegroundColor Yellow
        exit 0
    }
    
    $rootCauses = $events | ForEach-Object {
        try {
            ($_ | ConvertFrom-Json).rootCause
        } catch {
            "unknown"
        }
    } | Group-Object | Sort-Object Count -Descending
    
    Write-Host "Root-cause distribution:" -ForegroundColor Green
    foreach ($rc in $rootCauses) {
        $percentage = [math]::Round(($rc.Count / $events.Count) * 100, 1)
        Write-Host "  $($rc.Name): $($rc.Count) ($percentage%)" -ForegroundColor White
    }
    
    Write-Host "`nTotal events analyzed: $($events.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
