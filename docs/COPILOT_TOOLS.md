# COPILOT TOOLS REGISTRY
## Operasyon Katmanı: Tool-Router + Policy/Guardrails

**Versiyon:** v0.1
**Tarih:** 2025-01-29
**Durum:** 📋 TASARIM AŞAMASI

---

## 🎯 Amaç

Copilot'u "chat ekranı" olmaktan çıkarıp **tool-router + policy/guardrails** yapan bir **operasyon katmanı** haline getirmek. Her tool çağrısı:
- **dry-run** (varsayılan): sonuç üretir, state değiştirmez
- **commit**: state değiştirir → **confirm_required=true** (güvenlik protokolü)

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                    Copilot UI Layer                          │
│            (CopilotDock.tsx - değişmez)                      │
├─────────────────────────────────────────────────────────────┤
│                  /api/copilot/chat (SSE)                     │
│              Streaming LLM responses + tool calls             │
├─────────────────────────────────────────────────────────────┤
│                   Tool Router Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tool Registry│  │  Policy      │  │  Audit       │      │
│  │              │  │  Guardrails  │  │  Logger      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                      Tool Impl Layer                         │
│  Read-only Tools          Stateful Tools (dry-run default)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Tool Kategorileri

### 1. Read-Only Tools (State Değiştirmez)

**Varsayılan mod:** `dryRun: false` (zaten state değiştirmez)

#### `getMarketSnapshot`
**Açıklama:** Belirli bir sembol ve timeframe için mevcut piyasa durumunu getirir.

**Parametreler:**
```typescript
{
  symbol: string;      // Örn: "BTCUSDT", "BTCTRY"
  timeframe: string;   // Örn: "1h", "15m", "1d"
  indicators?: string[]; // Opsiyonel: ["ema", "rsi", "macd"]
}
```

**Örnek Kullanım:**
```json
{
  "tool": "getMarketSnapshot",
  "params": {
    "symbol": "BTCUSDT",
    "timeframe": "1h",
    "indicators": ["ema_50", "rsi_14"]
  }
}
```

**Dönüş:**
```typescript
{
  symbol: string;
  timeframe: string;
  currentPrice: number;
  volume24h: number;
  change24h: number;
  indicators: {
    ema_50?: number;
    rsi_14?: number;
    macd?: { macd: number; signal: number; histogram: number };
  };
  candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  staleness: 'ok' | 'warn' | 'stale';
  lastUpdate: number;
}
```

#### `getStrategies`
**Açıklama:** Mevcut stratejileri listeler (filtreleme desteği ile).

**Parametreler:**
```typescript
{
  status?: 'draft' | 'active' | 'paused' | 'stopped' | 'archived';
  limit?: number;  // Default: 10, Max: 100
  cursor?: string; // Pagination cursor
}
```

**Dönüş:**
```typescript
{
  strategies: Array<{
    id: string;
    name: string;
    status: string;
    symbol: string;
    timeframe: string;
    createdAt: string;
    updatedAt: string;
    metrics?: {
      trades: number;
      winRate: number;
      totalReturn: number;
      sharpe: number;
    };
  }>;
  count: number;
  hasMore: boolean;
  nextCursor?: string;
}
```

#### `getStrategy`
**Açıklama:** Belirli bir stratejinin detaylarını getirir.

**Parametreler:**
```typescript
{
  id: string;
}
```

**Dönüş:**
```typescript
{
  id: string;
  name: string;
  status: string;
  code: string;
  params: Record<string, any>;
  symbol: string;
  timeframe: string;
  createdAt: string;
  updatedAt: string;
  backtestResults?: {
    trades: number;
    winRate: number;
    maxDrawdown: number;
    sharpe: number;
    totalReturn: number;
  };
  positions?: Array<{
    symbol: string;
    side: 'long' | 'short';
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnl: number;
  }>;
}
```

#### `getPortfolioSummary`
**Açıklama:** Portföy özetini getirir (pozisyonlar, PnL, risk metrikleri).

**Parametreler:**
```typescript
{
  includePositions?: boolean;  // Default: true
  includeHistory?: boolean;    // Default: false
}
```

**Dönüş:**
```typescript
{
  totalValue: number;
  cashBalance: number;
  totalPositions: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalReturn: number;
  riskMetrics: {
    maxDrawdown: number;
    var95: number;  // Value at Risk (95%)
    sharpe: number;
  };
  positions?: Array<{...}>;
}
```

#### `getRuntimeHealth`
**Açıklama:** Sistem sağlık durumunu getirir (feed health, executor health, copilot health).

**Parametreler:**
```typescript
{}  // Parametresiz
```

