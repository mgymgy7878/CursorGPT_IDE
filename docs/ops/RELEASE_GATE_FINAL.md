# Release Gate - Final Implementation

**Tarih:** 1 Ocak 2026
**Durum:** ✅ Production-Ready Gate (3 Kritik Köşe Kesinleştirildi)

---

## 🎯 Release Gate Nedir?

Release Gate, mühür durumunu tek komutla kontrol eden ve CI/CD pipeline'ında otomatik çalışan bir doğrulama mekanizmasıdır. "Mühür" sadece belge değil; otomatik olarak doğrulanan bir sözleşme.

---

## ✅ 3 Kritik Köşe (Kesinleştirildi)

### 1. Exit Code Zinciri (En Kritik)

**Sorun:** `run-powershell.ps1` hedef script fail ettiğinde, kendi prosesinin de aynı kodla çıkması şart. Aksi halde bazı durumlarda PASS görünür ama pipeline devam eder.

**Çözüm:**

```powershell
# scripts/run-powershell.ps1
& pwsh -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @ScriptArgs
$exitCode = $LASTEXITCODE
if ($exitCode -eq $null) { $exitCode = 0 }
exit $exitCode
```

**Test:**

```powershell
# Gate fail ettiğinde exit code 1 döner
pnpm release:gate
echo $LASTEXITCODE  # 1 (fail) veya 0 (pass)
```

---

### 2. Negatif Senaryo Self-Test (1 Dakikalık "Yangın Alarmı")

**Amaç:** Gate'in fail yolunu da kanıtla. Gate sadece "mutlu path"te değil, kötü durumda da doğru çalışmalı.

**Test Senaryoları:**

1. **Dokümana geçici TODO koy** → `pnpm release:gate` Exit 1 vermeli
2. **Helper script adını geçici değiştir** → Helper kontrolü FAIL
3. **Evidence klasör adını geçici boz** → Evidence kontrolü FAIL

**Kullanım:**

```powershell
# Negatif senaryo testlerini çalıştır
pnpm release:gate:test
```

**Beklenen Çıktı:**

```
[PASS] Doküman Placeholder Testi
[PASS] Helper Script Kontrolü Testi
[PASS] Evidence Klasör Kontrolü Testi
[OK] Tüm negatif senaryo testleri geçti!
```

---

### 3. Release Akışına Otomatik Bağlama

**Amaç:** Gate'i "unutulabilir bir komut" olmaktan çıkar. Otomatik çalışmalı.

#### A) Package.json - prepublishOnly Hook

```json
{
  "scripts": {
    "prepublishOnly": "pnpm release:gate"
  }
}
```

**Etki:** `npm publish` veya `pnpm publish` öncesi otomatik gate kontrolü.

#### B) CI/CD - GitHub Actions

```yaml
# .github/workflows/ci.yml
- name: Release Gate Check
  run: pnpm release:gate
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
```

**Etki:** Main/develop branch'lerinde otomatik gate kontrolü. Fail olursa build durur.

---

## 📋 Gate Kontrol Noktaları

Release Gate 5 kontrol yapar:

1. **Evidence Klasörleri Kontrolü**
   - Pozitif paket: `evidence/final_verification_*`
   - Negatif paket: `evidence/negative_tests_*`

2. **Doküman Tutarlılık Kontrolü (Sertleştirilmiş)**
   - Placeholder taraması (HENÜZ TOPLANMADI, TODO, TBD)
   - Evidence klasör referansları kontrolü (gerçek timestamp pattern'leri)
   - Format pattern'leri sadece gerçek referans yoksa fail

3. **Script Runner Tespiti**
   - pwsh (PowerShell 7+) mevcut mu?
   - powershell (fallback) mevcut mu?

4. **Helper Script Kontrolü**
   - `scripts/run-powershell.ps1` mevcut mu?

5. **Package.json Script Kontrolü**
   - `verify:negative` ve `release:gate` script'leri mevcut mu?

---

## 🚀 Kullanım

### Manuel Kontrol

```powershell
# Mühür durumunu kontrol et
pnpm release:gate

# Exit code ile kontrol
if ($LASTEXITCODE -eq 0) {
  Write-Host "Mühür tamamlandı!"
} else {
  Write-Host "Mühür eksik!"
}
```

### Negatif Senaryo Testi

```powershell
# Gate'in fail yolunu test et
pnpm release:gate:test
```

### CI/CD Entegrasyonu

Gate otomatik olarak çalışır:

- `npm publish` / `pnpm publish` öncesi (prepublishOnly hook)
- GitHub Actions CI'da (main/develop branch'lerinde)

---

## 🔧 Teknik Detaylar

### Exit Code Semantik

- **Exit 0:** PASS - Mühür tamamlandı
- **Exit 1:** FAIL - Mühür eksik, sorunlar var

### CI Dostu Çıktı

```
[PASS] FULL MUHUR (4/4 ayak tamamlandi)
  Pozitif: final_verification_2025_01_29
  Negatif: negative_tests_2026_01_01_23_02_07
```

veya

```
[FAIL] YARIM MUHUR - Sorunlar tespit edildi
  Basarisiz ayaklar:
    - Doküman: FINAL_EVIDENCE_INDEX.md (placeholder)
  Detayli sorunlar:
    - FINAL_EVIDENCE_INDEX.md içinde placeholder bulundu: 'TODO'
```

