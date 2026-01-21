import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// Paper runner state
type RunState = {
  runId: string;
  strategyId: string;
  symbol: string;
  timeframe: string;
  mode: "paper" | "live";
  params: Record<string, any>;
  startedAt: number;
  running: boolean;
  lastTickTs?: number; // Marketdata'dan gelen candle timestamp (candle.ts)
  lastCandleTs?: number; // Gerçek mum zamanı (candle.ts, lastTickTs ile aynı)
  lastLoopTs?: number; // Loop/heartbeat zamanı (Date.now())
  lastDecisionTs?: number;
  lastSignal?: { type: "long" | "short" | "exit"; ts: number; price: number; reason: string };
  position?: { side: "long" | "short"; qty: number; entryPrice: number; entryTs: number };
  pnl: number;
  equity: number;
  lastError?: string;
  // Freshness metrics
  marketdataCandleTs?: number;
  marketdataAgeSec?: number;
  loopLagMs?: number;
  // Degraded state
  degraded?: boolean;
  degradedReason?: string;
};

let currentRun: RunState | null = null;
let runnerInterval: NodeJS.Timeout | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

// Event ring buffer (son 500 event)
const eventBuffer: Array<{ v: number; seq: number; ts: number; type: string; data: any }> = [];
let eventSeq = 0;

function emitEvent(type: string, data: any) {
  const event = { v: 1, seq: eventSeq++, ts: Date.now(), type, data };
  eventBuffer.push(event);
  if (eventBuffer.length > 500) {
    eventBuffer.shift();
  }
  return event;
}

// EMA calculation (simple)
function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) {
    // Simple average for insufficient data
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

// RSI calculation (simple)
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Neutral
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => -c);
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Timeframe to interval seconds (same as marketdata)
function timeframeToIntervalSec(timeframe: string): number {
  const map: Record<string, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
    "1w": 604800,
    "1M": 2592000,
  };
  return map[timeframe.toLowerCase()] || 60;
}

