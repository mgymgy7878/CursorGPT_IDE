# 🎯 HEMEN BAŞLAT - EYLEM PLANI

**Tarih:** 2025-10-24  
**Hedef:** İlk 2 haftada kritik özellikleri tamamla  
**Durum:** ✅ HAZIR

---

## 📊 ÖNCELİK SIRASI

### SPRINT 1 (Hafta 1): DATABASE & EXECUTION ENGINE

#### Gün 1-2: Database Setup ⚡ ACİL

**Görevler:**
```bash
# 1. Prisma kurulumu
cd c:\dev
pnpm add -w prisma @prisma/client
pnpm add -D -w prisma

# 2. Init Prisma
pnpm exec prisma init

# 3. Schema oluştur
```

**Schema Tasarımı (`prisma/schema.prisma`):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  strategies Strategy[]
  backtests  Backtest[]
}

model Strategy {
  id          String   @id @default(cuid())
  name        String
  code        String   @db.Text
  params      Json
  status      String   @default("draft") // draft, active, paused, stopped
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  backtests   Backtest[]
  trades      Trade[]
}

model Backtest {
  id          String   @id @default(cuid())
  strategyId  String
  strategy    Strategy @relation(fields: [strategyId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  params      Json
  results     Json     // metrics, equity curve, trades
  startDate   DateTime
  endDate     DateTime
  status      String   @default("pending") // pending, running, completed, failed
  createdAt   DateTime @default(now())
  completedAt DateTime?
}

model Trade {
  id         String   @id @default(cuid())
  strategyId String
  strategy   Strategy @relation(fields: [strategyId], references: [id])
  symbol     String
  side       String   // buy, sell
  type       String   // market, limit
  price      Float
  quantity   Float
  commission Float    @default(0)
  pnl        Float?
  status     String   // pending, filled, cancelled
  exchange   String   // binance, btcturk
  createdAt  DateTime @default(now())
  filledAt   DateTime?
}

model Position {
  id        String   @id @default(cuid())
  symbol    String
  side      String   // long, short
  quantity  Float
  avgPrice  Float
  exchange  String
  updatedAt DateTime @updatedAt
  
  @@unique([symbol, exchange])
}
```

**Migration:**
```bash
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

**ENV Setup (`.env`):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/spark?schema=public"
```

**Docker PostgreSQL:**
```yaml
# docker-compose.yml içine ekle
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: spark
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Başlat:**
```bash
docker-compose up -d postgres
```

**Tahmini Süre:** 6 saat

---

#### Gün 3-5: Execution Engine Prototype

**1. Executor'a Prisma Ekle:**
```bash
cd services/executor
pnpm add @prisma/client
```

**2. Order Placement Module (`src/execution/orders.ts`):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OrderRequest {
  strategyId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  exchange: 'binance' | 'btcturk';
}

export async function placeOrder(req: OrderRequest) {
  // 1. Risk checks
  await checkRiskLimits(req);
  
  // 2. Exchange API call
  const exchangeOrder = await sendToExchange(req);
  
  // 3. Save to DB
  const trade = await prisma.trade.create({
    data: {
      strategyId: req.strategyId,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      price: req.price || exchangeOrder.price,
      quantity: req.quantity,
      status: 'pending',
      exchange: req.exchange,
    },
  });
  
  return trade;
}

async function checkRiskLimits(req: OrderRequest) {
  // Max notional check
  const MAX_NOTIONAL = 10000; // $10k per order
  const notional = (req.price || 0) * req.quantity;
  if (notional > MAX_NOTIONAL) {
    throw new Error(`Order notional ${notional} exceeds max ${MAX_NOTIONAL}`);
  }
  
  // Max drawdown check
  // ... (calculate from recent trades)
}

async function sendToExchange(req: OrderRequest) {
  if (req.exchange === 'binance') {
    return sendToBinance(req);
  }
  throw new Error(`Exchange ${req.exchange} not supported`);
}

async function sendToBinance(req: OrderRequest) {
  // Binance API integration
  const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
  const BINANCE_SECRET = process.env.BINANCE_SECRET;
  
  // ... (Binance order placement logic)
  
  return {
    orderId: 'mock-123',
    price: 42000,
    status: 'FILLED',
  };
}
```

**3. API Endpoints (`src/server.ts`):**
```typescript
// Add to executor server.ts

import { placeOrder } from './execution/orders';

app.post('/api/exec/order', async (req, reply) => {
  try {
    const order = await placeOrder(req.body);
    return { ok: true, order };
  } catch (err) {
    reply.code(400);
    return { ok: false, error: err.message };
  }
});

app.post('/api/exec/start', async (req, reply) => {
  const { strategyId } = req.body;
  
  // Update strategy status
  await prisma.strategy.update({
    where: { id: strategyId },
    data: { status: 'active' },
  });
  
  return { ok: true, strategyId, status: 'active' };
});

app.post('/api/exec/stop', async (req, reply) => {
  const { strategyId } = req.body;
  
  await prisma.strategy.update({
    where: { id: strategyId },
    data: { status: 'stopped' },
  });
  
  return { ok: true, strategyId, status: 'stopped' };
});
```

**4. Frontend Integration (`apps/web-next/src/lib/api-client.ts`):**
```typescript
export async function startStrategy(strategyId: string) {
  const res = await fetch('http://localhost:4001/api/exec/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId }),
  });
  return res.json();
}

export async function stopStrategy(strategyId: string) {
  const res = await fetch('http://localhost:4001/api/exec/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId }),
  });
  return res.json();
}

