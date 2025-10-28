# Next.js Standalone Deployment Guide

**Proje:** Spark Trading Platform  
**Tarih:** 2025-10-24  
**Next.js Version:** 14.2.13

---

## 🎯 Standalone Output Nedir?

Next.js **`output: 'standalone'`** modu, production deployment için **self-contained** bir build oluşturur:

- ✅ Minimal dependency footprint
- ✅ Docker-friendly
- ✅ Hızlı başlangıç
- ✅ CDN-agnostic static assets

### Neden Standalone?

**Geleneksel Build:**
```
.next/
├── server/
├── static/
└── ...
node_modules/ (tüm dependencies)
```

**Standalone Build:**
```
.next/standalone/
├── server.js (entry point)
├── node_modules/ (sadece production deps)
└── ...
```

**Avantajlar:**
- 📦 **Küçük deployment boyutu** (gereksiz dev deps yok)
- 🚀 **Hızlı başlangıç** (minimum dependency yükleme)
- 🐳 **Docker optimize** (multi-stage build için ideal)

---

## ⚙️ Konfigürasyon

### `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // ✅ Standalone mode aktif
  // ... diğer ayarlar
};

export default nextConfig;
```

### Build & Start

```bash
# 1. Build
pnpm --filter web-next build

# 2. Start (standalone mode)
cd apps/web-next
PORT=3004 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

---

## 🚀 Production Deployment

### Manuel Başlatma

```bash
# Environment variables
export PORT=3004
export HOSTNAME=0.0.0.0  # Tüm interface'leri dinle
export NODE_ENV=production

# Start server
node apps/web-next/.next/standalone/server.js
```

### PowerShell ile (Windows)

```powershell
# Environment variables
$env:PORT = "3004"
$env:HOSTNAME = "127.0.0.1"
$env:NODE_ENV = "production"

# Start server
node apps/web-next/.next/standalone/server.js
```

### Script ile (`scripts/start-standalone.ps1`)

```powershell
param([int]$Port=3004)

# Kill eski process
try { npx -y kill-port $Port 3000 | Out-Null } catch {}

# Environment setup
$env:PORT = "$Port"
$env:HOSTNAME = "127.0.0.1"

# Start
node "apps/web-next/.next/standalone/server.js"
```

**Kullanım:**
```bash
powershell -File scripts/start-standalone.ps1 -Port 3004
```

---

## 🐳 Docker Deployment

### Dockerfile (Multi-stage Build)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && \
    pnpm --filter web-next build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0

# Copy standalone build
COPY --from=builder /app/apps/web-next/.next/standalone ./
COPY --from=builder /app/apps/web-next/.next/static ./apps/web-next/.next/static
COPY --from=builder /app/apps/web-next/public ./apps/web-next/public

EXPOSE 3004

CMD ["node", "apps/web-next/.next/standalone/server.js"]
```

### Build & Run
```bash
# Build
docker build -t spark-web-next:latest .

# Run
docker run -p 3004:3004 \
  -e PORT=3004 \
  -e HOSTNAME=0.0.0.0 \
  spark-web-next:latest
```

---

## 🔧 Environment Variables

### Required Variables

| Variable | Default | Açıklama |
|----------|---------|----------|
| `PORT` | `3003` | HTTP server port |
| `HOSTNAME` | `localhost` | Bind hostname (`0.0.0.0` = tüm interfaces) |
| `NODE_ENV` | `development` | Environment (`production` önerilir) |

### Optional Variables

| Variable | Default | Açıklama |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | - | API base URL |
| `NEXT_PUBLIC_WS_URL` | - | WebSocket URL |
| `SPARK_VERIFY_STRICT_LINT` | `0` | Strict lint mode (`1` = aktif) |

### Örnek `.env.local`

```bash
# Server
PORT=3004
HOSTNAME=0.0.0.0
NODE_ENV=production

# Public (client-side)
NEXT_PUBLIC_API_URL=https://api.spark.trading
NEXT_PUBLIC_WS_URL=wss://ws.spark.trading

# Lint (verify script)
SPARK_VERIFY_STRICT_LINT=0
```

---

## 📊 Health Checks

### Port Dinleme Kontrolü

```powershell
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3004 -State Listen -ErrorAction SilentlyContinue

# Linux/Mac
lsof -i :3004
# veya
netstat -an | grep 3004
```

### HTTP Health Check

```bash
# Root endpoint
curl http://127.0.0.1:3004/

# Metrics endpoint
curl http://127.0.0.1:3004/api/public/metrics.prom

# Expected: HTTP 200
```

### Smoke Test

```bash
powershell -File scripts/smoke_v2.ps1 -Port 3004

# Output:
# ready_via: prom
# try #1 | port: 3004
# msgs_total delta: 0
# staleness s: 999
# SMOKE: ATTENTION
```

---

## 🛠️ Troubleshooting

### Sorun: `Cannot find module 'server.js'`

**Hata:**
```
Error: Cannot find module 'C:\dev\apps\web-next\.next\standalone\server.js'
```

**Çözüm:**
```bash
# Build eksik - tekrar build et
pnpm --filter web-next build

# Standalone output oluşturuldu mu kontrol et
ls apps/web-next/.next/standalone/server.js
```

### Sorun: Port zaten kullanımda

**Hata:**
```
Error: listen EADDRINUSE: address already in use :::3004
```

**Çözüm:**
```bash
# Port'u kill et
npx kill-port 3004

# Veya farklı port kullan
PORT=3005 node .next/standalone/server.js
```

### Sorun: `clientModules` undefined

**Hata:**
```
TypeError: Cannot read properties of undefined (reading 'clientModules')
```

**Neden:**
- Standalone build eksik veya bozuk
- `node_modules` ve `.next` temizlenmesi gerekiyor

**Çözüm:**
```bash
# Tam temizlik
pnpm --filter web-next clean
rm -rf apps/web-next/.next
rm -rf apps/web-next/node_modules

# Yeniden install ve build
pnpm install
pnpm --filter web-next build

# Test
PORT=3004 node apps/web-next/.next/standalone/server.js
```

---

## 📋 Production Checklist

### Pre-deployment

- [ ] `output: 'standalone'` aktif (`next.config.mjs`)
- [ ] `pnpm build` başarılı
- [ ] `server.js` mevcut (`.next/standalone/`)
- [ ] Environment variables ayarlandı
- [ ] Port açık ve erişilebilir

### Post-deployment

- [ ] Server başladı (HTTP 200)
- [ ] Metrics endpoint çalışıyor (`/api/public/metrics.prom`)
- [ ] Smoke test PASS/ATTENTION
- [ ] Log dosyaları kontrol edildi
- [ ] Memory/CPU kullanımı normal

### Monitoring

```bash
# Process monitoring
pm2 start apps/web-next/.next/standalone/server.js --name spark-web

# Logs
pm2 logs spark-web

# Status
pm2 status
```

---

## 📚 Kaynaklar

- [Next.js Output Configuration](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Next.js Standalone Mode](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output#automatically-copying-traced-files)
- [Docker and Next.js](https://github.com/vercel/next.js/tree/canary/examples/with-docker)

---

## 🔗 İlgili Dökümanlar

- [METRICS_CANARY.md](./METRICS_CANARY.md) - Metrics ve smoke test detayları
- [LINT_STRICT_PLAN.md](./LINT_STRICT_PLAN.md) - Lint policy ve strict mode

---

**Son Güncelleme:** 2025-10-24  
**Bakım:** Next.js versiyonu güncellendiğinde revize edilir