**Dönüş:**
```typescript
{
  feeds: {
    btcturk: {
      status: 'healthy' | 'degraded' | 'down';
      lastMessageTs: number;
      stalenessSeconds: number;
      reconnectCount: number;
    };
    binance: {
      status: 'healthy' | 'degraded' | 'down';
      lastMessageTs: number;
      stalenessSeconds: number;
    };
  };
  executor: {
    status: 'healthy' | 'degraded' | 'down';
    queueLag: number;  // ms
    dbLatency: number; // ms
    errorBudget: number; // 0-1
  };
  copilot: {
    providerLatency: number; // ms
    toolErrorRate: number;   // 0-1
    lastRequestTs: number;
  };
}
```

---

### 2. Stateful Tools (State Değiştirir)

**Varsayılan mod:** `dryRun: true` → `confirm_required: true`

#### `runBacktest`
**Açıklama:** Strateji için backtest çalıştırır.

**Parametreler:**
```typescript
{
  strategyId?: string;  // Mevcut strateji ID (veya)
  code?: string;        // Yeni strateji kodu
  symbol: string;
  timeframe: string;
  startDate?: string;   // ISO date, default: son 30 gün
  endDate?: string;     // ISO date, default: şimdi
  dryRun?: boolean;     // Default: true
}
```

**Dönüş (dry-run):**
```typescript
{
  dryRun: true;
  jobId: string;
  estimatedDuration: number; // ms
  estimatedCost?: number;    // Compute cost
  confirmRequired: false;    // dry-run olduğu için false
}
```

**Dönüş (commit):**
```typescript
{
  dryRun: false;
  jobId: string;
  status: 'queued' | 'running';
  confirmRequired: false; // Zaten commit edildi
}
```

#### `runOptimize`
**Açıklama:** Strateji parametrelerini optimize eder.

**Parametreler:**
```typescript
{
  strategyId: string;
  symbol: string;
  timeframe: string;
  paramRanges: Record<string, { min: number; max: number; step: number }>;
  objective: 'sharpe' | 'totalReturn' | 'winRate' | 'custom';
  dryRun?: boolean;  // Default: true
}
```

**Dönüş:** Backtest'e benzer yapı.

#### `createAlert`
**Açıklama:** Piyasa uyarısı oluşturur.

**Parametreler:**
```typescript
{
  symbol: string;
  timeframe: string;
  type: 'price' | 'volume' | 'indicator' | 'custom';
  condition: Record<string, any>;  // Condition DSL
  action: 'notify' | 'execute' | 'log';
  dryRun?: boolean;  // Default: true
}
```

**Dönüş:**
```typescript
{
  dryRun: true;
  alertPreview: {
    description: string;
    estimatedFrequency: string;  // "~5 per day"
    impact: 'low' | 'medium' | 'high';
  };
  confirmRequired: true;
}
```

#### `proposeStrategyChange`
**Açıklama:** Strateji değişikliği önerir (diff view ile).

**Parametreler:**
```typescript
{
  strategyId: string;
  changes: {
    code?: string;
    params?: Record<string, any>;
    name?: string;
  };
  dryRun?: boolean;  // Default: true
}
```

**Dönüş:**
```typescript
{
  dryRun: true;
  diff: {
    code: { before: string; after: string; lineChanges: number };
    params: { before: Record<string, any>; after: Record<string, any> };
  };
  impact: {
    affectedPositions: number;
    estimatedPnl: number;
    riskChange: 'increase' | 'decrease' | 'neutral';
  };
  confirmRequired: true;
}
```

#### `startStrategy` / `pauseStrategy` / `stopStrategy`
**Açıklama:** Strateji lifecycle yönetimi.

**Parametreler:**
```typescript
{
  strategyId: string;
  dryRun?: boolean;  // Default: true
  idempotencyKey?: string;
}
```

**Dönüş:**
```typescript
{
  dryRun: true;
  currentStatus: string;
  newStatus: string;
  impact: {
    activePositions: number;
    estimatedClosePnL: number;
  };
  confirmRequired: true;
  auditHash?: string; // Commit sonrası
}
```

---

## 🔒 Policy / Guardrails

### RBAC (Role-Based Access Control)

**Seviyeler:**
- **readonly**: Sadece read-only tool'lar
- **analyst**: Read-only + backtest/optimize (dry-run)
- **trader**: Analyst + strateji lifecycle (dry-run)
- **admin**: Tüm tool'lar (commit yetkisi)

**Policy Rule:**
```typescript
{
  userRole: string;
  allowedTools: string[];
  defaultDryRun: boolean;
  confirmRequiredFor: string[];  // Tool isimleri
}
```

