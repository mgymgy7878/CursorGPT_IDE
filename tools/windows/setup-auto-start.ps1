# Spark Trading - Auto-Start Setup Script (Improved)
# Creates a Windows Task Scheduler task to start UI dev server on system startup
# Uses PowerShell watchdog script with proper PATH resolution and logging
# Usage: powershell -ExecutionPolicy Bypass -File setup-auto-start.ps1

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptPath\..\.."

# Choose script: dev (HMR) or prod-like (stable)
$useProdLike = $false  # Set to $true for prod-like mode (more stable, no HMR)
if ($useProdLike) {
    $watchdogScript = "$repoRoot\tools\windows\start-ui-prod-watchdog.ps1"
    $mode = "prod-like"
} else {
    $watchdogScript = "$repoRoot\tools\windows\start-ui-watchdog.ps1"
    $mode = "dev"
}

Write-Host "[INFO] Setting up auto-start for Spark Trading UI server..." -ForegroundColor Cyan
Write-Host "[INFO] Mode: $mode" -ForegroundColor $(if ($useProdLike) { "Green" } else { "Yellow" })
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
# Use AtLogOn by default (more reliable, no admin required)
# AtLogOn doesn't require admin privileges and is more reliable for user tasks
$useAtLogOn = $true  # Default to AtLogOn (no admin required, more reliable)
if ($useAtLogOn) {
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $trigger.Delay = "PT10S"  # 10 second delay after login
    $principal = New-ScheduledTaskPrincipal `
        -UserId "$env:USERDOMAIN\$env:USERNAME" `
        -LogonType Interactive `
        -RunLevel Limited  # No admin required (Limited = LeastPrivilege)
} else {
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $trigger.Delay = "PT30S"  # 30 second delay
    $principal = New-ScheduledTaskPrincipal `
        -UserId "$env:USERDOMAIN\$env:USERNAME" `
        -LogonType Interactive `
        -RunLevel Highest
}

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
    Write-Host "[INFO] Trigger mode: $(if ($useAtLogOn) { 'AtLogOn (no admin required)' } else { 'AtStartup (admin may be required)' })" -ForegroundColor Gray
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
    Write-Host ""
    Write-Host "[INFO] If you got 'Access denied', try one of these:" -ForegroundColor Yellow
    Write-Host "  1. Run PowerShell as Administrator and use: tools\windows\setup-auto-start-admin.ps1" -ForegroundColor Gray
    Write-Host "  2. Edit this script and set `$useAtLogOn = `$true (no admin required)" -ForegroundColor Gray
    Write-Host "  3. Use AtLogOn + LeastPrivilege mode (edit script: set useAtLogOn = true)" -ForegroundColor Gray
    exit 1
}
