# PRIVATE-API DAY-4 TASK CHECKLIST: Precision & Idempotency

## 🎯 DAY-4 Hedefleri
- Exchange Rules Cache (LOT_SIZE, PRICE_FILTER, MIN_NOTIONAL)
- Precision & Filters validation
- LIMIT_MAKER (post-only) support
- Idempotency with X-Idempotency-Key
- Atomic Replace orders
- Cancel-All hardening
- Balance Valuation v2 (USD/TL)
- Enhanced metrics and alerts

## 📋 TASK 1: Exchange Rules Cache

### 1.1 Exchange Info Service
```typescript
// services/executor/src/lib/exchangeInfo.ts
export async function getExchangeInfo(baseUrl: string) {
  const now = Date.now();
  if (cache && (now - cacheAt) < TTL_MS) return cache;
  
  const res = await fetch(`${baseUrl}/api/v3/exchangeInfo`);
  if (!res.ok) throw new Error(`exchangeInfo HTTP ${res.status}`);
  
  cache = await res.json();
  cacheAt = now;
  return cache;
}
```

### 1.2 Symbol Filters
```typescript
export function getSymbolFilters(info: any, symbol: string) {
  const s = info.symbols?.find((x: any) => x.symbol === symbol);
  if (!s) throw new Error('SYMBOL_NOT_FOUND');
  
  const pf = (t: string) => s.filters.find((f: any) => f.filterType === t);
  
  return {
    priceFilter: pf('PRICE_FILTER'),
    lotSize: pf('LOT_SIZE'),
    minNotional: pf('MIN_NOTIONAL'),
    baseAssetPrecision: s.baseAssetPrecision,
    quoteAssetPrecision: s.quoteAssetPrecision
  };
}
```

### 1.3 Precision Clamping
```typescript
export function clampToStep(v: string, step: string) {
  const d = (step.split('.')[1] || '').length;
  return Number(v).toFixed(d);
}
```

## 📋 TASK 2: Enhanced Order Validation

### 2.1 Precision & Min Notional
```typescript
// services/executor/src/routes/private.ts
r.post('/order', guardWrite, async (req, res, next) => {
  try {
    // Get exchange info and filters
    const info = await getExchangeInfo(process.env.BINANCE_API_BASE!);
    const f = getSymbolFilters(info, symbol);
    
    // Precision clamping
    if (price && f.priceFilter?.tickSize) {
      req.body.price = clampToStep(price, f.priceFilter.tickSize);
    }
    if (quantity && f.lotSize?.stepSize) {
      req.body.quantity = clampToStep(quantity, f.lotSize.stepSize);
    }
    
    // Min notional validation
    if (f.minNotional?.minNotional && price && quantity) {
      if (!validateMinNotional(price, quantity, f.minNotional.minNotional)) {
        return res.status(400).json({ error: 'MIN_NOTIONAL' });
      }
    }
    
    // Idempotency
    req.body.newClientOrderId = genClientOrderId(req.header('X-Idempotency-Key'));
    
    const data = await privateClient.newOrder(req.body);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
});
```

### 2.2 LIMIT_MAKER Support
```typescript
// LIMIT_MAKER (post-only) - Binance will reject if marketable
if (type === 'LIMIT_MAKER') {
  // TODO: Add best bid/ask check for pre-validation
}
```

## 📋 TASK 3: Idempotency

### 3.1 Idempotency Key Generation
```typescript
function genClientOrderId(idem?: string) {
  if (idem) return idem.slice(0, 36);
  return `spark-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}
```

### 3.2 UI Integration
```typescript
// apps/web-next/components/OrderTicket.tsx
const headers: any = { "Content-Type": "application/json" };
headers["X-Idempotency-Key"] = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

## 📋 TASK 4: Atomic Replace Orders

