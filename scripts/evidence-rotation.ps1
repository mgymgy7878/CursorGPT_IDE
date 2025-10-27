# Evidence Rotation and Retention Management
param(
    [string]$EvidenceDir = "evidence/runner",
    [int]$RetentionDays = 14,
    [int]$MaxFileSizeMB = 50,
    [int]$MaxTotalSizeMB = 1000
)

$ErrorActionPreference = "Stop"

function Get-FileSizeMB {
    param([string]$Path)
    if (Test-Path $Path) {
        return [math]::Round((Get-Item $Path).Length / 1MB, 2)
    }
    return 0
}

function Rotate-EvidenceFile {
    param(
        [string]$FilePath,
        [string]$BackupDir
    )
    
    if (-not (Test-Path $FilePath)) { return }
    
    $fileName = Split-Path $FilePath -Leaf
    $timestamp = Get-Date -Format "yyyyMMdd"
    $backupPath = Join-Path $BackupDir "$fileName.$timestamp"
    
    try {
        Move-Item $FilePath $backupPath -Force
        Write-Host "Rotated: $FilePath → $backupPath" -ForegroundColor Green
    } catch {
        Write-Host "Rotation failed for $FilePath : $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Cleanup-OldFiles {
    param(
        [string]$Dir,
        [int]$Days
    )
    
    $cutoffDate = (Get-Date).AddDays(-$Days)
    
    Get-ChildItem $Dir -Recurse | Where-Object {
        $_.LastWriteTime -lt $cutoffDate -and 
        $_.Extension -eq ".jsonl" -and
        $_.Name -match "\.\d{8}$"
    } | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force
            Write-Host "Cleaned: $($_.Name)" -ForegroundColor Yellow
        } catch {
            Write-Host "Cleanup failed for $($_.Name) : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Create-Manifest {
    param(
        [string]$EvidenceDir,
        [string]$ManifestPath
    )
    
    $manifest = @{
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        files = @()
        total_size_mb = 0
        retention_days = $RetentionDays
    }
    
    Get-ChildItem $EvidenceDir -Recurse -File | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        $hash = if ($_.Length -gt 0) { (Get-FileHash $_.FullName -Algorithm SHA256).Hash } else { "empty" }
        
        $manifest.files += @{
            name = $_.Name
            path = $_.FullName
            size_mb = $sizeMB
            modified = $_.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
            hash = $hash
        }
        
        $manifest.total_size_mb += $sizeMB
    }
    
    $manifest | ConvertTo-Json -Depth 3 | Out-File $ManifestPath -Encoding UTF8
    Write-Host "Manifest created: $ManifestPath" -ForegroundColor Green
    Write-Host "Total size: $($manifest.total_size_mb) MB" -ForegroundColor Cyan
}

# Main execution
Write-Host "## Evidence Rotation - $(Get-Date)" -ForegroundColor Cyan

# Create backup directory
$backupDir = Join-Path $EvidenceDir "backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Rotate current evidence files
$jsonlFiles = Get-ChildItem $EvidenceDir -Filter "*.jsonl" | Where-Object { $_.Name -notmatch "\.\d{8}$" }
foreach ($file in $jsonlFiles) {
    $sizeMB = Get-FileSizeMB $file.FullName
    if ($sizeMB -gt $MaxFileSizeMB) {
        Write-Host "File $($file.Name) exceeds size limit ($sizeMB MB > $MaxFileSizeMB MB)" -ForegroundColor Yellow
        Rotate-EvidenceFile $file.FullName $backupDir
    }
}

# Check total directory size
$totalSizeMB = (Get-ChildItem $EvidenceDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
if ($totalSizeMB -gt $MaxTotalSizeMB) {
    Write-Host "Total directory size exceeds limit ($([math]::Round($totalSizeMB, 2)) MB > $MaxTotalSizeMB MB)" -ForegroundColor Yellow
    
    # Cleanup oldest files first
    $filesByAge = Get-ChildItem $EvidenceDir -Recurse -File | Sort-Object LastWriteTime
    foreach ($file in $filesByAge) {
        if ((Get-FileSizeMB $EvidenceDir) -le $MaxTotalSizeMB) { break }
        try {
            Remove-Item $file.FullName -Force
            Write-Host "Removed oversized file: $($file.Name)" -ForegroundColor Red
        } catch {
            Write-Host "Failed to remove $($file.Name) : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Cleanup old files
Cleanup-OldFiles $EvidenceDir $RetentionDays

# Create manifest
$manifestPath = Join-Path $EvidenceDir "daily_report_manifest.json"
Create-Manifest $EvidenceDir $manifestPath

Write-Host "## Evidence rotation completed" -ForegroundColor Green
