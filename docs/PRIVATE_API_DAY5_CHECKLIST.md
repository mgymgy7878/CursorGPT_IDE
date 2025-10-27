# PRIVATE-API DAY-5 TASK CHECKLIST: Auto-Sync & Diff Analyzer

## 🎯 DAY-5 Hedefleri
- Trade Rules Auto-Sync (exchangeInfo'dan whitelist ve minQty otomatik güncelleme)
- Symbol Discovery UI (desteklenen sembollerin dropdown olarak otomatik doldurulması)
- Paper ↔ Testnet Diff Analyzer (aynı order setiyle sonuç karşılaştırması)
- 48h Canary Report (otomatik log/rapor üretimi)
- Grafana Panel Genişletme (latency heatmap, success/error trend)

## 📋 TASK 1: Symbol Discovery & Auto-Sync

### 1.1 Symbol Discovery Service
```typescript
// services/executor/src/lib/symbolDiscovery.ts
export class SymbolDiscoveryService {
  private static instance: SymbolDiscoveryService;
  private cache: DiscoveredSymbol[] = [];
  private lastUpdate = 0;
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

  async discoverSymbols(baseUrl: string): Promise<DiscoveredSymbol[]> {
    const now = Date.now();
    if (this.cache.length > 0 && (now - this.lastUpdate) < this.TTL_MS) {
      return this.cache;
    }

    const exchangeInfo = await getExchangeInfo(baseUrl);
    const symbols = exchangeInfo.symbols
      .filter((s: any) => s.status === 'TRADING')
      .map((s: any) => this.mapSymbol(s))
      .filter((s: DiscoveredSymbol) => s.quoteAsset === 'USDT');

    this.cache = symbols;
    this.lastUpdate = now;
    return symbols;
  }
}
```

### 1.2 Auto-Whitelist Logic
```typescript
async getWhitelistedSymbols(baseUrl: string): Promise<string[]> {
  const symbols = await this.discoverSymbols(baseUrl);
  return symbols
    .filter(s => this.isWhitelistCandidate(s))
    .map(s => s.symbol);
}

private isWhitelistCandidate(symbol: DiscoveredSymbol): boolean {
  const highVolumeSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
  const hasMinNotional = symbol.filters.minNotional?.minNotional;
  const hasReasonableStepSize = symbol.filters.lotSize?.stepSize;
  
  return highVolumeSymbols.includes(symbol.symbol) || 
         (hasMinNotional && hasReasonableStepSize);
}
```

### 1.3 Auto-Sync Endpoint
```typescript
// services/executor/src/routes/private.ts
r.post('/symbols/sync', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    const discoveryService = SymbolDiscoveryService.getInstance();
    await discoveryService.updateSymbolRules(process.env.BINANCE_API_BASE!);
    
    calls.inc({ route: 'symbols-sync', method: 'POST', ok: 'true' });
    res.json({ ok: true, message: 'Symbols synced successfully' });
  } catch (e: any) {
    calls.inc({ route: 'symbols-sync', method: 'POST', ok: 'false' });
    errors.inc({ route: 'symbols-sync', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

## 📋 TASK 2: Paper ↔ Testnet Diff Analyzer

### 2.1 Diff Analyzer Service
```typescript
// services/executor/src/lib/diffAnalyzer.ts
export class DiffAnalyzer {
  private paperOrders: OrderExecution[] = [];
  private testnetOrders: OrderExecution[] = [];

  addPaperOrder(order: OrderExecution): void {
    this.paperOrders.push(order);
  }

  addTestnetOrder(order: OrderExecution): void {
    this.testnetOrders.push(order);
  }

  generateReport(testRunId: string): DiffReport {
    const timestamp = Date.now();
    const comparison = this.calculateComparison();
    const summary = this.calculateSummary();

    return {
      timestamp,
      testRunId,
      paperOrders: this.paperOrders,
      testnetOrders: this.testnetOrders,
      comparison,
      summary
    };
  }
}
```

### 2.2 Performance Metrics
```typescript
private calculateComparison() {
  const paperCount = this.paperOrders.length;
  const testnetCount = this.testnetOrders.length;
  
  const paperValue = this.calculateTotalValue(this.paperOrders);
  const testnetValue = this.calculateTotalValue(this.testnetOrders);
  
  const paperTime = this.calculateAverageExecutionTime(this.paperOrders);
  const testnetTime = this.calculateAverageExecutionTime(this.testnetOrders);
  
  const paperFillRatio = this.calculateFillRatio(this.paperOrders);
  const testnetFillRatio = this.calculateFillRatio(this.testnetOrders);
  
  const paperSlippage = this.calculateAverageSlippage(this.paperOrders);
  const testnetSlippage = this.calculateAverageSlippage(this.testnetOrders);

  return {
    orderCount: { paper: paperCount, testnet: testnetCount, diff: testnetCount - paperCount },
    totalValue: { paper: paperValue, testnet: testnetValue, diff: testnetValue - paperValue, diffPercent: paperValue > 0 ? ((testnetValue - paperValue) / paperValue) * 100 : 0 },
    executionTime: { paper: paperTime, testnet: testnetTime, diff: testnetTime - paperTime },
    fillRatio: { paper: paperFillRatio, testnet: testnetFillRatio, diff: testnetFillRatio - paperFillRatio },
    slippage: { paper: paperSlippage, testnet: testnetSlippage, diff: testnetSlippage - paperSlippage }
  };
}
```

### 2.3 Diff Report Endpoint
```typescript
r.get('/diff-report/:testRunId', async (req, res, next) => {
  try {
    const { testRunId } = req.params;
    const analyzer = new DiffAnalyzer();
    // TODO: Load orders from storage/database
    const report = analyzer.generateReport(testRunId);
    
    calls.inc({ route: 'diff-report', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: report });
  } catch (e: any) {
    calls.inc({ route: 'diff-report', method: 'GET', ok: 'false' });
    errors.inc({ route: 'diff-report', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});
```

## 📋 TASK 3: Enhanced UI Components

### 3.1 Symbol Discovery Component
```typescript
// apps/web-next/components/SymbolDiscovery.tsx
export default function SymbolDiscovery() {
  const [symbols, setSymbols] = useState<DiscoveredSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadSymbols() {
    try {
      setLoading(true);
      const r = await fetch("/api/private/symbols");
      const data = await r.json();
      if (r.ok) {
        setSymbols(data.data || []);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('Symbol discovery error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function syncSymbols() {
    try {
      setSyncing(true);
      const r = await fetch("/api/private/symbols/sync", { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        alert("Symbols synced successfully!");
        loadSymbols();
      }
    } catch (e) {
      alert(`Sync error: ${e}`);
    } finally {
      setSyncing(false);
    }
  }
}
```

### 3.2 Diff Analyzer Component
```typescript
// apps/web-next/components/DiffAnalyzer.tsx
export default function DiffAnalyzer() {
  const [reports, setReports] = useState<DiffReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DiffReport | null>(null);

  async function loadReport(testRunId: string) {
    try {
      const r = await fetch(`/api/private/diff-report/${testRunId}`);
      const data = await r.json();
      if (r.ok) {
        setSelectedReport(data.data);
      }
    } catch (e) {
      alert(`Report load error: ${e}`);
    }
  }

  return (
    <div className="p-4 rounded-xl border bg-purple-50 border-purple-200">
      <div className="font-semibold text-purple-800">Paper ↔ Testnet Diff Analyzer</div>
      {/* Performance comparison table */}
      {/* Order details side-by-side */}
    </div>
  );
}
```

## 📋 TASK 4: Enhanced Metrics & Monitoring

### 4.1 New Metrics
```prometheus
# Symbol Discovery
spark_private_calls_total{route="symbols", method="GET", ok="true"}
spark_private_calls_total{route="symbols-sync", method="POST", ok="true"}

# Diff Analysis
spark_private_calls_total{route="diff-report", method="GET", ok="true"}

# Enhanced Balance
spark_private_calls_total{route="balance", method="GET", ok="true"}
```

### 4.2 Alert Rules
```yaml
# Symbol Sync Failure
- alert: SymbolSyncFailure
  expr: rate(spark_private_errors_total{route="symbols-sync"}[5m]) > 0
  for: 2m
  labels: { severity: warning }
  annotations:
    summary: "Symbol sync failed in last 5m"

# Diff Report Error
- alert: DiffReportError
  expr: rate(spark_private_errors_total{route="diff-report"}[5m]) > 0
  for: 2m
  labels: { severity: info }
  annotations:
    summary: "Diff report generation error"
```

## 📋 TASK 5: Test Scripts

### 5.1 DAY-5 Master Test
```cmd
@echo off
set BASE=http://127.0.0.1:4001
set SYM=BTCUSDT

echo ========================================
echo DAY-5 AUTO-SYNC & DIFF ANALYZER TEST
echo ========================================

echo [D5-1] Symbol Discovery
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/symbols

echo [D5-2] Auto-Sync Symbols
curl -s -X POST %BASE%/api/private/symbols/sync -H "Content-Type: application/json"

echo [D5-3] Exchange Info (Cached)
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/exchange-info

echo [D5-4] Diff Report (Sample)
curl -s -o NUL -w "HTTP=%%{http_code}\n" %BASE%/api/private/diff-report/test-run-001

echo [D5-5] Enhanced Balance
curl -s %BASE%/api/private/balance

echo [D5-6] METRICS (Enhanced)
curl -s %BASE%/api/public/metrics/prom | findstr spark_private_
```

### 5.2 Validation Commands
```bash
# Symbol Discovery
curl -s http://127.0.0.1:4001/api/private/symbols

# Auto-Sync
curl -s -X POST http://127.0.0.1:4001/api/private/symbols/sync \
  -H "Content-Type: application/json"

# Diff Report
curl -s http://127.0.0.1:4001/api/private/diff-report/test-run-001

# Enhanced Balance
curl -s http://127.0.0.1:4001/api/private/balance

# Metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep spark_private_
```

## 📋 TASK 6: Success Criteria

✅ Symbol Discovery: GET /api/private/symbols → 200, USDT pairs listesi
✅ Auto-Sync: POST /api/private/symbols/sync → 200, whitelist güncelleme
✅ Diff Analyzer: GET /api/private/diff-report/:id → 200, performance comparison
✅ Enhanced UI: SymbolDiscovery + DiffAnalyzer componentleri çalışıyor
✅ Enhanced Balance: USD değerleme ile portföy snapshot
✅ Enhanced Metrics: Yeni metrikler Prometheus'ta
✅ Test Scripts: DAY-5 test script çalışıyor

## 📋 TASK 7: HEALTH Status

- **YELLOW**: DAY-5 altyapı hazır, testnet key'leri bekleniyor
- **GREEN**: Tüm auto-sync ve diff analyzer testleri geçti
- **RED**: Kritik hata, geri dönüş gerekli

## 📋 TASK 8: Edge Cases

### 8.1 Symbol Discovery Failures
```bash
# Network timeout
PRIVATE_REQ_TIMEOUT_MS=30000

# Cache fallback
# Symbol discovery fails → return cached data
```

### 8.2 Diff Analysis Edge Cases
- Empty order sets
- Different order counts
- Missing fill data
- Invalid timestamps

### 8.3 Auto-Sync Conflicts
- Manual whitelist vs auto-whitelist
- Symbol status changes
- Filter updates

## 📋 TASK 9: Next Steps (DAY-6)

- WebSocket order updates
- Advanced order types (Iceberg, TWAP)
- Real-time PnL tracking
- Risk management rules
- Multi-exchange support
- Backtesting integration
- Strategy automation
- Performance optimization

## 📋 TASK 10: Production Readiness

### 10.1 Monitoring
- Symbol discovery health checks
- Auto-sync success rate
- Diff analysis accuracy
- UI component performance

### 10.2 Security
- Symbol validation
- Rate limiting
- Error handling
- Data sanitization

### 10.3 Scalability
- Cache optimization
- Database integration
- Load balancing
- Performance tuning 