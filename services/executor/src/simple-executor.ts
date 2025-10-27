// services/executor/src/simple-executor.ts
// Minimal executor for canary dry-run - no complex dependencies

import Fastify from 'fastify';

const app = Fastify({ 
  logger: {
    level: 'info'
  }
});

// Health endpoint
app.get('/health', async (_request, reply) => {
  return reply.send({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: 'v1.5-canary'
  });
});

// Metrics endpoint (mock)
app.get('/metrics', async (_request, reply) => {
  const mockMetrics = `# HELP spark_backtest_latency_ms Backtest execution latency
# TYPE spark_backtest_latency_ms histogram
spark_backtest_latency_ms_bucket{le="1000"} 45
spark_backtest_latency_ms_bucket{le="5000"} 89
spark_backtest_latency_ms_bucket{le="8000"} 95
spark_backtest_latency_ms_bucket{le="+Inf"} 100
spark_backtest_latency_ms_sum 284500
spark_backtest_latency_ms_count 100

# HELP spark_backtest_cache_hit_total Cache hits
# TYPE spark_backtest_cache_hit_total counter
spark_backtest_cache_hit_total 75

# HELP spark_backtest_cache_miss_total Cache misses
# TYPE spark_backtest_cache_miss_total counter
spark_backtest_cache_miss_total 25

# HELP spark_backtest_opt_latency_ms Optimizer latency
# TYPE spark_backtest_opt_latency_ms histogram
spark_backtest_opt_latency_ms_bucket{le="10000"} 12
spark_backtest_opt_latency_ms_bucket{le="20000"} 18
spark_backtest_opt_latency_ms_bucket{le="30000"} 20
spark_backtest_opt_latency_ms_bucket{le="+Inf"} 20
spark_backtest_opt_latency_ms_sum 480000
spark_backtest_opt_latency_ms_count 20

# HELP spark_backtest_overfitting_detected_total Overfitting detections
# TYPE spark_backtest_overfitting_detected_total counter
spark_backtest_overfitting_detected_total 2
`;

  return reply.type('text/plain').send(mockMetrics);
});

// Simple backtest endpoint
app.post('/backtest/run', async (req, reply) => {
  try {
    const body = req.body as any || {};
    const { symbol = 'BTCUSDT', timeframe = '1h', start = '2024-01-01', end = '2024-01-07' } = body;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    const result = {
      symbol,
      timeframe,
      start,
      end,
      trades: Math.floor(Math.random() * 50) + 10,
      winrate: 0.45 + Math.random() * 0.3,
      pnl: (Math.random() - 0.3) * 5000,
      sharpe: 0.5 + Math.random() * 2,
      maxdd: Math.random() * 20,
      equity: [],
      timestamps: [],
      duration: Date.now()
    };
    
    return reply.send({ ok: true, result });
  } catch (err: any) {
    return reply.code(500).send({ ok: false, error: err.message });
  }
});

// Cache stats endpoint
app.get('/backtest/cache/stats', async (_req, reply) => {
  return reply.send({
    ok: true,
    stats: {
      totalCandles: Math.floor(Math.random() * 10000) + 5000,
      exchanges: 2,
      symbols: 15,
      cacheHitRate: 0.75 + Math.random() * 0.2,
      lastCleanup: new Date().toISOString()
    }
  });
});

// Cache cleanup endpoint
app.post('/backtest/cache/cleanup', async (_req, reply) => {
  return reply.send({
    ok: true,
    message: 'Cache cleanup completed',
    cleaned: Math.floor(Math.random() * 1000) + 500
  });
});

// Optimizer endpoint
app.post('/backtest/optimize', async (req, reply) => {
  try {
    const body = req.body as any || {};
    const { grid, combinations = 180 } = body;
    
    // Simulate optimization time based on combinations
    const estimatedTime = Math.min(combinations * 150, 25000); // 150ms per combo, max 25s
    await new Promise(resolve => setTimeout(resolve, Math.min(estimatedTime, 15000)));
    
    const result = {
      totalCombinations: combinations,
      bestScore: 0.8 + Math.random() * 0.4,
      bestParams: {
        emaFast: 12 + Math.floor(Math.random() * 10),
        emaSlow: 40 + Math.floor(Math.random() * 20),
        atr: 10 + Math.floor(Math.random() * 8)
      },
      timing: {
        avgPerRun: 150 + Math.random() * 50,
        totalTime: estimatedTime
      }
    };
    
    return reply.send({ ok: true, result });
  } catch (err: any) {
    return reply.code(500).send({ ok: false, error: err.message });
  }
});

// Portfolio endpoint
app.post('/backtest/portfolio', async (req, reply) => {
  try {
    const body = req.body as any || {};
    const { symbols = ['BTCUSDT', 'ETHUSDT'], weights = [0.6, 0.4] } = body;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
    
    const result = {
      symbols,
      weights,
      totalReturn: (Math.random() - 0.1) * 0.2,
      portfolioSharpe: 0.8 + Math.random() * 1.2,
      maxDrawdown: Math.random() * 12,
      diversificationBenefit: Math.random() * 0.15,
      individualReturns: symbols.map(() => (Math.random() - 0.1) * 0.25)
    };
    
    return reply.send({ ok: true, result });
  } catch (err: any) {
    return reply.code(500).send({ ok: false, error: err.message });
  }
});

// Walk-forward endpoint
app.post('/backtest/walkforward', async (req, reply) => {
  try {
    const body = req.body as any || {};
    const { symbol = 'BTCUSDT', timeframe = '1h', trainPeriod = 30, testPeriod = 7 } = body;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 4000 + 2000));
    
    const result = {
      symbol,
      timeframe,
      trainPeriod,
      testPeriod,
      totalPeriods: Math.floor(Math.random() * 20) + 10,
      avgReturn: (Math.random() - 0.2) * 0.1,
      avgSharpe: 0.5 + Math.random() * 1.5,
      maxDrawdown: Math.random() * 15,
      overfittingScore: Math.random() * 0.8
    };
    
    return reply.send({ ok: true, result });
  } catch (err: any) {
    return reply.code(500).send({ ok: false, error: err.message });
  }
});

// Start server
async function start() {
  try {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
    const HOST = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Simple executor listening on http://${HOST}:${PORT}`);
    app.log.info('Available endpoints:');
    app.log.info('  GET  /health');
    app.log.info('  GET  /metrics');
    app.log.info('  POST /backtest/run');
    app.log.info('  POST /backtest/optimize');
    app.log.info('  POST /backtest/portfolio');
    app.log.info('  POST /backtest/walkforward');
    app.log.info('  GET  /backtest/cache/stats');
    app.log.info('  POST /backtest/cache/cleanup');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
