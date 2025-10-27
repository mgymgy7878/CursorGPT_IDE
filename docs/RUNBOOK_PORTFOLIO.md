# Spark • Portfolio Runbook

**Kaynak:** Spark Portfolio Performance Dashboard (UID: spark-portfolio)  
**Scope:** env=$env, exchange=$exchange, service=$service  
**Auto-generated**: YES (via generate-runbook-from-dashboard.ps1)

---

## 📊 PANEL RUNBOOKS

### 1️⃣ Latency (p95) - Portfolio Refresh Performance

**Query:**
```promql
job:spark_portfolio_latency_p95:5m{environment=~"$env",service=~"$service",exchange=~"$exchange"}
```

**SLO**: < 1500 ms (warning: 1500ms, critical: 3000ms)

**Kontrol Listesi**:
1. ✅ Executor CPU/memory kullanımı yüksek mi? → `docker stats spark-executor`
2. ✅ Exchange status sayfası incident var mı? 
   - Binance: https://www.binancestatus.com
   - BTCTurk: https://pro.btcturk.com/status
3. ✅ Rate limit problem var mı? → Logs'ta "429" ara
4. ✅ Son değişiklik refresh interval'i etkiledi mi?

**Hızlı Aksiyon**:
```powershell
# Refresh interval artır (60s → 120s)
# File: apps/web-next/src/app/portfolio/page.tsx
# refreshInterval: 60000 → 120000

# Backoff ekle (future)
# File: services/executor/src/lib/retry.ts
```

**Kalıcı Çözüm**:
- Paralel istek sayısını azalt
- Price cache TTL artır (30s → 60s)
- Exponential backoff implement et

---

### 2️⃣ Error Rate - Exchange API Errors

**Query:**
```promql
job:spark_exchange_api_error_rate:5m{environment=~"$env",service=~"$service",exchange=~"$exchange"}
```

**Thresholds**: warning 0.01/s, critical 0.05/s

**Error Type Breakdown**:

#### `error_type=auth` (Authentication)
**Neden**: API key geçersiz, süresi dolmuş, veya izinler yanlış  
**İlk Müdahale**:
```powershell
# Check .env
type services\executor\.env

# Sync system time
w32tm /resync

# Test API key manually
curl "https://api.binance.com/api/v3/account" -H "X-MBX-APIKEY: YOUR_KEY"
```

**Kalıcı Çözüm**:
- API key yenile (Binance/BTCTurk portal)
- Key rotation schedule (90 gün)
- 401/403 için özel retry policy

#### `error_type=ratelimit` (Rate Limit)
**Neden**: Çok hızlı request  
**İlk Müdahale**:
```powershell
# Increase refresh interval
# refreshInterval: 60000 → 120000

# Check request rate in logs
Receive-Job -Name spark-executor -Keep | Select-String "429"
```

**Kalıcı Çözüm**:
- Global rate limiter implement
- Token bucket algorithm
- Request batching

#### `error_type=timeout` (Network Timeout)
**Neden**: Yavaş ağ veya exchange API down  
**İlk Müdahale**:
```powershell
# Check network
Test-NetConnection api.binance.com -Port 443
Test-NetConnection api.btcturk.com -Port 443

# Increase connector timeout
# File: services/executor/src/connectors/binance.ts
# timeout: 5000 → 10000
```

**Kalıcı Çözüm**:
- Health probe + circuit breaker
- Secondary endpoint fallback
- Timeout adaptive tuning

---

### 3️⃣ Staleness - Data Freshness

**Query:**
```promql
job:spark_portfolio_staleness{environment=~"$env",service=~"$service",exchange=~"$exchange"}
```

**SLO**: < 60s (warning: 60s, critical: 300s)

**Kontrol Listesi**:
1. ✅ Executor çalışıyor mu? → `curl http://localhost:4001/health`
2. ✅ Connector timeout var mı? → Logs'ta "timeout" ara
3. ✅ Refresh cycle stuck mı? → Son `last_update_timestamp` ne zaman?

**Hızlı Aksiyon**:
```powershell
# Restart executor
Stop-Job -Name spark-executor
Remove-Job -Name spark-executor
# Then run basla.ps1

# Check logs for timeout
Receive-Job -Name spark-executor -Keep | Select-String "timeout|stale"
```

**Kalıcı Çözüm**:
- Health probe with auto-restart
- Connector timeout increase
- Parallel fetch with fallback

---

### 4️⃣ Total USD - Portfolio Value

**Query:**
```promql
sum by (exchange) (job:spark_portfolio_total_value:current{environment=~"$env",service=~"$service",exchange=~"$exchange"})
```

**Validation**: Value spike/dip = price feed issue

**Kontrol Listesi**:
1. ✅ Ani değer değişimi var mı? → Compare with previous 1h
2. ✅ Fiyat feed doğru mu? → Cross-check with exchange UI
3. ✅ Cache corrupt olabilir mi? → Clear price cache

