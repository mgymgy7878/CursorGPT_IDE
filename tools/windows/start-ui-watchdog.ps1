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

# Find pnpm executable
try {
    $pnpmPath = (Get-Command pnpm -ErrorAction Stop).Source
    Write-Host "[OK] Found pnpm: $pnpmPath" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] pnpm not found in PATH. Please install pnpm or add it to PATH." -ForegroundColor Red
    Write-Host "[ERROR] Error: $_" -ForegroundColor Red
    exit 1
}

# Start dev server with logging
Write-Host "[INFO] Starting dev server..." -ForegroundColor Cyan
Write-Host "[INFO] Command: pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003" -ForegroundColor Gray
Write-Host ""

# Append timestamp to log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "`n=== UI Dev Server Start: $timestamp ===`n"

# Start process with output redirection
$processStartInfo = New-Object System.Diagnostics.ProcessStartInfo
$processStartInfo.FileName = $pnpmPath
$processStartInfo.Arguments = "--filter web-next dev -- --hostname 127.0.0.1 --port 3003"
$processStartInfo.WorkingDirectory = $repoRoot
$processStartInfo.UseShellExecute = $false
$processStartInfo.RedirectStandardOutput = $true
$processStartInfo.RedirectStandardError = $true
$processStartInfo.CreateNoWindow = $false

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processStartInfo

# Redirect output to log file and console
$process.add_OutputDataReceived({
    param($sender, $e)
    if ($e.Data) {
        $line = $e.Data
        Add-Content -Path $logFile -Value $line
        Write-Host $line
    }
})

$process.add_ErrorDataReceived({
    param($sender, $e)
    if ($e.Data) {
        $line = $e.Data
        Add-Content -Path $logFile -Value "ERROR: $line"
        Write-Host "ERROR: $line" -ForegroundColor Red
    }
})

try {
    $process.Start() | Out-Null
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()
    
    Write-Host "[OK] Dev server started (PID: $($process.Id))" -ForegroundColor Green
    Write-Host "[INFO] Logging to: $logFile" -ForegroundColor Gray
    Write-Host "[INFO] Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    
    # Wait for process to exit
    $process.WaitForExit()
    
    $exitCode = $process.ExitCode
    Write-Host ""
    Write-Host "[WARN] Dev server exited with code: $exitCode" -ForegroundColor Yellow
    Write-Host "[INFO] Check log file for details: $logFile" -ForegroundColor Gray
    
    # Show last 20 lines of log on crash
    if ($exitCode -ne 0) {
        Write-Host ""
        Write-Host "=== Last 20 lines of log ===" -ForegroundColor Yellow
        Get-Content $logFile -Tail 20 | ForEach-Object { Write-Host $_ }
    }
    
    exit $exitCode
} catch {
    Write-Host "[ERROR] Failed to start dev server: $_" -ForegroundColor Red
    Add-Content -Path $logFile -Value "FATAL ERROR: $_"
    exit 1
}