// Strategy: EMA+RSI
async function runEMA_RSI_Strategy(run: RunState, marketdataUrl: string) {
  try {
    run.lastError = undefined;
    // Get latest candle
    const response = await fetch(`${marketdataUrl}/api/marketdata/latest?symbol=${run.symbol}&timeframe=${run.timeframe}`);
    if (!response.ok) {
      const errMsg = "Failed to fetch market data";
      run.lastError = errMsg;
      emitEvent("error", { message: errMsg });
      return;
    }
    const candle = await response.json();
    const now = Date.now();

    // Update loop timestamp (always, to show loop is running)
    run.lastLoopTs = now;

    // Extract freshness metrics from marketdata response
    run.marketdataCandleTs = candle.candleTs;
    run.marketdataAgeSec = candle.candleAgeSec || candle.ageSec; // Support both old and new format
    run.loopLagMs = now - (run.lastLoopTs || now);

    // Stale guardrail: check if marketdata is too old
    const intervalSec = timeframeToIntervalSec(run.timeframe);
    const maxAgeSec = intervalSec * 2 + 5; // e.g., 1m => 125s

    if (run.marketdataAgeSec !== undefined && run.marketdataAgeSec > maxAgeSec) {
      // Marketdata is stale - enter degraded mode
      run.degraded = true;
      run.degradedReason = "MARKETDATA_STALE";

      // Emit warning event
      emitEvent("warning", {
        message: `Marketdata stale: ageSec=${run.marketdataAgeSec}, maxAgeSec=${maxAgeSec}`,
        reason: "MARKETDATA_STALE",
        ageSec: run.marketdataAgeSec,
        maxAgeSec,
        source: candle.source || "unknown",
      });

      // Skip decision/trade logic
      emitEvent("log", { message: `Skipping decision loop: marketdata stale (${run.marketdataAgeSec}s > ${maxAgeSec}s)` });
      return;
    }

    // Marketdata is fresh - clear degraded state
    if (run.degraded && run.degradedReason === "MARKETDATA_STALE") {
      run.degraded = false;
      run.degradedReason = undefined;
      emitEvent("log", { message: `Marketdata fresh again: ageSec=${run.marketdataAgeSec}` });
    }

    // Update lastCandleTs to actual candle timestamp (semantic fix)
    if (candle.candleTs) {
      run.lastCandleTs = candle.candleTs;
    }

    if (!candle.candleTs || candle.candleTs === run.lastTickTs) {
      // No new candle, but emit heartbeat log
      emitEvent("log", { message: `Waiting for new candle (current: ${run.lastTickTs || "none"})` });
      return;
    }

    // New candle detected - update timestamps and emit decision event
    run.lastTickTs = candle.candleTs;
    run.lastCandleTs = candle.candleTs; // Semantic: lastCandleTs = actual candle timestamp
    run.lastDecisionTs = now;

    // Emit decision event (proof that loop is processing new candles)
    emitEvent("decision", {
      ts: run.lastDecisionTs,
      symbol: run.symbol,
      timeframe: run.timeframe,
      reason: "new_candle_received",
      candleTs: candle.candleTs,
      price: candle.close,
    });

    // Get historical candles for indicators (simplified: use last 30)
    const histResponse = await fetch(`https://api.binance.com/api/v3/klines?symbol=${run.symbol}&interval=${run.timeframe}&limit=30`);
    const histData = await histResponse.json();
    const closes = histData.map((k: any) => parseFloat(k[4]));

    // Calculate indicators
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const rsi = calculateRSI(closes, 14);
    const currentPrice = candle.close;

    emitEvent("log", { message: `EMA12: ${ema12.toFixed(2)}, EMA26: ${ema26.toFixed(2)}, RSI: ${rsi.toFixed(2)}, Price: ${currentPrice}` });

    // Strategy logic
    const hasPosition = !!run.position;
    const emaCrossUp = ema12 > ema26;
    const emaCrossDown = ema12 < ema26;
    const rsiOversold = rsi < 30;
    const rsiOverbought = rsi > 70;
    const rsiNeutral = rsi >= 30 && rsi <= 70;

    const rsiEntry = run.params.rsiEntry || 70;
    const rsiExit = run.params.rsiExit || 75;

    if (!hasPosition) {
      // Long entry: EMA12 > EMA26 AND RSI < rsiEntry
      if (emaCrossUp && rsi < rsiEntry) {
        const qty = run.params.qty || 0.001;
        run.position = {
          side: "long",
          qty,
          entryPrice: currentPrice,
          entryTs: Date.now(),
        };
        const signal = { type: "long" as const, ts: Date.now(), price: currentPrice, reason: `EMA cross up (${ema12.toFixed(2)} > ${ema26.toFixed(2)}) and RSI ${rsi.toFixed(2)} < ${rsiEntry}` };
        run.lastSignal = signal;
        run.lastDecisionTs = Date.now();
        emitEvent("signal", signal);
        emitEvent("trade", { action: "open", side: "long", qty, price: currentPrice });
      }
    } else {
      // Exit: EMA12 < EMA26 OR RSI > rsiExit
      if (emaCrossDown || rsi > rsiExit) {
        const pnl = (currentPrice - run.position!.entryPrice) * run.position!.qty;
        run.pnl += pnl;
        run.equity = 10000 + run.pnl;
        const signal = { type: "exit" as const, ts: Date.now(), price: currentPrice, reason: emaCrossDown ? `EMA cross down (${ema12.toFixed(2)} < ${ema26.toFixed(2)})` : `RSI overbought (${rsi.toFixed(2)} > ${rsiExit})` };
        run.lastSignal = signal;
        run.lastDecisionTs = Date.now();
        emitEvent("signal", signal);
        emitEvent("trade", { action: "close", side: run.position!.side, qty: run.position!.qty, price: currentPrice, pnl });
        run.position = undefined;
      } else {
        // Update PnL
        const pnl = (currentPrice - run.position!.entryPrice) * run.position!.qty;
        run.pnl = (run.equity - 10000) + pnl;
      }
    }

    emitEvent("status", {
      running: run.running,
      runId: run.runId,
      strategyId: run.strategyId,
      symbol: run.symbol,
      timeframe: run.timeframe,
      mode: run.mode,
      lastTickTs: run.lastTickTs,
      lastCandleTs: run.lastCandleTs,
      lastLoopTs: run.lastLoopTs,
      lastDecisionTs: run.lastDecisionTs,
      position: run.position,
      pnl: run.pnl,
      equity: run.equity,
      loopIntervalMs: 5000,
      lastError: run.lastError,
      marketdataCandleTs: run.marketdataCandleTs,
      marketdataAgeSec: run.marketdataAgeSec,
      loopLagMs: run.loopLagMs,
      degraded: run.degraded,
      degradedReason: run.degradedReason,
    });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    run.lastError = errMsg;
    emitEvent("error", { message: errMsg });
  }
}

