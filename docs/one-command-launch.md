# One-Command Launch - WebSocket Migration

## 1️⃣ Tek Komutla Başlat

```powershell
.\scripts\launch-execution.ps1
```

**Expected**: Script bitince otomatik kanıtlar `evidence/local/github/` altına düşmeli (örn. `launch_sequence_final.txt`).

## 2️⃣ 60 sn Preflight (Hemen Ardından)

```powershell
.\scripts\quick-go-no-go-check.ps1
nginx -t ; nginx -s reload
pm2 logs --lines 100
```

### Beklenenler:

- UI `/api/public/health` → 200 OK ✅
- Executor `/health` → 200 OK ✅
- Nginx test ok, reload sorunsuz ✅
- `/btcturk` sayfasında OPEN (reconnect loop yok) ✅

## 3️⃣ Canary Tetikle + Artifact Doğrula

1. GitHub Actions → Receipts Gate → Run workflow
2. Workflow bittiğinde artifact'te `canary_resp.json` ve parser PASS olmalı ✅

## 4️⃣ 10 Dakikalık Canlı Gözlem

### Eşikler:

- Health ≥ 99.5% ✅
- Canary PASS ≥ 95% ✅
- WS P95 < 1s ✅

### Kontroller:

- `pm2 logs`'ta error yok ✅
- UI status pill OPEN, DEGRADED/CLOSED olmamalı ✅

### Evidence Kontrolü:

```powershell
Get-ChildItem evidence\local\github\ | sort LastWriteTime -desc | select -First 10
```

## 5️⃣ Hızlı Müdahale (X olursa → Y yap)

### UI mock:true kaldı → WS flag'le rebuild:

```powershell
$env:NEXT_PUBLIC_WS_ENABLED="true"
pnpm -w --filter web-next run build
pm2 restart all
```

### WS 400/502 → Nginx WS upgrade başlıklarını doğrula:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

```bash
nginx -t && nginx -s reload
```

### Port çakışması (3003/4001) → süreç temizliği:

```powershell
pm2 delete all
# Gerekirse PID öldür: netstat -ano | findstr :3003
# taskkill /PID <PID> /F
.\scripts\launch-execution.ps1
```

### Yüksek gecikme → Nginx timeouts & ağ:

- UI DEGRADED ise otomatik polling fallback zaten devrede ✅

## 6️⃣ Rollback (En Hızlıdan Tam Geri Dönüşe)

### Feature flag rollback (en hızlı):

```powershell
$env:NEXT_PUBLIC_WS_ENABLED="false"
pnpm -w --filter web-next run build
pm2 restart all
```

### PM2 rollback:

```bash
pm2 delete all
pm2 start <previous-stable-ecosystem/version>
```

### WS'i geçici kapat:

```bash
# Nginx'te upgrade bloklarını yoruma al → nginx -t && nginx -s reload
```

## Başarı Kriterleri (Go Kararı)

### ✅ Go Criteria:

- `quick-go-no-go-check.ps1` PASS ✅
- Canary PASS ve `canary_resp.json` oluştu ✅
- UI pill OPEN, reconnect loop yok ✅
- İlk 10 dakikada P95 < 1s, error log yok ✅

## Execution Summary

### Launch Command:

```powershell
.\scripts\launch-execution.ps1
```

### Post-Launch Validation:

```powershell
.\scripts\quick-go-no-go-check.ps1
```

### Monitoring:

```powershell
pm2 logs --lines 100
pm2 monit
```

### Evidence Check:

```powershell
Get-ChildItem evidence\local\github\ | sort LastWriteTime -desc | select -First 10
```

---

**Status**: Ready for One-Command Launch
**Command**: `.\scripts\launch-execution.ps1`
**Last Updated**: 2025-01-08
**Version**: 1.0
