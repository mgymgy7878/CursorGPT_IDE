# Spark Trading - Auto-Start Setup Script (Improved)
# Creates a Windows Task Scheduler task to start UI dev server on system startup
# Uses PowerShell watchdog script with proper PATH resolution and logging
# Usage: powershell -ExecutionPolicy Bypass -File setup-auto-start.ps1

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptPath\..\.."
$watchdogScript = "$repoRoot\tools\windows\start-ui-watchdog.ps1"

Write-Host "[INFO] Setting up auto-start for Spark Trading UI dev server..." -ForegroundColor Cyan
Write-Host "[INFO] Repo root: $repoRoot" -ForegroundColor Gray
Write-Host "[INFO] Watchdog script: $watchdogScript" -ForegroundColor Gray
Write-Host ""

# Check if script exists
if (-not (Test-Path $watchdogScript)) {
    Write-Host "[ERROR] start-ui-watchdog.ps1 not found at: $watchdogScript" -ForegroundColor Red
    exit 1
}

# Verify pnpm is available
try {
    $pnpmPath = (Get-Command pnpm -ErrorAction Stop).Source
    Write-Host "[OK] pnpm found: $pnpmPath" -ForegroundColor Green
} catch {
    Write-Host "[WARN] pnpm not found in PATH. Task will use PATH from user context." -ForegroundColor Yellow
    Write-Host "[WARN] Make sure pnpm is installed and available at login time." -ForegroundColor Yellow
}

# Task name
$taskName = "SparkTrading-UI-DevServer"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "[WARN] Task '$taskName' already exists. Removing..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create task action (PowerShell with watchdog script)
# Use -NoProfile for faster startup, -ExecutionPolicy Bypass for script execution
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$watchdogScript`"" `
    -WorkingDirectory $repoRoot

# Create trigger (at startup, with delay to allow system to stabilize)
$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = "PT30S"  # 30 second delay

# Create principal (run as current user, highest privileges)
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Highest

# Create settings (allow start on battery, restart on failure)
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)  # No time limit

# Register task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Starts Spark Trading UI dev server on system startup with logging and crash detection"
    
    Write-Host "[OK] Task '$taskName' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name: $taskName" -ForegroundColor Gray
    Write-Host "  Trigger: At startup (30s delay)" -ForegroundColor Gray
    Write-Host "  Script: $watchdogScript" -ForegroundColor Gray
    Write-Host "  Log: $repoRoot\evidence\ui_dev.log" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To verify:" -ForegroundColor Cyan
    Write-Host "  Get-ScheduledTask -TaskName '$taskName' | Format-List" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To test manually:" -ForegroundColor Cyan
    Write-Host "  Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To remove:" -ForegroundColor Cyan
    Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To check status:" -ForegroundColor Cyan
    Write-Host "  powershell -ExecutionPolicy Bypass -File tools\windows\check-ui-status.ps1" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to create task: $_" -ForegroundColor Red
    exit 1
}
