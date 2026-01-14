# Spark Trading - Auto-Start Setup Script
# Creates a Windows Task Scheduler task to start UI dev server on system startup
# Usage: powershell -ExecutionPolicy Bypass -File setup-auto-start.ps1

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptPath\..\.."
$cmdPath = "$repoRoot\tools\windows\start-ui.cmd"

Write-Host "[INFO] Setting up auto-start for Spark Trading UI dev server..." -ForegroundColor Cyan
Write-Host "[INFO] Repo root: $repoRoot" -ForegroundColor Gray
Write-Host "[INFO] Script path: $cmdPath" -ForegroundColor Gray
Write-Host ""

# Check if script exists
if (-not (Test-Path $cmdPath)) {
    Write-Host "[ERROR] start-ui.cmd not found at: $cmdPath" -ForegroundColor Red
    exit 1
}

# Task name
$taskName = "SparkTrading-UI-DevServer"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "[WARN] Task '$taskName' already exists. Removing..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create task action
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$cmdPath`"" -WorkingDirectory $repoRoot

# Create trigger (at startup)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Create principal (run as current user)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

# Create settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

# Register task
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Starts Spark Trading UI dev server on system startup"
    Write-Host "[OK] Task '$taskName' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify:" -ForegroundColor Cyan
    Write-Host "  Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To remove:" -ForegroundColor Cyan
    Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to create task: $_" -ForegroundColor Red
    exit 1
}
