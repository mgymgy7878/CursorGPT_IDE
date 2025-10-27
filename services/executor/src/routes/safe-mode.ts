import type { FastifyInstance } from 'fastify';

// V1.6 Hybrid Mode: Conditionally register mock routes based on REAL_ROUTES env
const REAL = (process.env.REAL_ROUTES || '');
const allow = (key: string) => !REAL.split(',').map(s => s.trim()).includes(key);

export async function registerSafeMode(app: FastifyInstance) {
  const mode = REAL ? `hybrid (real: ${REAL})` : 'full-mock';
  
  // Health & metrics ALWAYS available
  app.get('/health', async () => ({ 
    ok: true, 
    service: 'executor', 
    ts: Date.now(),
    mode,
    version: 'v1.6-hybrid'
  }));

  app.get('/metrics', async () =>
`# HELP spark metrics (v1.6 hybrid mode)
# TYPE spark_backtest_cache_hit_total counter
spark_backtest_cache_hit_total 180
# TYPE spark_backtest_cache_miss_total counter
spark_backtest_cache_miss_total 1
# TYPE spark_backtest_overfitting_detected_total counter
spark_backtest_overfitting_detected_total 0
# TYPE spark_backtest_opt_latency_ms_sum gauge
spark_backtest_opt_latency_ms_sum 25000
# TYPE spark_backtest_portfolio_diversification_benefit gauge
spark_backtest_portfolio_diversification_benefit 0.26
`);

  // Mock POST routes - only if NOT in REAL_ROUTES
  if (allow('run')) {
    app.post('/backtest/run', async (_req, reply) => 
      reply.send({ 
        ok: true, 
        mock: true,
        result: { 
          pnl: 1234, 
          trades: 42, 
          sharpe: 1.6,
          winrate: 0.62,
          maxdd: 8.5 
        } 
      })
    );
  }

  if (allow('walkforward')) {
    app.post('/backtest/walkforward', async (_req, reply) => 
      reply.send({ 
        ok: true,
        mock: true,
        result: { 
          overfitting: { 
            detected: false, 
            ratio: 0.85, 
            threshold: Number(process.env.WFO_THRESHOLD || 0.6) 
          }, 
          summary: { 
            train: { sharpe: 1.8 }, 
            test: { sharpe: 1.5 } 
          } 
        } 
      })
    );
  }

  if (allow('portfolio')) {
    app.post('/backtest/portfolio', async (_req, reply) => 
      reply.send({ 
        ok: true,
        mock: true,
        result: { 
          combined: { sharpe: 1.82, winRate: 0.61, pnl: 1850 },
          correlation: { 
            matrix: [[1, 0.85, 0.72], [0.85, 1, 0.68], [0.72, 0.68, 1]], 
            avgCorrelation: 0.75, 
            diversificationBenefit: 0.26 
          } 
        } 
      })
    );
  }

  if (allow('optimize')) {
    app.post('/backtest/optimize', async (_req, reply) => 
      reply.send({ 
        ok: true,
        mock: true,
        bestParams: { emaFast: 20, emaSlow: 50, atr: 14 }, 
        bestScore: 1.92,
        totalCombinations: 180, 
        timing: { totalMs: 25000, avgPerRun: 139 } 
      })
    );
  }

  // Cache endpoints (always mock in hybrid mode)
  app.get('/backtest/cache/stats', async (_req, reply) => 
    reply.send({ 
      ok: true, 
      stats: { 
        totalCandles: 8500, 
        exchanges: 2, 
        symbols: 15, 
        cacheHitRate: 0.86 
      } 
    })
  );

  app.post('/backtest/cache/cleanup', async (_req, reply) => 
    reply.send({ 
      ok: true, 
      message: 'Cache cleanup completed (hybrid mode)', 
      cleaned: 750 
    })
  );
}
