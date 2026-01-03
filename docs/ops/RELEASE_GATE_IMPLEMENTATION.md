# Release Gate - Implementation Guide

**Tarih:** 1 Ocak 2026
**Durum:** ✅ Production-Ready Gate

---

## 🎯 Release Gate Nedir?

Release Gate, mühür durumunu tek komutla kontrol eden ve CI/CD pipeline'ında otomatik çalışan bir doğrulama mekanizmasıdır. "Mühür" sadece belge değil; otomatik olarak doğrulanan bir sözleşme.

---

## 🚀 Hızlı Başlangıç

**Golden Commands (Kopyala-Yapıştır):**

```powershell
# Hard gate (CI/CD, release öncesi)
pnpm release:gate

# Warn mode (geliştirme, ekip içi görünürlük)
pnpm release:gate:warn

# JSON output (dashboard/metrics)
pnpm release:gate:json > evidence/gate-status.json
```

**Diğer Komutlar:**

```powershell
# Negatif test (fail yolu kanıtı)
pnpm release:gate:test
```

---

## 📋 Implementation Checklist

### ✅ Kritik Köşeler (Kesinleştirildi)

- [x] **Exit Code Zinciri** - `run-powershell.ps1` exit code'u birebir forward ediyor
- [x] **Negatif Senaryo Self-Test** - Fail yolu kanıtlandı (repo temizliği garantisi ile)
- [x] **Release Akışına Otomatik Bağlama** - prepack + prepublishOnly + CI
- [x] **CI Shell Netliği** - pwsh açıkça belirtildi, Ubuntu'da otomatik kurulum
- [x] **Test Script Repo Temizliği** - Git diff kontrolü ile garantili
- [x] **Lifecycle Güvence** - prepack + prepublishOnly ile tüm varyasyonlar kapsandı

### ✅ Ek Özellikler

- [x] **Severity Sistemi** - Critical/Major/Minor ayrımı
- [x] **Warn Mode** - Critical → exit 1, Major/Minor → WARN + exit 0
- [x] **JSON Output** - Grafana/Prometheus entegrasyonu için
- [x] **CI Artifacts** - Fail olduğunda otomatik artifact upload
- [x] **SLO Policy** - Minor'ları zamanla Major'a yükseltme (30 gün)
- [x] **Registry Pattern** - Ayakların tek kaynaktan yönetilmesi (gelecek)

---

## 🔧 Ops Checklist

### Günlük Kullanım

```powershell
# Geliştirme sırasında (warn mode)
pnpm release:gate:warn

# Release öncesi (hard gate)
pnpm release:gate

# JSON output (dashboard/metrics)
pnpm release:gate:json > gate-status.json
```

### CI/CD Entegrasyonu

**GitHub Actions:**

```yaml
- name: Release Gate Check
  id: gate_check
  shell: pwsh
  run: |
    New-Item -ItemType Directory -Force -Path evidence | Out-Null
    pnpm release:gate 2>&1 | Tee-Object -FilePath evidence/release-gate.log
    $code = $LASTEXITCODE
    if ($code -ne 0) { exit $code }
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
  continue-on-error: false

- name: Upload Gate Artifacts
  if: always() && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop') && steps.gate_check.conclusion == 'failure'
  uses: actions/upload-artifact@v4
  with:
    name: release-gate-failure-${{ github.run_number }}
    path: |
      docs/ops/RELEASE_GATE_FINAL.md
      evidence/release-gate.log
      evidence/final_verification_*/
      evidence/negative_tests_*/
    retention-days: 30
    if-no-files-found: warn
```

**Kritik Not:** `Tee-Object` kullanıldığında `$LASTEXITCODE`'u yakalayıp explicit exit etmek şart. Aksi halde gate FAIL etse bile step PASS gösterebilir (Tee-Object'in exit code'u genelde 0'dır).

**Package.json Hooks:**

```json
{
  "scripts": {
    "prepack": "pnpm release:gate",
    "prepublishOnly": "pnpm release:gate"
  }
}
```

### Troubleshooting

**Gate FAIL oldu:**

1. CI artifacts'ı indir (otomatik upload edilmiş)
2. `evidence/release-gate.log` dosyasını kontrol et
3. Severity özetine bak: `[FAIL] X issue (Y critical, Z major, W minor)`
4. Critical issues'ları önce düzelt (release olmamalı)
5. Major/Minor issues'ları warn mode'da kontrol et