### 4.1 Replace Route
```typescript
r.post('/order/replace', guardWrite, async (req, res, next) => {
  try {
    const { symbol, cancelOrderId, newOrder } = req.body;
    if (!symbol || !newOrder) return res.status(400).json({ error: 'BAD_REQUEST' });
    
    // Idempotent clientOrderId
    newOrder.newClientOrderId = genClientOrderId(req.header('X-Idempotency-Key'));
    
    // 1) Cancel existing order
    if (cancelOrderId) {
      await privateClient.cancelOrder({ symbol, orderId: String(cancelOrderId) });
    }
    
    // 2) Place new order
    const out = await privateClient.newOrder(newOrder);
    calls.inc({ route: 'order-replace', method: 'POST', ok: 'true' });
    res.json({ ok: true, data: out });
  } catch (e) { next(e); }
});
```

## 📋 TASK 5: Cancel-All Hardening

### 5.1 Symbol Required
```typescript
r.delete('/open-orders', guardWrite, async (req, res, next) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'SYMBOL_REQUIRED' });
    
    const data = await privateClient.cancelAllOpenOrders(String(symbol));
    calls.inc({ route: 'cancel-all', method: 'DELETE', ok: 'true' });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
});
```

## 📋 TASK 6: Balance Valuation v2

### 6.1 USD Calculation
```typescript
r.get('/balance', async (req, res, next) => {
  try {
    const account = await privateClient.account();
    const tickerPrices = await privateClient.tickerPrice();
    
    // Calculate USD values
    const balances = account.balances
      .filter((b: any) => Number(b.free) > 0 || Number(b.locked) > 0)
      .map((b: any) => {
        const total = Number(b.free) + Number(b.locked);
        const price = tickerPrices.find((p: any) => p.symbol === `${b.asset}USDT`)?.price;
        const usdValue = price ? total * Number(price) : 0;
        
        return {
          ...b,
          total: String(total),
          usdValue: usdValue.toFixed(2)
        };
      });
    
    const totalUsdValue = balances.reduce((sum: number, b: any) => sum + Number(b.usdValue), 0);
    
    const snapshot = {
      timestamp: Date.now(),
      balances,
      totalUsdValue: totalUsdValue.toFixed(2)
    };
    
    res.json({ ok: true, data: snapshot });
  } catch (e) { next(e); }
});
```

## 📋 TASK 7: Enhanced Metrics

### 7.1 New Metrics
```prometheus
# Order Replace
spark_private_calls_total{route="order-replace", method="POST", ok="true"}
spark_private_errors_total{route="order-replace", code="BAD_REQUEST"}

# Cancel All
spark_private_calls_total{route="cancel-all", method="DELETE", ok="true"}
spark_private_errors_total{route="cancel-all", code="SYMBOL_REQUIRED"}

# Exchange Info
spark_private_calls_total{route="exchange-info", method="GET", ok="true"}

# Balance
spark_private_calls_total{route="balance", method="GET", ok="true"}
```

### 7.2 Alert Rules
```yaml
# Replace Order Error Rate
- alert: ReplaceOrderErrorRateHigh
  expr: rate(spark_private_errors_total{route="order-replace"}[5m]) / rate(spark_private_calls_total{route="order-replace"}[5m]) > 0.1
  for: 5m

# Cancel All Error Rate
- alert: CancelAllErrorRateHigh
  expr: rate(spark_private_errors_total{route="cancel-all"}[5m]) / rate(spark_private_calls_total{route="cancel-all"}[5m]) > 0.1
  for: 5m
```

## 📋 TASK 8: Test Scripts

