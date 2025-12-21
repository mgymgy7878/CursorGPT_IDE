# API — Taslak Uç Noktalar

## Strategy

### POST /api/strategy/nl-compile
NL'den Strategy IR üret.

**Input:**
```json
{ "text": "BTC için RSI 30 altında al, 70 üstünde sat" }
```

**Output:**
```json
{
  "strategyIR": { ... },
  "explain": ["RSI indikatörü kullanılıyor", "Eşikler: 30/70"]
}
```

### POST /api/strategy/backtest
Stratejiyi geçmiş verilerle test et.

**Input:**
```json
{
  "strategyId": "abc123",
  "range": { "start": "2024-01-01", "end": "2024-12-01" },
  "datasource": "binance"
}
```

**Output:**
```json
{
  "metrics": { "sharpe": 1.5, "maxDrawdown": 0.12, "winRate": 0.65 },
  "equityCurve": [...],
  "logs": [...]
}
```

### POST /api/strategy/optimize
Grid/Bayes optimizasyonu.

**Input:**
```json
{
  "strategyId": "abc123",
  "search": "grid",
  "constraints": { "maxTrials": 100 }
}
```

**Output:**
```json
{
  "best": { "params": {...}, "score": 1.8 },
  "leaderboard": [...]
}
```

### POST /api/strategy/canary
Canary test çalıştır.

**Input:**
```json
{ "strategyId": "abc123", "params": {...} }
```

**Output:**
```json
{
  "status": "PASS",
  "evidence": {
    "staleness": 1.2,
    "wsErrorRate": 0.001,
    "p95Ms": 450,
    "msgsDelta": 42
  }
}
```

### POST /api/strategy/deploy
Stratejiyi deploy et (sadece PASS sonrası).

**Input:**
```json
{ "strategyId": "abc123", "version": "v2" }
```

**Output:**
```json
{ "ok": true, "deploymentId": "dep-xyz" }
```

### GET /api/strategy/:id/history
Versiyon + param geçmişi + diff.

**Output:**
```json
{
  "versions": [
    { "v": "v1", "params": {...}, "createdAt": "..." },
    { "v": "v2", "params": {...}, "createdAt": "...", "diff": {...} }
  ]
}
```

---

## Health / Metrics

### GET /api/public/metrics
JSON snapshot (degrade) veya proxy.

**Output:**
```json
{
  "counters": {
    "spark_ws_btcturk_msgs_total": 12345,
    "spark_ws_btcturk_reconnects_total": 2
  },
  "gauges": {
    "spark_ws_staleness_seconds": 1.5
  },
  "timestamp": "2024-12-21T18:00:00Z"
}
```

### GET /api/public/metrics.prom (Plan)
Prometheus text format.

**Output:**
```
# HELP spark_ws_btcturk_msgs_total Total WS messages received
# TYPE spark_ws_btcturk_msgs_total counter
spark_ws_btcturk_msgs_total 12345

# HELP spark_ws_staleness_seconds Seconds since last message
# TYPE spark_ws_staleness_seconds gauge
spark_ws_staleness_seconds{pair="BTCUSDT"} 1.5
```

---

## Authentication (Plan)

Tüm `/api/strategy/*` endpointleri JWT bearer token gerektirir.

```
Authorization: Bearer <token>
```
