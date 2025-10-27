# PRIVATE-API DAY-2 VALIDATION RUNBOOK

## Önkoşullar

`.env.local` dosyasında aşağıdaki ayarlar olmalı:
```bash
EXCHANGE_MODE=binance
TRADE_MODE=testnet
LIVE_ENABLED=false
BINANCE_API_KEY=your_testnet_api_key_here
BINANCE_API_SECRET=your_testnet_secret_key_here
BINANCE_API_BASE=https://testnet.binance.vision
```

## Validation Adımları

### 1. Green Gate Test
```cmd
.\runtime\private_api_green_gate.cmd
```

**Beklenen Sonuç:**
- Tüm HTTP kodları 200
- Metriklerde `spark_private_calls_total` görünmeli
- Order placement başarılı

### 2. Canary Test
```cmd
.\runtime\private_api_canary.cmd
```

**Beklenen Sonuç:**
- BUY/SELL orderlar başarılı
- Loglar `runtime\logs\private_canary.log` altında

### 3. UI Validation
- http://127.0.0.1:3003/control adresine git
- "TESTNET" rozeti görünmeli
- OrderTicket formu çalışmalı
- OpenOrders tablosu 5s'de güncellenmeli

## Metrikler

### Beklenen Artışlar
- `spark_private_calls_total` → her başarılı çağrıda artar
- `spark_private_errors_total` → hata durumunda artar

### Alert Rules
- Error rate > 5% → 10m warning
- No calls in 10m → 15m info

## Sık Hatalar ve Çözümler

### -1021 Timestamp Error
```bash
# Clock drift ayarla
PRIVATE_CLOCK_DRIFT_MS=+1000  # +1000ms
PRIVATE_CLOCK_DRIFT_MS=+2000  # +2000ms (gerekirse)
PRIVATE_CLOCK_DRIFT_MS=+3000  # +3000ms (maksimum)
```

### 429 Rate Limit Error
```bash
# Backoff süresini artır
PRIVATE_REQ_RETRIES=5
# Rate limit'i düşür
PRIVATE_RATE_LIMIT_QPS=5
```

### SYMBOL_NOT_ALLOWED
- Sadece whitelist'teki semboller: BTCUSDT, ETHUSDT, BNBUSDT, XRPUSDT, ADAUSDT
- Yeni sembol eklemek için `packages/@spark/exchange-private/src/symbols.testnet.ts` güncelle

### QTY_BELOW_MIN
- BTCUSDT: minimum 0.0005
- ETHUSDT: minimum 0.005
- BNBUSDT: minimum 0.05
- XRPUSDT: minimum 5
- ADAUSDT: minimum 5

## Geri Dönüş Prosedürü

### Testnet'ten Paper'a
```bash
TRADE_MODE=paper
```
- Tüm write operasyonları 403 döner
- UI'da "MOCK" rozeti görünür

### Testnet'ten Live'a
```bash
TRADE_MODE=live
LIVE_ENABLED=true  # DİKKAT: Gerçek para!
```
- Sadece LIVE_ENABLED=true iken write izni
- UI'da "LIVE (ENABLED)" rozeti

## Monitoring

### Grafana Dashboard
- Error rate grafiği
- Call volume grafiği
- Response time grafiği

### Log Files
- `runtime/logs/private_canary.log` → Canary test logları
- `runtime/logs/private_testnet_*.log` → Testnet smoke logları

## Success Criteria

✅ `/api/private/health` → 200, mode: testnet
✅ `/api/private/account` → 200, bakiye bilgisi
✅ `/api/private/open-orders` → 200, order listesi
✅ POST `/api/private/order` → 200, order placement
✅ DELETE `/api/private/order` → 200, order cancellation
✅ UI OrderTicket → çalışıyor
✅ UI OpenOrders → 5s polling
✅ Metrikler → spark_private_* artışı
✅ Alert rules → yüklendi

## HEALTH Status

- **YELLOW**: Altyapı hazır, testnet key'leri bekleniyor
- **GREEN**: Tüm validation geçti, testnet aktif
- **RED**: Kritik hata, geri dönüş gerekli 