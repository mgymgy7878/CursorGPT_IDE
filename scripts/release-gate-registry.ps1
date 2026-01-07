# Release Gate Registry - Ayakların Tek Kaynağı
#
# KURUMSAL REFLEKS (5 Kural):
# 1. Registry tek kaynaktır - Tüm ayaklar buradan türetilir
# 2. Her entry: Name, Severity, CheckFn, FixHint (zorunlu alanlar)
# 3. Yeni entry = yeni negatif test (test-release-gate-fail.ps1)
# 4. Breaking JSON değişikliği = schema bump + migration notu
# 5. Ayak adı issues[].name ile birebir (dashboard için sabit)
#
# Bu dosya tüm gate ayaklarını tanımlar: Name, Severity, CheckFn, FixHint
# Böylece hem çıktı hem doc hem negatif test senaryoları aynı kaynaktan beslenir

# Registry: Her ayak için metadata
$script:GateRegistry = @(
  @{
    Name = "Evidence - Pozitif Paket"
    Severity = "Critical"
    CheckFn = {
      param($positiveDirs)
      if ($null -eq $positiveDirs -or $positiveDirs.Length -eq 0) {
        return @{
          Passed = $false
          Message = "Pozitif paket klasörü bulunamadı (final_verification_*)"
        }
      }
      return @{ Passed = $true; Message = "Pozitif paket: $($positiveDirs[0].Name)" }
    }
    FixHint = "pnpm verify:final komutunu çalıştır"
  },
  @{
    Name = "Evidence - Negatif Paket"
    Severity = "Critical"
    CheckFn = {
      param($negativeDirs)
      if ($null -eq $negativeDirs -or $negativeDirs.Length -eq 0) {
        return @{
          Passed = $false
          Message = "Negatif paket klasörü bulunamadı (negative_tests_*)"
        }
      }
      return @{ Passed = $true; Message = "Negatif paket: $($negativeDirs[0].Name)" }
    }
    FixHint = "pnpm verify:negative komutunu çalıştır"
  },
  @{
    Name = "Doküman - Placeholder Kontrolü"
    Severity = "Critical"
    CheckFn = {
      param($docPath, $content)
      $placeholderPatterns = @("HENÜZ TOPLANMADI", "henüz toplanmadı", "TODO", "TBD", "FIXME")
      foreach ($pattern in $placeholderPatterns) {
        if ($content -match $pattern) {
          return @{
            Passed = $false
            Message = "$docPath içinde placeholder bulundu: '$pattern'"
          }
        }
      }
      return @{ Passed = $true; Message = "$docPath tutarlı" }
    }
    FixHint = "Dokümanlardaki placeholder'ları kaldır, gerçek değerlerle değiştir"
  },
  @{
    Name = "Doküman - Klasör Referansları"
    Severity = "Critical"
    CheckFn = {
      param($docPath, $content)
      $evidenceRefs = [regex]::Matches($content, 'evidence/(final_verification|negative_tests)_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}')
      foreach ($match in $evidenceRefs) {
        $refPath = $match.Value
        if (-not (Test-Path $refPath)) {
          return @{
            Passed = $false
            Message = "$docPath içinde referans verilen klasör yok: $refPath"
          }
        }
      }
      return @{ Passed = $true; Message = "$docPath klasör referansları doğru" }
    }
    FixHint = "Dokümanlardaki eksik klasör referanslarını güncelle veya klasörleri oluştur"
  },
  @{
    Name = "Script Runner - PowerShell"
    Severity = "Critical"
    CheckFn = {
      param()
      try {
        $powershellAvailable = Get-Command powershell -ErrorAction Stop
        return @{ Passed = $true; Message = "powershell (fallback) mevcut" }
      } catch {
        return @{
          Passed = $false
          Message = "powershell komutu bulunamadı"
        }
      }
    }
    FixHint = "PowerShell kurulumu yapın"
  },
  @{
    Name = "Helper Script - run-powershell.ps1"
    Severity = "Critical"
    CheckFn = {
      param()
      $helperScript = "scripts/run-powershell.ps1"
      if (Test-Path $helperScript) {
        return @{ Passed = $true; Message = "run-powershell.ps1 mevcut" }
      }
      return @{
        Passed = $false
        Message = "run-powershell.ps1 helper script yok"
      }
    }
    FixHint = "scripts/run-powershell.ps1 dosyasını geri yükleyin"
  },
  @{
    Name = "Script Runner - pwsh (PS7+)"
    Severity = "Minor"
    CheckFn = {
      param()
      try {
        $pwshAvailable = Get-Command pwsh -ErrorAction Stop
        $pwshVersion = & pwsh -NoProfile -Command '$PSVersionTable.PSVersion'
        return @{ Passed = $true; Message = "pwsh (PowerShell 7+) mevcut: $pwshVersion" }
      } catch {
        return @{
          Passed = $false
          Message = "pwsh (PowerShell 7+) PATH'te yok (fallback kullanılıyor)"
        }
      }
    }
    FixHint = "winget install --id Microsoft.PowerShell"
  },
  @{
    Name = "Package.json - Script'ler"
    Severity = "Minor"
    CheckFn = {
      param()
      if (Test-Path "package.json") {
        try {
          $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
          if ($packageJson.scripts.'verify:negative' -and $packageJson.scripts.'release:gate') {
            return @{ Passed = $true; Message = "package.json script'leri mevcut" }
          }
          return @{
            Passed = $false
            Message = "package.json'da bazı script'ler eksik olabilir"
          }
        } catch {
          return @{
            Passed = $false
            Message = "package.json parse edilemedi"
          }
        }
      }
      return @{
        Passed = $false
        Message = "package.json bulunamadı"
      }
    }
    FixHint = "package.json'a verify:negative ve release:gate script'lerini ekleyin"
  }
)

# Registry'den ayak bilgilerini al
function Get-GateCheck {
  param([string]$Name)
  return $script:GateRegistry | Where-Object { $_.Name -eq $Name } | Select-Object -First 1
}

# Tüm ayakları listele
function Get-AllGateChecks {
  return $script:GateRegistry
}

# Severity'ye göre filtrele
function Get-GateChecksBySeverity {
  param([string]$Severity)
  return $script:GateRegistry | Where-Object { $_.Severity -eq $Severity }
}

