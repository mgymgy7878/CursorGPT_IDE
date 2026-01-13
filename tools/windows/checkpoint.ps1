# Spark Trading - Checkpoint Script
# Her riskli UI değişikliğinden sonra checkpoint oluştur
# Kullanım: .\tools\windows\checkpoint.ps1 -Message "command palette portal fix"
# Otomatik UI-touch tespiti: UI dokunuşu varsa otomatik -VerifyUi eklenir

param(
  [Parameter(Mandatory=$false)][string]$Message = "checkpoint",
  [Parameter(Mandatory=$false)][switch]$Daily,
  [Parameter(Mandatory=$false)][switch]$VerifyUi,
  [Parameter(Mandatory=$false)][switch]$NoPushTags
)

$ErrorActionPreference = "Stop"

# Repo root: bu script -> tools/windows/ -> repo
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

Write-Host "=== Spark Trading Checkpoint ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot" -ForegroundColor Gray

# Değişiklik var mı?
$status = git status --porcelain
if (-not $status) {
  Write-Host "No changes. Checkpoint skipped." -ForegroundColor Yellow
  exit 0
}

Write-Host "`nChanges detected:" -ForegroundColor Green
git status --short | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

# Otomatik UI-touch tespiti
$uiTouchPatterns = @(
  "apps/web-next/src/**",
  "apps/web-next/app/**",
  "apps/web-next/components/**",
  "apps/web-next/tailwind.*",
  "apps/web-next/postcss.*",
  "apps/web-next/styles/**",
  "apps/web-next/tokens/**",
  "apps/web-next/tests/e2e/**",
  "**/*.css",
  "**/*.scss",
  "**/tailwind.config.*",
  "**/uiTokens.*"
)

$hasUiTouch = $false
# Hem staged hem unstaged değişiklikleri kontrol et
$changedFiles = @()
$changedFiles += git diff --name-only --cached 2>$null
$changedFiles += git diff --name-only HEAD 2>$null
$changedFiles = $changedFiles | Where-Object { $_ } | Select-Object -Unique

foreach ($file in $changedFiles) {
  # UI-touch pattern kontrolü
  $isUiFile = $false

  # Pattern matching
  foreach ($pattern in $uiTouchPatterns) {
    if ($file -like $pattern) {
      $isUiFile = $true
      break
    }
  }

  # Regex matching (daha esnek)
  if (-not $isUiFile) {
    if ($file -match "apps/web-next/(src|app|components|styles|tokens|tests/e2e)") {
      $isUiFile = $true
    }
    elseif ($file -match "\.(css|scss)$") {
      $isUiFile = $true
    }
    elseif ($file -match "(tailwind|postcss|uiTokens)") {
      $isUiFile = $true
    }
  }

  if ($isUiFile) {
    $hasUiTouch = $true
    break
  }
}

# UI dokunuşu varsa otomatik VerifyUi ekle
if ($hasUiTouch -and -not $VerifyUi) {
  Write-Host "`n🔍 UI-touch detected! Auto-enabling VerifyUi..." -ForegroundColor Yellow
  $VerifyUi = $true
}

# (Opsiyonel) hızlı UI doğrulama
if ($VerifyUi) {
  Write-Host "`nRunning UI guard checks..." -ForegroundColor Cyan
  try {
    Write-Host "  - Token lockdown check..." -ForegroundColor Gray
    pnpm check:ui-tokens 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  ⚠️  Token check failed (non-blocking)" -ForegroundColor Yellow
    } else {
      Write-Host "  ✅ Token check passed" -ForegroundColor Green
    }

    Write-Host "  - Visual smoke tests..." -ForegroundColor Gray
    pnpm ui:test:visual 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  ⚠️  Visual tests failed (non-blocking)" -ForegroundColor Yellow
    } else {
      Write-Host "  ✅ Visual tests passed" -ForegroundColor Green
    }
  } catch {
    Write-Host "  ⚠️  UI checks failed: $_ (non-blocking)" -ForegroundColor Yellow
  }
}

# Commit
Write-Host "`nCreating checkpoint..." -ForegroundColor Cyan
git add -A
$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$dateDir = Get-Date -Format "yyyy-MM-dd"

