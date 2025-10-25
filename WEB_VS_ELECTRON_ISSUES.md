# Web vs Electron — İki Ayrı Sorun

**Tarih:** 2025-10-25  
**Durum:** Netleştirildi ve çözüldü

---

## ⚠️ Karışan İki Sorun

### 1. Web-Next Dev Sunucusu (127.0.0.1:3003)
**Belirtiler:**
- Tarayıcıda ERR_CONNECTION_REFUSED
- Port 3003 dinlemiyor
- Dashboard açılmıyor

**Sebep:** Dev sunucusu başlatılmamış veya port dolu

---

### 2. Electron Desktop App (js-yaml)
**Belirtiler:**
- Windows error dialog: "Cannot find module 'js-yaml'"
- Electron app açılmıyor
- Stack trace: `AppUpdater.js`, `BaseUpdater.js`

**Sebep:** Paketlenmiş desktop app'te eksik bağımlılık

**ÖNEMLİ:** Bu iki sorun **birbirinden bağımsız**. Electron hatası web-next'i ETKİLEMEZ.

---

## 🔧 Çözüm 1: Web-Next Dev Sunucusu (90 Saniye)

### Adım 1: Temiz Başlangıç
```powershell
# A) Tüm Node süreçlerini kapat
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# B) UI klasörüne geç
Set-Location apps/web-next

# C) Mock .env.local oluştur (ENGINE_URL / PROMETHEUS_URL YOK!)
@'
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
'@ | Out-File .env.local -Encoding utf8 -Force

# D) Next cache'i temizle
If (Test-Path .next) { Remove-Item .next -Recurse -Force }

# E) Bağımlılıkları yükle
corepack enable
pnpm install
```

### Adım 2: İki Terminal Başlat

**Terminal 1 (WebSocket):**
```powershell
cd apps/web-next
pnpm ws:dev
```

**Beklenen çıktı:**
```
[dev-ws] listening on ws://127.0.0.1:4001
```

**Terminal 2 (Next.js):**
```powershell
cd apps/web-next
pnpm dev
```

**Beklenen çıktı:**
```
✓ Ready in ~25s
- Local:        http://localhost:3003
- Environments: .env.local
```

### Adım 3: Doğrulama

```powershell
# Port kontrolü
Get-NetTCPConnection -LocalPort 3003,4001 -ErrorAction SilentlyContinue

# Health endpoint'ler
curl http://127.0.0.1:3003/api/public/engine-health
curl http://127.0.0.1:3003/api/public/error-budget
```

**Beklenen JSON:**
```json
{
  "status": "OK",
  "source": "mock",
  ...
}
```

**Dashboard:**
```
http://127.0.0.1:3003/dashboard
```

**Beklenen:** Status bar → API ✅ WS ✅ Engine ✅

---

## 🐛 Sorun Giderme: Web-Next

### Port Çakışması
```powershell
# Farklı port kullan
pnpm dev -- -p 3004

# Sonra aç
http://127.0.0.1:3004/dashboard
```

### Dev Server Başlamıyor
```powershell
# Logları kontrol et
Get-Content .next/trace -ErrorAction SilentlyContinue | Select-Object -First 50

# veya dev terminalinde ilk stack trace'i yakala
```

**Yaygın sebepler:**
- `.env.local` içinde `ENGINE_URL` var ama backend kapalı → Dosyadan sil
- `node_modules` bozuk → `pnpm install` tekrar çalıştır
- Port başka uygulama tarafından kullanılıyor → `Get-NetTCPConnection -LocalPort 3003`

### Proxy/VPN Sorunu
```powershell
# Tarayıcı proxy ayarını "Automatic" yap
# veya farklı tarayıcı dene (Edge/Chrome/Firefox)
```

---

## 🖥️ Çözüm 2: Electron Desktop App (js-yaml)

### A) Kullanıcı Çözümü (En Hızlı)

**Adım 1: Uygulamayı Kaldır**
1. Windows Ayarlar → Uygulamalar → "Spark Trading Desktop"
2. Kaldır
3. `%LocalAppData%\Programs\spark-trading-desktop` klasörünü sil (varsa)

**Adım 2: Yeniden Kur**
1. En son sürümü indir
2. Kurulum dosyasını çalıştır
3. İlk açılışı test et

**Adım 3: Hâlâ Hata Varsa**
→ Paketlenmiş sürüm kırık; **web arayüzünü kullan** (yukarıdaki adımlarla)

---

### B) Geliştirici Çözümü (Uygulamayı Sen Paketliyorsan)

**Adım 1: js-yaml Bağımlılığı Ekle**
```bash
# Package root'ta (desktop-electron veya benzeri)
pnpm add js-yaml

# ÖNEMLİ: dependencies içinde, devDependencies DEĞİL
```

