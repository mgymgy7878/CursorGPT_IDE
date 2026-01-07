# Release Gate - Geleceğe Yatırım Standartları

**Tarih:** 1 Ocak 2026
**Amaç:** Gate ayaklarını eklerken tutarlılık ve bakım kolaylığı

---

## 🎯 Gate Modları ve Severity Sistemi

### Hard Gate (Default)

```powershell
pnpm release:gate
```

**Davranış:**

- **Critical + Major + Minor:** Hepsi exit 1 (pipeline durur)
- CI/CD ve release öncesi kullanım için

**Kullanım:**

- `prepack` / `prepublishOnly` hook'larında
- GitHub Actions CI'da
- Release tag'leri öncesi

### Warn Mode (Soft Gate)

```powershell
pnpm release:gate:warn
```

**Davranış:**

- **Critical issues:** Her zaman exit 1 (release olmamalı)
- **Major/Minor issues:** Sadece WARN, exit 0
- Ekip içi disiplin + görünürlük için

**Kullanım:**

- Geliştirme sırasında (release öncesi kontrol)
- Büyük repo'larda "yanlış zamanda release kilitleme" önleme
- Ekip içi görünürlük (slack/teams bildirimleri)

**Severity Özeti:**

```
[WARN] 2 issue (0 critical, 1 major, 1 minor)
```

Bu çıktı zamanla "gate sağlık metriği" gibi çalışır.

**Severity Tanımları:**

- **Critical:** Release olmamalı (her modda exit 1)
  - Evidence klasörleri yok
  - Doküman placeholder'ları
  - Script runner yok
  - Helper script yok

- **Major:** Önemli ama warn mode'da sadece uyarı
  - (Şu an örnek yok, gelecekte eklenebilir)

- **Minor:** Küçük sorunlar, warn mode'da sadece uyarı
  - pwsh yok (fallback var)
  - package.json script'leri eksik

---

## 📋 Yeni Ayak Ekleme Standartları

**Önemli Not:** Bu dokümandaki örnek bloklar _canlı kod değildir_; referans şablondur. Gerçek uygulama registry'den türetilir (`scripts/release-gate-registry.ps1`). Örnekleri doğrudan kopyalayıp kullanmayın; registry pattern'ini takip edin.

Gate'e yeni bir ayak eklerken şu 3 standardı koru:

### 1. Her Yeni Ayak İçin 1 Negatif Test (Fail Yolu Kanıtı)

**Kural:** `scripts/test-release-gate-fail.ps1` içine yeni test senaryosu ekle.

**Format:**

```powershell
# Test N: Yeni Ayak Adı
Test-FailScenario -Name "Yeni Ayak Testi" `
  -Setup {
    # Durumu boz (ör. dosya sil, klasör taşı, placeholder ekle)
  } `
  -Test {
    # Gate çalıştırılacak (otomatik)
  } `
  -Cleanup {
    # Durumu geri yükle
  }