export async function placeOrder(order: OrderRequest) {
  const res = await fetch('http://localhost:4001/api/exec/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  return res.json();
}
```

**Tahmini Süre:** 12 saat

---

### SPRINT 2 (Hafta 2): BACKTEST ENGINE

#### Gün 1-3: Backtest Core

**1. Historical Data Loader (`services/analytics/src/backtest/dataLoader.ts`):**
```typescript
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function loadHistoricalData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  exchange: 'binance' | 'btcturk'
): Promise<Candle[]> {
  // Fetch from exchange API or database
  if (exchange === 'binance') {
    return fetchBinanceKlines(symbol, startDate, endDate);
  }
  throw new Error(`Exchange ${exchange} not supported`);
}

async function fetchBinanceKlines(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&startTime=${startDate.getTime()}&endTime=${endDate.getTime()}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  return data.map((k: any[]) => ({
    timestamp: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}
```

**2. Backtest Engine (`services/analytics/src/backtest/engine.ts`):**
```typescript
import { loadHistoricalData, Candle } from './dataLoader';

export interface BacktestConfig {
  strategyCode: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  exchange: 'binance' | 'btcturk';
  initialCapital: number;
  commission: number; // 0.001 = 0.1%
}

export interface BacktestResult {
  trades: Trade[];
  metrics: {
    totalReturn: number;
    cagr: number;
    sharpe: number;
    maxDD: number;
    winRate: number;
    profitFactor: number;
  };
  equityCurve: { timestamp: number; equity: number }[];
}

export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  // 1. Load data
  const candles = await loadHistoricalData(
    config.symbol,
    config.startDate,
    config.endDate,
    config.exchange
  );
  
  // 2. Initialize state
  let equity = config.initialCapital;
  let position = 0; // shares held
  const trades: Trade[] = [];
  const equityCurve: { timestamp: number; equity: number }[] = [];
  
  // 3. Compile strategy
  const strategy = compileStrategy(config.strategyCode);
  
  // 4. Event loop
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const signal = strategy.onCandle(candle, candles.slice(0, i));
    
    if (signal === 'buy' && position === 0) {
      // Buy
      const shares = Math.floor(equity / candle.close);
      const cost = shares * candle.close * (1 + config.commission);
      
      if (cost <= equity) {
        position = shares;
        equity -= cost;
        
        trades.push({
          timestamp: candle.timestamp,
          side: 'buy',
          price: candle.close,
          quantity: shares,
          commission: shares * candle.close * config.commission,
        });
      }
    } else if (signal === 'sell' && position > 0) {
      // Sell
      const proceeds = position * candle.close * (1 - config.commission);
      equity += proceeds;
      
      trades.push({
        timestamp: candle.timestamp,
        side: 'sell',
        price: candle.close,
        quantity: position,
        commission: position * candle.close * config.commission,
      });
      
      position = 0;
    }
    
    // Track equity
    const currentEquity = equity + position * candle.close;
    equityCurve.push({ timestamp: candle.timestamp, equity: currentEquity });
  }
  
  // 5. Calculate metrics
  const finalEquity = equity + position * candles[candles.length - 1].close;
  const metrics = calculateMetrics(trades, equityCurve, config.initialCapital);
  
  return { trades, metrics, equityCurve };
}

function compileStrategy(code: string) {
  // Simple strategy compiler
  // In production, use safer sandboxing
  const fn = new Function('candle', 'history', code);
  
  return {
    onCandle: (candle: Candle, history: Candle[]) => {
      try {
        return fn(candle, history);
      } catch {
        return null;
      }
    },
  };
}

function calculateMetrics(trades: Trade[], equityCurve: any[], initialCapital: number) {
  const finalEquity = equityCurve[equityCurve.length - 1].equity;
  const totalReturn = (finalEquity - initialCapital) / initialCapital;
  
  // CAGR
  const years = equityCurve.length / (252 * 6.5); // assume hourly, 252 trading days
  const cagr = Math.pow(1 + totalReturn, 1 / years) - 1;
  
  // Max Drawdown
  let maxDD = 0;
  let peak = initialCapital;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = (peak - point.equity) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  
  // Win Rate
  const wins = trades.filter((t, i) => {
    if (t.side === 'sell' && i > 0) {
      const buyTrade = trades[i - 1];
      return t.price > buyTrade.price;
    }
    return false;
  }).length;
  const totalTrades = trades.filter(t => t.side === 'sell').length;
  const winRate = totalTrades > 0 ? wins / totalTrades : 0;
  
  // Sharpe (simplified)
  const returns = equityCurve.map((p, i) => 
    i > 0 ? (p.equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity : 0
  );
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(
    returns.reduce((a, r) => a + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252 * 6.5) : 0;
  
  // Profit Factor
  const wins = trades.filter(t => t.pnl && t.pnl > 0);
  const losses = trades.filter(t => t.pnl && t.pnl < 0);
  const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
  
  return {
    totalReturn,
    cagr,
    sharpe,
    maxDD,
    winRate,
    profitFactor,
  };
}
```

**3. API Endpoint:**
```typescript
// services/executor/src/server.ts

import { runBacktest } from '../../../services/analytics/src/backtest/engine';

app.post('/api/backtest/run', async (req, reply) => {
  const { strategyId, startDate, endDate } = req.body;
  
  // Get strategy from DB
  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
  });
  
  if (!strategy) {
    reply.code(404);
    return { ok: false, error: 'Strategy not found' };
  }
  
  // Create backtest record
  const backtest = await prisma.backtest.create({
    data: {
      strategyId,
      userId: strategy.userId,
      params: strategy.params,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'running',
      results: {},
    },
  });
  
  // Run backtest (async)
  runBacktest({
    strategyCode: strategy.code,
    symbol: 'BTCUSDT',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    exchange: 'binance',
    initialCapital: 10000,
    commission: 0.001,
  })
    .then(async (result) => {
      await prisma.backtest.update({
        where: { id: backtest.id },
        data: {
          status: 'completed',
          results: result as any,
          completedAt: new Date(),
        },
      });
    })
    .catch(async (err) => {
      await prisma.backtest.update({
        where: { id: backtest.id },
        data: {
          status: 'failed',
          results: { error: err.message } as any,
        },
      });
    });
  
  return { ok: true, backtestId: backtest.id };
});

app.get('/api/backtest/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  
  const backtest = await prisma.backtest.findUnique({
    where: { id },
    include: { strategy: true },
  });
  
  if (!backtest) {
    reply.code(404);
    return { ok: false, error: 'Backtest not found' };
  }
  
  return { ok: true, backtest };
});
```

**Tahmini Süre:** 12 saat

---

#### Gün 4-5: Frontend Integration

**Strategy Lab'a Backtest Entegrasyonu:**

```typescript
// apps/web-next/src/app/strategy-lab/page.tsx

