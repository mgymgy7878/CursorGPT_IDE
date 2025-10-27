# Sprint F0: Binance Futures + Testnet - BAŞLATILDI 🚀

**Tarih**: 10 Ekim 2025  
**cursor (Claude 3.5 Sonnet)**

---

## 🎯 YENİ ÖNCELİK SIRALAMASI

**Öncelik değişikliği uygulandı!**

```
✅ Sprint 3.1: Observability              → TAMAMLANDI
🚀 Sprint F0: Binance Futures + Testnet  → ŞİMDİ BAŞLATILDI  
⏳ Sprint F1: Anasayfa Copilot            → SONRA
⏳ Sprint F2: Strateji Lab Copilotu       → EN SON
⏸️ Sprint 3.3: BTCTurk Spot Reader        → ERTELENDİ
```

**Neden bu sıralama?**
- Futures testnet = **sıfır risk**, canlı etkisi yok
- Copilot'lar için gerçek veri kaynağı hazır olur
- Backend-first yaklaşım (veri → UI)

---

## ✅ OLUŞTURULAN DOSYALAR

### Backend (Executor)

```
services/executor/src/
├── connectors/
│   └── binance-futures.ts              ✅ YENİ (300+ satır)
│       ├── REST API wrapper
│       ├── HMAC signature
│       ├── Account/Positions/Orders
│       └── Dry-run support
│
├── routes/
│   └── futures.ts                      ✅ YENİ (200+ satır)
│       ├── GET /futures/health
│       ├── GET /futures/account
│       ├── GET /futures/positions
│       ├── GET /futures/openOrders
│       ├── POST /futures/order.place
│       ├── POST /futures/order.cancel
│       ├── POST /futures/leverage
│       └── POST /futures/marginType
│
├── metrics/
│   └── futures.ts                      ✅ YENİ (150+ satır)
│       ├── futures_order_place_latency_ms
│       ├── futures_order_ack_total
│       ├── futures_order_reject_total
│       ├── futures_ws_reconnects_total
│       ├── futures_pnl_unrealized_usd
│       ├── futures_account_balance_usd
│       └── Helper functions
│
└── plugins/
    └── risk-gate.ts                    ✅ YENİ (200+ satır)
        ├── MaxNotional check
        ├── MaxPositionSize check
        ├── DailyLossLimit tracking
        ├── Circuit breaker
        └── Risk status endpoints
```

### Frontend (Web-Next)

```
apps/web-next/src/app/
├── copilot-home/
│   └── page.tsx                        ✅ YENİ (iskelet)
│       ├── System health cards
│       ├── Open positions display
│       ├── Chat interface
│       └── Quick commands
│
└── strategy-lab-copilot/
    └── page.tsx                        ✅ YENİ (iskelet)
        ├── Strategy prompt input
        ├── Strategy review
        ├── Backtest integration (TODO)
        └── Optimize integration (TODO)
```

### Executor Index Güncellemesi

```
services/executor/src/
└── index.ts                            ✏️ GÜNCELLEND İ
    ├── Risk gate plugin registered
    └── Futures routes registered
```

---

## 🔐 GÜVENLİK ÖZELLİKLERİ

### Risk Gate

**Varsayılan Limitler** (Testnet):
```env
FUTURES_MAX_NOTIONAL=100           # USD (maks emir büyüklüğü)
FUTURES_MAX_POSITION_SIZE=0.1      # BTC eşdeğeri
FUTURES_DAILY_LOSS_LIMIT=50        # USD (günlük max kayıp)
FUTURES_MAX_LEVERAGE=5             # Maks kaldıraç
```

**Circuit Breaker**:
- Günlük kayıp limite ulaşınca → auto-suspend
- Error rate > threshold → suspend
- Manuel reset gerektirir (`POST /futures/risk/circuit-breaker/close`)

**Dry-Run Varsayılan**:
```typescript
// Her order placement varsayılan olarak dry-run
placeOrder({ symbol, side, type, quantity, dryRun: true })  // ✅ Güvenli
placeOrder({ symbol, side, type, quantity, dryRun: false }) // ⚠️ Gerçek emir
```

---

## 📊 PROMETHEUS METRİKLERİ

### Yeni Metrikler (10 adet)

```promql
# Order latency
spark_futures_order_place_latency_ms{symbol, type, side}

# Order success/failure
spark_futures_order_ack_total{symbol, side, type}
spark_futures_order_reject_total{symbol, reason}

# WebSocket
spark_futures_ws_reconnects_total{stream_type}
spark_futures_ws_uptime_seconds{stream_type}

# PnL & Positions
spark_futures_pnl_unrealized_usd{symbol, position_side}
spark_futures_position_count{position_side}

# Account
spark_futures_account_balance_usd{balance_type}
spark_futures_margin_ratio

# Rate limits
spark_futures_rate_limit_remaining{limit_type}
```

---

## 🚀 NASIL KULLANILIR?

### Adım 1: Environment Variables

**Dosya**: `services/executor/.env`

```env
# Testnet mode (varsayılan)
BINANCE_TESTNET=1

# Binance Futures Testnet API keys
BINANCE_API_KEY=your_testnet_api_key_here
BINANCE_API_SECRET=your_testnet_secret_here

# Risk limits
FUTURES_MAX_NOTIONAL=100
FUTURES_MAX_POSITION_SIZE=0.1
FUTURES_DAILY_LOSS_LIMIT=50
FUTURES_MAX_LEVERAGE=5
```

### Adım 2: Servisleri Başlat

```powershell
cd C:\dev\CursorGPT_IDE
.\basla.ps1
```

