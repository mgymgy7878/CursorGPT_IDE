# PowerShell Log Rotation Script
# Spark Platform - Windows-compatible log rotation
# Usage: Run via Task Scheduler (daily at 03:00)

param(
    [Parameter()]
    [int]$MaxSizeMB = 100,
    
    [Parameter()]
    [int]$MaxFiles = 14,
    
    [Parameter()]
    [switch]$ZipOld = $true
)

$ErrorActionPreference = 'Continue'

Write-Host "🔄 Log Rotation Started" -ForegroundColor Cyan
Write-Host "Max Size: ${MaxSizeMB}MB | Max Files: $MaxFiles | Zip: $ZipOld" -ForegroundColor Yellow
Write-Host ""

$patterns = @(
    "C:\dev\.logs\*.log",
    "C:\dev\logs\*.log",
    "C:\dev\apps\web-next\logs\*.log",
    "C:\dev\evidence\daily\*.json"
)

$rotated = 0
$compressed = 0
$deleted = 0

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        # Check size
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        
        if ($sizeMB -gt $MaxSizeMB) {
            # Rotate file
            $newName = "$($file.BaseName)-$(Get-Date -Format 'yyyyMMdd')$($file.Extension)"
            $newPath = Join-Path $file.Directory $newName
            
            try {
                Move-Item -Path $file.FullName -Destination $newPath -Force
                Write-Host "✅ Rotated: $($file.Name) → $newName (${sizeMB}MB)" -ForegroundColor Green
                $rotated++
                
                # Compress if enabled
                if ($ZipOld) {
                    $zipPath = "$newPath.gz"
                    # Note: PowerShell doesn't have built-in gzip
                    # Use 7-Zip or compress module if available
                    # Compress-Archive -Path $newPath -DestinationPath $zipPath
                    # Remove-Item $newPath
                    # $compressed++
                }
            } catch {
                Write-Host "❌ Failed to rotate: $($file.Name)" -ForegroundColor Red
            }
        }
    }
    
    # Clean old files
    $dirPath = Split-Path -Parent $pattern
    $baseName = (Split-Path -Leaf $pattern).Replace("*", "")
    
    if (Test-Path $dirPath) {
        $oldFiles = Get-ChildItem -Path $dirPath -Filter "*$baseName*" -ErrorAction SilentlyContinue |
                    Sort-Object LastWriteTime -Descending |
                    Select-Object -Skip $MaxFiles
        
        foreach ($oldFile in $oldFiles) {
            try {
                Remove-Item -Path $oldFile.FullName -Force
                Write-Host "🗑️ Deleted old: $($oldFile.Name)" -ForegroundColor Gray
                $deleted++
            } catch {
                Write-Host "❌ Failed to delete: $($oldFile.Name)" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Rotated: $rotated files" -ForegroundColor Green
Write-Host "Compressed: $compressed files" -ForegroundColor Green
Write-Host "Deleted: $deleted files" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Log rotation completed" -ForegroundColor Green

# Return summary
return @{
    Rotated = $rotated
    Compressed = $compressed
    Deleted = $deleted
}

