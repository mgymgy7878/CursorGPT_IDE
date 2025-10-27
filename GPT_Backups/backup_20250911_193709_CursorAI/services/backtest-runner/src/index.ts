import express from "express";
import { register, Counter, Histogram, Gauge } from "prom-client";
import { BacktestSimulator, BacktestConfig, Order } from "@spark/backtest-core";
import { Bar, toEpochMs, isBar } from "@spark/types";
import { SyntheticDataSource } from "@spark/data-pipeline";
import { generateJSONReport, generateCSVReport, generateSimpleEquityReport } from "@spark/backtest-report";

const app = express();
app.use(express.json());

// Prometheus metrics
const backtestJobsTotal = new Counter({
  name: 'backtest_jobs_total',
  help: 'Total number of backtest jobs',
  labelNames: ['status']
});

const backtestRuntimeMs = new Histogram({
  name: 'backtest_runtime_ms',
  help: 'Backtest runtime in milliseconds',
  buckets: [100, 500, 1000, 5000, 10000, 30000, 60000]
});

const backtestFailuresTotal = new Counter({
  name: 'backtest_failures_total',
  help: 'Total number of backtest failures'
});

const guardrailBlocksTotal = new Counter({
  name: 'guardrail_blocks_total_backtest',
  help: 'Guardrail blocks during backtest',
  labelNames: ['reason']
});

// Job storage
const jobs = new Map<string, any>();

// Simple MA Crossover strategy
function generateMACrossoverOrders(bars: Bar[], shortWindow = 12, longWindow = 26): Order[] {
  const orders: Order[] = [];
  
  for (let i = longWindow; i < bars.length; i++) {
    const shortMA = bars.slice(i - shortWindow + 1, i + 1).reduce((sum, bar) => sum + bar.close, 0) / shortWindow;
    const longMA = bars.slice(i - longWindow + 1, i + 1).reduce((sum, bar) => sum + bar.close, 0) / longWindow;
    
    const prevShortMA = bars.slice(i - shortWindow, i).reduce((sum, bar) => sum + bar.close, 0) / shortWindow;
    const prevLongMA = bars.slice(i - longWindow, i).reduce((sum, bar) => sum + bar.close, 0) / longWindow;
    
    // Golden cross (short MA crosses above long MA)
    if (shortMA > longMA && prevShortMA <= prevLongMA) {
      const b = bars[i]!;
      orders.push({
        id: `order_${i}_buy`,
        symbol: 'BTCUSDT', // Default symbol
        side: 'BUY',
        type: 'MARKET',
        quantity: 0.1, // Fixed position size
        timestamp: b.time
      });
    }
    
    // Death cross (short MA crosses below long MA)
    if (shortMA < longMA && prevShortMA >= prevLongMA) {
      const b = bars[i]!;
      orders.push({
        id: `order_${i}_sell`,
        symbol: 'BTCUSDT', // Default symbol
        side: 'SELL',
        type: 'MARKET',
        quantity: 0.1, // Fixed position size
        timestamp: b.time
      });
    }
  }
  
  return orders;
}

export function normalizeBar(raw: any): Bar {
  return {
    time: toEpochMs(raw.time ?? raw.t ?? raw.timestamp),
    open: Number(raw.open ?? raw.o),
    high: Number(raw.high ?? raw.h),
    low: Number(raw.low ?? raw.l),
    close: Number(raw.close ?? raw.c),
    volume: raw.volume != null ? Number(raw.volume) : undefined,
  };
}

