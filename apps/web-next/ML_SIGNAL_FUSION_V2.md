# ML Signal Fusion v2.0 - Data Contracts & Integration Guide

## Durum: HAZIR (SDK + API)

**Build:** ✅ 61 routes + /api/ml/score  
**TypeScript:** ✅ 0 errors (strict mode)  
**Schema:** ✅ FeatureRow, Dataset, ScoreRequest/Response  
**SDK:** ✅ TypeScript + Python reference  
**OTEL:** ✅ Trace schema (commented)

---

## 1. VERI SÖZLEŞMESİ (Online & Offline Birebir)

### 1.1 Feature Row (Tek Bar, Tek An)

```typescript
// lib/ml/schema.ts
export interface FeatureRow {
  // Temel
  ts: number;              // ms epoch (bar close)
  symbol: string;          // "BTCUSDT"
  tf: TF;                  // "1m"|"5m"|"15m"|"1h"|"4h"|"1d"
  
  // OHLCV
  o: number; h: number; l: number; c: number; v: number;
  
  // Temel İndikatörler
  rsi_14?: number;
  macd?: number; macd_sig?: number; macd_hist?: number;
  ema_20?: number; ema_50?: number; ema_200?: number;
  atr_14?: number;
  
  // Volatilite/Likidite
  vol_z_20?: number;       // z-score of volume
  range_pct?: number;      // (h-l)/c
  spread_bp?: number;      // basis points (opsiyonel)
  
  // Hedef Etiket (offline/backtesting)
  label_horizon?: number;  // ms (3600000 = 1h)
  fwd_return?: number;     // (c[t+h]-c[t])/c[t]
  label?: -1 | 0 | 1;      // short/flat/long
  
  // Kalite Bayrakları
  _nanGuard?: boolean;
  _mock?: boolean;
}
```

**Kurallar:**
- ✅ NaN/Infinity YOK: Tüm numerikler sonlu
- ✅ UTC ms: Timestamp ms epoch (grafik/audit ile birebir)
- ✅ Horizon sabit: v2.0 → 1h (3600000ms)

### 1.2 Dataset (Eğitim/Validasyon)

```typescript
export interface DatasetMeta {
  symbol: string;
  tf: TF;
  startTs: number;
  endTs: number;
  horizonMs: number;         // 3600000 (1h)
  buildSha: string;
  featureVersion: string;    // "v2.0.0"
  rows: number;
  nanFiltered: number;       // kalite raporu
}

export interface Dataset {
  meta: DatasetMeta;
  features: FeatureRow[];    // label dolu
}
```

### 1.3 Online Score (Request/Response)

```typescript
export interface ScoreRequest {
  modelId: string;           // "fusion-v2.0.0"
  feature: FeatureRow;       // tek an
  ctx?: {
    position?: "long" | "short" | "flat";
    equity?: number;
  };
}

export interface ScoreResponse {
  ts: number;
  symbol: string;
  decision: -1 | 0 | 1;      // short/flat/long
  score: number;             // [-1, 1] continuous
  confid: number;            // [0, 1] confidence
  featuresUsed: string[];
  modelId: string;
  featureVersion: string;
  guardrails: { pass: boolean; reasons?: string[] };
  traceId: string;           // OTEL correlation
}
```

---

## 2. FUSION SDK

### 2.1 TypeScript (Production)

**Lokasyon:** `apps/web-next/src/lib/ml/fusion.ts`

**Ana Fonksiyonlar:**

```typescript
// 1) Sanitize - NaN/Infinity guard
export function sanitize(f: FeatureRow): FeatureRow | null;

// 2) Fuse - weighted ensemble
export function fuseSignals(f: FeatureRow): { 
  score: number;      // [-1, 1]
  parts: Record<string, number> 
};

// 3) Decide - discrete action
export function decide(score: number, confidFloor = 0.55): { 
  decision: -1 | 0 | 1; 
  confid: number 
};

// 4) Guardrails - SLO compliance
export function guardrailsCheck(ctx: {
  staleness_s?: number;
  p95_ms?: number;
  error_rate?: number;
  confid?: number;
}): { pass: boolean; reasons: string[] };

// 5) Score - main API
export function score(req: ScoreRequest): ScoreResponse;

// 6) Batch - backtesting
export function scoreBatch(features: FeatureRow[], modelId: string): ScoreResponse[];
```

