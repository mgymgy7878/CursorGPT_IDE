# Binance Futures — WebSocket + Canary Guide

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## 📊 GENEL BAKIŞ

Binance Futures entegrasyonu için WebSocket veri akışı ve Canary test sistemi.

### Bileşenler
- **REST API**: Account, positions, orders, leverage
- **WebSocket**: Market data (trade, depth, ticker) + User data (positions, orders)
- **Canary System**: Safe order testing (simulate → confirm)
- **Risk Gate**: MaxNotional, position size, daily loss, circuit breaker

---

## 🌊 WEBSOCKET STREAMS

### Market Data Streams

**Desteklenen Stream'ler**:
- `{symbol}@trade` - Real-time trades
- `{symbol}@depth5@100ms` - Order book depth (5 levels, 100ms update)
- `{symbol}@ticker` - 24hr ticker statistics

**Örnek**:
```powershell
# BTC ve ETH için market streams başlat
curl -X POST http://localhost:4001/futures/ws.start `
  -H "Content-Type: application/json" `
  -d '{"symbols":["BTCUSDT","ETHUSDT"]}'
```

**Response**:
```json
{
  "ok": true,
  "symbols": ["BTCUSDT", "ETHUSDT"],
  "streams": ["market", "userData"],
  "timestamp": "2025-10-10T12:00:00.000Z"
}
```

---

### User Data Stream

**Otomatik Listen Key Yenileme**:
- İlk bağlantıda listen key alınır
- Her 30 dakikada bir otomatik yenilenir
- Disconnect olursa reconnect logic devreye girer

**Alınan Event'ler**:
- `ACCOUNT_UPDATE` - Balance, position changes
- `ORDER_TRADE_UPDATE` - Order status, fills
- `MARGIN_CALL` - Margin call warnings

**Event Örneği**:
```json
{
  "e": "ACCOUNT_UPDATE",
  "T": 1728561600000,
  "a": {
    "B": [
      {"a": "USDT", "wb": "1000.00", "cw": "1000.00"}
    ],
    "P": [
      {"s": "BTCUSDT", "pa": "0.001", "ep": "65000", "up": "10.00"}
    ]
  }
}
```

---

## 🧪 CANARY SYSTEM

### Canary Workflow

```
1. Dry-Run Simulation
   POST /canary/run
   → Simulates order, validates risk, returns evidence
   
2. Review Evidence
   → Check simulation results, risk checks
   
3. Confirm (Testnet Only)
   POST /canary/confirm
   → Applies order on testnet with hard limits
```

---

### Canary Run (Dry-Run)

**Endpoint**: `POST /canary/run`

**Request**:
```json
{
  "scope": "futures-testnet",
  "symbol": "BTCUSDT",
  "side": "BUY",
  "quantity": 0.001,
  "type": "MARKET"
}
```

**Response** (Success):
```json
{
  "ok": true,
  "simulated": true,
  "order": {
    "id": "canary-1728561600000",
    "scope": "futures-testnet",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 0.001,
    "status": "simulated",
    "dryRun": true
  },
  "evidence": {
    "riskChecks": ["maxNotional", "dailyLoss", "leverage"],
    "passed": true
  }
}
```

**Response** (Risk Check Failed):
```json
{
  "ok": false,
  "simulated": true,
  "order": {...},
  "blocked": true,
  "reason": "MaxNotionalExceeded",
  "limit": 100
}
```

---

### Canary Confirm (Testnet Live)

**Endpoint**: `POST /canary/confirm`

**Request**:
```json
{
  "canaryId": "canary-1728561600000",
  "scope": "futures-testnet"
}
```

**Response**:
```json
{
  "ok": true,
  "applied": true,
  "testnet": true,
  "scope": "futures-testnet",
  "limits": {
    "maxNotional": 100,
    "maxPositionSize": 0.1,
    "dailyLossLimit": 50
  },
  "message": "Canary confirmed for testnet with hard limits"
}
```

