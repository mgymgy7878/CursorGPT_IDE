# STRATEGY SPECIFICATION (DSL)
## DSL → Validate → Backtest → Score → Onay → Deploy Zinciri

**Versiyon:** v0.1
**Tarih:** 2025-01-29
**Durum:** 📋 TASARIM AŞAMASI

---

## 🎯 Amaç

Strateji "serbest metin" değil, **kısıtlı bir dil (DSL)** + tester zinciri. LLM sadece **DSL üretir**, sistem gerisini deterministik yürütür.

**Zincir:**
```
DSL → Codegen → Validate → Backtest → Score → Approval UI → Deploy
```

---

## 📋 StrategySpec (DSL Schema)

### JSON Schema (Zod)

```typescript
import { z } from 'zod';

const StrategySpecSchema = z.object({
  // Meta
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),

  // Instrument
  symbol: z.string().regex(/^[A-Z0-9]+$/),
  timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']),

  // Entry Rules
  entry: z.object({
    type: z.enum(['signal', 'crossover', 'divergence', 'breakout', 'custom']),
    conditions: z.array(z.object({
      indicator: z.string(),  // "ema", "rsi", "macd", etc.
      operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'cross_above', 'cross_below']),
      value: z.union([z.number(), z.string()]),  // Number veya başka indicator ref
      period?: z.number(),  // Indicator period
    })),
    // Tüm condition'lar AND mi OR mu?
    logic: z.enum(['and', 'or']).default('and'),
  }),

  // Exit Rules
  exit: z.object({
    type: z.enum(['signal', 'crossover', 'time', 'target', 'custom']),
    conditions: z.array(z.object({
      indicator: z.string(),
      operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'cross_above', 'cross_below']),
      value: z.union([z.number(), z.string()]),
      period?: z.number(),
    })),
    logic: z.enum(['and', 'or']).default('and'),
  }),

  // Risk Management
  risk: z.object({
    stopLoss: z.object({
      type: z.enum(['fixed', 'atr', 'percentage', 'none']),
      value: z.number().positive(),
    }).optional(),
    takeProfit: z.object({
      type: z.enum(['fixed', 'atr', 'percentage', 'ratio', 'none']),
      value: z.number().positive(),
    }).optional(),
    positionSize: z.object({
      type: z.enum(['fixed', 'percentage', 'atr', 'kelly']),
      value: z.number().positive(),
      maxPosition?: z.number(),  // Max position size (notional)
    }).default({
      type: 'percentage',
      value: 1.0,  // %1 of portfolio
    }),
    maxPositions: z.number().int().positive().default(1),
    maxDailyLoss: z.number().optional(),  // Daily loss limit
  }),

  // Filters
  filters: z.object({
    time: z.object({
      enabled: z.boolean().default(false),
      sessions: z.array(z.object({
        start: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/),  // "09:00"
        end: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/),    // "17:00"
        timezone: z.string().default('UTC'),
      })).optional(),
    }).optional(),
    volume: z.object({
      enabled: z.boolean().default(false),
      minVolume: z.number().positive().optional(),
      minVolumeRatio: z.number().positive().optional(),  // vs average
    }).optional(),
    trend: z.object({
      enabled: z.boolean().default(false),
      indicator: z.string(),  // "ema_200", "sma_50"
      direction: z.enum(['up', 'down', 'neutral']),
    }).optional(),
  }).optional(),

  // Indicators Configuration
  indicators: z.record(z.string(), z.object({
    type: z.string(),  // "ema", "rsi", "macd", "bb", etc.
    params: z.record(z.any()),
  })).optional(),

  // Custom Code (opsiyonel - DSL yetersizse)
  customCode: z.string().optional(),
});

type StrategySpec = z.infer<typeof StrategySpecSchema>;
```

---

## 📝 Örnek StrategySpec

### Örnek 1: RSI Oversold/Bought

```json
{
  "name": "RSI Oversold Entry",
  "description": "RSI < 35'te al, RSI > 65'te sat",
  "version": "1.0.0",
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "entry": {
    "type": "signal",
    "conditions": [
      {
        "indicator": "rsi",
        "operator": "lt",
        "value": 35,
        "period": 14
      }
    ],
    "logic": "and"
  },
  "exit": {
    "type": "signal",
    "conditions": [
      {
        "indicator": "rsi",
        "operator": "gt",
        "value": 65,
        "period": 14
      }
    ],
    "logic": "and"
  },
  "risk": {
    "stopLoss": {
      "type": "percentage",
      "value": 2.0
    },
    "takeProfit": {
      "type": "ratio",
      "value": 2.0
    },
    "positionSize": {
      "type": "percentage",
      "value": 5.0,
      "maxPosition": 1000
    },
    "maxPositions": 1
  },
  "indicators": {
    "rsi": {
      "type": "rsi",
      "params": { "period": 14 }
    }
  }
}
```

