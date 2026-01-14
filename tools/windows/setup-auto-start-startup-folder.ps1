# Spark Trading - Auto-Start Setup Script (Startup Folder Method)
# Creates a shortcut in Windows Startup folder (no admin required)
# Usage: powershell -ExecutionPolicy Bypass -File setup-auto-start-startup-folder.ps1

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptPath\..\.."
$watchdogScript = "$repoRoot\tools\windows\start-ui-watchdog.ps1"

Write-Host "[INFO] Setting up auto-start via Startup folder..." -ForegroundColor Cyan
Write-Host "[INFO] Repo root: $repoRoot" -ForegroundColor Gray
Write-Host "[INFO] Watchdog script: $watchdogScript" -ForegroundColor Gray
Write-Host ""

# Check if script exists
if (-not (Test-Path $watchdogScript)) {
    Write-Host "[ERROR] Watchdog script not found at: $watchdogScript" -ForegroundColor Red
    exit 1
}

# Get Startup folder path
$startupFolder = [System.Environment]::GetFolderPath("Startup")
Write-Host "[INFO] Startup folder: $startupFolder" -ForegroundColor Gray

# Convert repoRoot to string if it's a PathInfo object
$repoRootStr = if ($repoRoot -is [System.Management.Automation.PathInfo]) { $repoRoot.Path } else { $repoRoot.ToString() }

# Create shortcut
$shortcutPath = Join-Path $startupFolder "SparkTrading-UI-DevServer.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)

# Set shortcut properties
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$watchdogScript`""
$shortcut.WorkingDirectory = $repoRootStr
$shortcut.Description = "Spark Trading UI Dev Server - Auto-start on login"
$shortcut.WindowStyle = 1  # Normal window (1 = Normal, 7 = Minimized)

# Save shortcut
$shortcut.Save()

Write-Host "[OK] Shortcut created successfully!" -ForegroundColor Green
Write-Host "[INFO] Shortcut: $shortcutPath" -ForegroundColor Gray
Write-Host ""
Write-Host "The UI server will start automatically when you log in." -ForegroundColor Cyan
Write-Host ""
Write-Host "To test manually:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File tools\windows\start-ui-watchdog.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "To remove auto-start:" -ForegroundColor Cyan
Write-Host "  Remove-Item `"$shortcutPath`"" -ForegroundColor Gray
Write-Host ""
Write-Host "To check status:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File tools\windows\check-ui-status.ps1" -ForegroundColor Gray
