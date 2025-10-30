# 🚀 Spark Web-Next — Hızlı Başlatma Kılavuzu

## ERR_CONNECTION_REFUSED Çözümü

### Yöntem 1: Tam Otomatik (Önerilen)

```powershell
.\tools\start-web-dev.ps1
```

**Özellikler:**
- ✅ Otomatik süreç temizliği (node/pnpm)
- ✅ Port 3003 kontrolü ve temizliği
- ✅ Cache temizliği (.next, node_modules/.cache)
- ✅ .env.local otomatik oluşturma
- ✅ Health check (30 deneme, 2sn aralık)
- ✅ Metrics smoke test (JSON + Prometheus)
- ✅ Renkli log çıktısı

**Parametreler:**
```powershell
# Farklı port
.\tools\start-web-dev.ps1 -Port 3004

# Cache temizliği atla
.\tools\start-web-dev.ps1 -NoClean

# Health check ayarları
.\tools\start-web-dev.ps1 -HealthCheckRetries 60 -HealthCheckDelay 1000
```

---

### Yöntem 2: Hızlı Başlat (Manuel)

```powershell
.\tools\quick-start.ps1
```

Sadece süreç temizliği + dev server başlatır. Health check yok.

---

### Yöntem 3: Manuel (İleri düzey)

```powershell
# 1. Süreç temizliği
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process pnpm -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Port kontrolü
netstat -ano | findstr :3003
# Eğer kullanımda ise PID'yi öldür

# 3. Cache temizliği
cd apps/web-next
if (Test-Path .next) { Remove-Item .next -Recurse -Force }
if (Test-Path node_modules\.cache) { Remove-Item node_modules\.cache -Recurse -Force }

# 4. Dev server
$env:PORT="3003"
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm dev
```

---

## Smoke Test (Server Ayağa Kalktıktan Sonra)

```powershell
# Ana sayfa
(Invoke-WebRequest http://127.0.0.1:3003/).StatusCode

# Dashboard
(Invoke-WebRequest http://127.0.0.1:3003/dashboard).StatusCode

# Market
(Invoke-WebRequest http://127.0.0.1:3003/market).StatusCode

# Metrics (JSON)
Invoke-RestMethod http://127.0.0.1:3003/api/public/metrics | ConvertTo-Json -Depth 3

# Metrics (Prometheus)
(Invoke-WebRequest http://127.0.0.1:3003/api/public/metrics.prom).Headers["Content-Type"]
```

Beklenen: Tüm sayfalarda **200 OK**, metrics'te `status.env|feed|broker` verileri.

---

## Yaygın Sorunlar ve Çözümler

### 1. "pnpm: command not found"
```powershell
npm install -g pnpm
```

### 2. Port hâlâ kullanımda
```powershell
# PID bul
netstat -ano | findstr LISTENING | findstr :3003

# Süreci öldür (PID değerini değiştir)
Stop-Process -Id <PID> -Force
```

### 3. Server başlıyor ama sayfalar yüklenmiyor
```powershell
# .env.local kontrolü
cd apps/web-next
cat .env.local

# Yoksa oluştur
@'
NEXT_PUBLIC_API_URL=http://127.0.0.1:4001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
'@ | Out-File -Encoding UTF8 .env.local
```

### 4. "Error: Cannot find module..."
```powershell
# Monorepo kökünden bağımlılıkları yeniden yükle
pnpm -w install
```

### 5. TypeScript hataları
```powershell
# Tip kontrolü
pnpm --filter web-next typecheck

# Build dene
pnpm --filter web-next build
```

---

## Standalone (Üretim Benzeri) Mod

```powershell
cd apps/web-next

# Build
pnpm build

# Standalone server başlat
node .next/standalone/server.js -p 3003
```

> **Not:** `next.config.js` içinde `output: "standalone"` aktif olmalı.

---

## Faydalı Komutlar

```powershell
# Tüm portları kontrol et
Get-NetTCPConnection -LocalPort 3003,4001 -ErrorAction SilentlyContinue

# Node versiyonu (portable)
C:\dev\CursorGPT_IDE\tools\node-v20.10.0-win-x64\node.exe --version

# pnpm workspace listesi
pnpm -w list --depth 0

# Cache temizliği (tüm workspace)
pnpm -w -r exec rm -rf .next node_modules/.cache dist

# Type check (tüm workspace)
pnpm -w -r typecheck
```

---

## Port Standardı

| Servis | Port | Komut |
|--------|------|-------|
| Web-Next (Frontend) | 3003 | `pnpm --filter web-next dev` |
| Executor (Backend) | 4001 | `pnpm --filter executor dev` |

---

## İletişim Akışı

```
Tarayıcı → http://127.0.0.1:3003 (Next.js)
            ↓
        /api/proxy/* → http://127.0.0.1:4001 (Executor)
            ↓
        Binance/Ticaret Motorları
```

---

## Hızlı Başvuru

```powershell
# Tek komutla her şey
.\tools\start-web-dev.ps1

# Tarayıcıda aç
start http://127.0.0.1:3003/dashboard
```

✅ **Sorun çözüldüyse:** Bu dokümanı favorilerine ekle ve bir dahaki sefer direkt `.\tools\start-web-dev.ps1` çalıştır!