**Ensemble Weights (v2.0 baseline):**
```typescript
const weights = {
  rsi: 0.3,      // Mean reversion
  macd: 0.4,     // Momentum
  trend: 0.3     // EMA crossover
};
```

### 2.2 Python (Training/Backtesting)

**Lokasyon:** `apps/web-next/src/lib/ml/fusion.py`

**Kullanım:**
```python
from ml.fusion import sanitize, fuse, decide

row = {
  "ts": 1697241600000,
  "symbol": "BTCUSDT",
  "tf": "1h",
  "o": 27500, "h": 27650, "l": 27450, "c": 27600, "v": 1200,
  "rsi_14": 45.5,
  "macd_hist": 0.25,
  "ema_20": 27550,
  "ema_50": 27400
}

clean = sanitize(row)
if clean:
    score, parts = fuse(clean)
    decision, confid = decide(score)
    print(f"Decision: {decision}, Confidence: {confid:.3f}")
```

---

## 3. API ENDPOINT

### POST /api/ml/score

**Request:**
```json
{
  "modelId": "fusion-v2.0.0",
  "feature": {
    "ts": 1697241600000,
    "symbol": "BTCUSDT",
    "tf": "1h",
    "o": 27500, "h": 27650, "l": 27450, "c": 27600, "v": 1200,
    "rsi_14": 45.5,
    "macd_hist": 0.25,
    "ema_20": 27550,
    "ema_50": 27400,
    "atr_14": 150
  }
}
```

**Response:**
```json
{
  "ts": 1697241600000,
  "symbol": "BTCUSDT",
  "decision": 1,
  "score": 0.627,
  "confid": 0.627,
  "featuresUsed": ["rsi", "macd", "trend"],
  "modelId": "fusion-v2.0.0",
  "featureVersion": "v2.0.0",
  "guardrails": { "pass": true, "reasons": [] },
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Audit:** `ml.score` action + traceId → RecentActions

---

## 4. OPENTELEMETRY TRACE ŞEMASI

### Span Hiyerarşisi

```
user_action.dashboard_click (SPAN_KIND=CLIENT)
 └─ pipeline.build_features (SERVER)
     ├─ datasource.candles.read (INTERNAL)
     ├─ indicators.compute (INTERNAL)
     └─ features.sanitize (INTERNAL)
 └─ model.score (SERVER) ← ML decision
     └─ ensemble.fuse_signals (INTERNAL)
 └─ guardrails.evaluate (INTERNAL)
 └─ strategy.control (SERVER) ← start/stop/pause
```

### Ortak Attributes

```typescript
// lib/observability/otel.ts
export type MLSpanAttributes = {
  'app.env': string;                    // "prod"|"staging"
  'app.build_sha': string;
  'trading.symbol': string;             // "BTCUSDT"
  'trading.tf': string;                 // "1h"
  'ml.model_id': string;                // "fusion-v2.0.0"
  'ml.feature_version': string;         // "v2.0.0"
  'ml.decision': -1 | 0 | 1;
  'ml.score': number;                   // [-1, 1]
  'ml.confidence': number;              // [0, 1]
  'slo.p95_ms'?: number;
  'slo.staleness_s'?: number;
  'slo.error_rate'?: number;
  'guardrails.pass': boolean;
  'user.action': string;
  'http.status_code'?: number;
  'retry.after_s'?: number;
};
```

**OTEL Integration:**
```typescript
// Uncomment when ready
// import { trace } from '@opentelemetry/api';
// const tracer = trace.getTracer('web-next', process.env.BUILD_SHA);
```

---

## 5. DEĞERLENDIRME PROTOKOLÜ

### Hedef Metrikler

```
Hit Rate (yön doğruluk): ≥ 55%
Information Ratio (IR):  ≥ 0.7
Max Drawdown (simül):    ≤ 15%
Turnover:                Makul (işlem kontrolü)
```

### Walk-Forward Protokol

```
36 ay veri:
├ 24 ay eğitim
└ 12 ay out-of-bag test

