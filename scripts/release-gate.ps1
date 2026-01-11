# Release Gate Final Check - Mühür Durumu Tek Komutla Hüküm Verir
# Bu script evidence + docs tutarlılık + script runner tespiti yapar
# CI/CD friendly: exit 0 = PASS, exit 1 = FAIL
#
# Modlar:
# - Hard gate (default): Her şey zorunlu, fail = exit 1
# - Warn mode: Bazı kontroller WARN üretsin ama exit 0 (soft gate)

param(
  [switch]$Verbose,
  [switch]$WarnMode,
  [switch]$JsonOutput
)

# Strict mode + Error handling
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# PS5.1 encoding "emoji kırılması" için güvenli mod
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $OutputEncoding = [Console]::OutputEncoding
} catch {
  # PS5.1'de bazı durumlarda başarısız olabilir, sessizce devam et
}

$allChecksPassed = $true
$issues = @()
$failedChecks = @()
$warnings = @()
$criticalIssues = @()
$majorIssues = @()
$minorIssues = @()

# Severity enum: Critical, Major, Minor
# Critical: Release olmamalı (her modda exit 1)
# Major: Önemli ama warn mode'da sadece uyarı
# Minor: Küçük sorunlar, warn mode'da sadece uyarı

# JSON mode'da sadece JSON çıktı, diğer modlarda normal çıktı
if (-not $JsonOutput) {
  $modeText = if ($WarnMode) { "WARN MODE (soft gate)" } else { "HARD GATE (strict)" }
  Write-Host "`n[RELEASE GATE] Muhr Durumu Kontrolu - $modeText" -ForegroundColor Cyan
  Write-Host ("=" * 60) -ForegroundColor Gray
}

# 1) Evidence Klasörleri Kontrolü
if (-not $JsonOutput) {
  Write-Host "`n[1/5] Evidence Klasörleri Kontrolu" -ForegroundColor Yellow
}

$positiveDirs = @()
$negativeDirs = @()

try {
  $positiveDirs = @(Get-ChildItem evidence -Directory -ErrorAction Stop |
    Where-Object { $_.Name -match '^final_verification_' } |
    Sort-Object LastWriteTime -Descending)

  $negativeDirs = @(Get-ChildItem evidence -Directory -ErrorAction Stop |
    Where-Object { $_.Name -match '^negative_tests_' } |
    Sort-Object LastWriteTime -Descending)
} catch {
  $allChecksPassed = $false
  $issues += "Evidence klasörü okunamadı: $($_.Exception.Message)"
  $failedChecks += "Evidence klasörleri"
      if (-not $JsonOutput) {
        Write-Host "  [FAIL] Evidence klasörü erişilemiyor" -ForegroundColor Red
      }
}

if ($null -eq $positiveDirs -or $positiveDirs.Length -eq 0) {
  $allChecksPassed = $false
  $issue = "Pozitif paket klasörü bulunamadı (final_verification_*)"
  $issues += $issue
  $failedChecks += "Pozitif paket"
  $criticalIssues += $issue
      if (-not $JsonOutput) {
        Write-Host "  [FAIL] Pozitif paket yok" -ForegroundColor Red
      }
} else {
  $latestPositive = $positiveDirs[0]
  if (-not $JsonOutput) {
    Write-Host "  [OK] Pozitif paket: $($latestPositive.Name)" -ForegroundColor Green
    if ($Verbose) {
      Write-Host "    LastWriteTime: $($latestPositive.LastWriteTime)" -ForegroundColor Gray
    }
  }
}

if ($null -eq $negativeDirs -or $negativeDirs.Length -eq 0) {
  $allChecksPassed = $false
  $issue = "Negatif paket klasörü bulunamadı (negative_tests_*)"
  $issues += $issue
  $failedChecks += "Negatif paket"
  $criticalIssues += $issue
      if (-not $JsonOutput) {
        Write-Host "  [FAIL] Negatif paket yok" -ForegroundColor Red
      }
} else {
  $latestNegative = $negativeDirs[0]
  if (-not $JsonOutput) {
    Write-Host "  [OK] Negatif paket: $($latestNegative.Name)" -ForegroundColor Green
    if ($Verbose) {
      Write-Host "    LastWriteTime: $($latestNegative.LastWriteTime)" -ForegroundColor Gray
    }
  }
}