### Adım 3: Test Et

```powershell
# Health check
curl http://localhost:4001/futures/health

# Account info
curl http://localhost:4001/futures/account

# Positions
curl http://localhost:4001/futures/positions

# Dry-run order (güvenli)
curl -X POST http://localhost:4001/futures/order.place `
  -H "Content-Type: application/json" `
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"quantity\":0.001,\"dryRun\":true}"

# Risk status
curl http://localhost:4001/futures/risk/status
```

---

## 📈 COPILOT İSKELETLERİ

### Anasayfa Copilot

**URL**: http://localhost:3003/copilot-home

**Özellikler**:
- ✅ System health cards (Executor, Portfolio, Futures)
- ✅ Open positions display
- ✅ Chat interface (iskelet)
- ⏳ Natural language → action (TODO)
- ⏳ Guardrails integration (TODO)

**Örnek Komutlar**:
- "portföy özeti"
- "açık emirlerim"
- "futures riskim ne?"
- "BTC short için stop kaç olmalı?"

### Strateji Lab Copilotu

**URL**: http://localhost:3003/strategy-lab-copilot

**Özellikler**:
- ✅ Strategy prompt input
- ✅ Quick templates (RSI, EMA, MACD, Mean Reversion)
- ✅ Strategy review panel
- ⏳ Strategy generation (TODO)
- ⏳ Backtest integration (TODO)
- ⏳ Optimization loop (TODO)

**Workflow**:
1. Prompt → Strategy draft
2. Review → Parameter adjustment
3. Backtest → Performance metrics
4. Optimize → Parameter tuning
5. Deploy → Canary/Live

---

## 🔄 SONRAKİ ADIMLAR

### Sprint F0 Devamı (Bu sprint içinde)

1. **WebSocket Integration**
   - User data stream (position/order updates)
   - Market data stream (depth/ticker)
   - Reconnect logic

2. **Copilot API Endpoints**
   - `POST /api/copilot/chat` (natural language processing)
   - `POST /api/copilot/generate-strategy` (strategy generation)
   - Guardrails integration

3. **Testing & Validation**
   - Unit tests for futures connector
   - Integration tests for risk gate
   - E2E tests for order flow

### Sprint F1: Anasayfa Copilot (Sonra)

- Natural language → action parsing
- Metrics-based guardrails
- Real-time suggestions
- Alert integration

### Sprint F2: Strateji Lab Copilotu (En son)

- AI strategy generation
- Backtest integration
- Parameter optimization
- Canary deployment

---

## 📚 DOKÜMANTASYON

### API Endpoints

**Futures Trading**:
- `GET /futures/health` - Health check
- `GET /futures/account` - Account info (balance, leverage)
- `GET /futures/positions?symbol` - Open positions
- `GET /futures/openOrders?symbol` - Open orders
- `POST /futures/order.place` - Place order (dry-run default)
- `POST /futures/order.cancel` - Cancel order
- `POST /futures/order.cancelAll` - Cancel all orders
- `GET /futures/order?symbol&orderId` - Order status
- `POST /futures/leverage` - Change leverage
- `POST /futures/marginType` - Change margin type

**Risk Management**:
- `GET /futures/risk/status` - Risk gate status
- `POST /futures/risk/circuit-breaker/close` - Close circuit breaker (admin)
- `POST /futures/risk/record-pnl` - Record PnL (for daily tracking)

---

## ⚠️ NOTLAR

### Güvenlik

- ✅ Varsayılan dry-run mode aktif
- ✅ Risk gate tüm emirleri validate ediyor
- ✅ Circuit breaker entegre
- ✅ Testnet mode varsayılan
- ⚠️ Production'a geçiş için confirm_required=true

### Performans

- ✅ Prometheus metrics entegre
- ✅ Grafana dashboard hazır (Sprint 3.1'den)
- ✅ Latency tracking aktif
- ⏳ WebSocket için ayrı metrics (TODO)

### Limitasyonlar

- ⏳ WebSocket stream henüz yok
- ⏳ Copilot NLP henüz çalışmıyor (iskelet var)
- ⏳ Strategy generation API TODO
- ⏳ Backtest/optimize integration TODO

---

## 🎯 BAŞARI KRİTERLERİ

### Sprint F0

- [x] Binance Futures connector oluşturuldu ✅
- [x] REST API endpoints hazır ✅
- [x] Risk gate entegre edildi ✅
- [x] Prometheus metrics eklendi ✅
- [x] Copilot UI iskeletleri hazır ✅
- [ ] WebSocket integration (TODO)
- [ ] Copilot API endpoints (TODO)
- [ ] E2E tests (TODO)

### Kabul Kriterleri

- [ ] Testnet'te dry-run order placement çalışıyor
- [ ] Risk gate limitleri doğru uygulanıyor
- [ ] Circuit breaker otomatik tetikleniyor
- [ ] Metrics Prometheus'ta görünür
- [ ] Copilot UI'lar erişilebilir
- [ ] Dokümantasyon eksiksiz

---

## 📊 İSTATİSTİKLER

**Sprint Başlangıcı**: 10 Ekim 2025  
**Oluşturulan Dosya**: 6 yeni + 1 güncelleme  
**Satır Kodu**: ~1200  
**Metrics**: 10 yeni  
**API Endpoint**: 11  
**UI Page**: 2 (iskelet)

**Sistem Durumu**: 🟢 DEVELOPMENT MODE (Testnet)

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**Sprint F0: Binance Futures + Testnet başarıyla başlatıldı!** 🚀

**Sonraki adım: WebSocket integration ve Copilot API endpoints**