// Convert Bar to backtest-core compatible format
function convertBarToBacktestCore(bar: Bar): any {
  return {
    time: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
    timestamp: bar.time, // Add timestamp for compatibility
    symbol: 'BTCUSDT' // Add symbol for compatibility
  };
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Start backtest
app.post('/start', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', initialCash = 10000, seed = 42 } = req.body;
    
    const jobId = `bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate synthetic data
    const dataSource = new SyntheticDataSource();
    const rawBars = await dataSource.generateData("BTCUSDT" as any, 50000);
    
    // Convert to Bar format with normalization
    const bars: Bar[] = (rawBars ?? []).map(normalizeBar).filter(isBar);
    
    // Guard: check if we have valid bars
    if (!bars.length) {
      return res.status(400).json({ error: "No valid bars generated" });
    }
    
    // Generate orders
    const orders = generateMACrossoverOrders(bars);
    
    // Create backtest config
    const config: BacktestConfig = {
      initialCash,
      feeConfig: {
        feeRate: 0.001, // 0.1%
        slippageBps: 1, // 1 basis point
        latencyMs: 50
      },
      startTime: bars[0]!.time,
      endTime: bars[bars.length - 1]!.time,
      seed
    };
    
    // Run backtest
    const simulator = new BacktestSimulator(config);
    
    // Combine bars and orders into events
    const events: Array<{bar?: any, order?: Order}> = [];
    
    // Add bars
    for (const bar of bars) {
      events.push({ bar: convertBarToBacktestCore(bar) });
    }
    
    // Add orders
    for (const order of orders) {
      events.push({ order });
    }
    
    // Sort by timestamp
    events.sort((a, b) => {
      const timeA = a.bar?.time || a.order?.timestamp || 0;
      const timeB = b.bar?.time || b.order?.timestamp || 0;
      return timeA - timeB;
    });
    
    const startTime = Date.now();
    const result = simulator.run(events);
    const runtimeMs = Date.now() - startTime;
    
    // Store job result
    jobs.set(jobId, {
      id: jobId,
      status: 'completed',
      result,
      runtimeMs,
      createdAt: new Date().toISOString()
    });
    
    // Update metrics
    backtestJobsTotal.inc({ status: 'completed' });
    backtestRuntimeMs.observe(runtimeMs);
    
    res.json({
      jobId,
      status: 'completed',
      runtimeMs,
      summary: {
        totalBars: bars.length,
        totalTrades: result.fills.length,
        totalReturn: result.metrics.totalReturn,
        sharpeRatio: result.metrics.sharpeRatio,
        maxDrawdown: result.metrics.maxDrawdown,
        guardrailBlocks: result.guardrailBlocks
      }
    });
    
  } catch (error) {
    console.error('Backtest error:', error);
    backtestJobsTotal.inc({ status: 'failed' });
    backtestFailuresTotal.inc();
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Start multi-scenario backtest
app.post('/start-matrix', async (req, res) => {
  try {
    const { 
      symbol = 'BTCUSDT', 
      initialCash = 10000, 
      scenarios = [
        { shortWindow: 12, longWindow: 26, stopLoss: 0.02, takeProfit: 0.04, feeRate: 0.001, slippageBps: 1, latencyMs: 50 }
      ]
    } = req.body;
    
    const matrixId = `matrix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate synthetic data for matrix
    const dataSource = new SyntheticDataSource();
    const rawBars = await dataSource.generateData("BTCUSDT" as any, 50000);
    
    // Convert to Bar format with normalization
    const bars: Bar[] = (rawBars ?? []).map(normalizeBar).filter(isBar);
    
    // Guard: check if we have valid bars
    if (!bars.length) {
      return res.status(400).json({ error: "No valid bars generated for matrix" });
    }
    
    const results: any[] = [];
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      
      // Generate orders for this scenario
      const orders = generateMACrossoverOrders(bars, scenario.shortWindow, scenario.longWindow);
      
      // Create backtest config
      const config: BacktestConfig = {
        initialCash,
        feeConfig: {
          feeRate: scenario.feeRate,
          slippageBps: scenario.slippageBps,
          latencyMs: scenario.latencyMs
        },
        startTime: bars[0]!.time,
        endTime: bars[bars.length - 1]!.time,
        seed: 42 + i
      };
      
      // Run backtest
      const simulator = new BacktestSimulator(config);
      
      // Combine bars and orders into events
      const events: Array<{bar?: any, order?: Order}> = [];
      
      // Add bars
      for (const bar of bars) {
        events.push({ bar: convertBarToBacktestCore(bar) });
      }
      
      // Add orders
      for (const order of orders) {
        events.push({ order });
      }
      
      events.sort((a, b) => {
        const timeA = a.bar?.time || a.order?.timestamp || 0;
        const timeB = b.bar?.time || b.order?.timestamp || 0;
        return timeA - timeB;
      });
      
      const startTime = Date.now();
      const result = simulator.run(events);
      const runtimeMs = Date.now() - startTime;
      
      results.push({
        scenarioId: i,
        scenario,
        result,
        runtimeMs
      });
      
      // Update metrics
      backtestJobsTotal.inc({ status: 'completed' });
      backtestRuntimeMs.observe(runtimeMs);
    }
    
    // Generate leaderboard
    const leaderboard = results.map((r, i) => ({
      rank: i + 1,
      scenarioId: r.scenarioId,
      shortWindow: r.scenario.shortWindow,
      longWindow: r.scenario.longWindow,
      stopLoss: r.scenario.stopLoss,
      takeProfit: r.scenario.takeProfit,
      totalReturn: r.result.metrics.totalReturn,
      sharpeRatio: r.result.metrics.sharpeRatio,
      maxDrawdown: r.result.metrics.maxDrawdown,
      winRate: r.result.metrics.winRate,
      totalTrades: r.result.fills.length,
      runtimeMs: r.runtimeMs
    })).sort((a, b) => b.sharpeRatio - a.sharpeRatio);
    
    // Find best scenario
    const bestScenario = leaderboard[0]!;
    const bestResult = results.find(r => r.scenarioId === bestScenario.scenarioId)!;
    
    // Store matrix results
    jobs.set(matrixId, {
      id: matrixId,
      status: 'completed',
      results,
      leaderboard,
      bestScenario,
      bestResult,
      createdAt: new Date().toISOString()
    });
    
    res.json({
      matrixId,
      status: 'completed',
      totalScenarios: scenarios.length,
      leaderboard,
      bestScenario: {
        scenarioId: bestScenario.scenarioId,
        totalReturn: bestScenario.totalReturn,
        sharpeRatio: bestScenario.sharpeRatio,
        maxDrawdown: bestScenario.maxDrawdown,
        winRate: bestScenario.winRate
      }
    });
    
  } catch (error) {
    console.error('Matrix backtest error:', error);
    backtestJobsTotal.inc({ status: 'failed' });
    backtestFailuresTotal.inc();
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Get job status
app.get('/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    id: job.id,
    status: job.status,
    runtimeMs: job.runtimeMs,
    createdAt: job.createdAt
  });
});

// Get job result
app.get('/result/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job not completed' });
  }
  
  const format = (req.query.format as string) || 'json';
  
  switch (format) {
    case 'json':
      const jsonReport = generateJSONReport(job.result, 'MA Crossover Backtest');
      res.json(jsonReport);
      break;
      
    case 'csv':
      const csvReport = generateCSVReport(job.result);
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename="backtest_${job.id}.csv"`);
      res.send(csvReport);
      break;
      
    case 'equity':
      const equityReport = generateSimpleEquityReport(job.result);
      res.set('Content-Type', 'text/plain');
      res.send(equityReport);
      break;
      
    default:
      res.status(400).json({ error: 'Invalid format' });
  }
});

const PORT = process.env.PORT || 4501;

app.listen(PORT, () => {
  console.log(`Backtest engine listening on port ${PORT}`);
}); 