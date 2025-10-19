# Spark TA Module v1.0.0 - API Reference

## 📡 Base URLs

- **Executor:** `http://localhost:4001`
- **Web-Next:** `http://localhost:3000`

---

## 🔧 Copilot Tools (Executor)

### POST /tools/fibonacci_levels
Calculate Fibonacci retracement levels.

**Request:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1d",
  "period": 200
}
```

**Response:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1d",
  "high": 69400,
  "low": 50200,
  "levels": [
    { "ratio": 0, "price": 69400 },
    { "ratio": 0.236, "price": 64868 },
    { "ratio": 0.382, "price": 62082 },
    { "ratio": 0.5, "price": 59800 },
    { "ratio": 0.618, "price": 57518 },
    { "ratio": 0.786, "price": 54304 },
    { "ratio": 1, "price": 50200 }
  ]
}
```

---

### POST /tools/bollinger_bands
Calculate Bollinger Bands.

**Request:**
```json
{
  "symbol": "ETHUSDT",
  "timeframe": "1h",
  "period": 20,
  "stdDev": 2
}
```

**Response:**
```json
{
  "symbol": "ETHUSDT",
  "timeframe": "1h",
  "period": 20,
  "stdDev": 2,
  "current": {
    "u": 1820.50,
    "m": 1705.30,
    "l": 1590.10
  },
  "series": [
    { "u": 1815.20, "m": 1700.00, "l": 1584.80 },
    ...
  ]
}
```

---

### POST /tools/macd
Calculate MACD indicator.

**Request:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "4h",
  "fast": 12,
  "slow": 26,
  "signal": 9
}
```

**Response:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "4h",
  "current": {
    "macd": 245.67,
    "signal": 198.34,
    "histogram": 47.33
  },
  "series": [...]
}
```

---

### POST /tools/stochastic
Calculate Stochastic Oscillator.

**Request:**
```json
{
  "symbol": "ETHUSDT",
  "timeframe": "1h",
  "kPeriod": 14,
  "dPeriod": 3
}
```

**Response:**
```json
{
  "symbol": "ETHUSDT",
  "timeframe": "1h",
  "current": {
    "k": 72.45,
    "d": 68.12
  },
  "series": [...]
}
```

---

## 🔔 Alerts (Executor)

### POST /alerts/create
Create a new alert.

**Request:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "type": "bb_break",
  "params": {
    "side": "both",
    "period": 20,
    "stdDev": 2
  }
}
```

**Response:**
```json
{
  "ok": true,
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "alert": {
    "id": "...",
    "symbol": "BTCUSDT",
    "timeframe": "1h",
    "type": "bb_break",
    "params": {...},
    "active": true,
    "createdAt": 1734537600000,
    "lastTriggeredAt": null
  }
}
```

**Alert Types:**
- `bb_break`: Bollinger Bands breakout
  - params: `{ side: "upper"|"lower"|"both", period, stdDev }`
- `fib_touch`: Price touches Fibonacci level
  - params: `{ level: 0.618, tolerance: 0.01 }`
- `macd_cross`: MACD line crosses signal line
  - params: `{ direction: "bullish"|"bearish"|"both" }`
- `stoch_cross`: Stochastic %K crosses %D
  - params: `{ zone: "overbought"|"oversold"|"any", threshold: 80 }`

---

### GET /alerts/list
List all alerts.

**Response:**
```json
{
  "ok": true,
  "items": [
    {
      "id": "...",
      "symbol": "BTCUSDT",
      "timeframe": "1h",
      "type": "bb_break",
      "active": true,
      "createdAt": 1734537600000,
      "lastTriggeredAt": 1734538500000
    },
    ...
  ]
}
```

---

### GET /alerts/get?id={id}
Get a single alert.

**Response:**
```json
{
  "ok": true,
  "id": "...",
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "type": "bb_break",
  "params": {...},
  "active": true,
  "createdAt": 1734537600000,
  "lastTriggeredAt": 1734538500000
}
```

---

### POST /alerts/enable
Enable an alert.

**Request:**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef"
}
```

**Response:**
```json
{
  "ok": true
}
```

---

### POST /alerts/disable
Disable an alert.

**Request:**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef"
}
```

**Response:**
```json
{
  "ok": true
}
```

---

### POST /alerts/delete
Delete an alert.

**Request:**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef"
}
```

**Response:**
```json
{
  "ok": true
}
```

---

### POST /alerts/test
Test an alert (trigger once manually).