### Örnek 2: EMA Crossover

```json
{
  "name": "EMA Golden Cross",
  "description": "EMA(21) > EMA(50) cross over'da al",
  "symbol": "ETHUSDT",
  "timeframe": "4h",
  "entry": {
    "type": "crossover",
    "conditions": [
      {
        "indicator": "ema",
        "operator": "cross_above",
        "value": "ema_50",
        "period": 21
      }
    ],
    "logic": "and"
  },
  "exit": {
    "type": "crossover",
    "conditions": [
      {
        "indicator": "ema",
        "operator": "cross_below",
        "value": "ema_50",
        "period": 21
      }
    ],
    "logic": "and"
  },
  "risk": {
    "stopLoss": {
      "type": "atr",
      "value": 2.0
    },
    "positionSize": {
      "type": "atr",
      "value": 1.0
    },
    "maxPositions": 1
  },
  "filters": {
    "trend": {
      "enabled": true,
      "indicator": "ema_200",
      "direction": "up"
    }
  },
  "indicators": {
    "ema_21": {
      "type": "ema",
      "params": { "period": 21 }
    },
    "ema_50": {
      "type": "ema",
      "params": { "period": 50 }
    },
    "ema_200": {
      "type": "ema",
      "params": { "period": 200 }
    }
  }
}
```

---

## 🔍 Validator

### Mantık Hataları

**1. Lookahead Risk:**
- ❌ Gelecekteki veri kullanımı (örn: `close[+1]`)
- ✅ Sadece geçmiş ve mevcut candle'lara erişim

**2. Çakışan Kurallar:**
- ❌ Entry ve Exit aynı anda true olabilir
- ✅ Mantık kontrolü: Entry → Exit geçişi deterministik olmalı

**3. Risk Yönetimi Eksikliği:**
- ⚠️ Stop Loss yoksa uyarı (zorunlu değil, ama önerilir)
- ❌ Position size > 100% olamaz
- ❌ Max positions < 1 olamaz

**4. Indicator Parametreleri:**
- ❌ Period <= 0
- ❌ Indicator tanımlı değil ama kullanılmış

### Validator Implementation

```typescript
interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    path: string;
    message: string;
  }>;
}

class StrategyValidator {
  validate(spec: StrategySpec): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Schema validation (Zod)
    const schemaResult = StrategySpecSchema.safeParse(spec);
    if (!schemaResult.success) {
      errors.push(...schemaResult.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        severity: 'error' as const,
      })));
      return { valid: false, errors, warnings };
    }

    // Logic validation
    this.validateLogic(spec, errors, warnings);

    // Risk validation
    this.validateRisk(spec, errors, warnings);

    // Indicator validation
    this.validateIndicators(spec, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateLogic(spec: StrategySpec, errors: any[], warnings: any[]): void {
    // Entry/Exit conflict check
    // Lookahead check
    // ...
  }

  private validateRisk(spec: StrategySpec, errors: any[], warnings: any[]): void {
    // Position size check
    // Stop loss recommendation
    // ...
  }

  private validateIndicators(spec: StrategySpec, errors: any[], warnings: any[]): void {
    // Indicator definition check
    // Parameter validation
    // ...
  }
}
```

---

## 🏃 Codegen: DSL → Executable Code

### Target: JavaScript Function

DSL'den çalıştırılabilir JavaScript fonksiyonu üretilir:

```typescript
interface CodegenOptions {
  target: 'backtest' | 'live';
  includeCustomCode?: boolean;
}

class StrategyCodegen {
  generate(spec: StrategySpec, options: CodegenOptions): string {
    // DSL → JavaScript function
    // Indicator calculations
    // Entry/Exit logic
    // Risk management
    // ...
  }
}
```

