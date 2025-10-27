// services/executor/src/routes/backtest-simple.ts
// V1.6 Phase 4b - Real backtest route with cache-first + metrics
import type { FastifyInstance } from 'fastify';

export async function registerBacktestSimple(app: FastifyInstance, opts?: { override?: boolean }) {
  console.log('[ROUTE] backtest-simple.ts loaded (REAL route with cache + metrics)');
  
  app.post('/backtest/run', async (req, reply) => {
    const started = Date.now();
    try {
      // body parse
      const body = typeof req.body === 'string' ? JSON.parse(req.body as string) : (req.body as any || {});
      const {
        symbol = 'BTCUSDT',
        timeframe = '1h',
        start,
        end,
        exchange = 'binance',
        useCache = true,
        config = {}
      } = body;

      if (!start || !end) {
        return reply.code(400).send({ ok:false, code:'BAD_RANGE', msg:'start/end required' });
      }

      console.log('[REAL] /backtest/run:', { symbol, timeframe, start, end, exchange, useCache });

      // Lazy imports (avoid bootstrap cost)
      const [{ BacktestCache }, { runBacktest: runBT }, { loadBinanceHistory }] = await Promise.all([
        import('../../../analytics/src/backtest/cache.js'),
        import('../../../analytics/src/backtest/engine.js'),
        import('../../../marketdata/src/history/binance.js')
      ]);

      // Cache-first bar load
      const cache = new BacktestCache();
      await cache.openOrCreate();
      const since = Date.parse(start);
      const until = Date.parse(end);

      // fetchFn: fallback to remote loader when cache miss
      const fetchFn = async (_sym: string, _tf: string, _since: number, _until: number) => {
        return await loadBinanceHistory(_sym, _tf, _since, _until);
      };

      const candles = await cache.loadOrFetch(exchange, symbol, timeframe, since, until, fetchFn);

      // Build config for engine
      const cfg = (config as any).symbol ? config : { 
        symbol, 
        timeframe,
        indicators:{ emaFast:20, emaSlow:50, atr:14 }, 
        entry:{ type:"crossUp" as const, fast:"EMA" as const, slow:"EMA" as const }, 
        exit:{ atrMult:2, takeProfitRR:1.5 }, 
        feesBps:5, 
        slippageBps:1 
      };

      // Run engine on loaded candles (map Candle → Bar format)
      const bars = candles.map(c => ({ t:c.ts, o:c.open, h:c.high, l:c.low, c:c.close, v:c.volume }));
      const result = runBT(bars, cfg);

      console.log('[REAL] /backtest/run completed:', { bars:bars.length, trades:result.trades, duration:Date.now()-started });

      // Metrics (lazy)
      try {
        const m = await import('./util/run-metrics.js').catch(()=>null);
        if (m?.runLatency) m.runLatency.observe(Date.now() - started);
        if (m?.runJobsTotal) m.runJobsTotal.inc({ exchange, timeframe });
      } catch {}

      return reply.send({ ok:true, mock:false, realEngine:true, symbol, timeframe, n:bars.length, result });
    } catch (e:any) {
      console.error('[REAL] /backtest/run error:', e);
      try {
        const m = await import('./util/run-metrics.js').catch(()=>null);
        if (m?.runErrorsTotal) m.runErrorsTotal.inc();
      } catch {}
      return reply.code(500).send({ ok:false, code:'RUN_ENGINE_ERROR', msg:String(e?.message||e) });
    }
  });
}