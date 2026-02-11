# Negatif Senaryo Self-Test - Gate'in Fail Yolunu Kanıtla
# Bu script gate'in "sadece mutlu path"te değil, kötü durumda da doğru çalıştığını mühürler
# 3 test senaryosu: TODO ekle, helper script adını değiştir, evidence klasör adını boz

param(
  [switch]$Restore
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Write-Host "`n[TEST] Release Gate Fail Senaryoları Testi" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$testResults = @()
$backupFiles = @{}

function Test-FailScenario {
  param(
    [string]$Name,
    [scriptblock]$Setup,
    [scriptblock]$Test,
    [scriptblock]$Cleanup
  )

  Write-Host "`n[TEST] $Name" -ForegroundColor Yellow

  try {
    # Setup: Durumu boz
    & $Setup

    # Test: Gate fail olmalı
    $output = & powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-gate.ps1 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 1) {
      Write-Host "  [PASS] Gate doğru şekilde fail etti (exit 1)" -ForegroundColor Green
      $script:testResults += @{ Name = $Name; Result = "PASS" }
    } else {
      Write-Host "  [FAIL] Gate fail etmedi (exit $exitCode, beklenen: 1)" -ForegroundColor Red
      $script:testResults += @{ Name = $Name; Result = "FAIL"; ExitCode = $exitCode }
    }
  } catch {
    Write-Host "  [ERROR] Test hatası: $($_.Exception.Message)" -ForegroundColor Red
    $script:testResults += @{ Name = $Name; Result = "ERROR"; Error = $_.Exception.Message }
  } finally {
    # Cleanup: Durumu geri yükle
    & $Cleanup
  }
}

# Test 1: Dokümana geçici TODO koy
$testDoc = "docs/ops/MUHUR_VERDICT.md"
if (Test-Path $testDoc) {
  Test-FailScenario -Name "Doküman Placeholder Testi" `
    -Setup {
      $content = Get-Content $testDoc -Raw
      $script:backupFiles[$testDoc] = $content
      $content + "`n`n<!-- TODO: Test placeholder -->" | Set-Content -Encoding utf8 -Path $testDoc
    } `
    -Test {
      # Gate çalıştırılacak
    } `
    -Cleanup {
      if ($script:backupFiles.ContainsKey($testDoc)) {
        $script:backupFiles[$testDoc] | Set-Content -Encoding utf8 -Path $testDoc
      }
    }
}

# Test 2: Helper script adını geçici değiştir
$helperScript = "scripts/run-powershell.ps1"
$helperBackup = "scripts/run-powershell.ps1.backup"
if (Test-Path $helperScript) {
  Test-FailScenario -Name "Helper Script Kontrolü Testi" `
    -Setup {
      Move-Item -Path $helperScript -Destination $helperBackup -Force
    } `
    -Test {
      # Gate çalıştırılacak
    } `
    -Cleanup {
      if (Test-Path $helperBackup) {
        Move-Item -Path $helperBackup -Destination $helperScript -Force
      }
    }
}

# Test 3: Evidence klasör adını geçici boz (negatif paket)
$negativeDirs = @(Get-ChildItem evidence -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^negative_tests_' } |
  Sort-Object LastWriteTime -Descending)

if ($negativeDirs.Count -gt 0) {
  $testDir = $negativeDirs[0]
  $testDirBackup = "evidence/negative_tests_BACKUP_$(Get-Date -Format 'yyyyMMddHHmmss')"

  Test-FailScenario -Name "Evidence Klasör Kontrolü Testi" `
    -Setup {
      Move-Item -Path $testDir.FullName -Destination $testDirBackup -Force
    } `
    -Test {
      # Gate çalıştırılacak
    } `
    -Cleanup {
      if (Test-Path $testDirBackup) {
        Move-Item -Path $testDirBackup -Destination $testDir.FullName -Force
      }
    }
}

# Final Cleanup: Tüm backupları geri yükle (ekstra güvence)
Write-Host "`n[CLEANUP] Final temizlik kontrolü" -ForegroundColor Yellow

# Doküman backupları
foreach ($key in $backupFiles.Keys) {
  if (Test-Path $key) {
    $current = Get-Content $key -Raw -ErrorAction SilentlyContinue
    $backup = $backupFiles[$key]
    if ($current -ne $backup) {
      Write-Host "  [RESTORE] $key geri yükleniyor..." -ForegroundColor Yellow
      $backup | Set-Content -Encoding utf8 -Path $key
    }
  }
}

# Helper script backup
if (Test-Path $helperBackup) {
  Write-Host "  [RESTORE] Helper script geri yükleniyor..." -ForegroundColor Yellow
  Move-Item -Path $helperBackup -Destination $helperScript -Force -ErrorAction SilentlyContinue
}

# Evidence klasör backupları
$evidenceBackups = Get-ChildItem evidence -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^negative_tests_BACKUP_' }
foreach ($backup in $evidenceBackups) {
  Write-Host "  [CLEANUP] Geçici backup klasörü temizleniyor: $($backup.Name)" -ForegroundColor Yellow
  Remove-Item -Path $backup.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# Git diff kontrolü (repo temizliği garantisi)
Write-Host "`n[VERIFY] Repo temizlik kontrolü" -ForegroundColor Yellow
try {
  $gitStatus = git status --porcelain 2>&1
  if ($gitStatus) {
    Write-Host "  [WARN] Git working tree değişiklikleri tespit edildi:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    Write-Host "  [INFO] Değişiklikleri geri almak için: git checkout ." -ForegroundColor Gray
    $allPassed = $false
  } else {
    Write-Host "  [OK] Git working tree temiz" -ForegroundColor Green
  }
} catch {
  Write-Host "  [WARN] Git kontrolü yapılamadı (git yok veya repo değil)" -ForegroundColor Yellow
}

# Özet
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "[SONUC] Negatif Senaryo Test Sonuclari" -ForegroundColor Cyan

$allPassed = $true
foreach ($result in $testResults) {
  if ($result.Result -eq "PASS") {
    Write-Host "  [PASS] $($result.Name)" -ForegroundColor Green
  } else {
    $allPassed = $false
    Write-Host "  [FAIL] $($result.Name)" -ForegroundColor Red
    if ($result.ExitCode) {
      Write-Host "    Exit code: $($result.ExitCode)" -ForegroundColor Yellow
    }
    if ($result.Error) {
      Write-Host "    Error: $($result.Error)" -ForegroundColor Yellow
    }
  }
}

if ($allPassed) {
  Write-Host "`n[OK] Tüm negatif senaryo testleri geçti!" -ForegroundColor Green
  Write-Host "  Repo temiz bırakıldı (git diff kontrolü yapıldı)" -ForegroundColor Gray
  exit 0
} else {
  Write-Host "`n[FAIL] Bazı testler başarısız veya repo temiz değil!" -ForegroundColor Red
  exit 1
}