**Örnek Output:**
```javascript
function strategy(candle, indicators, state) {
  // Indicator calculations
  const rsi = indicators.rsi(14);

  // Entry condition
  if (rsi < 35 && state.position === null) {
    const size = calculatePositionSize(state.portfolio, 0.05);
    return { action: 'buy', quantity: size };
  }

  // Exit condition
  if (rsi > 65 && state.position !== null) {
    return { action: 'sell', quantity: state.position.quantity };
  }

  // Stop loss
  if (state.position && state.position.entryPrice * 0.98 > candle.close) {
    return { action: 'sell', quantity: state.position.quantity };
  }

  return { action: 'hold' };
}
```

---

## 📊 Backtest → Score

### Backtest Runner

Mevcut pipeline'a bağlanır:
- `/api/backtest/run` endpoint'ini kullanır
- Multiple scenario test (farklı tf/symbol) → **robustness score**

### Scoring Metrics

**Tek metrik yeterli değil:**
- ✅ **Sharpe Ratio** (risk-adjusted return)
- ✅ **Max Drawdown** (en büyük düşüş)
- ✅ **Win Rate** (kazanan işlem yüzdesi)
- ✅ **Trade Count** (işlem sayısı - çok az ise yetersiz data)
- ✅ **Profit Factor** (total profit / total loss)
- ✅ **Slippage Assumption** (gerçekçilik için)

**Composite Score:**
```typescript
interface BacktestScore {
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  tradeCount: number;
  profitFactor: number;
  totalReturn: number;

  // Composite
  compositeScore: number;  // Weighted average
  robustnessScore: number; // Multi-scenario consistency
}

function calculateScore(results: BacktestResult[]): BacktestScore {
  // Weighted scoring
  // Robustness across scenarios
  // ...
}
```

---

## ✅ Approval UI: Diff View

### Diff View Component

**Önceki sürüm ↔ Yeni sürüm karşılaştırması:**

```typescript
interface StrategyDiff {
  code: {
    before: string;
    after: string;
    lineChanges: number;
    added: number;
    removed: number;
  };
  params: {
    before: Record<string, any>;
    after: Record<string, any>;
    changed: string[];
  };
  impact: {
    affectedPositions: number;
    estimatedPnl: number;
    riskChange: 'increase' | 'decrease' | 'neutral';
  };
}
```

**UI Features:**
- Side-by-side code diff
- Parameter change highlight
- Impact analysis visualization
- "Approve" / "Reject" buttons

---

## 🚀 Deploy Pipeline

### 1. Paper Run (Otomatik)

**Strateji onaylandıktan sonra:**
1. Paper trading'e deploy et
2. X gün (örn: 7 gün) izle
3. Paper metrikleri → **promote threshold** kontrolü

### 2. Live Promotion (Manuel Onay)

**Paper başarılı ise:**
1. UI'da "Promote to Live" butonu göster
2. Risk gate kontrolü:
   - Feed health ✅
   - Daily loss limit OK ✅
   - Position limit OK ✅
3. Kullanıcı onayı
4. Live'e deploy
5. Audit log: Promotion kaydı

---

## 🔄 LLM Integration

### LLM'den DSL Üretimi

**Prompt:**
```
Kullanıcı isteği: "BTCUSDT için RSI stratejisi"
LLM çıktısı: StrategySpec JSON
```

**Validation:**
1. Schema validation (Zod)
2. Logic validation (Validator)
3. Hata varsa → LLM'e geri bildirim → Düzeltme

**Iterative Refinement:**
```
LLM → DSL → Validate → [Hata varsa] → LLM (hata mesajı ile) → DSL (düzeltilmiş) → ...
```

---

## 📦 Implementation Plan

### Phase 1: DSL Schema + Validator (P0)
- ✅ Zod schema tanımla
- ✅ Validator implementasyonu
- ✅ Unit testler

### Phase 2: Codegen (P0)
- ✅ DSL → JavaScript function
- ✅ Indicator library entegrasyonu
- ✅ Risk management code generation

### Phase 3: LLM Integration (P0)
- ✅ LLM'den DSL üretimi
- ✅ Iterative refinement loop
- ✅ Error handling

### Phase 4: Approval UI (P1)
- ✅ Diff view component
- ✅ Impact analysis visualization
- ✅ Approval workflow

### Phase 5: Deploy Pipeline (P1)
- ✅ Paper run automation
- ✅ Live promotion gate
- ✅ Audit logging

---

**Son Güncelleme:** 2025-01-29
**Next Steps:** `packages/strategy-dsl` implementasyonu başlatılmalı.