'use client';

import { useState } from 'react';
import { EquityCurveChart } from '@/components/backtest/EquityCurveChart';
import { MetricsCards } from '@/components/backtest/MetricsCards';

export default function StrategyLab() {
  const [code, setCode] = useState('');
  const [backtestResult, setBacktestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  async function runBacktest() {
    setLoading(true);
    try {
      // 1. Save strategy
      const saveRes = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Strategy',
          code,
          params: {},
        }),
      });
      const { strategyId } = await saveRes.json();
      
      // 2. Start backtest
      const backtestRes = await fetch('http://localhost:4001/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      });
      const { backtestId } = await backtestRes.json();
      
      // 3. Poll for results
      let result = null;
      while (!result) {
        await new Promise(r => setTimeout(r, 2000));
        
        const statusRes = await fetch(`http://localhost:4001/api/backtest/${backtestId}`);
        const { backtest } = await statusRes.json();
        
        if (backtest.status === 'completed') {
          result = backtest.results;
          break;
        } else if (backtest.status === 'failed') {
          throw new Error('Backtest failed');
        }
      }
      
      setBacktestResult(result);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Strategy Lab</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Code Editor */}
        <div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm border rounded"
            placeholder="// Write your strategy code here..."
          />
          
          <button
            onClick={runBacktest}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
        </div>
        
        {/* Results */}
        <div>
          {backtestResult && (
            <>
              <MetricsCards metrics={backtestResult.metrics} />
              <EquityCurveChart data={backtestResult.equityCurve} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Tahmini Süre:** 8 saat

---

## 📋 CHECKPOINT - 2 HAFTA SONU

### Tamamlanması Gerekenler:

- [x] PostgreSQL çalışıyor
- [x] Prisma schema ve migrations
- [x] Execution engine: order placement
- [x] Execution engine: start/stop strategy
- [x] Backtest engine: data loader
- [x] Backtest engine: simulation
- [x] Backtest engine: metrics
- [x] Frontend: backtest entegrasyonu
- [x] Tüm API'ler çalışıyor

### Test Senaryosu:

```bash
# 1. Database check
docker ps | grep postgres

# 2. Services check
pm2 status

# 3. Create strategy via UI
# 4. Run backtest
# 5. View results
# 6. Start strategy (paper mode)
```

---

## 🚀 HEMEN BAŞLA

```bash
# Terminal 1: Database
docker-compose up -d postgres

# Terminal 2: Executor
cd services/executor
pnpm dev

# Terminal 3: Web
cd apps/web-next
pnpm dev

# Terminal 4: Database migrations
pnpm exec prisma migrate dev
```

---

## 📞 DESTEK

**Sorunlar:**
- Database connection: `.env` dosyasını kontrol et
- Prisma errors: `pnpm exec prisma generate` çalıştır
- Port conflicts: `netstat -ano | findstr "5432"`

**Kaynaklar:**
- Prisma Docs: https://www.prisma.io/docs
- Binance API: https://binance-docs.github.io/apidocs/

---

**BAŞARI! İlk 2 haftada core features tamamlanacak.** 🎉

