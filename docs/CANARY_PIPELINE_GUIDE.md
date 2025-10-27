# Spark Trading Platform - Canary Pipeline Guide

## Testnet → Confirm → Live Pipeline

### 1. Canary Dry-Run (Testnet)

```bash
curl -X POST http://localhost:3003/api/canary/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token-123" \
  -d '{
    "action": "/canary/run",
    "params": {
      "scope": "binance:futures:testnet",
      "symbols": ["BTCUSDT"],
      "samples": 20,
      "checks": ["place_order","cancel_order","ack_latency","ws_stream"],
      "strategy": {
        "name":"ema_atr_v0",
        "ema_fast":9,
        "ema_slow":21,
        "atr":14,
        "tp_atr":2,
        "sl_atr":1.5,
        "risk_notional_pct":0.01
      }
    },
    "dryRun": true,
    "confirm_required": false,
    "reason": "Hızlı testnet doğrulaması: emir akışı + P95 ölçümü"
  }'
```

### 2. Risk Guardrails (ONAY GEREKTİRİR)

```bash
curl -X POST http://localhost:3003/api/risk/threshold/set \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token-123" \
  -d '{
    "action": "/risk/threshold.set",
    "params": {
      "exchange": "binance:futures",
      "maxNotionalPerTradeUSDT": 200,
      "maxLeverage": 5,
      "maxDailyDrawdownPct": 3,
      "requireStopLoss": true,
      "killSwitch": true
    },
    "dryRun": false,
    "confirm_required": true,
    "reason": "İlk canlı devreye alım için guardrails"
  }'
```

### 3. Canary Confirm (CANLI ETKİ - ONAY GEREKTİRİR)

```bash
curl -X POST http://localhost:3003/api/canary/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token-123" \
  -d '{
    "action": "/canary/confirm",
    "params": {
      "scope": "binance:futures",
      "targets": ["place_order","cancel_order","ack_latency"],
      "criteria": { 
        "p95_ms_max": 1000, 
        "success_rate_min": 0.98, 
        "ts_errors_max": 15, 
        "auth": "token" 
      }
    },
    "dryRun": false,
    "confirm_required": true,
    "reason": "Runtime GREEN kanıtlarıyla canlı emir akışı"
  }'
```

### 4. Alerts (Otomatik)

```bash
curl -X POST http://localhost:3003/api/alerts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token-123" \
  -d '{
    "action": "/alerts/create",
    "params": [
      { "kind":"price","symbol":"BTCUSDT","op":"lt","value":58000,"ttl":"1d" },
      { "kind":"metric","name":"ack_p95_ms","op":"gt","value":800,"ttl":"24h" }
    ],
    "dryRun": false,
    "confirm_required": false,
    "reason": "Risk ve gecikme için erken uyarı"
  }'
```

## Kanıt Kriterleri

✅ **Place→ACK P95 < 1000 ms**
✅ **Success Rate ≥ 98%**  
✅ **Stop Loss zorunlu aktif**
✅ **Audit trail eksiksiz**

## Strateji Detayları (EMA + ATR v0)

- **Long Signal**: EMA9 > EMA21 crossover
- **Short Signal**: EMA9 < EMA21 crossover  
- **Stop Loss**: 1.5 × ATR(14)
- **Take Profit**: 2.0 × ATR(14)
- **Volatility Filter**: ATR/Price < 0.002 ise trade skip

## Risk Yönetimi

- **Max Notional**: 200 USDT per trade
- **Max Leverage**: 5x
- **Daily Drawdown**: ≤3%
- **Kill Switch**: Always enabled
- **Concurrent Positions**: ≤3