export default async function execRoute(app: FastifyInstance) {
  const marketdataUrl = process.env.MARKETDATA_URL || "http://localhost:5001";

  // Start runner
  app.post("/api/exec/start", async (req: FastifyRequest<{ Body: { strategyId: string; symbol?: string; timeframe?: string; mode?: string; params?: Record<string, any> } }>, reply) => {
    if (currentRun?.running) {
      return reply.code(400).send({ ok: false, error: "Runner already running" });
    }

    const { strategyId, symbol = "BTCUSDT", timeframe = "1m", mode = "paper", params = {} } = req.body;

    if (mode !== "paper") {
      return reply.code(400).send({ ok: false, error: "LIVE mode is disabled" });
    }

    if (strategyId !== "ema_rsi_v1") {
      return reply.code(400).send({ ok: false, error: `Unknown strategy: ${strategyId}` });
    }

    const runId = `run_${Date.now()}`;
    currentRun = {
      runId,
      strategyId,
      symbol: symbol.toUpperCase(),
      timeframe,
      mode: mode as "paper",
      params,
      startedAt: Date.now(),
      running: true,
      pnl: 0,
      equity: 10000,
    };

    emitEvent("log", { message: `Started ${strategyId} for ${symbol} ${timeframe} (${mode})` });

    // Start interval (every 5 seconds, check for new candle)
    runnerInterval = setInterval(() => {
      if (currentRun?.running && currentRun.strategyId === "ema_rsi_v1") {
        runEMA_RSI_Strategy(currentRun, marketdataUrl);
      }
    }, 5000);

    // Heartbeat (every 5 seconds, same as strategy loop)
    heartbeatInterval = setInterval(() => {
      if (currentRun?.running) {
        // Update loop timestamp for heartbeat
        currentRun.lastLoopTs = Date.now();
        if (currentRun.lastLoopTs && currentRun.lastLoopTs > 0) {
          currentRun.loopLagMs = Date.now() - currentRun.lastLoopTs;
        }
        emitEvent("status", {
          running: currentRun.running,
          runId: currentRun.runId,
          strategyId: currentRun.strategyId,
          symbol: currentRun.symbol,
          timeframe: currentRun.timeframe,
          mode: currentRun.mode,
          lastTickTs: currentRun.lastTickTs,
          lastCandleTs: currentRun.lastCandleTs,
          lastLoopTs: currentRun.lastLoopTs,
          lastDecisionTs: currentRun.lastDecisionTs,
          position: currentRun.position,
          pnl: currentRun.pnl,
          equity: currentRun.equity,
          loopIntervalMs: 5000,
          lastError: currentRun.lastError,
          marketdataCandleTs: currentRun.marketdataCandleTs,
          marketdataAgeSec: currentRun.marketdataAgeSec,
          loopLagMs: currentRun.loopLagMs,
          degraded: currentRun.degraded,
          degradedReason: currentRun.degradedReason,
        });
      } else {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
      }
    }, 5000);

    return { ok: true, runId, startedAt: new Date(currentRun.startedAt).toISOString() };
  });

  // Stop runner
  app.post("/api/exec/stop", async (req: FastifyRequest<{ Body: { runId?: string } }>) => {
    if (!currentRun?.running) {
      return { ok: false, error: "No runner running" };
    }

    if (runnerInterval) {
      clearInterval(runnerInterval);
      runnerInterval = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    currentRun.running = false;
    emitEvent("log", { message: `Stopped ${currentRun.runId}` });
    emitEvent("status", {
      running: false,
      runId: currentRun.runId,
      strategyId: currentRun.strategyId,
      symbol: currentRun.symbol,
      timeframe: currentRun.timeframe,
      mode: currentRun.mode,
      lastTickTs: currentRun.lastTickTs,
      lastCandleTs: currentRun.lastCandleTs,
      lastLoopTs: currentRun.lastLoopTs,
      lastDecisionTs: currentRun.lastDecisionTs,
      position: currentRun.position,
      pnl: currentRun.pnl,
      equity: currentRun.equity,
      loopIntervalMs: 5000,
      lastError: currentRun.lastError,
      marketdataCandleTs: currentRun.marketdataCandleTs,
      marketdataAgeSec: currentRun.marketdataAgeSec,
      loopLagMs: currentRun.loopLagMs,
      degraded: currentRun.degraded,
      degradedReason: currentRun.degradedReason,
    });

    const stoppedAt = Date.now();
    currentRun = null;

    return { ok: true, stoppedAt: new Date(stoppedAt).toISOString() };
  });

  // Get status
  app.get("/api/exec/status", async () => {
    const buildInfo = {
      pid: process.pid,
      startedAt: new Date(Date.now() - (process.uptime() * 1000)).toISOString(),
      version: "1.0.0", // From package.json
    };

    if (!currentRun) {
      return {
        running: false,
        build: buildInfo,
      };
    }

    return {
      running: currentRun.running,
      runId: currentRun.runId,
      strategyId: currentRun.strategyId,
      symbol: currentRun.symbol,
      timeframe: currentRun.timeframe,
      mode: currentRun.mode,
      lastTickTs: currentRun.lastTickTs,
      lastCandleTs: currentRun.lastCandleTs,
      lastLoopTs: currentRun.lastLoopTs,
      lastDecisionTs: currentRun.lastDecisionTs,
      lastSignal: currentRun.lastSignal,
      pnl: currentRun.pnl,
      position: currentRun.position,
      equity: currentRun.equity,
      loopIntervalMs: 5000,
      lastError: currentRun.lastError,
      // Freshness metrics
      marketdataCandleTs: currentRun.marketdataCandleTs,
      marketdataAgeSec: currentRun.marketdataAgeSec,
      loopLagMs: currentRun.loopLagMs,
      // Degraded state
      degraded: currentRun.degraded,
      degradedReason: currentRun.degradedReason,
      build: buildInfo,
    };
  });

  // SSE events stream
  app.get("/api/exec/events", async (req: FastifyRequest, reply: FastifyReply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    reply.raw.setHeader("Access-Control-Allow-Methods", "GET");

    // Send last 50 events to new client
    const last50 = eventBuffer.slice(-50);
    for (const event of last50) {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    // Keep connection alive and send new events
    const sendEvent = (event: { v: number; seq: number; ts: number; type: string; data: any }) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        // Client disconnected
        return false;
      }
      return true;
    };

    // Listen for new events (simple: check buffer every second)
    const checkInterval = setInterval(() => {
      const newEvents = eventBuffer.filter(e => e.seq > (last50[last50.length - 1]?.seq || -1));
      for (const event of newEvents) {
        if (!sendEvent(event)) {
          clearInterval(checkInterval);
          return;
        }
      }
    }, 1000);

    req.raw.on("close", () => {
      clearInterval(checkInterval);
    });
  });
}