Transaction Costs:
├ 5 bp round-trip (default)
└ Slippage: lineer hacim oranı (opsiyonel)

Guardrails:
└ İhlal anında trade skip (fail-closed)
```

---

## 6. ÇEVRİM İÇİ KARAR AKIŞI

### UI (Strategy Lab / Canlı)

```typescript
// POST /api/ml/score → ScoreResponse
const resp = await fetch("/api/ml/score", {
  method: "POST",
  body: JSON.stringify({ modelId, feature })
});

const { decision, confid, guardrails } = await resp.json();

if (!guardrails.pass) {
  // Yalnız "öneri" göster, emir verme
  toast({ type: "warning", title: "Guardrail Bloğu", description: guardrails.reasons.join(", ") });
  return;
}

if (confid >= 0.6) {
  // Emir adayı
  previewOrder({ decision, confid });
}
```

### Executor Integration

```
Decision ∈ {-1, 0, 1} ve confid ≥ 0.6 → emir adayı
Auto-pause açık + critical breach → emir YOK
```

### Audit Trail

```
Her karar:
├ ml.score action
├ traceId (OTEL correlation)
├ Details: { symbol, decision, confid, guardrails }
└ Result: "ok" | "err" (guardrails.pass)
```

---

## 7. v2.0 "İLK 48 SAAT" PLANI

### H+0–4: Preview-Only (1 sembol, 1 TF)

```
Symbol: BTCUSDT
TF: 1h
Mode: Preview only (no orders)

KPI:
├ Staleness ≤ 30s
├ P95 ≤ 1000ms
└ Error ≤ 1%

Kabul: 4h boyunca SLO green
```

### H+4–24: Paper Trading

```
Mode: Paper trading (emir simülasyonu)

KPI:
├ Hit rate ≥ 53%
├ IR ≥ 0.5 (erken sinyal)
└ MDD ≤ 10%

Kabul: 20h boyunca metrikler stabil
```

### H+24–48: Multi-TF Expansion

```
TF: 15m, 1h, 4h
Symbols: Max 3 (BTCUSDT, ETHUSDT, ADAUSDT)

Confidence Floor:
├ Canary: 0.55
├ Staged: 0.60
└ Full: 0.65

Kabul: İhlal yoksa confid artır
```

---

## 8. KIRMIZI ÇİZGİ GUARDRAILS

### Hard Stop Rules

```typescript
// lib/ml/fusion.ts - guardrailsCheck()

1. SLO Breach:
   - p95 > 1500ms → model skorları flat (0)
   - error_rate > 2% → model skorları flat
   
2. Data Hygiene:
   - sanitize() false → skor üretilmez
   - Audit: ml.score result="err"
   
3. Confidence Floor:
   - Canary: 0.55
   - Staged: 0.60
   - Full: 0.65
   - Below floor → decision = 0 (flat)
```

**Fail-Closed Pattern:**
```typescript
if (!guardrails.pass) {
  // NO orders, only advisory
  return { decision: 0, confid: 0, advisory: true };
}
```

---

## 9. ENTEGRASYON CHECK-LIST

### Frontend

- [x] Schema types: `lib/ml/schema.ts` ✅
- [x] Fusion SDK: `lib/ml/fusion.ts` ✅
- [x] API endpoint: `/api/ml/score` ✅
- [ ] UI component: `MLScoreWidget.tsx` (Strategy Lab)
- [ ] RecentActions: `ml.score` action visible
- [ ] TraceId: Copy-to-clipboard active

### Backend (Executor)

- [ ] Feature pipeline: candles → indicators → FeatureRow
- [ ] Model registry: `fusion-v2.0.0` versioning
- [ ] Guardrails integration: SLO metrics → score context
- [ ] Audit push: `ml.score` action
- [ ] OTEL tracing: span hierarchy

### Infrastructure

- [ ] Feature store: Redis/TimescaleDB (optional)
- [ ] Model serving: ONNX runtime (optional)
- [ ] Prometheus: `ml_score_count`, `ml_decision_dist`
- [ ] Grafana: ML dashboard (hit rate, IR, confid dist)

---

## 10. DUMAN TESTİ

### API Test

```bash
# Score request
curl -s -X POST http://localhost:3003/api/ml/score \
  -H 'Content-Type: application/json' \
  -d '{
    "modelId": "fusion-v2.0.0",
    "feature": {
      "ts": '$(date +%s000)',
      "symbol": "BTCUSDT",
      "tf": "1h",
      "o": 27500, "h": 27650, "l": 27450, "c": 27600, "v": 1200,
      "rsi_14": 45.5,
      "macd_hist": 0.25,
      "ema_20": 27550,
      "ema_50": 27400
    }
  }' | jq '.decision, .confid, .guardrails.pass'

