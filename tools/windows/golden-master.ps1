# Spark Trading - Golden Master Tag Script
# UI doğru haldeyken golden master tag'i oluştur
# Kullanım: .\tools\windows\golden-master.ps1 -Version "v1"
#         .\tools\windows\golden-master.ps1 -Version "v2" -VerifyUi

param(
  [Parameter(Mandatory=$true)][string]$Version,
  [Parameter(Mandatory=$false)][switch]$VerifyUi,
  [Parameter(Mandatory=$false)][switch]$NoPushTags
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

Write-Host "=== Spark Trading Golden Master ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot" -ForegroundColor Gray

# Değişiklik var mı kontrol et
$status = git status --porcelain
if ($status) {
  Write-Host "`n⚠️  Uncommitted changes detected!" -ForegroundColor Yellow
  Write-Host "   Golden master should be created on a clean state." -ForegroundColor Yellow
  $confirm = Read-Host "Continue anyway? (y/N)"
  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Golden master creation cancelled." -ForegroundColor Gray
    exit 0
  }
}

# UI doğrulama (opsiyonel)
if ($VerifyUi) {
  Write-Host "`nRunning UI guard checks..." -ForegroundColor Cyan
  try {
    Write-Host "  - Token lockdown check..." -ForegroundColor Gray
    pnpm check:ui-tokens 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  ⚠️  Token check failed" -ForegroundColor Yellow
    } else {
      Write-Host "  ✅ Token check passed" -ForegroundColor Green
    }

    Write-Host "  - Visual smoke tests..." -ForegroundColor Gray
    pnpm ui:test:visual 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  ⚠️  Visual tests failed" -ForegroundColor Yellow
    } else {
      Write-Host "  ✅ Visual tests passed" -ForegroundColor Green
    }
  } catch {
    Write-Host "  ⚠️  UI checks failed: $_" -ForegroundColor Yellow
  }
}

# Golden master tag oluştur
$tag = "ui/golden-master/$Version"
$currentHash = git rev-parse --short HEAD
$fullHash = git rev-parse HEAD

Write-Host "`nCreating golden master tag..." -ForegroundColor Cyan
Write-Host "   Tag: $tag" -ForegroundColor Gray
Write-Host "   Hash: $currentHash ($fullHash)" -ForegroundColor Gray

# Tag zaten var mı kontrol et
$tagExists = git rev-parse --verify "$tag^{tag}" 2>$null
if ($tagExists) {
  Write-Host "`n⚠️  Tag already exists: $tag" -ForegroundColor Yellow
  $confirm = Read-Host "Overwrite? (y/N)"
  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Golden master creation cancelled." -ForegroundColor Gray
    exit 0
  }
  git tag -d $tag | Out-Null
}

git tag $tag

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Tag creation failed!" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Golden master tag created" -ForegroundColor Green

# Tag'leri push et (varsayılan davranış)
if (-not $NoPushTags) {
  Write-Host "`n📤 Pushing tags to remote..." -ForegroundColor Cyan
  git push --tags 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Tags pushed successfully" -ForegroundColor Green
  } else {
    Write-Host "   ⚠️  Tag push failed (non-blocking)" -ForegroundColor Yellow
    Write-Host "   💡 Run manually: git push --tags" -ForegroundColor Gray
  }
} else {
  Write-Host "`n💡 Tags not pushed (use -NoPushTags to skip)" -ForegroundColor Gray
  Write-Host "   Remember to push: git push --tags" -ForegroundColor Yellow
}

# Evidence
$eviDir = Join-Path $repoRoot "evidence\golden-master"
New-Item -ItemType Directory -Force -Path $eviDir | Out-Null
$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

$evidenceContent = @"
=== Spark Trading Golden Master ===
time:      $ts
tag:       $tag
hash:      $fullHash ($currentHash)
version:   $Version
verify:    $VerifyUi

=== Git Status ===
$(git status)

=== Tag Info ===
$(git show $tag --no-patch --format=fuller)
"@

$evidenceFile = Join-Path $eviDir "$Version-$ts.txt"
$evidenceContent | Out-File -Encoding utf8 $evidenceFile

Write-Host "`n📋 Evidence saved: $evidenceFile" -ForegroundColor Gray

# Mevcut golden master tag'lerini göster
Write-Host "`n📋 Existing golden master tags:" -ForegroundColor Cyan
git tag --list "ui/golden-master/*" --sort=-creatordate | ForEach-Object {
  $tagHash = git rev-parse --short $_
  Write-Host "   $_ ($tagHash)" -ForegroundColor Gray
}

Write-Host "`n💡 To rollback to this golden master:" -ForegroundColor Gray
Write-Host "   .\tools\windows\rollback.ps1 -Tag `"$tag`"" -ForegroundColor DarkGray
Write-Host "`n💡 To create stable worktree:" -ForegroundColor Gray
Write-Host "   git worktree add ../spark-stable $tag" -ForegroundColor DarkGray