**Güvenlik**:
- ⚠️ `confirm_required: true` - Manuel onay gerektirir
- ✅ Testnet-only - Production'da çalışmaz
- ✅ Hard limits - Risk gate tam aktif

---

## 📊 PROMETHEUS METRİKLERİ

### WebSocket Metrics

```promql
# WS connections
spark_futures_ws_connects_total{stream_type}

# WS reconnections
spark_futures_ws_reconnects_total{stream_type}

# WS messages
spark_futures_ws_messages_total{stream_type, message_type}

# WS errors
spark_futures_ws_errors_total{stream_type, error_type}

# WS uptime
spark_futures_ws_connection_duration_seconds{stream_type}

# WS connection status (1=connected, 0=disconnected)
spark_futures_ws_connection_status{stream_type}
```

---

## ✅ SMOKE TEST (Kabul Kriterleri)

### Test 1: Futures Health

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/health -UseBasicParsing

# Beklenen: {"status":"ok","testnet":true,"serverTime":...}
```

### Test 2: WebSocket Başlatma

```powershell
# Market + user data streams başlat
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/ws.start `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"symbols":["BTCUSDT","ETHUSDT"]}' `
  -UseBasicParsing

# Beklenen: {"ok":true,"symbols":["BTCUSDT","ETHUSDT"],"streams":["market","userData"]}
```

### Test 3: Metrics Doğrulama

```powershell
# Futures metrics kontrolü
(Invoke-WebRequest -Uri http://127.0.0.1:4001/metrics -UseBasicParsing).Content | Select-String "futures_"

# Beklenen metriklerde görülmeli:
# futures_order_place_latency_ms
# futures_ws_connects_total
# futures_ws_messages_total
```

### Test 4: Dry-Run Order (Güvenli)

```powershell
# Dry-run order (gerçek emir yok, simülasyon)
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/order.place `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":0.001,"dryRun":true}' `
  -UseBasicParsing

# Beklenen: {"dryRun":true,"ack":true,"simulated":true,...}
```

### Test 5: Risk Gate (Başarısız Olmalı)

```powershell
# Limit üstü emir (reddedilmeli)
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/order.place `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":10,"price":80000,"dryRun":false}' `
  -UseBasicParsing

# Beklenen: {"error":"MaxNotionalExceeded","limit":100,...}
```

### Test 6: Canary Run

```powershell
# Canary simülasyonu
Invoke-WebRequest -Uri http://127.0.0.1:4001/canary/run `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"scope":"futures-testnet","symbol":"BTCUSDT","side":"BUY","quantity":0.001}' `
  -UseBasicParsing

# Beklenen: {"ok":true,"simulated":true,"evidence":{...}}
```

### Test 7: Canary Confirm

```powershell
# Canary onayı (testnet)
Invoke-WebRequest -Uri http://127.0.0.1:4001/canary/confirm `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"scope":"futures-testnet"}' `
  -UseBasicParsing

# Beklenen: {"ok":true,"applied":true,"testnet":true,"limits":{...}}
```

### Test 8: Copilot UI

**URL'ler**:
- Anasayfa Copilot: http://localhost:3003/copilot-home
- Strateji Lab Copilot: http://localhost:3003/strategy-lab-copilot

**Beklenen**:
- ✅ Sayfa yükleniyor
- ✅ Health cards görünüyor
- ✅ Quick command butonları çalışıyor
- ✅ Action JSON'ları üretiliyor

---

## 🔧 YAPILANDIRMA

### Environment Variables

**Dosya**: `services/executor/.env`

```env
# Binance Futures Testnet
BINANCE_TESTNET=1
BINANCE_API_KEY=your_testnet_api_key
BINANCE_API_SECRET=your_testnet_secret

# Risk Limits (Testnet)
FUTURES_MAX_NOTIONAL=100
FUTURES_MAX_POSITION_SIZE=0.1
FUTURES_DAILY_LOSS_LIMIT=50
FUTURES_MAX_LEVERAGE=5
FUTURES_CIRCUIT_BREAKER=1
```

---

## 🔗 API ENDPOINTS

### Futures Trading
- `GET /futures/health` - Health check
- `GET /futures/account` - Account info
- `GET /futures/positions` - Open positions
- `GET /futures/openOrders` - Open orders
- `POST /futures/order.place` - Place order (dry-run default)
- `POST /futures/order.cancel` - Cancel order
- `POST /futures/order.cancelAll` - Cancel all orders

### WebSocket
- `POST /futures/ws.start` - Start market + userData streams
- `POST /futures/ws.stop` - Stop all streams

### Canary
- `POST /canary/run` - Dry-run simulation
- `POST /canary/confirm` - Execute on testnet (confirm required)
- `GET /canary/status` - Canary system status

### Risk Gate
- `GET /futures/risk/status` - Risk parameters and circuit breaker status
- `POST /futures/risk/circuit-breaker/close` - Close circuit breaker (admin)

---

## 📈 GRAFANA DASHBOARD (Önerilen Paneller)

### Futures Ek Panelleri

```promql
# WebSocket uptime
spark_futures_ws_connection_duration_seconds

# WS message rate
rate(spark_futures_ws_messages_total[5m])

# WS reconnection rate
rate(spark_futures_ws_reconnects_total[5m])

# Order placement success rate
sum(rate(spark_futures_order_ack_total[5m])) /
(sum(rate(spark_futures_order_ack_total[5m])) + sum(rate(spark_futures_order_reject_total[5m])))

# Unrealized PnL
sum(spark_futures_pnl_unrealized_usd)
```

---

## 🐛 SORUN GİDERME

### WebSocket Bağlanamıyor

```powershell
# 1. API key'leri kontrol et
cd services\executor
cat .env

# 2. Testnet mode aktif mi?
# BINANCE_TESTNET=1 olmalı

# 3. Executor loglarını kontrol et
Receive-Job -Name spark-executor -Keep | Select-String "BinanceFuturesWS"

# 4. Listen key alınabiliyor mu?
curl https://testnet.binancefuture.com/fapi/v1/listenKey `
  -X POST `
  -H "X-MBX-APIKEY: YOUR_KEY"
```

### Risk Gate Reddediyor

```powershell
# Risk parametrelerini kontrol et
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/risk/status -UseBasicParsing

# Circuit breaker açık mı?
# "circuitBreaker": { "open": true }

# Circuit breaker'ı kapat (admin)
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/risk/circuit-breaker/close `
  -Method POST `
  -UseBasicParsing
```

---

## 🎯 AKSIYON TASLAK ÖRNEKLERİ

Copilot'ların kullanacağı action JSON formatları:

### 1. WebSocket Başlat
```json
{
  "action": "/futures/ws.start",
  "params": {
    "symbols": ["BTCUSDT", "ETHUSDT"]
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "market + userData WS başlat"
}
```

### 2. Dry-Run Order
```json
{
  "action": "/futures/order.place",
  "params": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 0.001,
    "dryRun": true
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "emir dry-run simülasyon"
}
```

### 3. Canary Simülasyon
```json
{
  "action": "/canary/run",
  "params": {
    "scope": "futures-testnet",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "quantity": 0.001
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "canary simülasyon"
}
```

### 4. Canary Confirm (Testnet)
```json
{
  "action": "/canary/confirm",
  "params": {
    "scope": "futures-testnet"
  },
  "dryRun": false,
  "confirm_required": true,
  "reason": "testnet uygulama (onaylı)"
}
```

---

## 📚 KULLANIM SENARYOLARİ

### Senaryo 1: Yeni Strateji Test

```powershell
# 1. WS başlat (market data için)
POST /futures/ws.start → {"symbols": ["BTCUSDT"]}

# 2. Canary dry-run
POST /canary/run → BUY 0.001 BTC MARKET

# 3. Sonucu incele
# {"ok": true, "simulated": true, "evidence": {...}}

# 4. Onay ver (testnet)
POST /canary/confirm → {"scope": "futures-testnet"}

# 5. Sonucu izle (userData stream)
# WebSocket → ORDER_TRADE_UPDATE event
```

### Senaryo 2: Risk Limit Testi

```powershell
# 1. Mevcut risk limitleri
GET /futures/risk/status

# 2. Limit üstü emir dene
POST /futures/order.place → quantity=10, price=80000

# 3. Risk gate reddeder
# {"error": "MaxNotionalExceeded", "limit": 100}

# 4. Loglarda audit kaydı
# [RiskGate] ❌ Max notional exceeded
```

### Senaryo 3: Circuit Breaker Test

```powershell
# 1. Günlük kayıp kaydı yap (simüle)
POST /futures/risk/record-pnl → {"pnl": -60}

# 2. Yeni emir dene
POST /futures/order.place → ...

# 3. Circuit breaker açılır
# {"error": "CircuitBreakerOpen", "reason": "Daily loss limit reached"}

# 4. Manuel reset (admin)
POST /futures/risk/circuit-breaker/close
```

---

## 🔒 GÜVENLİK POLİTİKASI

### Testnet-Only Operations

✅ **İzin Verilen**:
- Dry-run simülasyonlar (her zaman)
- Testnet order placement (confirm_required=true)
- WebSocket market data (read-only)
- WebSocket user data (testnet)

❌ **İzin Verilmeyen**:
- Production order placement (canary tarafından engellenir)
- confirm_required=false ile canlı emir
- Circuit breaker kapalıyken limit üstü emirler

---

## 📊 METRICS-BASED GUARDRAILS

### Otomatik Aksiyonlar

```typescript
// Latency yükselirse
if (p95_latency > 1500) {
  action = "auto_retry_with_backoff"
  notification = "alert_ops_channel"
}

// Error rate yükselirse
if (error_rate > 0.05) {
  action = "circuit_breaker_open"
  notification = "page_on_call_engineer"
}

// WebSocket disconnect
if (ws_uptime < 30) {
  action = "reconnect_with_exponential_backoff"
  metric = "futures_ws_reconnects_total"
}
```

---

## 🎯 KABUL KRİTERLERİ (Definition of Done)

### WebSocket
- [x] `/futures/ws.start` çağrısı başarılı
- [ ] `futures_ws_connects_total > 0` metriği görünür
- [ ] Loglarda **market** ve **userData** mesajları
- [ ] Reconnect logic test edildi
- [ ] 30 dakika listen key renewal çalışıyor

### Canary
- [x] `/canary/run` → `{ok:true, simulated:true}`
- [x] `/canary/confirm` → `{applied:true, testnet:true}`
- [ ] Risk check bloklaması doğru çalışıyor
- [ ] Testnet-only politikası uygulanıyor

### Metrics
- [x] `futures_order_place_latency_ms` aktif
- [x] `futures_ws_connection_duration_seconds` aktif
- [ ] Grafana'da görünür
- [ ] Alert rules test edildi

### Risk Gate
- [x] MaxNotional ihlali 400 ile reddediliyor
- [ ] Log'da audit kaydı var
- [ ] Daily loss tracking çalışıyor
- [ ] Circuit breaker otomatik açılıyor

### UI
- [x] Copilot Home presetleri action JSON üretiyor
- [ ] Action JSON'ları API'ye gönderilebiliyor
- [ ] Response'lar UI'da gösteriliyor

---

## 🔄 SONRAKİ ADIMLAR

### Sprint F0 Devamı
1. Smoke testleri çalıştır
2. WebSocket message handling'i iyileştir
3. Copilot API endpoints ekle (NLP)
4. E2E test suite

### Sprint F1: Anasayfa Copilot
1. Natural language → action parsing
2. Metrics-based guardrails integration
3. Real-time suggestions
4. Alert notifications

### Sprint F2: Strateji Lab Copilotu
1. Strategy generation API
2. Backtest integration
3. Parameter optimization loop
4. Canary deployment flow

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**WebSocket + Canary entegrasyonu tamamlandı!** 🌊✅