```

**Örnek (Backtest Evidence):**

```powershell
# Test 4: Backtest Evidence Kontrolü
$backtestDir = Get-ChildItem evidence -Directory | Where-Object { $_.Name -match '^backtest_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($backtestDir) {
  Test-FailScenario -Name "Backtest Evidence Kontrolü Testi" `
    -Setup {
      # Klasörü geçici rename → gate Critical FAIL
      Move-Item -Path $backtestDir.FullName -Destination "$($backtestDir.FullName).backup" -Force
    } `
    -Test { } `
    -Cleanup {
      if (Test-Path "$($backtestDir.FullName).backup") {
        Move-Item -Path "$($backtestDir.FullName).backup" -Destination $backtestDir.FullName -Force
      }
    }
}
```

---

### 2. Her Yeni Ayak İçin 1 Dokümantasyon Satırı

**Kural:** `docs/ops/RELEASE_GATE_FINAL.md` içine yeni ayak açıklaması ekle.

**Format:**

```markdown
### N. Yeni Ayak Adı

**Kontrol:** Ne kontrol ediyor?
**Fail Koşulu:** Ne zaman fail olur?
**Düzeltme:** Nasıl düzeltilir?

**Örnek:**

- Fail: `[FAIL] Backtest Evidence: evidence/backtest_YYYY_MM_DD_HH_MM_SS/ klasörü eksik`
- Fail: `[FAIL] Backtest Evidence: evidence/backtest_YYYY_MM_DD_HH_MM_SS/run.json eksik`
- Düzeltme: Backtest çalıştır ve çıktıları evidence klasörüne yaz (run.json + metrics.json + verdict.md)
```

**Örnek (Backtest Evidence):**

```markdown
### 6. Backtest Evidence Kontrolü

**Kontrol:** Backtest evidence klasörü ve içindeki 3 dosyanın varlığını kontrol eder.
**Fail Koşulu:** `evidence/backtest_YYYY_MM_DD_HH_MM_SS/` klasörü yok veya içinde run.json/metrics.json/verdict.md eksikse fail.
**Düzeltme:** Backtest çalıştır ve çıktılarını `evidence/backtest_*` altına yaz: run.json + metrics.json + verdict.md.

**Örnek:**

- Fail: `[FAIL] Backtest Evidence: evidence/backtest_2026_01_01_12_00_00/ klasörü eksik`
- Fail: `[FAIL] Backtest Evidence: evidence/backtest_2026_01_01_12_00_00/run.json eksik`
- Düzeltme: Backtest çalıştır ve çıktıları evidence klasörüne yaz
```

---

### 3. Her Yeni Ayak İçin 1 Çıktısı Kısa ([FAIL] <ayak>: <sebep>)

**Severity Belirleme:**

- Yeni ayak eklerken severity'yi seç: Critical, Major, veya Minor
- Critical: Release olmamalı (her modda exit 1)
- Major: Önemli ama warn mode'da sadece uyarı
- Minor: Küçük sorunlar, warn mode'da sadece uyarı

**Kural:** `scripts/release-gate.ps1` içinde kısa, net çıktı.

**Format:**

```powershell
# N) Yeni Ayak Kontrolü
Write-Host "`n[N/5] Yeni Ayak Kontrolu" -ForegroundColor Yellow

if (-not (Test-Path "evidence/yeni_ayak.json")) {
  $allChecksPassed = $false
  $issues += "Yeni ayak eksik: evidence/yeni_ayak.json"
  $failedChecks += "Yeni ayak"
  Write-Host "  [FAIL] Yeni ayak: evidence/yeni_ayak.json eksik" -ForegroundColor Red
} else {
  Write-Host "  [OK] Yeni ayak mevcut" -ForegroundColor Green
}
```

**Örnek (Backtest Evidence):**

```powershell
# 6) Backtest Evidence Kontrolü
Write-Host "`n[6/6] Backtest Evidence Kontrolu" -ForegroundColor Yellow

$backtestDirs = @(Get-ChildItem evidence -Directory | Where-Object { $_.Name -match '^backtest_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$' } | Sort-Object LastWriteTime -Descending)
if ($backtestDirs.Length -eq 0) {
  $allChecksPassed = $false
  $issues += "Backtest Evidence: evidence/backtest_YYYY_MM_DD_HH_MM_SS/ klasörü eksik"
  $failedChecks += "Backtest Evidence"
  Write-Host "  [FAIL] Backtest Evidence: klasör eksik" -ForegroundColor Red
} else {
  $latestDir = $backtestDirs[0]
  $requiredFiles = @("run.json", "metrics.json", "verdict.md")
  $missingFiles = @()
  foreach ($file in $requiredFiles) {
    if (-not (Test-Path (Join-Path $latestDir.FullName $file))) {
      $missingFiles += $file
    }
  }
  if ($missingFiles.Length -gt 0) {
    $allChecksPassed = $false
    $issues += "Backtest Evidence: $($latestDir.Name)/ içinde eksik dosyalar: $($missingFiles -join ', ')"
    $failedChecks += "Backtest Evidence"
    Write-Host "  [FAIL] Backtest Evidence: $($latestDir.Name)/ içinde eksik: $($missingFiles -join ', ')" -ForegroundColor Red
  } else {
    Write-Host "  [OK] Backtest Evidence mevcut: $($latestDir.Name)" -ForegroundColor Green
  }
}
```

**Çıktı Formatı:**

- `[FAIL] <ayak>: <sebep>` - Kısa, net, CI dostu
- `[OK] <ayak> mevcut` - Başarılı durum
- `[WARN] <ayak>: <sebep>` - Warn mode'da uyarı

**JSON Output Notu:**

- `issues[].name` alanında **ayak adını sabit tut** (dashboard tarafında çok iş görür)
- Örnek: `"name": "Backtest Evidence"`, `"name": "AU SHA512 Verify"`
- Bu sayede dashboard'lar issue'ları ayak bazında gruplayabilir ve trend analizi yapabilir

**Severity Belirleme:**

- Yeni ayak eklerken severity'yi seç: Critical, Major, veya Minor
- Critical: Release olmamalı (her modda exit 1)
- Major: Önemli ama warn mode'da sadece uyarı
- Minor: Küçük sorunlar, warn mode'da sadece uyarı

---

## 🔄 Ayak Ekleme Checklist

Yeni bir ayak eklerken şu checklist'i takip et:

- [ ] **Kontrol kodu eklendi** (`scripts/release-gate.ps1`)
  - [ ] Kısa, net çıktı: `[FAIL] <ayak>: <sebep>`
  - [ ] `$allChecksPassed = $false` set ediliyor
  - [ ] `$issues` ve `$failedChecks` güncelleniyor

- [ ] **Negatif test eklendi** (`scripts/test-release-gate-fail.ps1`)
  - [ ] Setup: Durumu boz
  - [ ] Test: Gate fail olmalı (exit 1)
  - [ ] Cleanup: Durumu geri yükle

- [ ] **Dokümantasyon eklendi** (`docs/ops/RELEASE_GATE_FINAL.md`)
  - [ ] Kontrol açıklaması
  - [ ] Fail koşulu
  - [ ] Düzeltme adımları

- [ ] **Test edildi**
  - [ ] Hard gate test: `pnpm release:gate` → fail olmalı
  - [ ] Warn mode test: `pnpm release:gate:warn` → warn + exit 0
  - [ ] Negatif test: `pnpm release:gate:test` → geçmeli

---

## 📊 Mevcut Ayaklar (Örnek)

### 1. Evidence Klasörleri Kontrolü

- **Kontrol:** Pozitif ve negatif paket klasörlerinin varlığı
- **Fail:** `evidence/final_verification_*` veya `evidence/negative_tests_*` yok
- **Düzeltme:** `pnpm verify:final` ve `pnpm verify:negative` çalıştır

### 2. Doküman Tutarlılık Kontrolü

- **Kontrol:** Placeholder'lar ve eksik klasör referansları
- **Fail:** `HENÜZ TOPLANMADI`, `TODO`, eksik klasör referansı
- **Düzeltme:** Dokümanları güncelle, gerçek klasör adlarını ekle

### 3. Script Runner Tespiti

- **Kontrol:** pwsh ve powershell komutlarının varlığı
- **Fail:** powershell komutu yok
- **Düzeltme:** PowerShell kurulumu

### 4. Helper Script Kontrolü

- **Kontrol:** `scripts/run-powershell.ps1` varlığı
- **Fail:** Helper script yok
- **Düzeltme:** Script'i geri yükle

### 5. Package.json Script Kontrolü

- **Kontrol:** `verify:negative` ve `release:gate` script'leri
- **Fail:** Script'ler eksik (warn mode'da sadece uyarı)
- **Düzeltme:** package.json'a script'leri ekle

---

## 🚀 Gelecek Ayaklar (Detaylı Çerçeve)

### Backtest Evidence Ayağı (Critical Önerisi)

**Kontrol (Critical):**

- `evidence/backtest_YYYY_MM_DD_HH_MM_SS/` klasörü var mı?
- İçinde en az şu üç dosya var mı?
  - `run.json` (run id, symbol/timeframe, commit hash, start/end)
  - `metrics.json` (P&L, max drawdown, winrate, trade count)
  - `verdict.md` (1 paragraf: "neden bu run anlamlı / hangi kısıtlar var")

**Fail Koşulu:**

- Klasör yok veya eksik dosya → Critical FAIL

**FixHint (1 satır):**

- "Backtest çalıştır ve çıktılarını `evidence/backtest_*` altına yaz: run.json + metrics.json + verdict.md."

**Negatif Test Senaryosu:**

- Klasörü geçici rename → gate Critical FAIL

**JSON Output:**

- `issues[].name`: "Backtest Evidence" (sabit, dashboard için)

---

### AU SHA512 Verify Ayağı (Major veya Critical, Risk Politikasına Göre)

**Kontrol:**

- `evidence/au_sha512_verify_*.json` var mı? (en güncelini seç)
- JSON içinde şu alanlar var mı (schema kontrolü):
  - `artifact` (dosya adı / URL)
  - `sha512_expected`
  - `sha512_actual`
  - `match: true/false`
  - `timestamp`
- `match == false` ise → **Critical FAIL** (warn modda bile)

**Fail Koşulu:**

- Dosya yok → Major/Critical (risk politikasına göre)
- `match == false` → **Critical FAIL** (her modda, güvenlik kapısı)

**FixHint (1 satır):**

- "AU paketini indir, SHA512 hesapla, doğrulama JSON'unu evidence'a yaz (match=true)."

**Negatif Test Senaryosu:**

- `match=false` yaz → gate Critical FAIL (warn modda bile)

**JSON Output:**

- `issues[].name`: "AU SHA512 Verify" (sabit, dashboard için)

**Not:** Bu ayak **supply-chain güvenliği** için kritik; `match=false` durumunda warn mode'da bile exit 1 olmalı.

---

### Optimizer Param Dump (Gelecek, Örnek)

**Kontrol:** `evidence/optimizer_params.json` varlığı
**Fail:** Dosya yok
**Düzeltme:** `pnpm optimizer:dump`

---

## 💡 Best Practices

1. **Kısa ve Net:** Her ayak için tek bir sorumluluk
2. **Hızlı:** Kontroller hızlı olmalı (saniyeler içinde)
3. **Deterministik:** Aynı durumda her zaman aynı sonuç
4. **Düzeltilebilir:** Fail durumunda net düzeltme adımları
5. **CI Dostu:** Çıktılar CI/CD pipeline'ında okunabilir

---

**Bu standartları korursan, backtest/optimizer/observability ayakları eklendiğinde bile gate "bürokrasiye" dönüşmez; tam tersine repo'nun güvenlik kemeri olur.**

---

## 🧠 Mental Alias (3 Ultra-Kısa Kural)

Gate'i büyütürken aklında tut:

1. **Pipeline'da pipe varsa → `$LASTEXITCODE` yakala → `exit` et.**
2. **Fail olduğunda kanıt otomatik upload.**
3. **Yeni ayak = registry + negatif test + fixHint.**

**Gate artık bir script değil; repo'nun bağışıklık sistemi.**
