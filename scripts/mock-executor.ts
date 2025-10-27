// scripts/mock-executor.ts
import Fastify from 'fastify';

const app = Fastify({ logger: true });
const PORT = 4001;

// Health endpoint
app.get('/health', async () => ({ 
  ok: true, 
  service: 'mock-executor', 
  ts: Date.now(),
  version: 'v1.5-canary-mock'
}));

// Metrics endpoint (mock Prometheus format)
app.get('/metrics', async () => (
`# HELP spark_backtest_latency_ms Backtest execution latency
# TYPE spark_backtest_latency_ms histogram
spark_backtest_latency_ms_bucket{le="1000"} 45
spark_backtest_latency_ms_bucket{le="5000"} 89
spark_backtest_latency_ms_bucket{le="8000"} 95
spark_backtest_latency_ms_bucket{le="+Inf"} 100
spark_backtest_latency_ms_sum 284500
spark_backtest_latency_ms_count 100

# HELP spark_backtest_cache_hit_total Cache hits
# TYPE spark_backtest_cache_hit_total counter
spark_backtest_cache_hit_total 180

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

# HELP spark_backtest_portfolio_diversification_benefit Portfolio diversification benefit
# TYPE spark_backtest_portfolio_diversification_benefit gauge
spark_backtest_portfolio_diversification_benefit 0.26
`));

// Simple backtest endpoint
app.post('/backtest/run', async (req, reply) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  
  return reply.send({ 
    ok: true, 
    result: { 
      pnl: 1234, 
      trades: 42, 
      sharpe: 1.6,
      winrate: 0.62,
      maxdd: 8.5,
      duration: Date.now()
    } 
  });
});

// Walk-forward backtest endpoint
app.post('/backtest/walkforward', async (req, reply) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
  
  return reply.send({ 
    ok: true, 
    result: { 
      overfitting: { 
        detected: false, 
        ratio: 0.85, 
        threshold: 0.6 
      },
      summary: { 
        train: { sharpe: 1.8 }, 
        test: { sharpe: 1.5 } 
      },
      totalPeriods: 15,
      avgReturn: 0.12
    } 
  });
});

// Portfolio backtest endpoint
app.post('/backtest/portfolio', async (req, reply) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2500 + 1500));
  
  return reply.send({ 
    ok: true, 
    result: {
      combined: { sharpe: 1.82, winRate: 0.61, pnl: 1850 },
      correlation: { 
        matrix: [[1,0.85,0.72],[0.85,1,0.68],[0.72,0.68,1]], 
        avgCorrelation: 0.75, 
        diversificationBenefit: 0.26 
      },
      symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
      weights: [0.5, 0.3, 0.2]
    }
  });
});

// Optimizer endpoint
app.post('/backtest/optimize', async (req, reply) => {
  const body = req.body as any || {};
  const combinations = body.grid ? 
    (body.grid.emaFast?.length || 5) * (body.grid.emaSlow?.length || 4) * (body.grid.atr?.length || 3) : 
    180;
  
  // Simulate optimization time based on combinations
  const estimatedTime = Math.min(combinations * 150, 25000);
  await new Promise(resolve => setTimeout(resolve, Math.min(estimatedTime, 15000)));
  
  return reply.send({ 
    ok: true, 
    bestParams: { emaFast: 20, emaSlow: 50, atr: 14 }, 
    bestScore: 1.92,
    totalCombinations: combinations, 
    timing: { 
      totalMs: estimatedTime, 
      avgPerRun: Math.round(estimatedTime / combinations) 
    }
  });
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

// Start server
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`🚀 Mock executor up on :${PORT}`);
    app.log.info('Available endpoints:');
    app.log.info('  GET  /health');
    app.log.info('  GET  /metrics');
    app.log.info('  POST /backtest/run');
    app.log.info('  POST /backtest/optimize');
    app.log.info('  POST /backtest/portfolio');
    app.log.info('  POST /backtest/walkforward');
    app.log.info('  GET  /backtest/cache/stats');
    app.log.info('  POST /backtest/cache/cleanup');
  })
  .catch((e) => { 
    app.log.error(e); 
    process.exit(1); 
  });
