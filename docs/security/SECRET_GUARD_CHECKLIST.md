# Secret Guard Hızlı Doğrulama Kontrol Listesi

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle
```bash
pnpm install
pnpm prepare  # Husky kurulumu
```

### 2. Gitleaks Kurulumu
```bash
# Windows (scoop)
scoop install gitleaks

# Windows (chocolatey)
choco install gitleaks

# macOS
brew install gitleaks

# Linux
ver=v8.18.4
curl -sSL https://github.com/gitleaks/gitleaks/releases/download/${ver}/gitleaks_${ver}_Linux_x86_64.tar.gz | tar -xz
sudo mv gitleaks /usr/local/bin/
```

## ✅ Lokal Doğrulama

### Pre-commit Testi
1. Küçük bir değişiklik yap
2. `git add .` ve `git commit -m "test"`
3. Beklenen davranış:
   - **Gitleaks yoksa**: `[husky] gitleaks yok; secrets taraması atlandı` (commit olur)
   - **Gitleaks varsa**: `gitleaks protect --staged` çalışır, sızıntı varsa engeller

### Manuel Tarama
```bash
# Windows CMD
gitleaks detect -c .gitleaks.toml -v --no-banner --redact --report-format sarif --report-path runtime\gitleaks.sarif && echo PASS>runtime\leaks_status.txt || echo FAIL>runtime\leaks_status.txt

# POSIX (Linux/macOS)
gitleaks detect -c .gitleaks.toml -v --no-banner --redact \
  --report-format sarif --report-path runtime/gitleaks.sarif \
  && echo PASS>runtime/leaks_status.txt || echo FAIL>runtime/leaks_status.txt

# Sonucu kontrol et
type runtime\leaks_status.txt  # Windows
cat runtime/leaks_status.txt    # Linux/macOS
```

## 🔍 CI'de Beklenenler

1. **Job Status**: `Secret Guard / secret-guard` → ✅ PASS
2. **Security Tab**: Code Scanning Alerts → gitleaks bulguları (SARIF)
3. **Artifacts**: `gitleaks-sarif` dosyası
4. **Schedule**: Haftalık otomatik tarama (Pazartesi 02:19 UTC)

## ⚠️ Sık Karşılaşılan Sorunlar

### 1. SARIF Upload İzin Hatası
**Sorun**: `Error: Resource not accessible by integration`
**Çözüm**: Workflow'da permissions eklendi:
```yaml
permissions:
  contents: read
  security-events: write
```

### 2. Yanlış Pozitifler
**Sorun**: Test/örnek kodlar sızıntı olarak algılanıyor
**Çözüm**: `.gitleaks.toml` → `[allowlist]` içine ekle:
- Zararsız path'ler: `runtime/`, `docs/screenshots/`
- Test pattern'leri: `examplekey`, `test_secret`
- **ASLA gerçek secret'ları allowlist'e ekleme!**

### 3. Code Scanning Görünmüyor
**Sorun**: Private repo'da Security tab'da görünmüyor
**Çözümler**:
- Organization ayarlarında Code Scanning'i etkinleştir
- Alternatif: CI artifacts'tan SARIF dosyasını indir

## 🛡️ Branch Protection

Settings → Branches → main → Protection rules:
- [x] Require status checks to pass
  - [x] `CI / ci` (mevcut)
  - [x] `Weekly Doctor / weekly-doctor` (mevcut)
  - [x] `Structure Guard / structure-guard`
  - [x] `Secret Guard / secret-guard` ⬅️ YENİ

## 🔧 Production-Grade Özellikler

✅ **Deterministik CI**: Gitleaks v8.18.4 sabitlendi
✅ **SARIF Raporlama**: GitHub Code Scanning entegrasyonu
✅ **Pre-commit Hook**: Husky ile otomatik koruma
✅ **Haftalık Tarama**: Cron schedule ile
✅ **Concurrency Control**: Aynı anda tek job
✅ **Redaction**: Bulunan secret'lar maskelenir

## 📝 Kanıt Dosyaları
- `runtime/leaks_status.txt`: Son tarama durumu (PASS/FAIL)
- `runtime/gitleaks.sarif`: Detaylı SARIF raporu
- `.husky/pre-commit`: Hook script (executable) 