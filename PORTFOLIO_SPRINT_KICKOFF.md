# 🚀 PORTFOLIO SPRINT KICKOFF - v1.9-p3

**Tarih**: 10 Ekim 2025  
**Durum**: READY TO EXECUTE  
**Collaboration**: cursor (Claude 3.5 Sonnet) + chatgpt

---

## ⚡ HIZLI BAŞLANGIÇ (5 DK)

### Otomatik Setup Script

```powershell
cd C:\dev\CursorGPT_IDE
.\scripts\quick-start-portfolio.ps1
```

Bu script:
- ✅ API key'leri interaktif olarak sorar
- ✅ `.env` dosyalarını oluşturur
- ✅ Backup alır
- ✅ Servisleri başlatır (opsiyonel)
- ✅ Smoke test yapar
- ✅ Tarayıcıyı açar (opsiyonel)

---

## 📋 MANUEL SETUP (10 DK)

### 1. API Key'leri Hazırla

**Binance** (https://www.binance.com/en/my/settings/api-management):
- "Create API" → **SADECE "Enable Reading" seç**
- API Key ve Secret'ı kopyala

**BTCTurk** (https://pro.btcturk.com/hesabim/api):
- Yeni API Key → **SADECE "Bakiye Görüntüleme" seç**
- API Key ve Base64 Secret'ı kopyala

---

### 2. Executor `.env` Oluştur

```powershell
cd C:\dev\CursorGPT_IDE\services\executor
```

**Dosya**: `.env`
```env
PORT=4001
HOST=0.0.0.0
NODE_ENV=development

BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret
BINANCE_TESTNET=0
BINANCE_RECV_WINDOW=5000

BTCTURK_API_KEY=your_btcturk_key
BTCTURK_API_SECRET_BASE64=your_btcturk_secret_base64

ADMIN_TOKEN=your_admin_token_64_chars
```

**Admin Token Generate**:
```powershell
# Windows (no openssl)
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Unix/macOS (with openssl)
openssl rand -hex 32
```

---

### 3. Web-Next `.env.local` Oluştur

```powershell
cd C:\dev\CursorGPT_IDE\apps\web-next
```

**Dosya**: `.env.local`
```env
EXECUTOR_BASE_URL=http://127.0.0.1:4001
NEXT_PUBLIC_EXECUTOR_BASE_URL=http://127.0.0.1:4001
NEXT_PUBLIC_ADMIN_ENABLED=true
```

---

### 4. Servisleri Başlat

```powershell
cd C:\dev\CursorGPT_IDE
.\basla.ps1
```

Beklenen çıktı:
```
========================================
  SPARK TRADING PLATFORM
  Baslatma Betigi v3.0
========================================

...
Web-Next baslatildi (Job ID: 1)
Executor baslatildi (Job ID: 2)
...
✓ Web-Next: Erislebilir (Status: 200)
✓ Executor: Erislebilir (Status: 200)
```

---

### 5. Smoke Tests

```powershell
# Executor health
curl http://localhost:4001/health
# Beklenen: {"ok":true}

# Portfolio API
curl http://localhost:4001/api/portfolio
# Beklenen: JSON with accounts array

# Web-Next
start http://localhost:3003/portfolio
# Beklenen: Portfolio sayfası real data ile
```

---

## 🎯 KABUL KRİTERLERİ

### ✅ PASS Kriterleri

**API Response**:
```powershell
$response = Invoke-WebRequest "http://localhost:4001/api/portfolio" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

# PASS if:
# - Status code: 200
# - accounts.Length >= 1
# - Each account has: exchange, totals.totalUsd, balances array
# - At least one balance.valueUsd > 0
```

**UI Verification**:
- [ ] Portfolio sayfası açılıyor
- [ ] Exchange tab'ları görünüyor
- [ ] Asset tablosu dolu (en az 1 varlık)
- [ ] Total USD değeri > 0
- [ ] Donut chart render oluyor
- [ ] "Yenile" butonu çalışıyor

**Metrics**:
```powershell
curl http://localhost:4001/metrics | Select-String "spark_portfolio"

# PASS if exists:
# - spark_portfolio_refresh_latency_ms
# - spark_portfolio_total_value_usd
# - spark_portfolio_asset_count
# - spark_portfolio_last_update_timestamp
```

---

## 📊 MONITORING AKTIVASYONU

### Docker Compose

```powershell
cd C:\dev\CursorGPT_IDE
docker compose up -d prometheus grafana
```

### Prometheus (http://localhost:9090)

**Targets Check**:
- Navigate to: Status → Targets
- Expected: `spark-executor` UP

**Query Test**:
```promql
spark_portfolio_refresh_latency_ms_bucket
spark_portfolio_total_value_usd
```

### Grafana (http://localhost:3005)

**Login**: admin / admin

**Dashboard**:
- Navigate to: Dashboards → Spark folder
- Open: "Spark • Portfolio Performance"
- Expected: 5 panels with live data

**Panels**:
1. Portfolio Refresh Latency (p50/p95)
2. Exchange API Error Rate
3. Total Portfolio Value (USD)
4. Data Staleness (seconds)
5. Asset Count by Exchange

---

## 🔍 SLO VALIDATION

### Latency Check

```promql
# Prometheus query
histogram_quantile(0.95, 
  sum by (le, exchange) (
    rate(spark_portfolio_refresh_latency_ms_bucket[5m])
  )
)

# Expected: < 1500ms
```

### Staleness Check

```promql
time() - spark_portfolio_last_update_timestamp

# Expected: < 60 seconds
```

### Error Rate Check

```promql
sum by (exchange, error_type) (
  rate(spark_exchange_api_error_total[5m])
)

# Expected: < 0.01/s
```

### Asset Count Check

```promql
spark_portfolio_asset_count

# Expected: > 0 for each exchange
```

---

## 🎬 SMOKE PASS CHECKLIST

Tüm bunlar geçerse "**SMOKE PASS**" demek için:

- [ ] `/api/portfolio` → 200 OK
- [ ] Accounts array → en az 1 exchange
- [ ] Total USD değeri → > 0
- [ ] UI portfolio sayfası → real data görünüyor
- [ ] Metrics endpoint → spark_portfolio_* metrikleri mevcut
- [ ] Prometheus targets → executor UP
- [ ] Grafana dashboard → 5 panel canlı
- [ ] No crashes → 30 dakika uptime
- [ ] Logs → critical error yok

---

## 💾 EVIDENCE COLLECTION

### Otomatik Script

```powershell
cd C:\dev\CursorGPT_IDE
.\scripts\portfolio-sprint-evidence.ps1
```

Output:
- `evidence/portfolio/{timestamp}/`
  - `portfolio_api_response.json`
  - `metrics_full.txt`
  - `metrics_portfolio.txt`
  - `health_checks.txt`
  - `prometheus_targets.json`
  - `prometheus_rules.json`
  - `deployment_summary.txt`
- `evidence/portfolio/portfolio_sprint_{timestamp}.zip`

### Manuel Screenshot'lar

**Al ve kaydet**:
1. Portfolio UI (http://localhost:3003/portfolio)
2. Grafana dashboard (http://localhost:3005)
3. Prometheus targets (http://localhost:9090/targets)
4. Prometheus metrics (http://localhost:9090/graph?g0.expr=spark_portfolio_total_value_usd)

**Kayıt yeri**: `evidence/portfolio/{timestamp}/screenshots/`

---

## 🚨 ROLLBACK PROCEDURE

### Hızlı Rollback (< 2 dakika)

```powershell
# 1. Stop services
cd C:\dev\CursorGPT_IDE
.\durdur.ps1

# 2. Restore env files (if backup exists)
cd services\executor
Copy-Item .env.backup.* .env -Force  # Pick latest backup

cd ..\..\apps\web-next
Copy-Item .env.local.backup.* .env.local -Force

# 3. Git reset (optional)
cd ..\..
git reset --hard HEAD~1
# OR
git checkout rollback/pre-portfolio-xxxxxxxx

# 4. Restart
.\basla.ps1
```

### Verification

```powershell
curl http://localhost:4001/health
curl http://localhost:3003
# Both should return 200 OK
```

---

## 🎯 SUCCESS CRITERIA

### Sprint Complete When:

- [x] Kod deployed (100% ready)
- [ ] API keys configured
- [ ] Services running (24h+ uptime)
- [ ] Real data in UI (no mock fallback)
- [ ] Monitoring active (Prometheus + Grafana)
- [ ] SLO targets met (latency, staleness, error rate)
- [ ] Evidence collected (ZIP + screenshots)
- [ ] Documentation updated
- [ ] Git commit + tag created

### Metrics Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Portfolio Refresh P95 | < 1500ms | TBD |
| Data Staleness | < 60s | TBD |
| API Error Rate | < 0.01/s | TBD |
| Uptime | > 99% | TBD |
| Asset Count | > 0 | TBD |

---

## 📞 SUPPORT KOMUTLARI

### Status Check

```powershell
# Job status
Get-Job | Where-Object { $_.Name -like "*spark*" }

# View logs
Receive-Job -Name spark-executor -Keep | Select-Object -Last 50

# Port check
netstat -ano | findstr ":4001"
netstat -ano | findstr ":3003"
```

### Restart Executor Only

```powershell
# Stop
Stop-Job -Name spark-executor
Remove-Job -Name spark-executor

# Restart
$executorJob = Start-Job -Name "spark-executor" -ScriptBlock {
    Set-Location "C:\dev\CursorGPT_IDE\services\executor"
    $env:NODE_ENV = "development"
    $env:PORT = "4001"
    $env:HOST = "0.0.0.0"
    & pnpm dev
}
```

### Test API Manually

```powershell
# Portfolio API (formatted)
Invoke-WebRequest "http://localhost:4001/api/portfolio" -UseBasicParsing | 
  Select-Object -ExpandProperty Content | 
  ConvertFrom-Json | 
  ConvertTo-Json -Depth 10

# Metrics (portfolio only)
curl http://localhost:4001/metrics | Select-String "spark_portfolio" | Select-Object -First 20
```

---

## 🎁 BONUS: MICRO-IMPROVEMENTS

### UI Staleness Badge

**Önerilir**: Portfolio kartında veri yaşını göster

```typescript
// apps/web-next/src/components/portfolio/SummaryCards.tsx
const staleness = data?.updatedAt 
  ? Math.floor((Date.now() - new Date(data.updatedAt).getTime()) / 1000)
  : null;

<Badge color={staleness < 60 ? "green" : "yellow"}>
  {staleness}s ago
</Badge>
```

### Prometheus Labels Enhancement

**Önerilir**: Environment label ekle

```typescript
// services/executor/src/metrics/portfolio.ts
const labels = {
  exchange,
  environment: process.env.NODE_ENV || 'development',
  service: 'executor'
};
```

### Binance Price Cache TTL

**Önerilir**: Fiyat haritasını 30-60s cache'le

```typescript
// services/executor/src/services/portfolioService.ts
let priceCache: { data: Map<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds

if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
  priceMap = priceCache.data;
} else {
  const allPrices = await binance.getAllTickerPrices();
  // ... populate priceMap
  priceCache = { data: priceMap, timestamp: Date.now() };
}
```

### BTCTurk Error Classification

**Önerilir**: Error type labels

```typescript
// services/executor/src/connectors/btcturk.ts
catch (err: any) {
  const errorType = err.status === 401 ? 'auth' :
                    err.status === 429 ? 'ratelimit' :
                    err.code === 'ETIMEDOUT' ? 'timeout' : 'unknown';
  apiErrors.labels('btcturk', errorType).inc();
  throw err;
}
```

---

## 🚀 NEXT SPRINT PREVIEW

### Sprint N+2: Binance Futures Portfolio

- [ ] `/futures/account` endpoint
- [ ] `/futures/positions` endpoint
- [ ] Unrealized P/L calculation
- [ ] USDT-M vs COIN-M separation
- [ ] UI: "Futures" tab in portfolio
- [ ] Grafana: Futures panel ekleme

**Estimated**: 2 weeks, 34 SP

### Sprint N+3: Historical P/L

- [ ] Transaction history database
- [ ] Daily/weekly/monthly P/L
- [ ] P/L time series chart
- [ ] CSV export for tax

**Estimated**: 2 weeks, 34 SP

---

## 🤝 COLLABORATION

**cursor (Claude 3.5 Sonnet)**:
- Technical implementation
- Code architecture
- Documentation (5,500+ lines total)
- Evidence framework

**chatgpt**:
- Strategic planning
- Execution roadmap
- Decision making (Portfolio first, Backtest later)
- Risk assessment & mitigation

**Shared Principles**:
- User-visible value first
- Low-risk, high-impact
- Evidence-based delivery
- Clean rollback paths

---

## 📚 REFERENCES

**Dokümantasyon**:
- `PORTFOLIO_ENTEGRASYON_REHBERI.md` (855 lines)
- `TEKNIK_ANALIZ_VE_DETAYLI_RAPOR_2025_10_10.md` (1,684 lines)
- `PORTFOLIO_SPRINT_EXECUTION_PLAN.md` (673 lines)

**Scripts**:
- `scripts/quick-start-portfolio.ps1` (Auto setup)
- `scripts/portfolio-sprint-evidence.ps1` (Evidence collection)
- `basla.ps1` (Service launcher)
- `durdur.ps1` (Service stopper)

**Monitoring**:
- `monitoring/grafana/provisioning/dashboards/spark-portfolio.json`
- `prometheus/alerts/spark-portfolio.rules.yml`

---

## ✨ READY TO EXECUTE

**Plan**: COMPLETE ✅  
**Code**: READY ✅  
**Scripts**: PREPARED ✅  
**Documentation**: COMPREHENSIVE ✅

**Şimdi tek yapman gereken**:

```powershell
cd C:\dev\CursorGPT_IDE
.\scripts\quick-start-portfolio.ps1
```

**Ve sonra chatgpt'ye söyle**: "**SMOKE PASS**" 🚀

---

**cursor (Claude 3.5 Sonnet) + chatgpt**  
**Sprint**: v1.9-p3 Portfolio Real Data Integration  
**Status**: READY TO EXECUTE 🎯