**Hızlı Aksiyon**:
```powershell
# Clear price cache (restart executor)
Stop-Job -Name spark-executor; Remove-Job -Name spark-executor
# Restart via basla.ps1

# Verify prices
curl http://localhost:4001/api/portfolio | ConvertFrom-Json | Select-Object -ExpandProperty accounts
```

**Kalıcı Çözüm**:
- Redundant price source
- Price sanity checks (±20% validation)
- Historical price comparison

---

### 5️⃣ Asset Count - Holdings Tracking

**Query:**
```promql
spark_portfolio_asset_count{environment=~"$env",service=~"$service",exchange=~"$exchange"}
```

**Expected**: > 0 for each exchange with configured API keys

**Kontrol Listesi**:
1. ✅ API key configured? → `type services\executor\.env`
2. ✅ API permissions correct? → Read-only enabled?
3. ✅ Account has assets? → Check exchange UI

**Hızlı Aksiyon**:
```powershell
# Verify API key
curl "https://api.binance.com/api/v3/account" `
  -H "X-MBX-APIKEY: YOUR_KEY"
# Should return balances array (even without signature)

# Check BTCTurk via connector
# (Requires signature, test via executor endpoint)
```

---

## 🔧 OTOMATIK ÇÖZÜM ÖNERİLERİ (Alert → Fix)

### Alert Action Matrix (chatgpt's spec)

| Alert | Olası Neden | İlk Müdahale | Kalıcı Çözüm |
|-------|-------------|--------------|--------------|
| **PortfolioRefreshLatencyHighP95** | Ağ gecikmesi / rate-limit | refresh interval ↑ (60→120s) | Backoff + jitter, paralel istek azalt |
| **ExchangeApiErrorRateHigh{auth}** | API key izinleri / tarih | Key yenile, saat senkronu `w32tm /resync` | Key rotasyonu (90 gün), 401/403 özel retry |
| **ExchangeApiErrorRateHigh{ratelimit}** | Hızlı sorgu | İstekleri grupla, burst azalt | Global rate limiter + token bucket |
| **PortfolioDataStale** | Executor tıkandı / connector timeout | Executor restart, connector timeout ↑ | Health probe + circuit breaker |
| **PortfolioValueDropAnomaly** | Fiyat feed / piyasa hareketi | Ticker cache temizle, cross-check | Redundant source, price sanity checks |
| **PortfolioNoAssets** | API key yok / permission hatalı | .env kontrol, permission verify | API key validation on startup |

---

## 🚨 ROLLBACK KISA YOLU (< 2 dk)

**Trigger**: ≥2 critical threshold violations for 15+ minutes

**Procedure**:
```powershell
cd C:\dev\CursorGPT_IDE

# Stop services
.\durdur.ps1

# Restore .env files
cd services\executor
Copy-Item .env.backup.* .env -Force

cd ..\..\apps\web-next
Copy-Item .env.local.backup.* .env.local -Force

# Restart
cd ..\..
.\basla.ps1

# Verify
curl http://localhost:4001/health
```

**Verification**:
- [ ] Health endpoints return 200 OK
- [ ] No critical errors in logs
- [ ] Metrics stable after 5 minutes

---

## 📖 İLGİLİ REHBERLER

### Troubleshooting Guides
- `PORTFOLIO_ENTEGRASYON_REHBERI.md` - Complete integration guide
- `GRAFANA_TEMPLATING_SETUP.md` - Dashboard setup
- `OPERATIONAL_GUARDRAILS_SPEC.md` - Safety monitoring

### Scripts
- `scripts/quick-diagnostic.ps1` - Automated diagnostics
- `scripts/operational-guardrails.ps1` - Continuous monitoring
- `scripts/alert-autotune-v2.ps1` - Threshold tuning

### Dashboards
- http://localhost:3005/d/spark-portfolio - Main dashboard
- http://localhost:9090/rules - Alert rules
- http://localhost:9090/alerts - Active alerts

---

## 🎯 QUICK FIXES

### Problem: /api/portfolio boş

```powershell
# 1. Check .env
type services\executor\.env

# 2. Sync time
w32tm /resync

# 3. Restart
.\durdur.ps1
.\basla.ps1

# 4. Test
curl http://localhost:4001/api/portfolio
```

### Problem: Metrics eksik

```powershell
# 1. Trigger portfolio API
curl http://localhost:4001/api/portfolio

# 2. Wait 10s
Start-Sleep 10

# 3. Check metrics
curl http://localhost:4001/metrics | Select-String "spark_portfolio"
```

### Problem: Grafana boş

```powershell
# 1. Check Prometheus target
start http://localhost:9090/targets

# 2. Verify dashboard UID
start http://localhost:3005/d/spark-portfolio

# 3. Check time range (Last 1h)
```

---

**Auto-generated by**: generate-runbook-from-dashboard.ps1  
**Last updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Version**: 2.0 (chatgpt + cursor collaboration)