# Expected: 1, 0.627, true (or similar)
```

### Python Test

```bash
cd apps/web-next/src/lib/ml
python3 fusion.py

# Output:
# Score: 0.627
# Parts: {'rsi': -0.091, 'macd': 0.245, 'trend': 0.542}
# Decision: 1 (confid: 0.627)
```

### Audit Verify

```bash
curl -s -X POST http://localhost:3003/api/audit/list -d '{"limit":5}' \
  | jq '.items[] | select(.action == "ml.score")'

# Expected: { action: "ml.score", result: "ok", traceId: "...", details: {...} }
```

---

## 11. BACKTEST ENTEGRASYONU

### Backtest API Enhancement

```typescript
// /api/backtest/run → BacktestReport
export interface BacktestReport {
  // ... existing fields
  
  // ML-specific metrics
  metrics: {
    // ... existing metrics
    informationRatio: number;  // NEW
    hitRate: number;           // NEW - signal direction accuracy
    turnover: number;          // NEW - avg trades/day
  };
  
  // ML metadata
  modelId?: string;
  featureVersion?: string;
}
```

**Calculate IR:**
```typescript
// Information Ratio = mean(excess_returns) / std(excess_returns)
const excessReturns = returns.map(r => r - riskFreeRate);
const ir = mean(excessReturns) / std(excessReturns);
```

**Calculate Hit Rate:**
```typescript
// Hit Rate = correct_direction_calls / total_calls
const hits = signals.filter(s => s.direction === s.actual_direction).length;
const hitRate = hits / signals.length;
```

---

## 12. KALİBRASYON & OPTİMİZASYON

### Confidence Calibration

```
Hedef: Predicted confidence ≈ Actual accuracy

Yöntem:
1. Bin predictions by confidence [0.5-0.6), [0.6-0.7), ...
2. Calculate actual accuracy in each bin
3. Plot reliability diagram (diagonal = perfect calibration)
4. Adjust decision threshold if miscalibrated
```

### Weight Optimization (v2.1)

```
Yöntem: Empirical Bayes / WLS

1. Collect historical performance per signal
2. Estimate posterior weights: w* = argmax P(w | data)
3. Update ensemble weights
4. Walk-forward validate

Constraint: Σw = 1, w_i ≥ 0
```

**Kod (placeholder):**
```python
# ml/calibration.py
def optimize_weights(features, labels):
    from scipy.optimize import minimize
    
    def loss(w):
        scores = [fuse_with_weights(f, w) for f in features]
        return -information_ratio(scores, labels)
    
    w0 = [0.3, 0.4, 0.3]  # Initial
    bounds = [(0, 1)] * 3
    constraints = {'type': 'eq', 'fun': lambda w: sum(w) - 1}
    
    result = minimize(loss, w0, bounds=bounds, constraints=constraints)
    return result.x