**Request:**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef"
}
```

**Response:**
```json
{
  "ok": true,
  "triggered": true,
  "reason": "Manual test"
}
```

---

### GET /alerts/history?id={id}&limit=100
Get alert trigger history.

**Response:**
```json
{
  "ok": true,
  "id": "...",
  "events": [
    {
      "id": "...",
      "symbol": "BTCUSDT",
      "timeframe": "1h",
      "type": "bb_break",
      "reason": "Price broke upper band",
      "value": 69450.25,
      "ts": 1734538500000
    },
    ...
  ]
}
```

---

## 📡 Real-Time Streaming (Web-Next)

### GET /api/marketdata/stream
Server-Sent Events stream for real-time kline data.

**Query Params:**
- `symbol`: Trading pair (e.g., BTCUSDT)
- `timeframe`: Interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)

**Example:**
```bash
curl -N "http://localhost:3000/api/marketdata/stream?symbol=BTCUSDT&timeframe=1m"
```

**Response (SSE):**
```
data: {"type":"open"}

data: {"type":"kline","data":{"t":1734537600000,"o":69400,"h":69450,"l":69380,"c":69420,"v":12.5,"x":false}}

data: {"type":"kline","data":{"t":1734537600000,"o":69400,"h":69460,"l":69380,"c":69430,"v":15.2,"x":false}}

data: {"type":"kline","data":{"t":1734537600000,"o":69400,"h":69470,"l":69380,"c":69450,"v":18.7,"x":true}}
```

**Fields:**
- `x`: `false` = updating candle, `true` = closed candle

**Headers:**
```
HEAD /api/marketdata/stream

X-Streams-Connected: 1
X-Streams-Messages: 342
X-Streams-Errors: 0
```

---

## 📊 Marketdata (Web-Next)

### GET /api/marketdata/candles
Get historical kline data.

**Query Params:**
- `symbol`: Trading pair
- `timeframe`: Interval
- `limit`: Number of candles (default: 100, max: 1000)

**Example:**
```bash
curl "http://localhost:3000/api/marketdata/candles?symbol=BTCUSDT&timeframe=1h&limit=200"
```

**Response:**
```json
[
  {
    "t": 1734537600000,
    "o": 69400,
    "h": 69500,
    "l": 69300,
    "c": 69450,
    "v": 123.45
  },
  ...
]
```

---

## 💬 Notifications (Executor)

### POST /notify/test
Send a test notification.

**Request:**
```json
{
  "channel": "telegram",
  "message": "Test notification from Spark TA"
}
```

**Response:**
```json
{
  "ok": true,
  "sent": 1
}
```

---

## 📊 Metrics (Executor)

### GET /metrics
Prometheus metrics in text format.

**Example:**
```bash
curl http://localhost:4001/metrics
```

**Response:**
```
# HELP alerts_created_total Number of alerts created
# TYPE alerts_created_total counter
alerts_created_total 42

# HELP alerts_triggered_total Number of alerts triggered
# TYPE alerts_triggered_total counter
alerts_triggered_total{type="bb_break",symbol="BTCUSDT",timeframe="1h"} 5
alerts_triggered_total{type="fib_touch",symbol="ETHUSDT",timeframe="4h"} 2

# HELP alerts_active Current number of active alerts
# TYPE alerts_active gauge
alerts_active 12

# HELP notifications_sent_total Number of notifications sent
# TYPE notifications_sent_total counter
notifications_sent_total{channel="telegram"} 7
notifications_sent_total{channel="webhook"} 3

# HELP leader_elected_total Number of times leader was elected
# TYPE leader_elected_total counter
leader_elected_total 1

# HELP streams_connected Current number of SSE streams
# TYPE streams_connected gauge
streams_connected 3
```

---

## ❤️ Health (Executor)

### GET /health
Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## 🔐 Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid symbol format",
  "code": "INVALID_INPUT"
}
```

### 404 Not Found
```json
{
  "error": "Alert not found",
  "code": "NOT_FOUND"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## 📝 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/tools/*` | 60 req/min | Per IP |
| `/alerts/*` | 30 req/min | Per IP |
| `/notify/*` | 10 req/min | Per IP |
| `/stream` | 3 connections | Per IP |

---

## 🔄 Pagination (Future - PATCH-5B)

### GET /alerts/list?limit=50&cursor={cursor}

**Response:**
```json
{
  "items": [...],
  "nextCursor": "eyJpZCI6IjAxMjM0NTY3In0="
}
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-11  
**Status:** Production Ready