### Strict Mode + Error Handling

```powershell
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
```

### PS5.1 Encoding Koruması

```powershell
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $OutputEncoding = [Console]::OutputEncoding
} catch {
  # PS5.1'de bazı durumlarda başarısız olabilir, sessizce devam et
}
```

---

## 🎯 Gate Modları

### Hard Gate (Default)

```powershell
pnpm release:gate
```

**Davranış:**

- Her kontrol zorunlu
- Fail = exit 1 (pipeline durur)
- CI/CD ve release öncesi kullanım için

### Warn Mode (Soft Gate)

```powershell
pnpm release:gate:warn
```

**Davranış:**

- **Critical issues:** Her zaman exit 1 (release olmamalı)
- **Major/Minor issues:** Sadece WARN, exit 0
- Ekip içi disiplin + görünürlük için

**Neden?** Büyük repo büyüdükçe her şeyi "hard" yapmak bazen yanlış zamanda release'i kilitler; ama "warn" modu ekip içi disiplin + görünürlük sağlar. Ancak kritik hatalar her modda release'i engeller.

**Severity Özeti:**

```
[WARN] 2 issue (0 critical, 1 major, 1 minor)
```

Bu çıktı zamanla "gate sağlık metriği" gibi çalışır.

---

## 📋 Geleceğe Yatırım Standartları

Gate ayaklarını eklerken şu 3 standardı koru:

1. **Her yeni ayak için 1 negatif test** (fail yolu kanıtı)
2. **Her yeni ayak için 1 dokümantasyon satırı** (ne kontrol ediyor, nasıl düzeltilir)
3. **Her yeni ayak için 1 çıktısı kısa** (`[FAIL] <ayak>: <sebep>`)

**Detaylı standartlar:** `docs/ops/RELEASE_GATE_STANDARDS.md`

---

## 🔧 Ek Özellikler

### JSON Output (Opsiyonel)

```powershell
pnpm release:gate:json
```

**Çıktı Formatı (Schema Version 1.0):**

```json
{
  "schemaVersion": "1.0",
  "status": "pass",
  "mode": "hard",
  "timestamp": "2026-01-02T20:34:49.7881039+03:00",
  "counts": {
    "critical": 0,
    "major": 0,
    "minor": 1,
    "total": 1
  },
  "issues": [
    {
      "name": "Minor Issue",
      "severity": "minor",
      "message": "pwsh (PowerShell 7+) PATH'te yok (fallback kullanılıyor)"
    }
  ],
  "positivePackage": "final_verification_2025_01_29",
  "negativePackage": "negative_tests_2026_01_01_23_02_07"
}
```

**Not:** JSON mode'da stdout saf JSON, exit code korunur (PASS=0, FAIL=1). Makineler parse eder, pipeline doğru kırılır.

**Kullanım:**

- Grafana/Prometheus entegrasyonu
- Dashboard'lar için veri kaynağı
- Otomatik raporlama

### CI Artifacts (Otomatik)

Gate FAIL olduğunda CI step'i otomatik olarak şunları artifact olarak yükler:

- `docs/ops/RELEASE_GATE_FINAL.md`
- `evidence/release-gate.log`
- `evidence/final_verification_*/`
- `evidence/negative_tests_*/`

**Retention:** 30 gün

**Not:** `if: always()` kullanıldığı için gate step fail olsa bile artifact upload kesin çalışır. "Gate patladı ama log yok" kabusu biter.

### SLO Policy (Minor → Major Yükseltme)

```powershell
# Minor issue'ları track et, 30+ gün devam ederse Major'a yükselt
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-gate-slo.ps1
```

**Amaç:** Warn mode "kalıcı sarı ışık"a dönüşmesin. 30 gün boyunca minor kalıyorsa artık Major'a yükselt.

**Tracking Dosyası:** `evidence/gate-slo-tracking.json`

**Not:** Bu dosya `.gitignore`'da ignore edilmiş. Herkesin lokalinde farklı tarih/istatistik → sürekli diff önlenir.

---

## 🎯 Sonuç

**Release Gate artık platform bileşeni:**

- ✅ Exit code zinciri kesinleştirildi
- ✅ Negatif senaryo self-test ile fail yolu kanıtlandı (repo temizliği garantisi ile)
- ✅ Release akışına otomatik bağlandı (prepack + prepublishOnly + CI)
- ✅ CI shell netliği (pwsh açıkça belirtildi, Ubuntu'da otomatik kurulum)
- ✅ Severity sistemi (Critical/Major/Minor)
- ✅ JSON output (Grafana/Prometheus entegrasyonu, schemaVersion 1.0)
- ✅ CI artifacts (fail olduğunda otomatik upload, if: always() ile garantili)
- ✅ SLO policy (Minor → Major yükseltme, .gitignore'da ignore edilmiş)

**Bu seviyede bir gate, ileride backtest/optimizer/observability ayakları eklendiğinde bile yönetilebilir kalır. Registry + JSON + CI artifacts + SLO policy dörtlüsü, ileride ayak sayısı 15'e çıksa bile drift'i önler.**

---

**Detaylı implementation guide:** `docs/ops/RELEASE_GATE_IMPLEMENTATION.md`