# 2) Doküman Tutarlılık Kontrolü (Sertleştirilmiş)
if (-not $JsonOutput) {
  Write-Host "`n[2/5] Dokuman Tutarlilik Kontrolu (Sertlestirilmis)" -ForegroundColor Yellow
}

$docsPath = "docs/ops"
$criticalDocs = @(
  "FINAL_EVIDENCE_INDEX.md",
  "FULL_MUHUR_COMPLETE.md",
  "MUHUR_VERDICT.md"
)

# Placeholder pattern'leri (regex)
$placeholderPatterns = @(
  "HENÜZ TOPLANMADI",
  "henüz toplanmadı",
  "TODO",
  "TBD",
  "FIXME",
  "evidence/negative_tests_YYYY_MM_DD_HH_MM_SS",
  "evidence/final_verification_YYYY_MM_DD_HH_MM_SS"
)

foreach ($doc in $criticalDocs) {
  $docPath = Join-Path $docsPath $doc
  if (-not (Test-Path $docPath)) {
    $allChecksPassed = $false
    $issue = "Kritik doküman eksik: $doc"
    $issues += $issue
    $failedChecks += "Doküman: $doc"
    $criticalIssues += $issue
    Write-Host "  [FAIL] $doc bulunamadı" -ForegroundColor Red
    continue
  }

  try {
    $content = Get-Content $docPath -Raw -ErrorAction Stop

    # Placeholder kontrolü (sadece gerçek klasör referansı yoksa)
    # Format bilgisi olarak YYYY_MM_DD_HH_MM_SS kullanılabilir, ama gerçek klasör de olmalı
    $hasRealPositiveRef = $content -match 'evidence/final_verification_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}'
    $hasRealNegativeRef = $content -match 'evidence/negative_tests_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}'

    # Sadece format pattern'leri var ama gerçek referans yoksa fail (Critical)
    if ($content -match 'evidence/(final_verification|negative_tests)_YYYY_MM_DD_HH_MM_SS' -and
        -not ($hasRealPositiveRef -or $hasRealNegativeRef)) {
      $allChecksPassed = $false
      $issue = "$doc içinde sadece format pattern'i var, gerçek klasör referansı yok"
      $issues += $issue
      $failedChecks += "Doküman: $doc (sadece format, gerçek referans yok)"
      $criticalIssues += $issue
      Write-Host "  [FAIL] $doc içinde sadece format pattern'i var, gerçek referans yok" -ForegroundColor Red
    }

    # Diğer placeholder'lar (TODO, TBD, HENÜZ TOPLANMADI) - Critical
    $otherPlaceholders = @("HENÜZ TOPLANMADI", "henüz toplanmadı", "TODO", "TBD", "FIXME")
    foreach ($pattern in $otherPlaceholders) {
      if ($content -match $pattern) {
        $allChecksPassed = $false
        $issue = "$doc içinde placeholder bulundu: '$pattern'"
        $issues += $issue
        $failedChecks += "Doküman: $doc (placeholder)"
        $criticalIssues += $issue
        Write-Host "  [FAIL] $doc içinde placeholder: '$pattern'" -ForegroundColor Red
        break
      }
    }

    # Evidence klasör referansları kontrolü (sadece gerçek timestamp pattern'leri) - Critical
    $evidenceRefs = [regex]::Matches($content, 'evidence/(final_verification|negative_tests)_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}')
    foreach ($match in $evidenceRefs) {
      $refPath = $match.Value
      if (-not (Test-Path $refPath)) {
        $allChecksPassed = $false
        $issue = "$doc içinde referans verilen klasör yok: $refPath"
        $issues += $issue
        $failedChecks += "Doküman: $doc (eksik klasör referansı)"
        $criticalIssues += $issue
        Write-Host "  [FAIL] $doc içinde eksik klasör referansı: $refPath" -ForegroundColor Red
      }
    }

    if ($allChecksPassed -or $issues.Count -eq 0) {
      Write-Host "  [OK] $doc tutarlı" -ForegroundColor Green
    }
  } catch {
    $allChecksPassed = $false
    $issues += "$doc okunamadı: $($_.Exception.Message)"
    $failedChecks += "Doküman: $doc (okuma hatası)"
    Write-Host "  [FAIL] $doc okunamadı" -ForegroundColor Red
  }
}

# 3) Script Runner Tespiti
if (-not $JsonOutput) {
  Write-Host "`n[3/6] Script Runner Tespiti" -ForegroundColor Yellow
}

