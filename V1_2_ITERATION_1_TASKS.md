# 🚀 V1.2 Iteration 1: Backtest Engine Foundation

**Duration:** 3-4 hours  
**Goal:** Mock → Real engine transition with deterministic results

---

## 📋 MICRO-TASKS (Copy-Paste Ready)

### **Task 1: Workspace Bootstrap** (30-45 min)

**Objective:** Create `packages/backtest-engine` package skeleton.

**Files to create:**
1. `packages/backtest-engine/package.json`
2. `packages/backtest-engine/tsconfig.json`
3. `packages/backtest-engine/src/types.ts` (empty)
4. `packages/backtest-engine/src/engine.ts` (stub)
5. `packages/backtest-engine/src/index.ts` (export)

**Commands:**
```powershell
cd C:\dev\CursorGPT_IDE\CursorGPT_IDE\packages
mkdir backtest-engine\src
cd backtest-engine
```

**package.json:**
```json
{
  "name": "@spark/backtest-engine",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^20.11.30"
  }
}
```

**tsconfig.json:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "esModuleInterop": true,
    "strict": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Acceptance:**
- ✅ `pnpm -w build` succeeds
- ✅ `packages/backtest-engine/dist/index.js` exists

---

### **Task 2: Core Types & Strategy Interface** (45-60 min)

**Objective:** Define canonical data types and strategy contract.

**src/types.ts:**
```typescript
export type Candle = {
  t: number;  // timestamp (ms)
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
};

export type Order = {
  side: "buy" | "sell";
  qty: number;
  price?: number;  // undefined = market order
  ts: number;
};

export type Fill = {
  orderId: string;
  price: number;
  qty: number;
  fee: number;
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
  rand: (seed?: string) => () => number;
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

**src/engine.ts (stub):**
```typescript
import { BacktestOptions, BacktestResult } from "./types";

export async function runBacktest(opts: BacktestOptions): Promise<BacktestResult> {
  const id = `bt-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  const startTime = Date.now();
  
  // TODO: Implement simulation loop
  // For now, return stub
  
  return {
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
}
```

**src/index.ts:**
```typescript
export * from "./types";
export { runBacktest } from "./engine";
```

**Acceptance:**
- ✅ Types compile without errors
- ✅ `runBacktest()` callable from Node
- ✅ Returns valid `BacktestResult` structure

**Test:**
```powershell
cd packages\backtest-engine
pnpm install
pnpm build
node -e "const {runBacktest} = require('./dist/index.js'); runBacktest({symbol:'ETH',timeframe:'1h',candles:[],strategy:async()=>{},params:{}}).then(r=>console.log(r.id))"
```

---

### **Task 3: Deterministic Sim Skeleton + Evidence** (60-90 min)

**Objective:** Simple order matching, evidence JSON generation.

**src/sim.ts:**
```typescript
import { Candle, Order, Fill, Trade } from "./types";

export function simulateOrders(
  candles: Candle[],
  orders: Order[]
): { fills: Fill[]; trades: Trade[] } {
  // Deterministic fill logic
  // Commission = 0, Slippage = 0 (for now)
  const fills: Fill[] = [];
  const trades: Trade[] = [];
  
  // TODO: Implement simple matcher
  // Match each order at candle close price
  
  return { fills, trades };
}

export function calculatePnL(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
}

export function calculateStats(trades: Trade[]) {
  const wins = trades.filter(t => (t.pnl || 0) > 0).length;
  return {
    totalTrades: trades.length,
    winRate: trades.length > 0 ? wins / trades.length : 0,
    avgPnl: trades.length > 0 ? trades.reduce((s, t) => s + (t.pnl || 0), 0) / trades.length : 0,
    maxDrawdown: 0  // TODO: Implement
  };
}
```

**Update engine.ts:**
```typescript
import { BacktestOptions, BacktestResult } from "./types";
import { simulateOrders, calculatePnL, calculateStats } from "./sim";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export async function runBacktest(opts: BacktestOptions): Promise<BacktestResult> {
  const id = `bt-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  const startTime = Date.now();
  
  const orders: any[] = [];
  const ctx = {
    candles: opts.candles,
    emit: (order: any) => orders.push(order),
    now: () => Date.now(),
    rand: () => Math.random
  };
  
  // Run strategy
  await opts.strategy(opts.params, ctx);
  
  // Simulate
  const { fills, trades } = simulateOrders(opts.candles, orders);
  const pnl = calculatePnL(trades);
  const stats = calculateStats(trades);
  
  const result: BacktestResult = {
    id,
    report: { pnl, trades, stats },
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
    const evidenceDir = join(process.cwd(), "evidence", "backtest");
    mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(
      join(evidenceDir, `${id}.json`),
      JSON.stringify(result, null, 2)
    );
  } catch (err) {
    console.error("[EVIDENCE_ERROR]", err);
  }
  
  return result;
}
```

**Acceptance:**
- ✅ `runBacktest()` writes `evidence/backtest/<id>.json`
- ✅ Returns deterministic PnL
- ✅ Orders → Fills → Trades chain works

---

### **Task 4: Executor-Lite Integration** (30-45 min)

**Objective:** Replace mock with engine, feature-flagged.

**services/executor-lite/src/jobs/backtest.ts:**
```typescript
import { runBacktest } from "@spark/backtest-engine";

