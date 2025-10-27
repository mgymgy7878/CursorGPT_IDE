# 🚀 ITERATION 1 KICKOFF - Copy-Paste Ready

**Date:** 2025-10-09  
**Goal:** Backtest Engine Foundation (Mock → Real Engine)  
**Duration:** 3-4 hours

---

## 📋 CURSOR TASK (Single Message)

**Copy this to Cursor tomorrow:**

```
mehmet:

V1.2 Iteration 1 başlıyoruz - Backtest Engine Foundation. Aşağıdaki yapıyı oluştur, stub içeriklerle doldur, build et, smoke test yap.

HEDEF: Mock'u gerçek engine ile değiştir; deterministik evidence JSON + metrics üret.

1) packages/backtest-engine oluştur (CJS)
   • package.json: type=commonjs, main=dist/index.js, build=tsc
   • tsconfig.json: module=CommonJS, outDir=dist, rootDir=src, extends ../../tsconfig.base.json
   • src/types.ts: Candle, Order, Trade, Report, StrategyCtx, Strategy, BacktestOptions, BacktestResult
   • src/engine.ts: async runBacktest(opts:BacktestOptions):Promise<BacktestResult> - stub, ID üret, evidence yaz
   • src/sim.ts: simulateOrders(), calculatePnL(), calculateStats() - stub
   • src/strategies/smaCross.ts: async (params, ctx) => { /* stub SMA cross logic */ }
   • src/index.ts: export * from types, export runBacktest

2) services/executor-lite entegrasyonu
   • src/jobs/backtest.ts: executeBacktest(job) → runBacktest() çağır, mock candles kullan
   • server.ts güncellemesi:
     - BACKTEST_IMPL env (mock|engine, default:mock)
     - /api/backtest/start içinde: BACKTEST_IMPL=engine ise executeBacktest() çağır
     - bt_runs_total, bt_fail_total, bt_latency_ms metriklerini ekle
   
3) Build & Smoke
   • pnpm -w build
   • BACKTEST_IMPL=engine ile executor-lite başlat
   • curl ile /api/backtest/start → evidence/backtest/<id>.json oluşturuldu mu kontrol et
   • metrics'te bt_runs_total > 0 olmalı

KABUL KRİTERİ: Evidence JSON oluşur, metrics artar, /start p95 < 100ms.

cursor: Tek paragraf özet ile dön (hangi dosyalar oluşturuldu, smoke test sonucu, metrics sayıları).
```

---

## 📝 EXPECTED FILE STRUCTURE (After Task)

```
packages/
  backtest-engine/
    package.json
    tsconfig.json
    src/
      types.ts
      engine.ts
      sim.ts
      index.ts
      strategies/
        smaCross.ts
    dist/
      index.js

services/
  executor-lite/
    src/
      jobs/
        backtest.ts    # NEW
      server.ts        # UPDATED (BACKTEST_IMPL flag)
    evidence/
      backtest/
        bt-*.json      # GENERATED
```

---

## 🧪 EXPECTED SMOKE TEST OUTPUT

```powershell
=== Iteration 1 Smoke Test ===

1. Build:
   ✅ packages/backtest-engine/dist/index.js created

2. Engine Test (direct):
   ✅ runBacktest() returns valid BacktestResult
   ✅ ID: bt-1759950000000-abcd1234

3. Executor Integration:
   ✅ POST /api/backtest/start → 201 Created
   ✅ Evidence: evidence/backtest/bt-*.json created

4. Metrics:
   ✅ bt_runs_total: 1
   ✅ bt_fail_total: 0
   ✅ bt_latency_ms_bucket{le="100"}: 1

5. Status:
   ✅ GET /api/backtest/status → queue contains "done" job

SUCCESS: ✅ Mock → Engine transition complete
```

---

## 📊 STUB CONTENT PREVIEW (Copy-Paste Ready)

### **types.ts (Complete)**

```typescript
export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type Order = {
  side: "buy" | "sell";
  qty: number;
  price?: number;
  ts: number;
};

export type Trade = {
  id: string;
  side: "long" | "short";
  entry: number;
  exit?: number;
  pnl?: number;
  tsEnter: number;
  tsExit?: number;
};

export type Report = {
  pnl: number;
  trades: Trade[];
  stats: {
    totalTrades: number;
    winRate: number;
    avgPnl: number;
    maxDrawdown: number;
  };
};

export type StrategyCtx = {
  candles: Candle[];
  emit: (order: Order) => void;
  now: () => number;
};

export type Strategy = (
  params: Record<string, number | string>,
  ctx: StrategyCtx
) => Promise<void>;

export type BacktestOptions = {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  strategy: Strategy;
  params: Record<string, any>;
};

export type BacktestResult = {
  id: string;
  report: Report;
  metadata: {
    symbol: string;
    timeframe: string;
    startTime: number;
    endTime: number;
    candleCount: number;
    duration: number;
  };
};
```

### **engine.ts (Stub)**

```typescript
import { BacktestOptions, BacktestResult } from "./types";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export async function runBacktest(opts: BacktestOptions): Promise<BacktestResult> {
  const id = `bt-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  const startTime = Date.now();
  
  // TODO: Implement real simulation
  // For now, stub returns
  
  const result: BacktestResult = {
    id,
    report: {
      pnl: 0,
      trades: [],
      stats: { totalTrades: 0, winRate: 0, avgPnl: 0, maxDrawdown: 0 }
    },
    metadata: {
      symbol: opts.symbol,
      timeframe: opts.timeframe,
      startTime,
      endTime: Date.now(),
      candleCount: opts.candles.length,
      duration: Date.now() - startTime
    }
  };
  
  // Write evidence
  try {
    const evidenceDir = join(process.cwd(), "..", "..", "evidence", "backtest");
    mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(join(evidenceDir, `${id}.json`), JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("[EVIDENCE_ERROR]", err);
  }
  
  return result;
}
```

---

## 🎯 SUCCESS CRITERIA (Iteration 1)

- [ ] Package builds: `dist/index.js` exists
- [ ] Evidence JSON: `evidence/backtest/<id>.json` created
- [ ] Metrics: `bt_runs_total > 0`
- [ ] Feature flag: `BACKTEST_IMPL=engine|mock` works
- [ ] Latency: P95 < 100ms maintained

---

## 🚀 READY FOR TOMORROW!

**Documents Prepared:**
- ✅ `V1_2_SPRINT_PLAN.md`
- ✅ `V1_2_ITERATION_1_TASKS.md`
- ✅ `ITERATION_1_KICKOFF.md` (this file)
- ✅ `SESSION_SUMMARY_2025_10_08_v2.md`

**Next Session:**
1. Copy task from above
2. Paste to Cursor
3. Execute
4. Verify smoke test
5. Commit & tag

**Estimated Time:** 3-4 hours for complete Iteration 1.

---

**See you tomorrow! 🚀**