try {
  $pwshAvailable = Get-Command pwsh -ErrorAction Stop
  $pwshVersion = & pwsh -NoProfile -Command '$PSVersionTable.PSVersion'
  Write-Host "  [OK] pwsh (PowerShell 7+) mevcut: $pwshVersion" -ForegroundColor Green
} catch {
  $issue = "pwsh (PowerShell 7+) PATH'te yok (fallback kullanılıyor)"
  if ($WarnMode) {
    Write-Host "  [WARN] $issue" -ForegroundColor Yellow
    $warnings += $issue
    $minorIssues += $issue
  } else {
    Write-Host "  [WARN] $issue" -ForegroundColor Yellow
    # Hard mode'da da minor (fallback var, kritik değil)
    $minorIssues += $issue
  }
}

try {
  $powershellAvailable = Get-Command powershell -ErrorAction Stop
  $psVersion = & powershell -NoProfile -Command '$PSVersionTable.PSVersion'
  Write-Host "  [OK] powershell (fallback) mevcut: $psVersion" -ForegroundColor Green
} catch {
  $allChecksPassed = $false
  $issue = "powershell komutu bulunamadı"
  $issues += $issue
  $failedChecks += "Script runner (powershell yok)"
  $criticalIssues += $issue
  Write-Host "  [FAIL] powershell komutu yok" -ForegroundColor Red
}

# 4) Helper Script Kontrolü
if (-not $JsonOutput) {
  Write-Host "`n[4/6] Helper Script Kontrolu" -ForegroundColor Yellow
}

$helperScript = "scripts/run-powershell.ps1"
if (Test-Path $helperScript) {
  Write-Host "  [OK] run-powershell.ps1 mevcut (pwsh/powershell fallback)" -ForegroundColor Green
} else {
  $allChecksPassed = $false
  $issue = "run-powershell.ps1 helper script yok"
  $issues += $issue
  $failedChecks += "Helper script"
  $criticalIssues += $issue
  Write-Host "  [FAIL] run-powershell.ps1 yok" -ForegroundColor Red
}

# 5) Package.json Script Kontrolü
if (-not $JsonOutput) {
  Write-Host "`n[5/6] Package.json Script Kontrolu" -ForegroundColor Yellow
}

if (Test-Path "package.json") {
  try {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts.'verify:negative' -and $packageJson.scripts.'release:gate') {
      Write-Host "  [OK] package.json script'leri mevcut" -ForegroundColor Green
    } else {
      $issue = "package.json'da bazı script'ler eksik olabilir"
      if ($WarnMode) {
        Write-Host "  [WARN] $issue" -ForegroundColor Yellow
        $warnings += $issue
        $minorIssues += $issue
      } else {
        Write-Host "  [WARN] $issue" -ForegroundColor Yellow
        # Hard mode'da da minor olarak işaretle (ama exit 1 yapmayalım, sadece warn)
        $minorIssues += $issue
      }
    }
  } catch {
    Write-Host "  [WARN] package.json parse edilemedi" -ForegroundColor Yellow
  }
} else {
  Write-Host "  [WARN] package.json bulunamadı" -ForegroundColor Yellow
}

# Severity özeti
$criticalCount = $criticalIssues.Count
$majorCount = $majorIssues.Count
$minorCount = $minorIssues.Count
$totalIssues = $criticalCount + $majorCount + $minorCount

# Warn mode'da kritik hatalar hala exit 1, diğerleri sadece uyarı
$hasCriticalIssues = $criticalCount -gt 0
$hasNonCriticalIssues = $majorCount -gt 0 -or $minorCount -gt 0

# Exit code belirleme (JSON mode için)
$exitCode = 0
if ($allChecksPassed -and -not $hasCriticalIssues) {
  $exitCode = 0
} else {
  if ($WarnMode -and $hasCriticalIssues) {
    $exitCode = 1
  } elseif ($WarnMode -and -not $hasCriticalIssues -and $hasNonCriticalIssues) {
    $exitCode = 0
  } else {
    $exitCode = 1
  }
}

# 6) Evidence Index Kontrolü (Major)
if (-not $JsonOutput) {
  Write-Host "`n[6/6] Evidence Index Kontrolu" -ForegroundColor Yellow
}

