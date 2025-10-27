# Kalıcı Bakım Otomasyonları (Cron)
param(
    [string]$ScheduleType = "hourly",
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Run-HourlyMaintenance {
    Write-Host "## Hourly Maintenance - $(Get-Date)" -ForegroundColor Cyan
    
    # Self-check heartbeat
    Write-Host "Running self-check heartbeat..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "self:check" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Self-check heartbeat completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Self-check heartbeat completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Self-check heartbeat failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Evidence writing verification
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $eventCount = (Get-Content "evidence/runner/stall-events.jsonl" | Measure-Object).Count
        Write-Host "Evidence events count: $eventCount" -ForegroundColor Gray
    }
}

function Run-DailyMaintenance {
    Write-Host "## Daily Maintenance - $(Get-Date)" -ForegroundColor Cyan
    
    # Daily report generation
    Write-Host "Running daily report..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "report:daily" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Daily report completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Daily report completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Daily report failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Snapshot diffs analysis
    Write-Host "Running snapshot diffs analysis..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "snapshot:diffs" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Snapshot diffs analysis completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Snapshot diffs analysis completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Snapshot diffs analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Run-WeeklyMaintenance {
    Write-Host "## Weekly Maintenance - $(Get-Date)" -ForegroundColor Cyan
    
    # Neural feedback loop analysis
    Write-Host "Running neural feedback loop..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "neural:feedback" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Neural feedback loop completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Neural feedback loop completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Neural feedback loop failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Cognitive memory analysis
    Write-Host "Running cognitive memory analysis..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "memory:analyze" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Cognitive memory analysis completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Cognitive memory analysis completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Cognitive memory analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Confidence review
    Write-Host "Running confidence review..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "automation:suggest" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Confidence review completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Confidence review completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Confidence review failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Run-MonthlyMaintenance {
    Write-Host "## Monthly Maintenance - $(Get-Date)" -ForegroundColor Cyan
    
    # Deep chaos testing
    Write-Host "Running deep chaos testing..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "chaos:test" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deep chaos testing completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Deep chaos testing completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Deep chaos testing failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Threshold calibration report
    Write-Host "Running threshold calibration report..." -ForegroundColor Yellow
    try {
        $result = & "pnpm" "run" "thresholds:adaptive" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Threshold calibration report completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Threshold calibration report completed with warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Threshold calibration report failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Generate-CronScripts {
    # Hourly cron script
    $hourlyCron = @"
# Hourly Runner Watchdog Maintenance
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

cd C:\dev\CursorGPT_IDE\CursorGPT_IDE
powershell -ExecutionPolicy Bypass -File scripts/maintenance-automation.ps1 -ScheduleType hourly
"@

    # Daily cron script
    $dailyCron = @"
# Daily Runner Watchdog Maintenance
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

cd C:\dev\CursorGPT_IDE\CursorGPT_IDE
powershell -ExecutionPolicy Bypass -File scripts/maintenance-automation.ps1 -ScheduleType daily
"@

    # Weekly cron script
    $weeklyCron = @"
# Weekly Runner Watchdog Maintenance
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

cd C:\dev\CursorGPT_IDE\CursorGPT_IDE
powershell -ExecutionPolicy Bypass -File scripts/maintenance-automation.ps1 -ScheduleType weekly
"@

    # Monthly cron script
    $monthlyCron = @"
# Monthly Runner Watchdog Maintenance
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

cd C:\dev\CursorGPT_IDE\CursorGPT_IDE
powershell -ExecutionPolicy Bypass -File scripts/maintenance-automation.ps1 -ScheduleType monthly
"@

    return @{
        hourly = $hourlyCron
        daily = $dailyCron
        weekly = $weeklyCron
        monthly = $monthlyCron
    }
}

# Main execution
Write-Host "## Kalıcı Bakım Otomasyonları - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Schedule Type: $ScheduleType" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

switch ($ScheduleType) {
    "hourly" {
        Run-HourlyMaintenance
    }
    "daily" {
        Run-DailyMaintenance
    }
    "weekly" {
        Run-WeeklyMaintenance
    }
    "monthly" {
        Run-MonthlyMaintenance
    }
    default {
        Write-Host "❌ Invalid schedule type: $ScheduleType" -ForegroundColor Red
        exit 1
    }
}

# Generate cron scripts if not dry run
if (-not $DryRun) {
    $cronScripts = Generate-CronScripts
    
    # Save cron scripts
    $cronScripts.hourly | Out-File "scripts/cron-hourly.ps1" -Encoding UTF8
    $cronScripts.daily | Out-File "scripts/cron-daily.ps1" -Encoding UTF8
    $cronScripts.weekly | Out-File "scripts/cron-weekly.ps1" -Encoding UTF8
    $cronScripts.monthly | Out-File "scripts/cron-monthly.ps1" -Encoding UTF8
    
    Write-Host "`nCron scripts generated:" -ForegroundColor Green
    Write-Host "  - scripts/cron-hourly.ps1" -ForegroundColor White
    Write-Host "  - scripts/cron-daily.ps1" -ForegroundColor White
    Write-Host "  - scripts/cron-weekly.ps1" -ForegroundColor White
    Write-Host "  - scripts/cron-monthly.ps1" -ForegroundColor White
}

# Log maintenance event
$maintenanceEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "maintenance_automation"
    schedule_type = $ScheduleType
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $maintenanceEvent

Write-Host "`n## Maintenance automation completed" -ForegroundColor Green
