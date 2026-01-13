# Spark Trading - Rollback Script
# Checkpoint'e geri dön
# Kullanım: .\tools\windows\rollback.ps1
#         .\tools\windows\rollback.ps1 -Tag "cp/2026-01-13_17-39-00"

# Encoding hardening: UTF-8 without BOM (PowerShell 5.1 compatible)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

param(
  [Parameter(Mandatory=$false)][string]$Tag = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

Write-Host "=== Spark Trading Rollback ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot" -ForegroundColor Gray

# Tag belirtilmemişse son cp tag'ini bul
if (-not $Tag) {
  Write-Host "`nFinding latest checkpoint tag..." -ForegroundColor Cyan
  $Tag = git describe --tags --match "cp/*" --abbrev=0 2>$null

  if (-not $Tag) {
    Write-Host "[ERROR] No checkpoint tags found!" -ForegroundColor Red
    Write-Host "Available tags:" -ForegroundColor Yellow
    git tag --list | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    exit 1
  }

  Write-Host "   Found: $Tag" -ForegroundColor Green
}

# Tag var mı kontrol et
$tagExists = git rev-parse --verify "$Tag^{tag}" 2>$null
if (-not $tagExists) {
  Write-Host "[ERROR] Tag not found: $Tag" -ForegroundColor Red
  Write-Host "Available checkpoint tags:" -ForegroundColor Yellow
  git tag --list "cp/*" | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
  exit 1
}

# Mevcut durumu göster
$currentHash = git rev-parse --short HEAD
$targetHash = git rev-parse --short $Tag
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "`nCurrent: $currentHash ($currentBranch)" -ForegroundColor Gray
Write-Host "Target:  $targetHash ($Tag)" -ForegroundColor Cyan

# Uncommitted değişiklik var mı kontrol et
$uncommitted = git status --porcelain
$hasUncommitted = $uncommitted -ne $null -and $uncommitted.Count -gt 0

# Kayıpsız rollback: stash + rescue branch
if ($hasUncommitted) {
  Write-Host "`n[INFO] Uncommitted changes detected - creating safety backup..." -ForegroundColor Yellow

  # Timestamp
  $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

  # Auto-stash (timestamp + branch adı ile)
  $stashMessage = "rollback-backup-$timestamp-$currentBranch"
  Write-Host "   Stashing changes as: $stashMessage" -ForegroundColor Gray
  git stash push -m $stashMessage 2>&1 | Out-Null

  if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Changes stashed safely" -ForegroundColor Green
  } else {
    Write-Host "   [WARN] Stash failed (non-blocking)" -ForegroundColor Yellow
  }

  # Rescue branch oluştur (son halinizi kurtar)
  $rescueBranch = "rescue/$timestamp"
  Write-Host "   Creating rescue branch: $rescueBranch" -ForegroundColor Gray
  git branch $rescueBranch HEAD 2>&1 | Out-Null

  if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Rescue branch created" -ForegroundColor Green
    Write-Host "`n[TIP] To recover stashed changes:" -ForegroundColor Cyan
    Write-Host "   git stash list" -ForegroundColor DarkGray
    Write-Host "   git stash apply stash@{0}" -ForegroundColor DarkGray
    Write-Host "`n[TIP] To recover rescue branch:" -ForegroundColor Cyan
    Write-Host "   git checkout $rescueBranch" -ForegroundColor DarkGray
  } else {
    Write-Host "   [WARN] Rescue branch creation failed (non-blocking)" -ForegroundColor Yellow
  }
}

# Onay iste (interactive)
if (-not $env:CI) {
  Write-Host "`n[WARN] This will reset your working directory to $Tag" -ForegroundColor Yellow
  if ($hasUncommitted) {
    Write-Host "   Uncommitted changes have been stashed and backed up." -ForegroundColor Green
  }
  $confirm = Read-Host "Continue? (y/N)"
  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Rollback cancelled." -ForegroundColor Gray
    if ($hasUncommitted) {
      Write-Host "[TIP] Your changes are safe in stash and rescue branch." -ForegroundColor Cyan
    }
    exit 0
  }
}

# Rollback
Write-Host "`nRolling back..." -ForegroundColor Cyan
git reset --hard $Tag

if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERROR] Rollback failed!" -ForegroundColor Red
  exit 1
}

Write-Host "[OK] Rollback complete" -ForegroundColor Green
Write-Host "   Now at: $Tag ($targetHash)" -ForegroundColor Cyan

# Değişiklikleri göster
Write-Host "`n[INFO] Status:" -ForegroundColor Cyan
git status --short

if ($hasUncommitted) {
  Write-Host "`n[INFO] Recovery Info:" -ForegroundColor Cyan
  Write-Host "   Stash: git stash list" -ForegroundColor DarkGray
  Write-Host "   Rescue branch: git checkout $rescueBranch" -ForegroundColor DarkGray
}

Write-Host "`n[TIP] To see what changed, run:" -ForegroundColor Gray
Write-Host "   git log $targetHash..$currentHash --oneline" -ForegroundColor DarkGray