$evidenceIndexPath = "evidence/INDEX.md"
if (Test-Path $evidenceIndexPath) {
  try {
    $indexStats = Get-Item $evidenceIndexPath
    $indexContent = Get-Content $evidenceIndexPath -Raw -ErrorAction Stop
    $lastUpdateMatch = $indexContent -match '\*\*Son Guncelleme:\*\* (.+)'
    $lastUpdateStr = if ($lastUpdateMatch) { $matches[1].Trim() } else { $null }

    # Parse timestamp (format: 2026-01-02 23:18:03)
    $lastUpdate = $null
    if ($lastUpdateStr) {
      try {
        $lastUpdate = [DateTime]::ParseExact($lastUpdateStr, "yyyy-MM-dd HH:mm:ss", $null)
      } catch {
        # Fallback: try ISO format
        try {
          $lastUpdate = [DateTime]::Parse($lastUpdateStr)
        } catch {
          # Use file modification time as fallback
          $lastUpdate = $indexStats.LastWriteTime
        }
      }
    } else {
      $lastUpdate = $indexStats.LastWriteTime
    }

    $ageHours = if ($lastUpdate) {
      ((Get-Date) - $lastUpdate).TotalHours
    } else {
      999
    }

    # Major: Index var ama 24 saatten eski ise warn
    if ($ageHours -gt 24) {
      $issue = "Evidence Index eski (${ageHours} saat once guncellenmis, 24 saatten eski)"
      if ($WarnMode) {
        if (-not $JsonOutput) {
          Write-Host "  [WARN] $issue" -ForegroundColor Yellow
        }
        $warnings += $issue
        $majorIssues += $issue
      } else {
        if (-not $JsonOutput) {
          Write-Host "  [WARN] $issue" -ForegroundColor Yellow
        }
        $warnings += $issue
        $majorIssues += $issue
      }
    } else {
      if (-not $JsonOutput) {
        Write-Host "  [OK] Evidence Index mevcut (${ageHours} saat once guncellenmis)" -ForegroundColor Green
      }
    }
  } catch {
    $issue = "Evidence Index okunamadi: $($_.Exception.Message)"
    if ($WarnMode) {
      if (-not $JsonOutput) {
        Write-Host "  [WARN] $issue" -ForegroundColor Yellow
      }
      $warnings += $issue
      $majorIssues += $issue
    } else {
      if (-not $JsonOutput) {
        Write-Host "  [WARN] $issue" -ForegroundColor Yellow
      }
      $warnings += $issue
      $majorIssues += $issue
    }
  }
} else {
  $issue = "Evidence Index eksik (evidence/INDEX.md yok)"
  if ($WarnMode) {
    if (-not $JsonOutput) {
      Write-Host "  [WARN] $issue" -ForegroundColor Yellow
    }
    $warnings += $issue
    $majorIssues += $issue
  } else {
    if (-not $JsonOutput) {
      Write-Host "  [WARN] $issue" -ForegroundColor Yellow
    }
    $warnings += $issue
    $majorIssues += $issue
  }
}

# JSON Output (opsiyonel) - En sonda, tüm kontrollerden sonra
if ($JsonOutput) {
  $jsonResult = @{
    schemaVersion = "1.0"
    status = if ($exitCode -eq 0) { "pass" } else { "fail" }
    mode = if ($WarnMode) { "warn" } else { "hard" }
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    counts = @{
      critical = $criticalCount
      major = $majorCount
      minor = $minorCount
      total = $totalIssues
    }
    issues = @()
  }

  foreach ($issue in $criticalIssues) {
    $jsonResult.issues += @{
      name = "Critical Issue"
      severity = "critical"
      message = $issue
    }
  }
  foreach ($issue in $majorIssues) {
    $jsonResult.issues += @{
      name = "Major Issue"
      severity = "major"
      message = $issue
    }
  }
  foreach ($issue in $minorIssues) {
    $jsonResult.issues += @{
      name = "Minor Issue"
      severity = "minor"
      message = $issue
    }
  }

  if ($null -ne $positiveDirs -and $positiveDirs.Length -gt 0) {
    $jsonResult.positivePackage = $positiveDirs[0].Name
  }
  if ($null -ne $negativeDirs -and $negativeDirs.Length -gt 0) {
    $jsonResult.negativePackage = $negativeDirs[0].Name
  }

  # JSON mode'da sadece JSON çıktısı (stdout'a Write-Output ile, tüm Write-Host'lar stderr'e gider)
  # Tüm Write-Host çıktılarını stderr'e yönlendir (JSON parse için temiz stdout)
  $jsonResult | ConvertTo-Json -Depth 10 | Write-Output
  exit $exitCode
}