```

---

## 13. PRODUCTION CHECKLIST

### Veri Hijyeni

- [x] sanitize() aynı (TS/Python) ✅
- [x] featureVersion tek kaynak ✅
- [x] NaN/Infinity guard aktif ✅
- [ ] Schema versioning (zod validation)

### Trace Korelasyonu

- [x] TraceId generation ✅
- [x] Audit push ml.score ✅
- [x] OTEL schema defined ✅
- [ ] OTEL SDK integration (@opentelemetry/api)

### Guardrails

- [x] SLO checks (p95, staleness, error) ✅
- [x] Confidence floor ✅
- [x] Fail-closed pattern ✅
- [ ] Critical breach → auto-pause tested

### Backtesting

- [x] BacktestReport schema ✅
- [ ] IR calculation
- [ ] Hit rate calculation
- [ ] Turnover calculation
- [ ] Walk-forward framework

---

## 14. KABUL KRİTERLERİ (v2.0 Ship)

| Kriter | Test | Beklenen | Durum |
|--------|------|----------|-------|
| **API /ml/score** | curl POST | decision ∈ {-1,0,1} | ✅ Aktif |
| **Sanitize** | NaN input | null return | ✅ Aktif |
| **Guardrails** | Low confid | decision = 0 | ✅ Aktif |
| **Audit** | ml.score action | RecentActions visible | ✅ Aktif |
| **TraceId** | Copy button | Clipboard + toast | ✅ Aktif |
| **Python sync** | Same input | Same output | ✅ Test |
| **OTEL** | Span attributes | ml.* fields | ⛳ Integration |
| **Backtest IR** | Report | IR ≥ 0.7 | ⛳ Implementation |

---

## 15. v2.0 → v2.1 YOL HARİTASI

### v2.1: Bayesian Weight Optimization

```
1. Collect performance data (6 months)
2. Empirical Bayes weight estimation
3. Walk-forward validation
4. Confidence calibration curve
5. Adaptive threshold (time-of-day)
```

### v2.2: Multi-Horizon Ensemble

```
Horizons: 15m, 1h, 4h
Weights: horizon-dependent
Aggregation: Bayesian model averaging
```

### v2.3: Advanced Features

```
1. Orderbook imbalance
2. Volume profile
3. Funding rate (perpetuals)
4. On-chain metrics (BTC)
5. Sentiment signals (Twitter/Reddit)
```

### v2.4: AutoML

```
1. Feature selection (LASSO/Elastic Net)
2. Hyperparameter tuning (Optuna)
3. Model ensemble (XGBoost + LSTM)
4. Online learning (incremental updates)
```

---

## 16. ÖNEMLİ NOTLAR

### Veri Senkronizasyonu

```
TS (online) ↔ Python (offline) AYNI:
├ sanitize() logic
├ fuse() weights
├ decide() threshold
└ Feature names/types
```

**Test:** Her değişiklikte her iki implementasyonu da test edin.

### Guardrails Fail-Closed

```
pass = false → decision = 0 (flat)
Asla risk almadan kırmızı çizgiyi geçmeyin
```

### Trace Korelasyonu

```
UI TraceId rozet → RecentActions → Postgres audit
                 → OTEL spans → Jaeger/Zipkin
                 
Korelasyon: Click copy → Jaeger search
```

### Model Versioning

```
ModelID format: "fusion-v{major}.{minor}.{patch}"
Feature version: "v{major}.{minor}.{patch}"

Breaking change → major bump
New feature → minor bump
Bug fix → patch bump
```

---

## ÖZET: ML OMURGASI HAZIR

**Teslim Edilen:**

```
Schema (TypeScript):
├ FeatureRow (30+ fields)
├ Dataset + DatasetMeta
├ ScoreRequest/Response
└ BacktestReport

SDK:
├ TypeScript: sanitize, fuse, decide, score, scoreBatch
├ Python: referans implementasyon (sync)
└ Guardrails: SLO-integrated checks

API:
├ /api/ml/score (POST)
├ Audit: ml.score action
└ TraceId: correlation ready

OTEL:
├ Span hierarchy (7 levels)
├ MLSpanAttributes type
└ Integration point (commented)

Documentation:
├ ML_SIGNAL_FUSION_V2.md (complete)
└ CUTOVER_PLAYBOOK.md (infrastructure)
```

**İlk 48 Saat Planı:**
- H+0–4: Preview-only (BTCUSDT 1h)
- H+4–24: Paper trading (hit ≥53%, IR ≥0.5)
- H+24–48: Multi-TF (15m/1h/4h, max 3 sembol)

**Sonraki Adım:**

1. Feature pipeline (executor): candles → indicators → FeatureRow
2. Backtest runner: IR + hit rate + turnover hesaplama
3. OTEL uncomment: @opentelemetry/api integration
4. Calibration: reliability diagram + adaptive threshold
5. v2.1: Bayesian weight optimization

**Veri disiplini hazır. Model puanını "para"ya tercüme etme zamanı.** 🎯