### Risk Gate

**Kontroller:**
1. **Max Open Positions:** Aktif pozisyon sayısı limiti
2. **Daily Loss Limit:** Günlük zarar limiti
3. **Notional Limit:** Toplam işlem hacmi limiti
4. **Exchange Health Gate:** Feed stale ise trade önerisi yap ama deploy etme

**Policy Rule:**
```typescript
{
  maxOpenPositions: number;
  dailyLossLimit: number;
  notionalLimit: number;
  requireHealthyFeed: boolean;  // true: feed stale ise trade'i engelle
}
```

### Audit Log

**Her tool çağrısı şu bilgileri kaydeder:**
```typescript
{
  requestId: string;        // Unique request ID
  timestamp: number;
  actor: string;            // User ID
  tool: string;
  params: Record<string, any>;
  paramsHash: string;       // SHA256(params)
  result?: Record<string, any>;
  resultHash?: string;      // SHA256(result)
  dryRun: boolean;
  confirmRequired: boolean;
  confirmed?: boolean;
  confirmedBy?: string;
  confirmedAt?: number;
  auditHash: string;        // Chain hash
}
```

---

## 🔌 Tool Registry Implementation

### Tool Definition

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  category: 'read-only' | 'stateful';
  defaultDryRun: boolean;
  schema: z.ZodSchema;  // Parameter validation
  handler: (params: any, ctx: ToolContext) => Promise<ToolResult>;
  policy?: {
    requiredRoles?: string[];
    riskChecks?: RiskCheck[];
  };
}

interface ToolContext {
  userId: string;
  userRole: string;
  requestId: string;
  dryRun: boolean;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  confirmRequired?: boolean;
  auditLog?: AuditLogEntry;
}
```

### Registry

```typescript
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void;
  get(name: string): ToolDefinition | undefined;
  list(category?: string): ToolDefinition[];
  canExecute(toolName: string, ctx: ToolContext): boolean;
}
```

---

## 📊 Örnek Akış: "BTCUSDT için RSI stratejisi öner"

1. **User Input:** "BTCUSDT için RSI stratejisi öner"

2. **LLM Function Call:**
   ```json
   {
     "tool": "getMarketSnapshot",
     "params": { "symbol": "BTCUSDT", "timeframe": "1h", "indicators": ["rsi_14"] }
   }
   ```

3. **Tool Execution (dry-run=false):**
   - Policy check: ✅ (read-only tool, herkes erişebilir)
   - Execute: Gerçek market data çek
   - Audit log: Kaydet

4. **LLM Response (tool sonucuna göre):**
   ```
   BTCUSDT şu anda RSI 14 değeri 45.2. Oversold (30 altı) bölgesine yakın.
   Şöyle bir strateji önerebilirim:
   - Entry: RSI < 35
   - Exit: RSI > 65 veya Stop Loss: %2
   ```

5. **LLM Function Call (strateji oluştur):**
   ```json
   {
     "tool": "proposeStrategyChange",
     "params": {
       "code": "function strategy(candle) { ... }",
       "params": { "rsiPeriod": 14, "entry": 35, "exit": 65, "stopLoss": 0.02 }
     },
     "dryRun": true
     }
   }
   ```

6. **Tool Execution (dry-run=true):**
   - Policy check: ✅ (dry-run herkese açık)
   - Simulate: Strateji diff oluştur, impact analizi yap
   - Result: `confirmRequired: true` dön

7. **UI:** Kullanıcıya diff view göster, "Onayla" butonu göster

8. **User Approval:** Kullanıcı onaylar

9. **LLM Function Call (commit):**
   ```json
   {
     "tool": "proposeStrategyChange",
     "params": { ... },
     "dryRun": false
   }
   ```

10. **Tool Execution (dry-run=false):**
    - Policy check: ✅ (trader/admin rolü gerekli)
    - Risk gate: ✅ (feed healthy, pozisyon limiti OK)
    - Execute: Stratejiyi oluştur/güncelle
    - Audit log: Commit kaydı

---

## 🚀 İlk Tool Set (P0)

**Yüksek etki / Düşük risk:**
1. ✅ `getMarketSnapshot` - Market durumu
2. ✅ `runBacktest` - Backtest (dry-run default)
3. ✅ `proposeStrategyChange` - Strateji diff view

Bu üç tool ile Copilot'un temel operasyonel gücü ortaya çıkar.

---

**Son Güncelleme:** 2025-01-29
**Next Steps:** Implementation başlangıcı için `packages/ai-core` yapısı kurulmalı.

