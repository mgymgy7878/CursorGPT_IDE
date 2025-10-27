# Backup script for Spark Trading Platform configuration files
# Creates timestamped backup of critical config files

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Split-Path -Parent $PSScriptRoot) "backups\config-$timestamp"

Write-Host "[BACKUP] Creating backup directory: $backupDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Critical files to backup
$filesToBackup = @(
    "package.json",
    "pnpm-lock.yaml",
    ".vscode\settings.json",
    ".gitignore",
    ".github\workflows\ci.yml",
    "tools\dev-up.ps1",
    "tools\dev-down.ps1",
    "tools\rotate-logs.ps1",
    "tools\smoke.cjs",
    "tools\doctor.cjs",
    "apps\web-next\package.json",
    "apps\web-next\next.config.js",
    "apps\web-next\tsconfig.json",
    "services\executor\package.json",
    "services\executor\tsconfig.json",
    ".husky\pre-commit"
)

$backupCount = 0
foreach ($file in $filesToBackup) {
    $sourcePath = Join-Path (Split-Path -Parent $PSScriptRoot) $file
    
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $backupDir $file
        $destDir = Split-Path -Parent $destPath
        
        # Create subdirectory if needed
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $sourcePath $destPath -Force
        Write-Host "[BACKUP] OK - $file" -ForegroundColor Green
        $backupCount++
    } else {
        Write-Host "[BACKUP] SKIP - $file (not found)" -ForegroundColor Yellow
    }
}

# Create backup summary
$summaryPath = Join-Path $backupDir "BACKUP_INFO.txt"
@"
Spark Trading Platform Configuration Backup
============================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Node Version: $(node -v 2>$null)
PNPM Version: $(pnpm -v 2>$null)
Files Backed Up: $backupCount
Location: $backupDir

Recent Changes:
- Node 20 LTS engine requirements added
- Husky + lint-staged configured
- GitHub Actions CI workflow created
- Log rotation implemented
- pnpm overrides for security patches
- VSCode settings optimized

To restore:
1. Copy files from this backup to project root
2. Run: pnpm -w install
3. Run: pnpm run dev:verify
"@ | Set-Content $summaryPath

Write-Host "`n[BACKUP] Summary:" -ForegroundColor Cyan
Write-Host "  - Files backed up: $backupCount" -ForegroundColor White
Write-Host "  - Location: $backupDir" -ForegroundColor White
Write-Host "  - Info file: BACKUP_INFO.txt" -ForegroundColor White
Write-Host "[BACKUP] Complete!" -ForegroundColor Green