# CI Dostu Özet
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray

if ($allChecksPassed -and -not $hasCriticalIssues) {
  # Tüm kontroller geçti veya sadece minor/major var (warn mode'da)
  if ($WarnMode -and $totalIssues -gt 0) {
    Write-Host "[PASS] FULL MUHUR (4/4 ayak tamamlandi) - WARNINGS VAR" -ForegroundColor Green
    Write-Host "`n  [WARN] $totalIssues issue (0 critical, $majorCount major, $minorCount minor)" -ForegroundColor Yellow
    if ($majorCount -gt 0) {
      Write-Host "`n  Major issues:" -ForegroundColor Yellow
      foreach ($issue in $majorIssues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
      }
    }
    if ($minorCount -gt 0) {
      Write-Host "`n  Minor issues:" -ForegroundColor Yellow
      foreach ($issue in $minorIssues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
      }
    }
  } else {
    Write-Host "[PASS] FULL MUHUR (4/4 ayak tamamlandi)" -ForegroundColor Green
  }

  if ($null -ne $positiveDirs -and $positiveDirs.Length -gt 0 -and $null -ne $negativeDirs -and $negativeDirs.Length -gt 0) {
    Write-Host "  Pozitif: $($positiveDirs[0].Name)" -ForegroundColor Gray
    Write-Host "  Negatif: $($negativeDirs[0].Name)" -ForegroundColor Gray
  }
  exit 0
} else {
  # Kritik hatalar var veya hard mode'da herhangi bir hata var
  if ($WarnMode -and $hasCriticalIssues) {
    # Warn mode'da bile kritik hatalar exit 1
    Write-Host "[FAIL] YARIM MUHUR - Critical issues tespit edildi (warn mode ama critical = exit 1)" -ForegroundColor Red
    Write-Host "`n  [FAIL] $totalIssues issue ($criticalCount critical, $majorCount major, $minorCount minor)" -ForegroundColor Red
    Write-Host "`n  Critical issues (release olmamalı):" -ForegroundColor Red
    foreach ($issue in $criticalIssues) {
      Write-Host "    - $issue" -ForegroundColor Red
    }
    if ($majorCount -gt 0) {
      Write-Host "`n  Major issues:" -ForegroundColor Yellow
      foreach ($issue in $majorIssues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
      }
    }
    if ($minorCount -gt 0) {
      Write-Host "`n  Minor issues:" -ForegroundColor Yellow
      foreach ($issue in $minorIssues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
      }
    }
    exit 1
  } elseif ($WarnMode -and -not $hasCriticalIssues -and $hasNonCriticalIssues) {
    # Warn mode'da sadece major/minor var → exit 0
    Write-Host "[WARN] YARIM MUHUR - Non-critical issues tespit edildi (warn mode - exit 0)" -ForegroundColor Yellow
    Write-Host "`n  [WARN] $totalIssues issue (0 critical, $majorCount major, $minorCount minor)" -ForegroundColor Yellow
    if ($majorCount -gt 0) {
      Write-Host "`n  Major issues:" -ForegroundColor Yellow
      foreach ($issue in $majorIssues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
      }
    }
    if ($minorCount -gt 0) {
      Write-Host "`n  Minor issues:" -ForegroundColor Yellow
      foreach ($issue in $minorIssues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
      }
    }
    exit 0
  } else {
    # Hard mode: herhangi bir hata = exit 1
    Write-Host "[FAIL] YARIM MUHUR - Sorunlar tespit edildi" -ForegroundColor Red
    Write-Host "`n  [FAIL] $totalIssues issue ($criticalCount critical, $majorCount major, $minorCount minor)" -ForegroundColor Red
    if ($criticalCount -gt 0) {
      Write-Host "`n  Critical issues:" -ForegroundColor Red
      foreach ($issue in $criticalIssues) {
        Write-Host "    - $issue" -ForegroundColor Red
      }
    }
    if ($majorCount -gt 0) {
      Write-Host "`n  Major issues:" -ForegroundColor Red
      foreach ($issue in $majorIssues) {
        Write-Host "    - $issue" -ForegroundColor Red
      }
    }
    if ($minorCount -gt 0) {
      Write-Host "`n  Minor issues:" -ForegroundColor Yellow
      foreach ($issue in $minorIssues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
      }
    }
    exit 1
  }
}