**JSON Parse Hatası:**

```powershell
# JSON mode'da sadece JSON çıktısı (stderr'e yönlendirilmiş)
pnpm release:gate:json 2>$null | ConvertFrom-Json
```

**SLO Tracking:**

```powershell
# Minor issue'ları track et, 30+ gün devam ederse Major'a yükselt
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-gate-slo.ps1
```

---

## 📊 JSON Schema

**Version:** 1.0

```json
{
  "schemaVersion": "1.0",
  "status": "pass" | "fail",
  "mode": "hard" | "warn",
  "timestamp": "ISO 8601",
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

**Kullanım:**

- Grafana/Prometheus entegrasyonu
- Dashboard'lar için veri kaynağı
- Otomatik raporlama

---

## 🔒 Schema Lock

**Schema Version:** 1.0

**Kural:** Breaking değişiklikte 2.0'a bump + migration notu şart.

Bu, gelecekte JSON tüketen dashboard/CI parser'larının kırılmasını önler.

**Migration Notu Örneği:**

```markdown
## Schema 2.0 Migration

**Breaking Changes:**

- `counts` → `severityCounts` (alan adı değişti)
- `issues[].message` → `issues[].description` (alan adı değişti)

**Migration:**

- Dashboard'ları güncelle: `counts` → `severityCounts`
- CI parser'ları güncelle: `issues[].message` → `issues[].description`
```

---

## 🔒 Severity Sistemi

### Critical

- Release olmamalı (her modda exit 1)
- Evidence klasörleri yok
- Doküman placeholder'ları
- Script runner yok
- Helper script yok

### Major

- Önemli ama warn mode'da sadece uyarı
- (Şu an örnek yok, gelecekte eklenebilir)

### Minor

- Küçük sorunlar, warn mode'da sadece uyarı
- pwsh yok (fallback var)
- package.json script'leri eksik

**SLO Policy:** 30 gün boyunca minor kalıyorsa Major'a yükselt.

---

## 🎯 Geleceğe Yatırım

Gate'e yeni ayak eklerken:

1. **Registry entry** - `scripts/release-gate-registry.ps1` (Name, Severity, CheckFn, FixHint)
2. **1 negatif test** - `scripts/test-release-gate-fail.ps1`
3. **1 fixHint** - Registry'den otomatik çıktı

**Detaylı standartlar:** `docs/ops/RELEASE_GATE_STANDARDS.md`

---

## 📚 İlgili Dokümanlar

- `docs/ops/RELEASE_GATE_FINAL.md` - Detaylı implementation guide
- `docs/ops/RELEASE_GATE_STANDARDS.md` - Geleceğe yatırım standartları
- `scripts/release-gate-registry.ps1` - Ayak registry (gelecek)

---

## 🧠 Mental Alias (3 Ultra-Kısa Kural)

Gate'i büyütürken aklında tut:

1. **Pipeline'da pipe varsa → `$LASTEXITCODE` yakala → `exit` et.**
   - `Tee-Object`, `Select-String`, `Where-Object` gibi pipe'lar exit code'u kaybettirebilir
   - Her zaman: `$code = $LASTEXITCODE; if ($code -ne 0) { exit $code }`

2. **Fail olduğunda kanıt otomatik upload.**
   - CI'da `if: always() && steps.gate_check.conclusion == 'failure'`
   - `if-no-files-found: warn` ile klasör yok durumunda step kırılmaz

3. **Yeni ayak = registry + negatif test + fixHint.**
   - Registry entry (Name, Severity, CheckFn, FixHint)
   - 1 negatif test (`test-release-gate-fail.ps1`)
   - 1 fixHint (nasıl düzeltilir)

---

**Bu gate, backtest/optimizer/observability ayakları eklendiğinde bile yönetilebilir kalır. Registry + JSON + CI artifacts + SLO policy dörtlüsü, ileride ayak sayısı 15'e çıksa bile drift'i önler.**

**Gate artık bir script değil; repo'nun bağışıklık sistemi.**

---

## 📚 Referans

**Golden Commands:** → [Hızlı Başlangıç](#-hızlı-başlangıç)
