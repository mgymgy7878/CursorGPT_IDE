# Spark Trading - UI Status Check Script
# Quick diagnostic: port check + log analysis
# Usage: powershell -ExecutionPolicy Bypass -File check-ui-status.ps1

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptPath\..\.."
$logFile = "$repoRoot\evidence\ui_dev.log"

Write-Host "=== Spark Trading UI Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check port 3003
Write-Host "[1] Checking port 3003..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":3003"
if ($portCheck) {
    Write-Host "[OK] Port 3003 is in use" -ForegroundColor Green
    $pidMatch = $portCheck | Select-String -Pattern "LISTENING\s+(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    if ($pidMatch) {
        $process = Get-Process -Id $pidMatch -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "     Process: $($process.ProcessName) (PID: $pidMatch)" -ForegroundColor Gray
            Write-Host "     Started: $($process.StartTime)" -ForegroundColor Gray
        } else {
            Write-Host "     [WARN] Process not found (may have exited)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "[INFO] UI should be accessible at: http://127.0.0.1:3003" -ForegroundColor Cyan
} else {
    Write-Host "[WARN] Port 3003 is NOT in use" -ForegroundColor Yellow
    Write-Host "     Server is not running (expected after reboot)" -ForegroundColor Gray
    Write-Host ""
}

# Check log file
Write-Host "[2] Checking log file..." -ForegroundColor Yellow
if (Test-Path $logFile) {
    Write-Host "[OK] Log file exists: $logFile" -ForegroundColor Green
    
    $logSize = (Get-Item $logFile).Length
    Write-Host "     Size: $([math]::Round($logSize / 1KB, 2)) KB" -ForegroundColor Gray
    
    $lastModified = (Get-Item $logFile).LastWriteTime
    Write-Host "     Last modified: $lastModified" -ForegroundColor Gray
    
    # Check for errors in last 50 lines
    Write-Host ""
    Write-Host "[3] Checking for errors in log..." -ForegroundColor Yellow
    $logContent = Get-Content $logFile -Tail 50 -ErrorAction SilentlyContinue
    $errors = $logContent | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED|crash|Crash|CRASH" -CaseSensitive:$false
    
    if ($errors) {
        Write-Host "[WARN] Found potential errors in log:" -ForegroundColor Yellow
        $errors | Select-Object -First 10 | ForEach-Object {
            Write-Host "     $_" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "[INFO] Full log: $logFile" -ForegroundColor Gray
    } else {
        Write-Host "[OK] No obvious errors in last 50 lines" -ForegroundColor Green
    }
    
    # Show last 10 lines
    Write-Host ""
    Write-Host "[4] Last 10 lines of log:" -ForegroundColor Yellow
    Get-Content $logFile -Tail 10 | ForEach-Object {
        Write-Host "     $_" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARN] Log file not found: $logFile" -ForegroundColor Yellow
    Write-Host "     Server may not have been started yet" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Quick Actions ===" -ForegroundColor Cyan
Write-Host "  Start dev server:  tools\windows\start-ui-watchdog.ps1" -ForegroundColor Gray
Write-Host "  Start prod-like:   tools\windows\start-ui-prod.cmd" -ForegroundColor Gray
Write-Host "  View full log:     type $logFile | more" -ForegroundColor Gray
Write-Host ""
