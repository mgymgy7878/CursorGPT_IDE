# V0.3.0 Regression Suite

Bu dokümantasyon Spark Trading Platform v0.3.0 regresyon testlerini açıklar.

## 🎯 Amaç

V0.3.0 "init" sonrası tek komutla kanıt üreten regresyon-suite kurmak:
- Order types (MARKET, LIMIT, STOP_MARKET, STOP_LIMIT, IOC)
- Paper trading PnL/fees
- Backtest bridge
- Prometheus metrics
- UI/proxy validation

## 🚀 Tek Komutla Çalıştırma

### Mock Modda (Önerilen)
```bash
cmd /d /c runtime\regression_v030.cmd
```

### Real Public Modda (Hızlı)
```bash
cmd /d /c runtime\regression_real_public.cmd
```

## 📊 Üretilen Artefaktlar

### Ana Dosyalar
- `runtime/regression.summary.txt` - Ana özet raporu
- `runtime/regression.index.json` - JSON formatında test sonuçları
- `runtime/ui_codes.txt` - UI endpoint HTTP kodları
- `runtime/ui_bodies.log` - UI endpoint yanıtları
- `runtime/metrics_snapshot.prom` - Prometheus metrikleri

### Test Logları
- `runtime/order_types_smoke.log` - Order types test sonuçları
- `runtime/backtest_smoke.log` - Backtest test sonuçları
- `runtime/metrics_snapshot.log` - Metrics snapshot log
- `runtime/ui_probe.log` - UI probe log

## ✅ Başarı Ölçütleri

### GREEN (Başarılı)
- `/control=200` - Control sayfası erişilebilir
- `proxy health=200` - Proxy health endpoint çalışıyor
- `proxy metrics=200` - Proxy metrics endpoint çalışıyor
- Order types smoke: PASS
- Backtest smoke: PASS
- Metrics snapshot: PASS
- UI probe: PASS

### YELLOW (Kısmi Başarı)
- Real public modda rate limit (429)
- SSE bağlantı sorunları
- Bazı testler başarısız

### RED (Başarısız)
- Executor başlamadı
- Panel başlamadı
- Kritik endpoint'ler erişilemez

## 🔧 Test Demetleri

### 1. Order Types Smoke Test
- MARKET, LIMIT, STOP_MARKET, STOP_LIMIT, IOC emirleri
- `/api/paper/orders|positions|fills|account` GET
- `spark_paper_orders_total{type}` metrik artışı

### 2. Backtest Smoke Test
- `/api/backtest/run` (küçük aralık) 200
- Özet alanları doğrulama (trades, winrate, pnl)

### 3. Metrics Snapshot
- `/api/public/metrics/prom` ilk 2000 byte
- `spark_paper_*` ve `spark_backtest_*` metrikleri

### 4. UI Probe
- `/control`, proxy health/metrics 200 kodları
- Gövdeleri log dosyalarına kaydetme

## 🛠️ Kurulum Gereksinimleri

### Sistem Gereksinimleri
- Windows 10/11
- Node.js >= 18.18
- pnpm >= 10
- curl (Windows 10'da varsayılan)

### Environment Variables
```bash
EXCHANGE_MODE=mock    # mock | binance
TRADE_MODE=paper      # paper | live
```

### Port Gereksinimleri
- 3003: Panel (Next.js)
- 4001: Executor (Express.js)

## 🔍 Sorun Giderme

### EADDRINUSE (Port Kullanımda)
```bash
pnpm dlx kill-port 3003 4001
```

### 429 Binance (Rate Limit)
- Real public modda normal
- YELLOW olarak kabul edilir
- `EXCHANGE_BACKOFF_MS=1000` ayarlanabilir

### Module Not Found
```bash
pnpm -w install
```

### /control 000 (Panel Başlamadı)
- `runtime/panel_*` log son 120 satıra bak
- Port 3003 boş mu kontrol et

### Backtest 413 (Bar Limit)
- Smoke içinde küçük limit kullanılıyor
- Büyük aralıklar için limit artırılabilir

### Metrics Boş
- Executor health 200 değil
- Önce executor'u stabilize et

## 📈 CI Entegrasyonu

### GitHub Actions
```yaml
regression-mock:
  name: "regression-mock @smoke"
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: pnpm install
    - run: cmd /d /c runtime\regression_v030.cmd
```

### Required Checks
- Mevcut required checks bozulmamalı
- Regression job opsiyonel olarak eklenir

## 📝 Log Formatı

### SUMMARY Formatı
Her test demeti 11 maddelik özet üretir:
```
=== SUMMARY — TEST NAME ===
1) Item 1: Value
2) Item 2: Value
...
10) Item 10: Value
11) Item 11: Value
HEALTH=GREEN/RED/YELLOW
```

### JSON Index Formatı
```json
{
  "timestamp": "2025-08-16 07:30:00",
  "version": "v0.3.0",
  "environment": {
    "exchange_mode": "mock",
    "trade_mode": "paper"
  },
  "services": {
    "executor": "200",
    "panel": "200"
  },
  "tests": {
    "order_types_smoke": "PASS",
    "backtest_smoke": "PASS",
    "metrics_snapshot": "PASS",
    "ui_probe": "PASS"
  },
  "final_health": {
    "ui": "200",
    "proxy_health": "200",
    "proxy_metrics": "200"
  },
  "health": "GREEN"
}
```

## 🎯 Sonraki Adımlar

### v0.3.0 Devamında
- Limit/stop matching optimizasyonu
- Fee modeli varyantları
- Private API gerçekleme
- Advanced risk management

### Regression Suite Geliştirmeleri
- Performance benchmarks
- Load testing
- Integration tests
- E2E scenarios

## 📞 Destek

Sorunlar için:
1. `runtime/regression.summary.txt` kontrol edin
2. İlgili test log dosyasını inceleyin
3. Environment variables'ları doğrulayın
4. Port durumlarını kontrol edin

---

**HEALTH=GREEN** hedeflenir. Tüm testler başarılı olduğunda sistem production-ready kabul edilir. 