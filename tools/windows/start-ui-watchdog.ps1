# Spark Trading - UI Dev Server Watchdog Script
# Starts UI dev server with logging and crash detection
# Usage: powershell -ExecutionPolicy Bypass -File start-ui-watchdog.ps1

$ErrorActionPreference = "Stop"

# Get script directory and repo root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptPath\..\.."
$logDir = "$repoRoot\evidence"
$logFile = "$logDir\ui_dev.log"

# Ensure log directory exists
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Rotate log if > 5MB
if (Test-Path $logFile) {
    $logSize = (Get-Item $logFile).Length
    $maxSize = 5MB
    if ($logSize -gt $maxSize) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $rotatedLog = "$logDir\ui_dev_$timestamp.log"
        Write-Host "[INFO] Rotating log ($([math]::Round($logSize / 1MB, 2)) MB > 5 MB)..." -ForegroundColor Yellow
        Move-Item -Path $logFile -Destination $rotatedLog -Force
        Write-Host "[INFO] Rotated to: $rotatedLog" -ForegroundColor Gray
    }
}

# Change to repo root
Set-Location $repoRoot

Write-Host "[INFO] Starting UI dev server watchdog..." -ForegroundColor Cyan
Write-Host "[INFO] Repo root: $repoRoot" -ForegroundColor Gray
Write-Host "[INFO] Log file: $logFile" -ForegroundColor Gray
Write-Host ""

# Check if port 3003 is already in use
$portCheck = netstat -ano | findstr ":3003"
if ($portCheck) {
    Write-Host "[WARN] Port 3003 is already in use. Checking process..." -ForegroundColor Yellow
    $pidMatch = $portCheck | Select-String -Pattern "LISTENING\s+(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    if ($pidMatch) {
        $process = Get-Process -Id $pidMatch -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "[INFO] Process already running: $($process.ProcessName) (PID: $pidMatch)" -ForegroundColor Green
            Write-Host "[INFO] Exiting watchdog (server already running)" -ForegroundColor Gray
            exit 0
        }
    }
}

# Find pnpm executable (prefer .cmd over .ps1 for Process.Start compatibility)
try {
    # Try to find pnpm.cmd first
    $pnpmCmd = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    if ($pnpmCmd) {
        $pnpmPath = $pnpmCmd.Source
        $useCmdWrapper = $true
    } else {
        # Fallback to pnpm (might be .ps1)
        $pnpmPath = (Get-Command pnpm -ErrorAction Stop).Source
        if ($pnpmPath -like "*.ps1") {
            # Try to find .cmd in same directory
            $pnpmDir = Split-Path -Parent $pnpmPath
            $pnpmCmdPath = Join-Path $pnpmDir "pnpm.cmd"
            if (Test-Path $pnpmCmdPath) {
                $pnpmPath = $pnpmCmdPath
                $useCmdWrapper = $true
            } else {
                # Use PowerShell wrapper for .ps1
                $useCmdWrapper = $false
                $pnpmPath = "powershell.exe"
                $pnpmArgs = "-NoProfile -ExecutionPolicy Bypass -Command `"& '$pnpmPath' --filter web-next dev -- --hostname localhost --port 3003`""
            }
        } else {
            $useCmdWrapper = $false
        }
    }
    Write-Host "[OK] Found pnpm: $pnpmPath" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] pnpm not found in PATH. Please install pnpm or add it to PATH." -ForegroundColor Red
    Write-Host "[ERROR] Error: $_" -ForegroundColor Red
    exit 1
}

# Start dev server with logging
Write-Host "[INFO] Starting dev server..." -ForegroundColor Cyan
Write-Host "[INFO] Command: pnpm --filter web-next dev -- --hostname localhost --port 3003" -ForegroundColor Gray
Write-Host ""

# Append timestamp to log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "`n=== UI Dev Server Start: $timestamp ===`n"

# Build command - use pnpm directly with proper argument separation
$pnpmCommand = "--filter web-next dev -- --hostname localhost --port 3003"

# Use direct execution with output redirection (simplest and most reliable)
try {
    Write-Host "[INFO] Executing: $pnpmPath $pnpmCommand" -ForegroundColor Gray
    Write-Host "[INFO] Working directory: $repoRoot" -ForegroundColor Gray
    Write-Host ""

    # Change to repo root
    Set-Location $repoRoot

    # Execute pnpm command - use package.json script as-is (already has -p 3003)
    # No additional parameters needed, package.json handles port
    $fullCmd = "`"$pnpmPath`" --filter web-next dev"

    Write-Host "[DEBUG] Executing: $fullCmd" -ForegroundColor Gray
    Write-Host "[INFO] Using package.json dev script (port 3003 already configured)" -ForegroundColor Gray
    Write-Host ""

    # Execute via cmd.exe with output redirection
    cmd.exe /c $fullCmd *>&1 | Tee-Object -FilePath $logFile -Append

    # Note: This will block until server stops (Ctrl+C)
    # Exit code will be from pnpm process
    exit $LASTEXITCODE
} catch {
    Write-Host "[ERROR] Failed to start dev server: $_" -ForegroundColor Red
    Add-Content -Path $logFile -Value "FATAL ERROR: $_"
    Write-Host "[ERROR] Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