**Adım 2: package.json Kontrol**
```json
{
  "dependencies": {
    "js-yaml": "^4.1.0",  // ✅ Burada olmalı
    "electron-updater": "^6.x.x"
  },
  "devDependencies": {
    // ❌ js-yaml burada olmamalı
  }
}
```

**Adım 3: electron-builder Konfigürasyonu**

**package.json içinde:**
```json
{
  "build": {
    "asar": true,  // ✅ asar paketleme açık
    "files": [
      "dist/**/*",
      "node_modules/**/*",  // ✅ node_modules dahil
      "!node_modules/**/{CHANGELOG.md,README.md,LICENSE}"  // Sadece docs hariç
    ],
    "asarUnpack": [
      "**/*.node"  // Sadece native modüller dışarıda
    ]
  }
}
```

**electron-builder.yml varsa:**
```yaml
asar: true
files:
  - dist/**/*
  - node_modules/**/*
  - '!node_modules/**/{CHANGELOG.md,README.md,LICENSE}'
asarUnpack:
  - '**/*.node'
```

**Adım 4: Build ve Test**
```powershell
# Development test
pnpm run electron:dev

# Production package
pnpm run electron:build

# Kurulum dosyasını test et
# (dist/ klasöründe .exe veya .msi)
```

**Adım 5: Doğrulama**
```powershell
# Paketlenmiş app'i aç
# Hata yoksa → js-yaml başarıyla dahil edilmiş
# Hâlâ hata varsa → asar içeriğini kontrol et

# asar extract (npm i -g asar gerekir)
asar extract app.asar extracted/
cat extracted/package.json | grep js-yaml
```

---

## 🧪 Tam Doğrulama Checklist

### Web-Next (Mock Mode)
- [ ] `pnpm ws:dev` çıktısı: `listening on ws://127.0.0.1:4001`
- [ ] `pnpm dev` çıktısı: `Ready on http://localhost:3003`
- [ ] `Get-NetTCPConnection -LocalPort 3003,4001` → İki satır sonuç
- [ ] `curl http://127.0.0.1:3003/api/public/engine-health` → JSON, `"source":"mock"`
- [ ] `curl http://127.0.0.1:3003/api/public/error-budget` → JSON, `"source":"mock"`
- [ ] Dashboard: http://127.0.0.1:3003/dashboard → Status bar tümü yeşil

### Electron Desktop App
- [ ] Uygulama açılıyor (js-yaml hatası yok)
- [ ] Veya: Web arayüzü kullanılıyor (alternatif)

---

## 📊 İlişki Matrisi

| Sorun | Etkilediği | Etkilemediği | Çözüm Süresi |
|-------|-----------|-------------|--------------|
| Web-next başlamıyor | Dashboard erişimi | Electron app | ~90 saniye |
| Electron js-yaml | Desktop app | Web-next UI | ~5 dakika (kullanıcı) / ~30 dakika (geliştirici) |

**Önemli:** İki sorun birbirinden **tamamen bağımsız**.

---

## 🚀 Hızlı Başlangıç (Sadece Web)

```powershell
# Tek komut reset (INSTANT_FIX.md'den)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Set-Location apps/web-next; @'
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
'@ | Out-File .env.local -Encoding utf8 -Force; If (Test-Path .next) { Remove-Item .next -Recurse -Force }; pnpm install; Write-Host "✅ Reset complete! Now run:" -ForegroundColor Green; Write-Host "  Terminal 1: pnpm ws:dev" -ForegroundColor Cyan; Write-Host "  Terminal 2: pnpm dev" -ForegroundColor Cyan
```

**Sonra:**
```powershell
# Terminal 1
pnpm ws:dev

# Terminal 2
pnpm dev
```

**Dashboard:** http://127.0.0.1:3003/dashboard

---

## 📝 Özet

**Web-Next:**
- Sorun: Port dinlemiyor
- Çözüm: Temiz .env + cache + pnpm install + dev başlat
- Süre: 90 saniye
- Araç: `INSTANT_FIX.md`

**Electron:**
- Sorun: js-yaml eksik
- Çözüm: Yeniden kur (kullanıcı) / js-yaml dependencies + rebuild (geliştirici)
- Süre: 5-30 dakika
- Etki: Web-next'i etkilemez

---

## 🔗 İlgili Dökümanlar

- `INSTANT_FIX.md` — Tek komut web-next fix
- `ISSUE_500_RECOVERY.md` — Internal Server Error (500)
- `TROUBLESHOOTING.md` — Kapsamlı sorun giderme
- `QUICK_START.md` — Platform başlangıç

---

**Son Güncelleme:** 2025-10-25  
**Durum:** Çözüldü ve dokümante edildi  
**Validasyon:** Başarılı

*İki ayrı sorun, iki ayrı çözüm. Web-next için instant fix ready. Electron için kullanıcı/geliştirici yolları açık.*

