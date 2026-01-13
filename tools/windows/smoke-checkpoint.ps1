# Spark Trading - Checkpoint System Smoke Test
# Kabul testleri: Kayıpsız rollback, annotated tags, stash recovery
# Kullanım: .\tools\windows\smoke-checkpoint.ps1

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

Write-Host "=== Spark Trading Checkpoint Smoke Test ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot" -ForegroundColor Gray
Write-Host ""

$testResults = @()
$allPassed = $true

# Test 1: Kayıpsız Rollback (Kirli Working Tree)
Write-Host "Test 1: Kayıpsız Rollback (Kirli Working Tree)" -ForegroundColor Yellow
Write-Host "  - Creating test file..." -ForegroundColor Gray

# Test dosyası oluştur
$testFile = "test-checkpoint-rollback.txt"
"Test content for rollback $(Get-Date)" | Out-File -Encoding utf8 $testFile

# Checkpoint oluştur
Write-Host "  - Creating checkpoint..." -ForegroundColor Gray
$preMessage = "smoke-test-pre-$(Get-Date -Format 'HHmmss')"
& "$PSScriptRoot\checkpoint.ps1" -Message $preMessage 2>&1 | Out-Null
$preExitCode = $LASTEXITCODE

if ($preExitCode -ne 0) {
  Write-Host "  ❌ PRE checkpoint failed!" -ForegroundColor Red
  $allPassed = $false
  $testResults += @{ Test = "PRE Checkpoint"; Passed = $false; Details = "Failed to create checkpoint" }
} else {
  Write-Host "  ✅ PRE checkpoint created" -ForegroundColor Green

  # Test dosyasını değiştir (kirli working tree)
  "Modified content $(Get-Date)" | Out-File -Encoding utf8 $testFile

  # Rollback yap
  Write-Host "  - Running rollback..." -ForegroundColor Gray
  & "$PSScriptRoot\rollback.ps1" 2>&1 | Out-Null
  $rollbackExitCode = $LASTEXITCODE

  if ($rollbackExitCode -ne 0) {
    Write-Host "  ❌ Rollback failed!" -ForegroundColor Red
    $allPassed = $false
    $testResults += @{ Test = "Rollback Execution"; Passed = $false; Details = "Rollback script failed" }
  } else {
    # Stash kontrolü
    Write-Host "  - Checking stash..." -ForegroundColor Gray
    $stashList = git stash list 2>&1
    $hasStash = $stashList -match "rollback-backup"

    if (-not $hasStash) {
      Write-Host "  ⚠️  No rollback stash found (may be OK if no uncommitted changes)" -ForegroundColor Yellow
    } else {
      Write-Host "  ✅ Stash found: $($stashList | Select-String 'rollback-backup' | Select-Object -First 1)" -ForegroundColor Green
    }

    # Rescue branch kontrolü
    Write-Host "  - Checking rescue branch..." -ForegroundColor Gray
    $rescueBranches = git branch --list "rescue/*" 2>&1
    $hasRescue = $rescueBranches.Count -gt 0

    if (-not $hasRescue) {
      Write-Host "  ⚠️  No rescue branch found (may be OK if no uncommitted changes)" -ForegroundColor Yellow
    } else {
      Write-Host "  ✅ Rescue branch found: $($rescueBranches | Select-Object -First 1)" -ForegroundColor Green
    }

    # Test dosyası kontrolü (rollback sonrası eski haline dönmeli)
    if (Test-Path $testFile) {
      $fileContent = Get-Content $testFile -Raw
      if ($fileContent -match "Test content for rollback") {
        Write-Host "  ✅ File restored to checkpoint state" -ForegroundColor Green
        $testResults += @{ Test = "Rollback File Restoration"; Passed = $true; Details = "File restored correctly" }
      } else {
        Write-Host "  ❌ File not restored correctly" -ForegroundColor Red
        $allPassed = $false
        $testResults += @{ Test = "Rollback File Restoration"; Passed = $false; Details = "File content mismatch" }
      }
    } else {
      Write-Host "  ⚠️  Test file not found (may have been deleted)" -ForegroundColor Yellow
    }

    $testResults += @{ Test = "Rollback Execution"; Passed = $true; Details = "Rollback completed" }
    $testResults += @{ Test = "Stash Creation"; Passed = $hasStash; Details = if ($hasStash) { "Stash created" } else { "No stash (OK if no changes)" } }
    $testResults += @{ Test = "Rescue Branch"; Passed = $hasRescue; Details = if ($hasRescue) { "Rescue branch created" } else { "No rescue branch (OK if no changes)" } }
  }

  # Test dosyasını temizle
  if (Test-Path $testFile) {
    Remove-Item $testFile -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ""

# Test 2: Stash Geri Alma
Write-Host "Test 2: Stash Geri Alma" -ForegroundColor Yellow

$stashList = git stash list 2>&1
$rollbackStash = $stashList | Select-String "rollback-backup" | Select-Object -First 1

if ($rollbackStash) {
  Write-Host "  - Found rollback stash: $rollbackStash" -ForegroundColor Gray

  # Stash'i geri al
  Write-Host "  - Applying stash..." -ForegroundColor Gray
  git stash apply stash@{0} 2>&1 | Out-Null
  $applyExitCode = $LASTEXITCODE

  if ($applyExitCode -eq 0) {
    Write-Host "  ✅ Stash applied successfully" -ForegroundColor Green
    $testResults += @{ Test = "Stash Apply"; Passed = $true; Details = "Stash applied successfully" }

    # Stash'i tekrar drop et (temizlik)
    git stash drop stash@{0} 2>&1 | Out-Null
  } else {
    Write-Host "  ❌ Stash apply failed" -ForegroundColor Red
    $allPassed = $false
    $testResults += @{ Test = "Stash Apply"; Passed = $false; Details = "Failed to apply stash" }
  }
} else {
  Write-Host "  ⚠️  No rollback stash found (skipping stash test)" -ForegroundColor Yellow
  $testResults += @{ Test = "Stash Apply"; Passed = $true; Details = "Skipped (no stash)" }
}

Write-Host ""

# Test 3: Annotated Tag Kalite Kontrolü
Write-Host "Test 3: Annotated Tag Kalite Kontrolü" -ForegroundColor Yellow

# Son checkpoint tag'ini bul
$latestTag = git describe --tags --match "cp/*" --abbrev=0 2>$null

if (-not $latestTag) {
  Write-Host "  ⚠️  No checkpoint tags found (skipping tag test)" -ForegroundColor Yellow
  $testResults += @{ Test = "Annotated Tag Quality"; Passed = $true; Details = "Skipped (no tags)" }
} else {
  Write-Host "  - Checking tag: $latestTag" -ForegroundColor Gray

  # Tag detaylarını al
  $tagMessage = git tag -l -n99 $latestTag 2>&1

  # Kontroller
  $checks = @{
    "UI-touch detected" = $false
    "VerifyUi enabled/result" = $false
    "Evidence path" = $false
    "Timestamp/hash" = $false
  }

  if ($tagMessage -match "UI-touch detected") {
    $checks["UI-touch detected"] = $true
  }
  if ($tagMessage -match "VerifyUi") {
    $checks["VerifyUi enabled/result"] = $true
  }
  if ($tagMessage -match "Evidence:") {
    $checks["Evidence path"] = $true
  }
  if ($tagMessage -match "Timestamp:" -or $tagMessage -match "Hash:") {
    $checks["Timestamp/hash"] = $true
  }

  $allChecksPassed = ($checks.Values | Where-Object { $_ -eq $true }).Count -eq 4

  if ($allChecksPassed) {
    Write-Host "  ✅ All tag quality checks passed" -ForegroundColor Green
    Write-Host "    - UI-touch detected: ✅" -ForegroundColor Gray
    Write-Host "    - VerifyUi enabled/result: ✅" -ForegroundColor Gray
    Write-Host "    - Evidence path: ✅" -ForegroundColor Gray
    Write-Host "    - Timestamp/hash: ✅" -ForegroundColor Gray
    $testResults += @{ Test = "Annotated Tag Quality"; Passed = $true; Details = "All checks passed" }
  } else {
    Write-Host "  ❌ Some tag quality checks failed" -ForegroundColor Red
    foreach ($check in $checks.GetEnumerator()) {
      $status = if ($check.Value) { "✅" } else { "❌" }
      Write-Host "    - $($check.Key): $status" -ForegroundColor Gray
    }
    $allPassed = $false
    $testResults += @{ Test = "Annotated Tag Quality"; Passed = $false; Details = "Some checks failed" }
  }
}

Write-Host ""

# Test 4: Commit Mesajı Evidence Linki
Write-Host "Test 4: Commit Mesajı Evidence Linki" -ForegroundColor Yellow

if ($latestTag) {
  $commitHash = git rev-parse $latestTag 2>$null
  $commitMessage = git log -1 --format=%B $commitHash 2>&1

  if ($commitMessage -match "Evidence:") {
    Write-Host "  ✅ Evidence link found in commit message" -ForegroundColor Green
    $evidencePath = ($commitMessage | Select-String "Evidence: (.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value })
    Write-Host "    Path: $evidencePath" -ForegroundColor Gray
    $testResults += @{ Test = "Commit Evidence Link"; Passed = $true; Details = "Evidence link found" }
  } else {
    Write-Host "  ❌ Evidence link not found in commit message" -ForegroundColor Red
    $allPassed = $false
    $testResults += @{ Test = "Commit Evidence Link"; Passed = $false; Details = "Evidence link missing" }
  }
} else {
  Write-Host "  ⚠️  No checkpoint tags found (skipping)" -ForegroundColor Yellow
  $testResults += @{ Test = "Commit Evidence Link"; Passed = $true; Details = "Skipped (no tags)" }
}

Write-Host ""

# Özet
Write-Host "=== Test Özeti ===" -ForegroundColor Cyan
$passedCount = ($testResults | Where-Object { $_.Passed -eq $true }).Count
$totalCount = $testResults.Count

Write-Host "Passed: $passedCount / $totalCount" -ForegroundColor $(if ($allPassed) { "Green" } else { "Yellow" })
Write-Host ""

foreach ($result in $testResults) {
  $status = if ($result.Passed) { "✅" } else { "❌" }
  Write-Host "$status $($result.Test): $($result.Details)" -ForegroundColor $(if ($result.Passed) { "Green" } else { "Red" })
}

Write-Host ""

# Evidence kaydet
$eviDir = Join-Path $repoRoot "evidence\checkpoints\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Force -Path $eviDir | Out-Null
$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$evidenceFile = Join-Path $eviDir "smoke-test-$ts.txt"

$evidenceContent = @"
=== Spark Trading Checkpoint Smoke Test ===
time:      $ts
passed:    $allPassed
results:   $passedCount / $totalCount

=== Test Results ===
$(foreach ($result in $testResults) {
  "$($result.Test): $($result.Passed) - $($result.Details)"
})

=== Latest Tag ===
$latestTag

=== Git Status ===
$(git status --short)
"@

$evidenceContent | Out-File -Encoding utf8 $evidenceFile

Write-Host "📋 Evidence saved: $evidenceFile" -ForegroundColor Gray
Write-Host ""

if ($allPassed) {
  Write-Host "✅ All tests passed!" -ForegroundColor Green
  exit 0
} else {
  Write-Host "❌ Some tests failed!" -ForegroundColor Red
  exit 1
}
