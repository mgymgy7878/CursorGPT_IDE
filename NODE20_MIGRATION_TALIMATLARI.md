# Node 20.10.0+ Migration - Çalıştırma Talimatları

## TL;DR
Node 18 → 20.10.0+ geçişi için tek atımlık PowerShell script'i hazırlandı. Tüm build zinciri ve health check'ler otomatik olarak çalışacak.

## Çalıştırma Komutu

```powershell
cd C:\dev\CursorGPT_IDE
powershell -ExecutionPolicy Bypass -File .\scripts\fix-node-and-build.ps1
```

## Beklenen Sonuçlar

### 1. Node Versiyonu
- **Önceki**: v18.18.2
- **Sonrası**: v20.10.0

### 2. Build Zinciri Sırası
1. `@spark/types` → TypeScript tür üretimi
2. `@spark/*` core packages → Çekirdek paketler
3. `apps/web-next` → Next.js uygulaması
4. `services/executor` → API servisi

### 3. Health Check Endpoints
- **web-next**: `http://127.0.0.1:3003/api/public/health` → 200 OK
- **executor**: `http://127.0.0.1:4001/health` → 200 OK
- **Prometheus**: `http://127.0.0.1:3003/api/public/metrics/prom` → Metrics data

### 4. Kanıt Dosyaları
Tüm loglar ve kanıtlar şu klasörde toplanır:
```
logs\evidence\node20_build\[timestamp]\
├── node_version.txt
├── npm_version.txt
├── pnpm_version.txt
├── pnpm_install.log
├── build_types.log
├── build_core.log
├── web_next_build.log
├── executor_build.log
├── web_health.json
├── executor_health.json
├── metrics.prom
├── web_next_BUILD_ID.txt
├── package_json_list.txt
└── migration_report.txt
```

## Hızlı Sorun Giderme

### nvm Bulunamadı Hatası
```powershell
# nvm-windows indir ve kur:
# https://github.com/coreybutler/nvm-windows/releases
```

### Port Çakışması
```powershell
# Mevcut Node süreçlerini temizle:
Get-Process -Name "node" | Stop-Process -Force
```

### Build Hataları
- TypeScript hataları: `pnpm run ts:diag:core`
- Import hataları: `pnpm run fix:imports`
- PostCSS/Tailwind: `pnpm run guard:postcss`

## Sonraki Adımlar

1. **Smoke Test**: `pnpm smoke:all`
2. **Canary Test**: `pnpm run canary-dry-run.ps1`
3. **P95 Latency**: `pnpm smoke:p95`
4. **BTCTurk Spot Entegrasyon**: Duman testi

## Güvenlik Notları

- Script sadece okuma işlemleri yapar (git-safe, pm2-safe)
- Rollback için önceki Node versiyonu: `nvm use 18.18.2`
- Backup otomatik: `pnpm backup`

---
**Hazırlayan**: AI Assistant  
**Tarih**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Proje**: Spark Trading Platform v0.3.3