# Evidence dosyası yolu (commit mesajına eklenecek)
$eviDir = Join-Path $repoRoot "evidence\checkpoints\$dateDir"
New-Item -ItemType Directory -Force -Path $eviDir | Out-Null
$evidenceFile = Join-Path $eviDir "$ts.txt"
$evidenceRelativePath = "evidence/checkpoints/$dateDir/$ts.txt"

# Commit mesajı (evidence linki ile)
$commitMsg = "cp: $Message [$ts]`n`nEvidence: $evidenceRelativePath"
git commit -m $commitMsg | Out-Null

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Commit failed!" -ForegroundColor Red
  exit 1
}

# VerifyUi sonuçlarını topla
$verifyUiResult = "not-run"
if ($VerifyUi) {
  # Token check sonucu
  $tokenCheckPassed = $false
  try {
    pnpm check:ui-tokens 2>&1 | Out-Null
    $tokenCheckPassed = ($LASTEXITCODE -eq 0)
  } catch {
    $tokenCheckPassed = $false
  }

  # Visual test sonucu
  $visualTestPassed = $false
  try {
    pnpm ui:test:visual 2>&1 | Out-Null
    $visualTestPassed = ($LASTEXITCODE -eq 0)
  } catch {
    $visualTestPassed = $false
  }

  if ($tokenCheckPassed -and $visualTestPassed) {
    $verifyUiResult = "pass"
  } elseif ($tokenCheckPassed -or $visualTestPassed) {
    $verifyUiResult = "partial"
  } else {
    $verifyUiResult = "fail"
  }
}

# Evidence içeriği
$hash = git rev-parse HEAD
$shortHash = git rev-parse --short HEAD

$evidenceContent = @"
=== Spark Trading Checkpoint ===
time:      $ts
tag:       (will be created)
hash:      $hash ($shortHash)
msg:       $Message
daily:     $Daily
verify:    $VerifyUi
ui-touch:  $hasUiTouch
verify-result: $verifyUiResult

=== Git Status ===
$(git status)

=== Diff Stat ===
$(git diff --stat HEAD~1..HEAD)

=== Changed Files ===
$(git diff --name-only HEAD~1..HEAD | ForEach-Object { "  - $_" })

=== UI-Touch Detection ===
$(if ($hasUiTouch) { "UI-related files detected - VerifyUi auto-enabled" } else { "No UI-touch detected" })
"@

$evidenceContent | Out-File -Encoding utf8 $evidenceFile

# Annotated tag oluştur
$tagPrefix = $(if ($Daily) { "daily" } else { "cp" })
$tag = "$tagPrefix/$ts"

# Tag mesajı (annotated tag için)
$tagMessage = @"
Checkpoint: $Message

UI-touch detected: $hasUiTouch
VerifyUi enabled: $VerifyUi
VerifyUi result: $verifyUiResult
Daily checkpoint: $Daily

Evidence: $evidenceRelativePath
Hash: $hash ($shortHash)
Timestamp: $ts
"@

# Annotated tag oluştur
git tag -a $tag -m $tagMessage

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Tag failed!" -ForegroundColor Red
  exit 1
}

# Evidence dosyasını güncelle (tag bilgisi ile)
$evidenceContent = $evidenceContent -replace "tag:       \(will be created\)", "tag:       $tag"
$evidenceContent | Out-File -Encoding utf8 $evidenceFile

Write-Host "`n✅ Checkpoint OK" -ForegroundColor Green
Write-Host "   Tag:  $tag" -ForegroundColor Cyan
Write-Host "   Hash: $shortHash" -ForegroundColor Gray
Write-Host "   Evidence: $evidenceFile" -ForegroundColor Gray

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

# Son checkpoint'i göster
Write-Host "`n📋 Recent checkpoints:" -ForegroundColor Cyan
git tag --list "cp/*" --sort=-creatordate | Select-Object -First 5 | ForEach-Object {
  $tagHash = git rev-parse --short $_
  Write-Host "   $_ ($tagHash)" -ForegroundColor Gray
}

if ($Daily) {
  Write-Host "`n📅 Daily checkpoint created" -ForegroundColor Green
}

if ($hasUiTouch) {
  Write-Host "`n🎨 UI-touch checkpoint (VerifyUi enabled)" -ForegroundColor Green
}