### 8.1 DAY-4 Master Test
```cmd
@echo off
set BASE=http://127.0.0.1:4001
set SYM=BTCUSDT

echo [D4-1] Exchange Info
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/exchange-info

echo [D4-2] LIMIT_MAKER (Post-Only)
curl -s -X POST %BASE%/api/private/order -H "Content-Type: application/json" -H "X-Idempotency-Key: lmkr-1" -d "{\"symbol\":\"%SYM%\",\"side\":\"BUY\",\"type\":\"LIMIT_MAKER\",\"price\":\"65000\",\"quantity\":\"0.0006\"}"

echo [D4-3] REPLACE Order
curl -s -X POST %BASE%/api/private/order/replace -H "Content-Type: application/json" -H "X-Idempotency-Key: rplc-1" -d "{\"symbol\":\"%SYM%\",\"cancelOrderId\":\"12345\",\"newOrder\":{\"side\":\"SELL\",\"type\":\"LIMIT\",\"price\":\"66000\",\"quantity\":\"0.0006\"}}"

echo [D4-4] CANCEL-ALL (Symbol Required)
curl -s -X DELETE "%BASE%/api/private/open-orders?symbol=%SYM%"

echo [D4-5] Balance with USD Valuation
curl -s %BASE%/api/private/balance

echo [D4-6] METRICS
curl -s %BASE%/api/public/metrics/prom | findstr spark_private_
```

## 📋 TASK 9: Validation Commands

### 9.1 Smoke Test
```bash
# Exchange Info
curl -s http://127.0.0.1:4001/api/private/exchange-info

# LIMIT_MAKER (post-only)
curl -s -X POST http://127.0.0.1:4001/api/private/order \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: lmkr-1" \
  -d '{"symbol":"BTCUSDT","side":"BUY","type":"LIMIT_MAKER","price":"65000","quantity":"0.0006"}'

# Replace (cancel+new)
curl -s -X POST http://127.0.0.1:4001/api/private/order/replace \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: rplc-1" \
  -d '{"symbol":"BTCUSDT","cancelOrderId":"12345","newOrder":{"side":"SELL","type":"LIMIT","price":"66000","quantity":"0.0006"}}'

# Cancel-All (symbol-required)
curl -s -X DELETE "http://127.0.0.1:4001/api/private/open-orders?symbol=BTCUSDT"

# Balance with USD
curl -s http://127.0.0.1:4001/api/private/balance

# Metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep spark_private_
```

## 📋 TASK 10: Success Criteria

✅ Exchange Info: GET /api/private/exchange-info → 200
✅ Precision Clamping: Price/qty otomatik yuvarlama
✅ Min Notional: Validation aktif
✅ LIMIT_MAKER: Post-only order desteği
✅ Idempotency: X-Idempotency-Key ile duplicate koruması
✅ Replace Order: POST /api/private/order/replace → 200
✅ Cancel-All: DELETE /api/private/open-orders (symbol required) → 200
✅ Balance USD: GET /api/private/balance → USD değerleme
✅ Enhanced Metrics: Yeni metrikler Prometheus'ta
✅ Test Scripts: DAY-4 test script çalışıyor

## 📋 TASK 11: HEALTH Status

- **YELLOW**: DAY-4 altyapı hazır, testnet key'leri bekleniyor
- **GREEN**: Tüm precision/idempotency testleri geçti
- **RED**: Kritik hata, geri dönüş gerekli

## 📋 TASK 12: Edge Cases

### 12.1 -1021 Timestamp Error
```bash
# Clock drift ayarla
PRIVATE_CLOCK_DRIFT_MS=+1000  # +1000ms
PRIVATE_CLOCK_DRIFT_MS=+2000  # +2000ms (gerekirse)
PRIVATE_CLOCK_DRIFT_MS=+3000  # +3000ms (maksimum)
```

### 12.2 429 Rate Limit Error
```bash
# Backoff süresini artır
PRIVATE_REQ_RETRIES=5
# Rate limit'i düşür
PRIVATE_RATE_LIMIT_QPS=5
```

### 12.3 Precision Clamp Errors
- Price: tickSize'a göre yuvarlama
- Quantity: stepSize'a göre yuvarlama
- Min Notional: minimum değer kontrolü

## 📋 TASK 13: Next Steps (DAY-5)

- Trade Rules Auto-Sync
- Symbol Discovery
- Paper ↔ Testnet Diff Analyzer
- Canary-48h raporlama
- WebSocket order updates
- Advanced order types (Iceberg, TWAP) 