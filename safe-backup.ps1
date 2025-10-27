Param(
  [string]$BackupRoot = "GPT_Backups",
  [switch]$SkipBuild,
  [int]$RetentionCount = 10,
  [string]$Tag = ""
)

$ErrorActionPreference = 'Stop'

Write-Host "Gvenli Yedekleme basliyor..."

try { if ($PSScriptRoot) { Set-Location $PSScriptRoot } } catch {}

if (-not $SkipBuild) {
  Write-Host "Derleme calistiriliyor (npm run build)..."
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Derleme basarisiz. Yedek alinmadi."
    exit 1
  }
  Write-Host "Derleme basarili."
} else {
  Write-Host "Derleme atlandi (SkipBuild)."
}

if (-not (Test-Path $BackupRoot)) { New-Item -ItemType Directory -Path $BackupRoot | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tagSuffix = if ([string]::IsNullOrWhiteSpace($Tag)) { "" } else { "_" + $Tag }
$backupDir = Join-Path $BackupRoot ("backup_" + $timestamp + $tagSuffix)
New-Item -ItemType Directory -Path $backupDir | Out-Null

Write-Host "Dosyalar kopyalaniyor -> $backupDir"

$source = (Get-Location).Path

# Plan ilerleme kaydi: docs/PLAN_PROGRESS.md
try {
  $planDir = Join-Path $source "docs"
  $planProgress = Join-Path $planDir "PLAN_PROGRESS.md"
  if (-not (Test-Path $planDir)) { New-Item -ItemType Directory -Path $planDir | Out-Null }
  if (-not (Test-Path $planProgress)) { "# Plan İlerleme Kaydı`r`n`r`n" | Out-File -FilePath $planProgress -Encoding utf8 }
  $buildState = if ($SkipBuild) { "skipped" } else { "success" }
  $commitNow = ''
  try { $commitNow = (git rev-parse --short HEAD) } catch {}
  $ts = Get-Date -Format "u"
  $gitSummary = ''
  try { $gitSummary = (git status --porcelain) } catch {}
  $lines = @()
  $lines += "## $ts"
  $lines += "- Build: $buildState"
  $lines += "- Commit: $commitNow"
  if (-not [string]::IsNullOrWhiteSpace($Tag)) { $lines += "- Tag: $Tag" }
  if ($gitSummary) {
    $lines += "- Changes:" 
    $lines += $gitSummary
  }
  $entry = ($lines -join "`r`n") + "`r`n`r`n"
  Add-Content -Path $planProgress -Value $entry -Encoding utf8
} catch {
  Write-Host "PLAN_PROGRESS guncelleme uyarisi: $($_.Exception.Message)"
}

$excludeDirs = @("node_modules", ".next", ".git", $BackupRoot)
$excludeFiles = @("*.log")

$robocopyArgs = @($source, $backupDir, '/MIR', '/R:1', '/W:1')
foreach ($d in $excludeDirs) { $robocopyArgs += @('/XD', (Join-Path $source $d)) }
foreach ($f in $excludeFiles) { $robocopyArgs += @('/XF', $f) }

$proc = Start-Process -FilePath robocopy -ArgumentList $robocopyArgs -NoNewWindow -PassThru -Wait
$rc = $proc.ExitCode
if ($rc -ge 8) {
  Write-Host "Yedekleme sirasinda kopyalama hatasi (robocopy code: $rc)."
  exit 2
}

$commit = ''
try { $commit = (git rev-parse HEAD) } catch {}
$meta = @(
  "backup_time=$((Get-Date).ToString('u'))",
  "git_commit=$commit",
  "source=$source",
  "tag=$Tag"
)
$meta | Out-File -FilePath (Join-Path $backupDir "backup_info.txt") -Encoding utf8

# Retention temizlik
try {
  $backups = Get-ChildItem -Path $BackupRoot -Directory | Where-Object { $_.Name -like 'backup_*' } | Sort-Object CreationTime -Descending
  if ($backups.Count -gt $RetentionCount) {
    $toDelete = $backups | Select-Object -Skip $RetentionCount
    foreach ($dir in $toDelete) {
      Write-Host "Eski yedek siliniyor: $($dir.FullName)"
      Remove-Item -Recurse -Force -Path $dir.FullName -ErrorAction SilentlyContinue
    }
  }
} catch {
  Write-Host "Retention temizliginde uyari: $($_.Exception.Message)"
}

Write-Host "Yedekleme tamamlandi: $backupDir"
exit 0 