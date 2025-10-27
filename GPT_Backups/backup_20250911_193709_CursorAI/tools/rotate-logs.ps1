# Log rotation script for Spark Trading Platform
# Rotates log files when they exceed the size limit

$logDir = Join-Path (Join-Path $PSScriptRoot "..") "logs"
$sizeLimit = 10MB

Write-Host "[LOG-ROTATE] Checking log files in: $logDir" -ForegroundColor Cyan

if (Test-Path $logDir) {
    Get-ChildItem $logDir -Filter "*.txt" | ForEach-Object {
        if ($_.Length -gt $sizeLimit) {
            $backupPath = "$($_.FullName).$(Get-Date -Format 'yyyyMMdd-HHmmss').bak"
            
            Write-Host "[LOG-ROTATE] Rotating $($_.Name) ($('{0:N2}' -f ($_.Length / 1MB)) MB)" -ForegroundColor Yellow
            
            # Copy current log to backup
            Copy-Item $_.FullName $backupPath
            
            # Clear the original log file
            Clear-Content $_.FullName
            
            Write-Host "[LOG-ROTATE] OK - Rotated to: $(Split-Path $backupPath -Leaf)" -ForegroundColor Green
        } else {
            Write-Host "[LOG-ROTATE] OK - $($_.Name) ($('{0:N2}' -f ($_.Length / 1MB)) MB) - under limit" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "[LOG-ROTATE] Log directory not found: $logDir" -ForegroundColor Gray
}

Write-Host "[LOG-ROTATE] Rotation complete" -ForegroundColor Green
