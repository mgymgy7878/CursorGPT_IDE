# Spark Trading - Stable Worktree Script
# Golden master'dan stable worktree oluştur
# Kullanım: .\tools\windows\stable-worktree.ps1
#         .\tools\windows\stable-worktree.ps1 -Tag "ui/golden-master/v1"
#         .\tools\windows\stable-worktree.ps1 -Remove

param(
  [Parameter(Mandatory=$false)][string]$Tag = "",
  [Parameter(Mandatory=$false)][switch]$Remove
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

Write-Host "=== Spark Trading Stable Worktree ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot" -ForegroundColor Gray

$worktreePath = Join-Path (Split-Path $repoRoot -Parent) "spark-stable"

# Worktree silme
if ($Remove) {
  Write-Host "`nRemoving stable worktree..." -ForegroundColor Cyan
  Write-Host "   Path: $worktreePath" -ForegroundColor Gray

  if (-not (Test-Path $worktreePath)) {
    Write-Host "⚠️  Worktree not found: $worktreePath" -ForegroundColor Yellow
    exit 0
  }

  git worktree remove $worktreePath 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Stable worktree removed" -ForegroundColor Green
  } else {
    Write-Host "❌ Failed to remove worktree" -ForegroundColor Red
    Write-Host "   Try manually: git worktree remove $worktreePath" -ForegroundColor Yellow
    exit 1
  }
  exit 0
}

# Tag belirtilmemişse son golden master tag'ini bul
if (-not $Tag) {
  Write-Host "`nFinding latest golden master tag..." -ForegroundColor Cyan
  $Tag = git describe --tags --match "ui/golden-master/*" --abbrev=0 2>$null

  if (-not $Tag) {
    Write-Host "❌ No golden master tags found!" -ForegroundColor Red
    Write-Host "Available tags:" -ForegroundColor Yellow
    git tag --list "ui/golden-master/*" | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host "`n💡 Create golden master first:" -ForegroundColor Gray
    Write-Host "   .\tools\windows\golden-master.ps1 -Version `"v1`"" -ForegroundColor DarkGray
    exit 1
  }

  Write-Host "   Found: $Tag" -ForegroundColor Green
}

# Tag var mı kontrol et
$tagExists = git rev-parse --verify "$Tag^{tag}" 2>$null
if (-not $tagExists) {
  Write-Host "❌ Tag not found: $Tag" -ForegroundColor Red
  Write-Host "Available golden master tags:" -ForegroundColor Yellow
  git tag --list "ui/golden-master/*" | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
  exit 1
}

# Worktree zaten var mı kontrol et
if (Test-Path $worktreePath) {
  Write-Host "`n⚠️  Worktree already exists: $worktreePath" -ForegroundColor Yellow
  $confirm = Read-Host "Remove and recreate? (y/N)"
  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Stable worktree creation cancelled." -ForegroundColor Gray
    exit 0
  }
  git worktree remove $worktreePath 2>&1 | Out-Null
}

# Worktree oluştur
Write-Host "`nCreating stable worktree..." -ForegroundColor Cyan
Write-Host "   Path: $worktreePath" -ForegroundColor Gray
Write-Host "   Tag:  $Tag" -ForegroundColor Gray

git worktree add $worktreePath $Tag 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Worktree creation failed!" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Stable worktree created" -ForegroundColor Green
Write-Host "`n📋 Worktree info:" -ForegroundColor Cyan
git worktree list | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

Write-Host "`n💡 Usage:" -ForegroundColor Gray
Write-Host "   cd $worktreePath" -ForegroundColor DarkGray
Write-Host "   # Stable version is now available at this path" -ForegroundColor DarkGray
Write-Host "`n💡 To remove:" -ForegroundColor Gray
Write-Host "   .\tools\windows\stable-worktree.ps1 -Remove" -ForegroundColor DarkGray