export async function executeBacktest(job: any): Promise<void> {
  // Load candles (mock for now)
  const candles = [
    { t: 1000, o: 100, h: 101, l: 99, c: 100.5, v: 1000 },
    // ... more mock candles
  ];
  
  // Simple SMA-Cross strategy (stub)
  const strategy = async (params: any, ctx: any) => {
    // TODO: Implement
  };
  
  const result = await runBacktest({
    symbol: job.pair,
    timeframe: job.timeframe,
    candles,
    strategy,
    params: job.params || {}
  });
  
  console.log(`[BACKTEST_COMPLETE] ${result.id} - PnL: ${result.report.pnl}`);
}
```

**Update server.ts:**
```typescript
// Add at top
const BACKTEST_IMPL = process.env.BACKTEST_IMPL || "mock";

// Update /api/backtest/start
app.post("/api/backtest/start", requireAdmin, async (req, res) => {
  const endTimer = enqueueLatency.startTimer();
  const { pair = "ETHUSDT", timeframe = "4h", notes = "", params = {} } = req.body ?? {};
  const id = `bt-${Date.now()}-${randomUUID().slice(0,8)}`;
  
  backtestStart.inc();
  audit({ evt: "start", id, pair, timeframe, notes, ip: req.ip, ua: req.headers["user-agent"] });
  
  Q.push({ id, pair, timeframe, notes, status: "queued", ts: Date.now() });
  
  // Execute based on flag
  if (BACKTEST_IMPL === "engine") {
    setTimeout(async () => {
      try {
        const { executeBacktest } = await import("./jobs/backtest.js");
        await executeBacktest({ id, pair, timeframe, params });
        const j = Q.find(x => x.id === id);
        if (j) j.status = "done";
        backtestDone.inc();
        audit({ evt: "done", id });
      } catch (err) {
        console.error("[BACKTEST_ERROR]", err);
        const j = Q.find(x => x.id === id);
        if (j) j.status = "failed";
      }
    }, 100);
  } else {
    // Mock (existing logic)
    setTimeout(() => { 
      const j = Q.find(x => x.id === id); 
      if (j) {
        j.status = "done";
        backtestDone.inc();
        audit({ evt: "done", id });
      }
    }, 3500);
  }
  
  endTimer();
  res.status(201).json({ id, status: "queued" });
});
```

**Acceptance:**
- ✅ `BACKTEST_IMPL=mock` → old behavior
- ✅ `BACKTEST_IMPL=engine` → new behavior
- ✅ Evidence JSON created when engine used
- ✅ Metrics still work

---

## 🎯 **TOMORROW'S CHECKLIST**

**Morning (2 hours):**
1. ✅ Create package skeleton
2. ✅ Define types
3. ✅ Stub engine + sim
4. ✅ Test with `node -e` command

**Afternoon (2 hours):**
1. ✅ Integrate with executor-lite
2. ✅ Feature flag implementation
3. ✅ Evidence generation
4. ✅ Smoke test with real engine

**Smoke Test Commands:**
```powershell
# Test mock mode
$env:BACKTEST_IMPL="mock"
curl -X POST http://127.0.0.1:4010/api/backtest/start -H "x-admin-token: test-secret-123" -H "content-type: application/json" -d '{"pair":"ETHUSDT"}'

# Test engine mode
$env:BACKTEST_IMPL="engine"
curl -X POST http://127.0.0.1:4010/api/backtest/start -H "x-admin-token: test-secret-123" -H "content-type: application/json" -d '{"pair":"ETHUSDT","strategy":"smaCross","params":{"fast":10,"slow":30}}'

# Check evidence
dir C:\dev\CursorGPT_IDE\CursorGPT_IDE\evidence\backtest\
```

---

## 📊 SUCCESS CRITERIA (Iteration 1 Exit)

- [ ] `packages/backtest-engine` builds successfully
- [ ] `runBacktest()` returns deterministic results
- [ ] Evidence JSON generated at `evidence/backtest/<id>.json`
- [ ] Prometheus metrics: `bt_runs_total`, `bt_latency_ms`
- [ ] Feature flag works: `BACKTEST_IMPL=mock|engine`
- [ ] P95 enqueue latency < 100ms (SLO maintained)

---

## 🔄 ROLLBACK PLAN

**If anything breaks:**
```powershell
$env:BACKTEST_IMPL="mock"
# System reverts to v1.1 behavior immediately
```

---

## 📝 NEXT ITERATIONS (Preview)

**Iteration 2:** BTCTurk Spot Reader (Days 4-7)
- Live WebSocket feed
- REST fallback
- Reconnection logic

**Iteration 3:** Guardrails v1 (Days 8-11)
- Param-diff approval
- Risk gates

**Iteration 4:** UI Integration (Days 12-14)
- Backtest report viewer
- Guardrails panel

---

**Ready for tomorrow!** 🚀

