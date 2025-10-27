# PRIVATE-API DAY-3 TASK CHECKLIST: OCO/STOP & Cancel-All

## 🎯 DAY-3 Hedefleri
- OCO (One-Cancels-Other) order desteği
- Stop Order entegrasyonu
- Cancel-All route (DELETE /api/private/open-orders)
- Balance Snapshot ve PnL entegrasyonu
- Paper ↔ Testnet Diff raporu
- Grafana Dashboard JSON

## 📋 TASK 1: OCO Order Desteği

### 1.1 Binance OCO API Entegrasyonu
```typescript
// packages/@spark/exchange-private/src/binance.ts
ocoOrder(params: {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;        // Limit price
  stopPrice: string;    // Stop price
  stopLimitPrice?: string; // Stop limit price (optional)
  stopLimitTimeInForce?: 'GTC' | 'IOC' | 'FOK';
}) {
  return this.callSigned('POST', '/api/v3/order/oco', params as any);
}
```

### 1.2 Executor Route
```typescript
// services/executor/src/routes/private.ts
r.post('/order/oco', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    const { symbol, side, quantity, price, stopPrice, stopLimitPrice, stopLimitTimeInForce } = req.body ?? {};
    if (!isAllowedSymbol(symbol)) return res.status(400).json({ error: 'SYMBOL_NOT_ALLOWED' });
    if (!checkMinQty(symbol, String(quantity || '0'))) {
      return res.status(400).json({ error: 'QTY_BELOW_MIN' });
    }
    const data = await privateClient.ocoOrder(req.body);
    calls.inc({ route: 'order-oco', method: 'POST', ok: 'true' });
    res.json({ ok: true, data });
  } catch (e: any) {
    calls.inc({ route: 'order-oco', method: 'POST', ok: 'false' });
    errors.inc({ route: 'order-oco', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

### 1.3 UI OCO Form
```typescript
// apps/web-next/components/OcoOrderTicket.tsx
export default function OcoOrderTicket() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<"BUY"|"SELL">("BUY");
  const [qty, setQty] = useState("0.0005");
  const [price, setPrice] = useState("");      // Limit price
  const [stopPrice, setStopPrice] = useState(""); // Stop price
  const [stopLimitPrice, setStopLimitPrice] = useState(""); // Stop limit price

  async function submit() {
    const body = { symbol, side, quantity: qty, price, stopPrice };
    if (stopLimitPrice) body.stopLimitPrice = stopLimitPrice;
    const r = await fetch("/api/private/order/oco", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(body) 
    });
    const j = await r.json();
    if (!r.ok) alert(`Hata: ${j.error || j.msg || r.status}`); 
    else alert(`OCO OK: ${JSON.stringify(j)}`);
  }

  return (
    <div className="p-3 rounded-xl border bg-purple-50 border-purple-200">
      <div className="font-semibold mb-2 text-purple-800">OCO Order (TESTNET)</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="border p-2 rounded border-purple-300" value={symbol} onChange={e=>setSymbol(e.target.value)} />
        <select className="border p-2 rounded border-purple-300" value={side} onChange={e=>setSide(e.target.value as any)}>
          <option>BUY</option><option>SELL</option>
        </select>
        <input className="border p-2 rounded border-purple-300" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Qty" />
        <input className="border p-2 rounded border-purple-300" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Limit Price" />
        <input className="border p-2 rounded border-purple-300" value={stopPrice} onChange={e=>setStopPrice(e.target.value)} placeholder="Stop Price" />
        <input className="border p-2 rounded border-purple-300" value={stopLimitPrice} onChange={e=>setStopLimitPrice(e.target.value)} placeholder="Stop Limit Price (opt)" />
      </div>
      <button className="mt-3 px-4 py-2 rounded-xl border shadow bg-purple-600 text-white hover:bg-purple-700" onClick={submit}>
        Send OCO
      </button>
    </div>
  );
}
```

## 📋 TASK 2: Stop Order Desteği

### 2.1 Binance Stop Order API
```typescript
// packages/@spark/exchange-private/src/binance.ts
stopOrder(params: {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'STOP_MARKET' | 'STOP_LIMIT';
  quantity: string;
  stopPrice: string;
  price?: string; // Required for STOP_LIMIT
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}) {
  return this.callSigned('POST', '/api/v3/order', params as any);
}
```

### 2.2 Executor Route
```typescript
// services/executor/src/routes/private.ts
r.post('/order/stop', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    const { symbol, side, type, quantity, stopPrice, price, timeInForce } = req.body ?? {};
    if (!isAllowedSymbol(symbol)) return res.status(400).json({ error: 'SYMBOL_NOT_ALLOWED' });
    if (!checkMinQty(symbol, String(quantity || '0'))) {
      return res.status(400).json({ error: 'QTY_BELOW_MIN' });
    }
    if (type === 'STOP_LIMIT' && !price) {
      return res.status(400).json({ error: 'PRICE_REQUIRED_FOR_STOP_LIMIT' });
    }
    const data = await privateClient.stopOrder(req.body);
    calls.inc({ route: 'order-stop', method: 'POST', ok: 'true' });
    res.json({ ok: true, data });
  } catch (e: any) {
    calls.inc({ route: 'order-stop', method: 'POST', ok: 'false' });
    errors.inc({ route: 'order-stop', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

## 📋 TASK 3: Cancel-All Route

### 3.1 Binance Cancel All Orders
```typescript
// packages/@spark/exchange-private/src/binance.ts
cancelAllOrders(symbol?: string) {
  const p: Record<string, string> = {};
  if (symbol) p.symbol = symbol;
  return this.callSigned('DELETE', '/api/v3/openOrders', p);
}
```

### 3.2 Executor Route
```typescript
// services/executor/src/routes/private.ts
r.delete('/open-orders', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    const { symbol } = req.query || {};
    if (symbol && !isAllowedSymbol(String(symbol))) {
      return res.status(400).json({ error: 'SYMBOL_NOT_ALLOWED' });
    }
    const data = await privateClient.cancelAllOrders(symbol as string | undefined);
    calls.inc({ route: 'cancel-all', method: 'DELETE', ok: 'true' });
    res.json({ ok: true, data });
  } catch (e: any) {
    calls.inc({ route: 'cancel-all', method: 'DELETE', ok: 'false' });
    errors.inc({ route: 'cancel-all', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

### 3.3 UI Cancel-All Button
```typescript
// apps/web-next/components/OpenOrdersTable.tsx
async function cancelAllOrders(symbol?: string) {
  try {
    const url = symbol ? `/api/private/open-orders?symbol=${symbol}` : '/api/private/open-orders';
    const r = await fetch(url, { method: 'DELETE' });
    const j = await r.json();
    if (!r.ok) alert(`Hata: ${j.error || j.msg || r.status}`);
    else {
      alert(`Cancel All OK: ${JSON.stringify(j)}`);
      load(); // Refresh table
    }
  } catch (e) {
    alert(`Hata: ${e}`);
  }
}

// Add to component JSX
<div className="flex justify-between items-center mb-2">
  <div className="font-semibold">Open Orders</div>
  <button 
    onClick={() => cancelAllOrders()}
    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
  >
    Cancel All
  </button>
</div>
```

## 📋 TASK 4: Balance Snapshot

### 4.1 Balance Interface
```typescript
// types/balance.ts
export interface Balance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

export interface BalanceSnapshot {
  timestamp: number;
  balances: Balance[];
  totalUsdValue: number;
}
```

### 4.2 Balance Service
```typescript
// services/executor/src/lib/balanceService.ts
import { privateClient } from './privateClient';

export class BalanceService {
  async getSnapshot(): Promise<BalanceSnapshot> {
    const account = await privateClient.account();
    const balances = account.balances
      .filter(b => Number(b.free) > 0 || Number(b.locked) > 0)
      .map(b => ({
        ...b,
        total: String(Number(b.free) + Number(b.locked))
      }));
    
    // TODO: USD conversion (requires price API)
    const totalUsdValue = 0; // Placeholder
    
    return {
      timestamp: Date.now(),
      balances,
      totalUsdValue
    };
  }
}
```

### 4.3 Balance Route
```typescript
// services/executor/src/routes/private.ts
r.get('/balance', async (req, res, next) => {
  try {
    const snapshot = await balanceService.getSnapshot();
    calls.inc({ route: 'balance', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: snapshot });
  } catch (e: any) {
    calls.inc({ route: 'balance', method: 'GET', ok: 'false' });
    errors.inc({ route: 'balance', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

## 📋 TASK 5: Paper ↔ Testnet Diff Raporu

### 5.1 Diff Service
```typescript
// services/executor/src/lib/diffService.ts
export interface DiffReport {
  timestamp: number;
  paperOrders: any[];
  testnetOrders: any[];
  differences: {
    orderCount: { paper: number; testnet: number; diff: number };
    totalValue: { paper: number; testnet: number; diff: number };
    executionTime: { paper: number; testnet: number; diff: number };
  };
}

export class DiffService {
  async generateReport(): Promise<DiffReport> {
    // TODO: Implement paper vs testnet comparison
    return {
      timestamp: Date.now(),
      paperOrders: [],
      testnetOrders: [],
      differences: {
        orderCount: { paper: 0, testnet: 0, diff: 0 },
        totalValue: { paper: 0, testnet: 0, diff: 0 },
        executionTime: { paper: 0, testnet: 0, diff: 0 }
      }
    };
  }
}
```

## 📋 TASK 6: Grafana Dashboard JSON

### 6.1 Dashboard Template
```json
// ops/grafana/dashboards/private_api_dashboard.json
{
  "dashboard": {
    "title": "Private API Dashboard",
    "panels": [
      {
        "title": "API Calls",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(spark_private_calls_total[5m])",
            "legendFormat": "{{route}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(spark_private_errors_total[5m]) / rate(spark_private_calls_total[5m])",
            "legendFormat": "{{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(spark_private_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## 📋 TASK 7: Windows CMD Test Scripts

### 7.1 OCO Test Script
```cmd
@echo off
setlocal enabledelayedexpansion
set BASE=http://127.0.0.1:4001
set SYM=BTCUSDT
set QTY=0.0005
set PRICE=50000
set STOP=45000

echo [OCO-TEST] BUY OCO
curl -s -X POST %BASE%/api/private/order/oco -H "Content-Type: application/json" -d "{\"symbol\":\"%SYM%\",\"side\":\"BUY\",\"quantity\":\"%QTY%\",\"price\":\"%PRICE%\",\"stopPrice\":\"%STOP%\"}"

timeout /t 2 > NUL
echo [OCO-TEST] OPEN ORDERS
curl -s "%BASE%/api/private/open-orders?symbol=%SYM%"

echo Done.
```

### 7.2 Stop Order Test Script
```cmd
@echo off
setlocal enabledelayedexpansion
set BASE=http://127.0.0.1:4001
set SYM=BTCUSDT
set QTY=0.0005
set STOP=45000

echo [STOP-TEST] BUY STOP MARKET
curl -s -X POST %BASE%/api/private/order/stop -H "Content-Type: application/json" -d "{\"symbol\":\"%SYM%\",\"side\":\"BUY\",\"type\":\"STOP_MARKET\",\"quantity\":\"%QTY%\",\"stopPrice\":\"%STOP%\"}"

timeout /t 2 > NUL
echo [STOP-TEST] OPEN ORDERS
curl -s "%BASE%/api/private/open-orders?symbol=%SYM%"

echo Done.
```

### 7.3 Cancel-All Test Script
```cmd
@echo off
setlocal enabledelayedexpansion
set BASE=http://127.0.0.1:4001
set SYM=BTCUSDT

echo [CANCEL-ALL] Before
curl -s "%BASE%/api/private/open-orders?symbol=%SYM%"

echo [CANCEL-ALL] Cancelling all orders
curl -s -X DELETE "%BASE%/api/private/open-orders?symbol=%SYM%"

timeout /t 2 > NUL
echo [CANCEL-ALL] After
curl -s "%BASE%/api/private/open-orders?symbol=%SYM%"

echo Done.
```

## 📋 TASK 8: Validation Commands

### 8.1 Smoke Test
```cmd
:: OCO Order
curl -s -X POST http://127.0.0.1:4001/api/private/order/oco -H "Content-Type: application/json" -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"quantity\":\"0.0005\",\"price\":\"50000\",\"stopPrice\":\"45000\"}"

:: Stop Order
curl -s -X POST http://127.0.0.1:4001/api/private/order/stop -H "Content-Type: application/json" -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"STOP_MARKET\",\"quantity\":\"0.0005\",\"stopPrice\":\"45000\"}"

:: Cancel All
curl -s -X DELETE http://127.0.0.1:4001/api/private/open-orders?symbol=BTCUSDT

:: Balance
curl -s http://127.0.0.1:4001/api/private/balance
```

## 📋 TASK 9: Success Criteria

✅ OCO Order: POST /api/private/order/oco → 200
✅ Stop Order: POST /api/private/order/stop → 200
✅ Cancel All: DELETE /api/private/open-orders → 200
✅ Balance: GET /api/private/balance → 200
✅ UI Components: OcoOrderTicket + Cancel-All button
✅ Test Scripts: OCO, Stop, Cancel-All testleri
✅ Grafana Dashboard: JSON template hazır
✅ Diff Report: Paper vs Testnet karşılaştırma

## 📋 TASK 10: HEALTH Status

- **YELLOW**: DAY-3 altyapı hazır, testnet key'leri bekleniyor
- **GREEN**: Tüm OCO/Stop/Cancel-All testleri geçti
- **RED**: Kritik hata, geri dönüş gerekli

## 📋 TASK 11: Next Steps (DAY-4)

- WebSocket order updates
- Advanced order types (Iceberg, TWAP)
- Portfolio PnL tracking
- Risk management rules
- Multi-exchange support 