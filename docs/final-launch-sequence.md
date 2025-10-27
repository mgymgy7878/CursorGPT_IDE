# Final Launch Sequence - WebSocket Migration

## Son 6 Adım – Launch Sırası

### 1️⃣ Environment Flags (Build-time + Runtime)

```powershell
# Next.js (build-time)
$Env:NEXT_PUBLIC_WS_ENABLED = "true"

# Runtime
$Env:NODE_ENV = "production"
# Optional: $Env:WS_ENABLED = "true"
```

**Not**: `NEXT_PUBLIC_*` değerleri yeniden build gerektirir.

### 2️⃣ Runbook Execution

```powershell
# Windows
.\scripts\cutover-runbook.ps1
```

```bash
# Linux
bash ./scripts/cutover-runbook-linux.sh
```

### 3️⃣ Quick Validation (Automatic + Spot)

```powershell
.\scripts\quick-go-no-go-check.ps1
```

**Expected Results:**

- UI health 200 ✅
- Executor health 200 ✅
- `/btcturk` page: OPEN (green) pill, no reconnect loops ✅

### 4️⃣ Nginx WS Upgrade (Production)

```bash
nginx -t && nginx -s reload
```

**Expected**: 101 Switching Protocols

### 5️⃣ Canary Run + Parser

1. GitHub Actions → Receipts Gate → Run workflow
2. Parser PASS ✅
3. `canary_resp.json` artifact created ✅

### 6️⃣ 10-Minute Observation

```bash
pm2 logs --lines 200
```

**Check:**

- No errors ✅
- P95 < 1s ✅
- Reconnect not increasing ✅

## Hızlı Müdahale Matrisi

| Issue                  | Solution                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI mock:true stuck** | `NEXT_PUBLIC_WS_ENABLED=true` ile yeniden build → `pm2 restart all`                                                                                   |
| **WS 400/502**         | Nginx'te:<br/>`proxy_http_version 1.1;`<br/>`proxy_set_header Upgrade $http_upgrade;`<br/>`proxy_set_header Connection "upgrade";`<br/>Reload + retry |
| **Port conflict**      | `pm2 delete all` → 3003/4001 PID cleanup → runbook retry                                                                                              |
| **High latency**       | Network & Nginx timeouts; UI DEGRADED = polling fallback active                                                                                       |

## 24 Saat İzleme (Automation Ready)

### Start Monitoring

```powershell
.\scripts\monitoring-24h.ps1
```

### Thresholds

- Health ≥ 99.5%
- Canary PASS ≥ 95%
- WS P95 < 1s

### Evidence Auto-Collection

- `evidence/local/github/*`

## Geri Alma (Hızlıdan Güvenliye)

### 1. Feature Flag Rollback

```bash
NEXT_PUBLIC_WS_ENABLED=false
# Rebuild + pm2 restart all
```

### 2. PM2 Rollback

```bash
pm2 delete all
pm2 start <previous-ecosystem/version>
```

### 3. WS Disable

```bash
# Comment out Nginx WS upgrade blocks → reload
```

## Küçük Ama Kritik Son Kontrol

### ✅ Consistency Check

- `NEXT_PUBLIC_WS_ENABLED` (build-time) ✅
- `WS_ENABLED` (runtime) - same direction ✅

### ✅ Secrets Check

- `SPARK_API_URL` set ✅
- `SPARK_API_TOKEN` set ✅

### ✅ Evidence Check

- `final_go_no_go_ready.txt` ✅
- `canary_resp.json` ✅
- Smoke/health outputs ✅

## Execution Commands

### Launch Sequence

```powershell
# 1. Run cutover
.\scripts\cutover-runbook.ps1

# 2. Quick validation
.\scripts\quick-go-no-go-check.ps1

# 3. Start monitoring
.\scripts\monitoring-24h.ps1
```

### Manual Steps

1. Navigate to `/btcturk` for WebSocket validation
2. Trigger canary in GitHub Actions
3. Monitor for 10 minutes
4. Start 24-hour monitoring

---

**Status**: Ready for Launch
**Last Updated**: 2025-01-08
**Version**: 1.0
