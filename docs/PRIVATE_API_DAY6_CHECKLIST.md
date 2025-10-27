# PRIVATE-API DAY-6 TASK CHECKLIST: WebSocket + Risk Rules + PnL Tracking

## 🎯 DAY-6 Hedefleri
- WebSocket Order Updates (real-time order/account updates)
- Risk Management Rules (max position size, daily loss limits)
- Real-Time PnL Tracking (unrealized/realized PnL)
- Advanced Order Types (trailing stop, iceberg)
- Multi-Exchange Support (API abstraction)
- Backtesting Integration (historical comparison)
- Strategy Automation (parameter optimization)

## 📋 TASK 1: WebSocket Order Updates

### 1.1 WebSocket Manager
```typescript
// services/executor/src/lib/websocketManager.ts
export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;

  async connect(): Promise<void> {
    try {
      const listenKey = await this.getListenKey();
      const wsUrl = `${this.baseUrl}/ws/${listenKey}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.emit('connected');
      });

      this.ws.on('message', (data: Buffer) => {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(message);
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }
}
```

### 1.2 Order Update Handling
```typescript
private handleUserData(data: any): void {
  if (data.e === 'outboundAccountPosition') {
    const accountUpdate: AccountUpdate = {
      eventType: data.e,
      eventTime: data.E,
      balances: data.B.map((b: any) => ({
        asset: b.a,
        free: b.f,
        locked: b.l
      }))
    };
    this.emit('accountUpdate', accountUpdate);
  } else if (data.e === 'executionReport') {
    const orderUpdate: OrderUpdate = {
      symbol: data.s,
      orderId: data.i,
      clientOrderId: data.c,
      price: data.p,
      origQty: data.q,
      executedQty: data.z,
      cummulativeQuoteQty: data.Z,
      status: data.X,
      timeInForce: data.f,
      type: data.o,
      side: data.S,
      stopPrice: data.P,
      icebergQty: data.F,
      time: data.T,
      updateTime: data.t,
      isWorking: data.w,
      origQuoteOrderQty: data.Q
    };
    this.emit('orderUpdate', orderUpdate);
  }
}
```

### 1.3 WebSocket Endpoints
```typescript
// services/executor/src/routes/private.ts
r.get('/websocket/status', async (req, res, next) => {
  try {
    const status = {
      connected: wsManager?.isConnectedToWebSocket() || false,
      timestamp: Date.now()
    };
    
    calls.inc({ route: 'websocket-status', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: status });
  } catch (e: any) {
    calls.inc({ route: 'websocket-status', method: 'GET', ok: 'false' });
    errors.inc({ route: 'websocket-status', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.post('/websocket/connect', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    if (!wsManager) {
      wsManager = new WebSocketManager(
        process.env.BINANCE_API_BASE!,
        process.env.BINANCE_API_KEY!,
        process.env.BINANCE_API_SECRET!
      );
      
      wsManager.on('orderUpdate', (orderUpdate) => {
        // Update PnL tracker
        const side = orderUpdate.side === 'BUY' ? 'LONG' : 'SHORT';
        pnlTracker.updatePosition(orderUpdate.symbol, side, Number(orderUpdate.executedQty), Number(orderUpdate.price));
      });
      
      wsManager.on('accountUpdate', (accountUpdate) => {
        // Update risk manager
        console.log('Account update received:', accountUpdate);
      });
    }
    
    await wsManager.connect();
    
    calls.inc({ route: 'websocket-connect', method: 'POST', ok: 'true' });
    res.json({ ok: true, message: 'WebSocket connected' });
  } catch (e: any) {
    calls.inc({ route: 'websocket-connect', method: 'POST', ok: 'false' });
    errors.inc({ route: 'websocket-connect', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

## 📋 TASK 2: Risk Management Rules

### 2.1 Risk Manager Service
```typescript
// services/executor/src/lib/riskManager.ts
export class RiskManager {
  private rules: RiskRule[] = [];
  private positions: Map<string, Position> = new Map();
  private dailyPnL = 0;
  private dailyStartTime: number;

  constructor() {
    this.dailyStartTime = this.getStartOfDay();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'max-position-size',
        name: 'Maximum Position Size',
        type: 'MAX_POSITION_SIZE',
        value: 1000, // $1000 max position
        enabled: true,
        description: 'Maximum position size in USD'
      },
      {
        id: 'per-symbol-exposure',
        name: 'Per Symbol Exposure',
        type: 'PER_SYMBOL_EXPOSURE',
        value: 500, // $500 max per symbol
        enabled: true,
        description: 'Maximum exposure per symbol in USD'
      },
      {
        id: 'global-daily-loss',
        name: 'Global Daily Loss Limit',
        type: 'GLOBAL_DAILY_LOSS',
        value: -200, // -$200 daily loss limit
        enabled: true,
        description: 'Maximum daily loss in USD'
      }
    ];
  }
}
```

### 2.2 Risk Check Logic
```typescript
checkOrderRisk(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): RiskCheckResult[] {
  const orderValue = quantity * price;
  const results: RiskCheckResult[] = [];

  for (const rule of this.rules) {
    if (!rule.enabled) continue;

    let passed = true;
    let currentValue = 0;
    let message = '';

    switch (rule.type) {
      case 'MAX_ORDER_SIZE':
        currentValue = orderValue;
        passed = orderValue <= rule.value;
        message = passed ? 'Order size within limits' : `Order size ${orderValue} exceeds limit ${rule.value}`;
        break;

      case 'PER_SYMBOL_EXPOSURE':
        const symbolExposure = this.getSymbolExposure(symbol);
        currentValue = symbolExposure + orderValue;
        passed = currentValue <= rule.value;
        message = passed ? 'Symbol exposure within limits' : `Symbol exposure ${currentValue} exceeds limit ${rule.value}`;
        break;

      case 'GLOBAL_DAILY_LOSS':
        currentValue = this.dailyPnL;
        passed = this.dailyPnL >= rule.value;
        message = passed ? 'Daily loss within limits' : `Daily loss ${this.dailyPnL} exceeds limit ${rule.value}`;
        break;
    }

    results.push({
      passed,
      rule,
      currentValue,
      limit: rule.value,
      message
    });
  }

  return results;
}
```

### 2.3 Risk Management Endpoints
```typescript
r.get('/risk/rules', async (req, res, next) => {
  try {
    const rules = riskManager.getRules();
    const summary = riskManager.getRiskSummary();
    
    calls.inc({ route: 'risk-rules', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: { rules, summary } });
  } catch (e: any) {
    calls.inc({ route: 'risk-rules', method: 'GET', ok: 'false' });
    errors.inc({ route: 'risk-rules', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.post('/risk/rules', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    const rule = req.body;
    riskManager.addRule(rule);
    
    calls.inc({ route: 'risk-rules', method: 'POST', ok: 'true' });
    res.json({ ok: true, message: 'Risk rule added' });
  } catch (e: any) {
    calls.inc({ route: 'risk-rules', method: 'POST', ok: 'false' });
    errors.inc({ route: 'risk-rules', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

## 📋 TASK 3: PnL Tracking

### 3.1 PnL Tracker Service
```typescript
// services/executor/src/lib/pnlTracker.ts
export class PnLTracker {
  private positions: Map<string, PnLPosition> = new Map();
  private trades: Trade[] = [];
  private priceCache: Map<string, number> = new Map();
  private dailyPnL = 0;
  private weeklyPnL = 0;
  private monthlyPnL = 0;

  updatePosition(symbol: string, side: 'LONG' | 'SHORT', quantity: number, price: number): void {
    const key = `${symbol}_${side}`;
    const existing = this.positions.get(key);

    if (existing) {
      // Update existing position
      const totalQuantity = existing.quantity + quantity;
      const totalValue = (existing.quantity * existing.avgEntryPrice) + (quantity * price);
      const newAvgPrice = totalValue / totalQuantity;

      this.positions.set(key, {
        ...existing,
        quantity: totalQuantity,
        avgEntryPrice: newAvgPrice,
        timestamp: Date.now()
      });
    } else {
      // Create new position
      this.positions.set(key, {
        symbol,
        side,
        quantity,
        avgEntryPrice: price,
        currentPrice: price,
        unrealizedPnl: 0,
        realizedPnl: 0,
        totalPnl: 0,
        pnlPercent: 0,
        timestamp: Date.now()
      });
    }
  }
}
```

### 3.2 PnL Calculation
```typescript
private calculateUnrealizedPnl(position: PnLPosition): void {
  if (position.side === 'LONG') {
    position.unrealizedPnl = (position.currentPrice - position.avgEntryPrice) * position.quantity;
  } else {
    position.unrealizedPnl = (position.avgEntryPrice - position.currentPrice) * position.quantity;
  }

  position.totalPnl = position.unrealizedPnl + position.realizedPnl;
  position.pnlPercent = position.avgEntryPrice > 0 
    ? ((position.currentPrice - position.avgEntryPrice) / position.avgEntryPrice) * 100 
    : 0;
}

getPnLSummary(): PnLSummary {
  let totalUnrealizedPnl = 0;
  let totalRealizedPnl = 0;
  let bestPerformer = '';
  let worstPerformer = '';
  let bestPnl = -Infinity;
  let worstPnl = Infinity;

  for (const position of this.positions.values()) {
    totalUnrealizedPnl += position.unrealizedPnl;
    totalRealizedPnl += position.realizedPnl;

    if (position.totalPnl > bestPnl) {
      bestPnl = position.totalPnl;
      bestPerformer = position.symbol;
    }

    if (position.totalPnl < worstPnl) {
      worstPnl = position.totalPnl;
      worstPerformer = position.symbol;
    }
  }

  const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
  const totalPnlPercent = this.calculateTotalPnlPercent();

  return {
    totalUnrealizedPnl,
    totalRealizedPnl,
    totalPnl,
    totalPnlPercent,
    dailyPnl: this.dailyPnL,
    weeklyPnl: this.weeklyPnL,
    monthlyPnl: this.monthlyPnL,
    bestPerformer,
    worstPerformer,
    activePositions: this.positions.size,
    timestamp: Date.now()
  };
}
```

### 3.3 PnL Endpoints
```typescript
r.get('/pnl/summary', async (req, res, next) => {
  try {
    const summary = pnlTracker.getPnLSummary();
    const positions = pnlTracker.getPositions();
    
    calls.inc({ route: 'pnl-summary', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: { summary, positions } });
  } catch (e: any) {
    calls.inc({ route: 'pnl-summary', method: 'GET', ok: 'false' });
    errors.inc({ route: 'pnl-summary', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.get('/pnl/positions', async (req, res, next) => {
  try {
    const positions = pnlTracker.getPositions();
    
    calls.inc({ route: 'pnl-positions', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: positions });
  } catch (e: any) {
    calls.inc({ route: 'pnl-positions', method: 'GET', ok: 'false' });
    errors.inc({ route: 'pnl-positions', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.get('/pnl/performance/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const performance = pnlTracker.getSymbolPerformance(symbol);
    
    calls.inc({ route: 'pnl-performance', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: performance });
  } catch (e: any) {
    calls.inc({ route: 'pnl-performance', method: 'GET', ok: 'false' });
    errors.inc({ route: 'pnl-performance', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

## 📋 TASK 4: Enhanced UI Components

### 4.1 WebSocket Status Component
```typescript
// apps/web-next/components/WebSocketStatus.tsx
export default function WebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function loadStatus() {
    try {
      const r = await fetch("/api/private/websocket/status");
      const data = await r.json();
      if (r.ok) {
        setStatus(data.data);
      }
    } catch (e) {
      console.error('WebSocket status error:', e);
    }
  }

  async function connectWebSocket() {
    try {
      setConnecting(true);
      const r = await fetch("/api/private/websocket/connect", { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        alert("WebSocket connected successfully!");
        loadStatus();
      } else {
        alert(`Connection failed: ${data.error}`);
      }
    } catch (e) {
      alert(`Connection error: ${e}`);
    } finally {
      setConnecting(false);
    }
  }
}
```

### 4.2 Risk Manager Component
```typescript
// apps/web-next/components/RiskManager.tsx
export default function RiskManager() {
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'MAX_ORDER_SIZE',
    value: 100,
    description: ''
  });

  async function loadRiskData() {
    try {
      setLoading(true);
      const r = await fetch("/api/private/risk/rules");
      const data = await r.json();
      if (r.ok) {
        setRules(data.data.rules || []);
        setSummary(data.data.summary || null);
      }
    } catch (e) {
      console.error('Risk data error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function addRule() {
    try {
      const rule = {
        id: `rule-${Date.now()}`,
        ...newRule,
        enabled: true
      };

      const r = await fetch("/api/private/risk/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule)
      });

      if (r.ok) {
        alert("Risk rule added successfully!");
        setNewRule({ name: '', type: 'MAX_ORDER_SIZE', value: 100, description: '' });
        loadRiskData();
      } else {
        const data = await r.json();
        alert(`Failed to add rule: ${data.error}`);
      }
    } catch (e) {
      alert(`Error adding rule: ${e}`);
    }
  }
}
```

### 4.3 PnL Tracker Component
```typescript
// apps/web-next/components/PnLTracker.tsx
export default function PnLTracker() {
  const [summary, setSummary] = useState<PnLSummary | null>(null);
  const [positions, setPositions] = useState<PnLPosition[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPnLData() {
    try {
      setLoading(true);
      const r = await fetch("/api/private/pnl/summary");
      const data = await r.json();
      if (r.ok) {
        setSummary(data.data.summary || null);
        setPositions(data.data.positions || []);
      }
    } catch (e) {
      console.error('PnL data error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPnLData();
    const interval = setInterval(loadPnLData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);
}
```

## 📋 TASK 5: Enhanced Metrics & Monitoring

### 5.1 New Metrics
```prometheus
# WebSocket
spark_private_calls_total{route="websocket-status", method="GET", ok="true"}
spark_private_calls_total{route="websocket-connect", method="POST", ok="true"}

# Risk Management
spark_private_calls_total{route="risk-rules", method="GET", ok="true"}
spark_private_calls_total{route="risk-rules", method="POST", ok="true"}

# PnL Tracking
spark_private_calls_total{route="pnl-summary", method="GET", ok="true"}
spark_private_calls_total{route="pnl-positions", method="GET", ok="true"}
spark_private_calls_total{route="pnl-performance", method="GET", ok="true"}
```

### 5.2 Alert Rules
```yaml
# WebSocket Disconnection
- alert: WebSocketDisconnected
  expr: spark_private_calls_total{route="websocket-status"} == 0
  for: 1m
  labels: { severity: warning }
  annotations:
    summary: "WebSocket disconnected"

# Risk Rule Violation
- alert: RiskRuleViolation
  expr: spark_private_errors_total{route="risk-rules"} > 0
  for: 2m
  labels: { severity: warning }
  annotations:
    summary: "Risk rule violation detected"

# PnL Tracking Error
- alert: PnLTrackingError
  expr: spark_private_errors_total{route="pnl-summary"} > 0
  for: 2m
  labels: { severity: info }
  annotations:
    summary: "PnL tracking error"
```

## 📋 TASK 6: Test Scripts

### 6.1 DAY-6 Master Test
```cmd
@echo off
set BASE=http://127.0.0.1:4001
set SYM=BTCUSDT

echo ========================================
echo DAY-6 WEBSOCKET + RISK + PNL TEST
echo ========================================

echo [D6-1] WebSocket Status
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/websocket/status

echo [D6-2] WebSocket Connect
curl -s -X POST %BASE%/api/private/websocket/connect -H "Content-Type: application/json"

echo [D6-3] Risk Rules
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/risk/rules

echo [D6-4] Add Risk Rule
curl -s -X POST %BASE%/api/private/risk/rules -H "Content-Type: application/json" -d "{\"id\":\"test-rule\",\"name\":\"Test Max Order\",\"type\":\"MAX_ORDER_SIZE\",\"value\":50,\"enabled\":true,\"description\":\"Test rule\"}"

echo [D6-5] PnL Summary
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/pnl/summary

echo [D6-6] PnL Positions
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/pnl/positions

echo [D6-7] PnL Performance
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/pnl/performance/%SYM%

echo [D6-8] Enhanced Balance
curl -s %BASE%/api/private/balance

echo [D6-9] METRICS (Enhanced)
curl -s %BASE%/api/public/metrics/prom | findstr spark_private_
```

### 6.2 Validation Commands
```bash
# WebSocket Status
curl -s http://127.0.0.1:4001/api/private/websocket/status

# WebSocket Connect
curl -s -X POST http://127.0.0.1:4001/api/private/websocket/connect \
  -H "Content-Type: application/json"

# Risk Rules
curl -s http://127.0.0.1:4001/api/private/risk/rules

# Add Risk Rule
curl -s -X POST http://127.0.0.1:4001/api/private/risk/rules \
  -H "Content-Type: application/json" \
  -d '{"id":"test-rule","name":"Test Max Order","type":"MAX_ORDER_SIZE","value":50,"enabled":true,"description":"Test rule"}'

# PnL Summary
curl -s http://127.0.0.1:4001/api/private/pnl/summary

# PnL Positions
curl -s http://127.0.0.1:4001/api/private/pnl/positions

# PnL Performance
curl -s http://127.0.0.1:4001/api/private/pnl/performance/BTCUSDT

# Enhanced Balance
curl -s http://127.0.0.1:4001/api/private/balance

# Metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep spark_private_
```

## 📋 TASK 7: Success Criteria

✅ WebSocket Status: GET /api/private/websocket/status → 200, connection status
✅ WebSocket Connect: POST /api/private/websocket/connect → 200, real-time updates
✅ Risk Rules: GET /api/private/risk/rules → 200, risk management rules
✅ Add Risk Rule: POST /api/private/risk/rules → 200, rule management
✅ PnL Summary: GET /api/private/pnl/summary → 200, PnL tracking
✅ PnL Positions: GET /api/private/pnl/positions → 200, position tracking
✅ PnL Performance: GET /api/private/pnl/performance/:symbol → 200, performance analysis
✅ Enhanced UI: WebSocketStatus + RiskManager + PnLTracker componentleri çalışıyor
✅ Enhanced Metrics: Yeni metrikler Prometheus'ta
✅ Test Scripts: DAY-6 test script çalışıyor

## 📋 TASK 8: HEALTH Status

- **YELLOW**: DAY-6 altyapı hazır, testnet key'leri bekleniyor
- **GREEN**: Tüm WebSocket, risk ve PnL testleri geçti
- **RED**: Kritik hata, geri dönüş gerekli

## 📋 TASK 9: Edge Cases

### 9.1 WebSocket Failures
```bash
# Connection timeout
PRIVATE_WS_TIMEOUT_MS=30000

# Reconnection logic
# WebSocket fails → exponential backoff → reconnect
```

### 9.2 Risk Management Edge Cases
- Position size limits
- Daily loss limits
- Symbol exposure limits
- Order size validation

### 9.3 PnL Tracking Edge Cases
- Missing price data
- Invalid position data
- Calculation errors
- Historical data gaps

## 📋 TASK 10: Next Steps (DAY-7)

- Advanced order types (Iceberg, TWAP)
- Multi-exchange support
- Backtesting integration
- Strategy automation
- Performance optimization
- Real-time alerts
- Advanced analytics
- Machine learning integration

## 📋 TASK 11: Production Readiness

### 11.1 Monitoring
- WebSocket health checks
- Risk rule compliance
- PnL accuracy validation
- Performance monitoring

### 11.2 Security
- WebSocket authentication
- Risk rule validation
- Data integrity checks
- Access control

### 11.3 Scalability
- WebSocket connection pooling
- Risk calculation optimization
- PnL calculation caching
- Performance tuning 