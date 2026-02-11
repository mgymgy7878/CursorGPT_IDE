# PowerShell Version Requirement

**Amaç:** Checksum disiplini ve encoding tutarlılığı için deterministik PowerShell versiyonu.

---

## 🔒 Gereksinim: PowerShell 7+

**Neden?**
- `Set-Content -Encoding utf8` davranışı PS5.1 vs PS7 arasında farklı (BOM/newline)
- Checksum tutarlılığı için encoding sabit kalmalı
- PS7+ `Set-Content` daha güvenilir ve standart

---

## ✅ Script Guard

Tüm verification script'leri başında version guard bulunur:

```powershell
# PowerShell Version Guard - Checksum disiplini için PS7+ gerekli
if ($PSVersionTable.PSVersion.Major -lt 7) {
  Write-Host "ERROR: PowerShell 7+ required for checksum consistency." -ForegroundColor Red
  Write-Host "Current version: $($PSVersionTable.PSVersion)" -ForegroundColor Yellow
  Write-Host "Please use 'pwsh' instead of 'powershell' or install PowerShell 7+." -ForegroundColor Yellow
  exit 1
}
```

---

## 📋 Package.json Script'leri

**Kural:** `powershell` yerine `pwsh` kullanılmalı

```json
{
  "scripts": {
    "verify:final": "pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/verify-final.ps1",
    "verify:negative": "pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/verify-negative-tests.ps1",
    "verify:ci": "pnpm -w -r typecheck && pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/verify-final.ps1 -SkipExecutorCheck",
    "verify:ci:full": "pnpm -w -r typecheck && pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/verify-final.ps1"
  }
}
```

---

## 🔧 Kurulum

### Windows
```powershell
# PowerShell 7+ kurulumu
winget install --id Microsoft.PowerShell --source winget
```

### macOS
```bash
brew install --cask powershell
```

### Linux
```bash
# Ubuntu/Debian
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y powershell
```

---

## ✅ Doğrulama

```powershell
# Versiyon kontrolü
pwsh --version
# Beklenen: PowerShell 7.x.x

# veya script içinde
$PSVersionTable.PSVersion
# Beklenen: Major 7 veya üzeri
```

---

## ⚠️ Uyarılar

**PS5.1 Kullanıldığında:**
- Script guard devreye girer ve exit 1 döner
- Hata mesajı gösterilir
- `pwsh` kullanılması önerilir

**Neden PS5.1 Kabul Edilmiyor?**
- Encoding farklılıkları (BOM/newline)
- Checksum tutarsızlığı riski
- JSON/JSONL export'larda sorun

---

**Bu gereksinim, checksum disiplini ve encoding tutarlılığı için kritiktir.**

