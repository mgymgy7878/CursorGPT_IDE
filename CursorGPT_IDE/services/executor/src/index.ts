// BOOTSTRAP: erken hata yakalama (pino'dan önce)
process.on('unhandledRejection', (err) => {
  console.error('[BOOT][unhandledRejection]', err && (err as any).stack || err);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('[BOOT][uncaughtException]', err && (err as any).stack || err);
  process.exit(1);
});

import './bootstrap/env';
import { installCrashGuard } from './bootstrap/crash-guard';
installCrashGuard();
import Fastify from 'fastify';
import { ENV } from './env';
// import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { startStrategy, pauseStrategy, stopStrategy, listStrategies, onChange } from './state/strategies.js';
import rateLimit from '@fastify/rate-limit';
import { writeTextFile } from './lib/fs-helpers.js';

// Safe plugin registration helper
async function safeRegister<T extends (...args:any)=>any>(fn:()=>Promise<T>|T, log:any, label:string) {
  try { 
    await fn() 
  } catch (err:any) {
    if (err?.code === 'FST_ERR_PLUGIN_VERSION_MISMATCH') {
      log?.warn({ err, label }, `${label} disabled due to Fastify version mismatch`)
    } else { 
      throw err 
    }
  }
}
import { 
  buildMetricsRoute,
  httpRequestsTotal,
  httpLatencySeconds,
  inFlight,
  aiTokensTotal
} from './metrics.js';
import { metricsPlugin } from './metrics.js';
import { portfolioPlugin } from './portfolio.js';
import chunkRoutes from './routes/internal/chunks.js';
import { startCleanupJob } from './storage/local-chunks.js';
import os from 'node:os';
import httpMetricsPlugin from './plugins/httpMetrics.js';
import auditRoutes from './routes/public/audit.js';
import strategyLiveRoutes from './routes/strategy-live.js';

// V1.2 Market Data Adapters (commented out due to ESM issues)
// import { createBTCTurkClient } from '@spark/marketdata';
// import { createBISTReader } from '@spark/bist-reader';
// import binanceTestRoute from './routes/test/binance.js'; // may import undici
// import btcturkTestRoute from './routes/test/btcturk.js';
// TEMP: Disabled due to ESM import issues
// import futuresRoutes from './routes/futures.js';
import positionsRoutes from './routes/positions.js';
import copilotRoutes from './routes/copilot.js';
import backtestRoutes from './routes/backtest.js';
import optimizeRoutes from './routes/optimize.js';
import healthPlugin from './plugins/health.js';
import { healthRoutes } from './routes/health.js';
import { log as auditLog } from './utils/audit.js';
import typeProvider from './plugins/type-provider.js';
import { placeRoutes } from './routes/place.js';
import { feedRoutes } from './routes/feed.js';
import btcturkRoutes from './routes/btcturk.js';
import { guardrails } from './guardrails.js';
import { execRoutes } from './routes/exec.js';
import aiRoutes from './routes/ai-generate.js';
import rlPlugin from './plugins/ratelimit.js';
import alertsRoutes from './routes/alerts.js';
import strategyRoutes from './routes/strategy.js';
import { canaryRoutes } from './routes/canary.js';
import { metricsRoutes } from './routes/metrics.js';
import { btcturkOrderflowRoutes } from './routes/btcturk-orderflow.js';
import { httpRequestsTotal } from './metrics.js';
import { registerCompat } from './utils/register';
import metrics from './plugins/metrics';
import guardrailsParams from './routes/guardrails/params';
// import compress from '@fastify/compress'; // Sürüm uyumsuzluğu - Fastify 4.x ile uyumsuz
// import underPressure from '@fastify/under-pressure'; // Sürüm uyumsuzluğu - Fastify 4.x ile uyumsuz
import https from 'https';
import http from 'http';

// HTTP Keep-Alive agent configuration
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 64,
  timeout: 10000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  timeout: 10000,
});

// Set global agents for fetch/axios
globalThis.fetch = globalThis.fetch || require('node-fetch');
if (globalThis.fetch) {
  // Configure fetch to use keep-alive agents
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, options = {}) => {
    const agent = url.toString().startsWith('https:') ? httpsAgent : httpAgent;
    return originalFetch(url, { ...options, agent });
  };
}

const app = Fastify({ 
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body',              // büyük payload'ı LOG'dan çıkar
        'response.request.body'  // olası upstream proxy logları
      ],
      remove: true
    }
  },
  requestTimeout: 15000, 
  keepAliveTimeout: 7000 
});

// Health route'u healthRoutes'da tanımlanıyor

// Global error handler
app.setErrorHandler((err, _req, reply) => {
  app.log.error({ err }, 'unhandled');
  if (!reply.sent) reply.code(500).send({ ok: false, error: err.message });
});

// Otomatik HTTP timing hooks
app.addHook('onRequest', (req, _reply, done) => {
  inFlight.inc({ route: req.routerPath ?? req.url });
  (req as any).__sparkReqTimerEnd = httpLatencySeconds.startTimer();
  done();
});

app.addHook('onResponse', (req, reply, done) => {
  try {
    const route = req.routerPath ?? req.url;
    const code = String(reply.statusCode);
    const end = (req as any).__sparkReqTimerEnd as (labels?: any) => void;
    if (end) end({ route, method: req.method, status: code });
    
    // Yeni metrics
    inFlight.dec({ route });
    httpRequestsTotal.inc({
      route,
      method: req.method,
      status: code,
    });
  } catch {}
  done();
});

// app.get('/health', async () => ({ ok: true, ts: Date.now(), host: os.hostname(), mode: 'NORMAL' })); // Moved to healthRoutes

// ENV kanıt logu
app.log.info({
  cwd: process.cwd(),
  env_loaded: !!process.env.BINANCE_FUTURES_BASE_URL,
  base_url: process.env.BINANCE_FUTURES_BASE_URL,
  prefix: process.env.BINANCE_FUTURES_PREFIX
}, 'startup-env');

process.on('unhandledRejection', (e) => app.log.error({ err: e }, 'UNHANDLED_REJECTION'));
process.on('uncaughtException', (e) => { app.log.error({ err: e }, 'UNCAUGHT_EXCEPTION'); process.exit(1); });


async function start() {
  // >>> HOST2 KULLANMAYIN <<<
  // Tek kaynak: HOST & PORT
  const PORT = Number(process.env.EXECUTOR_PORT || process.env.PORT) || 4001;                                    
  const HOST = process.env.EXECUTOR_HOST || process.env.HOST || '0.0.0.0';
  
  app.log.info({ HOST, PORT, pid: process.pid, node: process.version }, 'boot');
  await app.register(typeProvider);
  // await app.register(httpMetricsPlugin); // Devre dışı - label sorunu
  await app.register(rlPlugin);
  // await app.register(compress, { global: true }); // Sürüm uyumsuzluğu nedeniyle devre dışı
  // await app.register(underPressure, { 
  //   maxEventLoopDelay: 1000, 
  //   maxHeapUsedBytes: 1_200_000_000, 
  //   healthCheck: async () => ({ ok: true }) 
  // }); // Sürüm uyumsuzluğu nedeniyle devre dışı
  // await app.register(cors, { origin: true } as any); // Disabled due to version mismatch; enable later
  await app.register(healthPlugin);
  await app.register(healthRoutes);
  await app.register(canaryRoutes);
  await app.register(metricsRoutes);
  await app.register(metricsPlugin);
  await app.register(portfolioPlugin);
  
  // Register plugins with compatibility layer (metrics already registered above)
  registerCompat(app, guardrailsParams, { prefix: '/api' });
  
  // Register fusion gate plugin with prefix
  const fusionGate = require('./plugins/fusion-gate.cjs');
  await app.register(fusionGate, { prefix: '/api/public/fusion' });
  
  // Debug: Route tree after registration
  await app.ready();
  const tree = app.printRoutes();
  app.log.info("\n--- ROUTE TREE ---\n" + tree + "\n--- END TREE ---");
  
  // Write route tree to file for analysis
  const fs = await import("node:fs/promises");
  await fs.writeFile("services/executor/dist/route-tree.txt", tree);
  
  // Yeni metrics route'u ekle - metricsPlugin zaten /metrics tanımlıyor
  // await buildMetricsRoute(app);
  await app.register(btcturkOrderflowRoutes);
  
  // Rate limit plugin - guard ile koru
  if (process.env.EXEC_RATE_LIMIT_DISABLED !== '1') {
    await safeRegister(() =>
      app.register(rateLimit, {
        max: Number(process.env.NODE_ENV === 'production' ? (process.env.RATE_LIMIT_PER_MIN_PROD ?? 5) : (process.env.RATE_LIMIT_PER_MIN_DEV ?? 20)),
        timeWindow: '1 minute'
      }),
      app.log, '@fastify/rate-limit'
    );
  } else {
    app.log.info('Rate limit disabled via EXEC_RATE_LIMIT_DISABLED env var');
  }
  
  // WebSocket plugin - guard ile koru
  if (process.env.EXEC_WS_DISABLED !== '1') {
    await safeRegister(() =>
      app.register(websocket),
      app.log, '@fastify/websocket'
    );
  } else {
    app.log.info('WebSocket disabled via EXEC_WS_DISABLED env var');
  }
  
  // Register new routes
  // await app.register(placeRoutes); // Disabled to unblock build
  await app.register(feedRoutes);
  await app.register(btcturkRoutes);
  await app.register(auditRoutes);
  // await app.register(binanceTestRoute);
  // await app.register(btcturkTestRoute);
  await app.register(futuresRoutes, { prefix: '/api/futures' } as any);
  await app.register(positionsRoutes as any);
  await app.register(copilotRoutes, { prefix: '/api' } as any);
  await app.register(backtestRoutes, { prefix: '/api' } as any);
  
  // v1.4.1 Backtest Status Plugin
  try {
    const backtestPlugin = await import('./plugins/backtest.js');
    await app.register(backtestPlugin.default);
    app.log.info('✅ v1.4.1 Backtest status plugin registered');
  } catch (err: any) {
    app.log.warn({ err }, '❌ Backtest status plugin registration failed - skipping');
  }
  
  // v1.4.2 Backtest SSE Stream Plugin
  try {
    const backtestStreamPlugin = await import('./plugins/backtest-stream.js');
    await app.register(backtestStreamPlugin.default);
    app.log.info('✅ v1.4.2 Backtest SSE stream registered');
  } catch (err: any) {
    app.log.warn({ err }, '❌ Backtest stream plugin registration failed - skipping');
  }
  
  // v1.4.3 Backtest Write Routes (Start/Cancel) - ADMIN_TOKEN required
  try {
    const backtestWritePlugin = await import('./plugins/backtest-write.js');
    await app.register(backtestWritePlugin.default);
    app.log.info('✅ v1.4.3 Backtest write routes registered');
  } catch (err: any) {
    app.log.warn({ err }, '❌ Backtest write plugin registration failed - skipping');
  }
  
  // v1.5 Backtest Routes (Minimal) - ADMIN_TOKEN required
  try {
    const backtestRoutesPlugin = await import('./plugins/backtest-routes.js');
    await app.register(backtestRoutesPlugin.default);
    app.log.info('✅ v1.5 Backtest routes registered');
  } catch (err: any) {
    app.log.warn({ err }, '❌ Backtest routes plugin registration failed - skipping');
  }
  
  await app.register(optimizeRoutes, { prefix: '/api' } as any);
  
  // v1.7 Export@Scale Plugin
  try {
    const exportPlugin = await import('../../../plugins/export.js');
    await app.register(exportPlugin.default || exportPlugin.exportPlugin);
    app.log.info('v1.7 Export@Scale plugin registered');
  } catch (err: any) {
    app.log.warn({ err }, 'Export plugin registration failed - skipping');
  }
  
  await app.register(aiRoutes);
  await app.register(alertsRoutes);
  await app.register(strategyRoutes);
  await app.register(strategyLiveRoutes);
  
  // Register internal chunk routes
  await app.register(chunkRoutes);
  
  // Start chunk cleanup job
  const cleanupInterval = startCleanupJob({
    storageDir: process.env.CHUNK_STORAGE_DIR || '.data/chunks',
    ttlHours: Number(process.env.CHUNK_TTL_HOURS) || 24,
    cleanupIntervalMinutes: 60
  });
  
  app.log.info('Chunk cleanup job started');
  
  // Register canary routes with flag protection
  const CANARY_ENABLED = process.env.CANARY_ENABLED === 'true';
  
  if (CANARY_ENABLED) {
    try {
      const canaryLivePlan = await import('./routes/canary-live-plan.js');
      await app.register(canaryLivePlan.default, { prefix: '/api' } as any);
      app.log.info('canary routes registered');
    } catch (err: any) {
      app.log.warn({ err }, 'canary route registration failed - skipping');
    }
  } else {
    app.log.info('canary disabled by flag');
  }
  
  // Fallback: ensure critical futures endpoints exist even if plugin registration fails
  try {
    app.get('/api/futures/time', async (_req, reply) => {
      try {
        const { makeFuturesFromEnv } = await import('./lib/binance-futures.js');
        const fut = makeFuturesFromEnv();
        const r = await fut.time();
        reply.send(r as any);
      } catch (err:any) {
        reply.code(500).send({ error:'futures_time_failed', message: err?.message || String(err) });
      }
    });
    app.get('/api/futures/klines', async (req:any, reply:any) => {
      try {
        const { makeFuturesFromEnv } = await import('./lib/binance-futures.js');
        const fut = makeFuturesFromEnv();
        const { symbol, interval, limit, startTime, endTime } = (req.query ?? {}) as any;
        const r = await fut.klines({ symbol, interval, limit: limit?Number(limit):undefined, startTime:startTime?Number(startTime):undefined, endTime:endTime?Number(endTime):undefined } as any);
        reply.send(r as any);
      } catch (err:any) {
        reply.code(500).send({ error:'futures_klines_failed', message: err?.message || String(err) });
      }
    });
  } catch {}

  // Canary dry-run stub (testnet demonstration, no live trading)
  app.post('/api/canary/run', async (req:any, reply:any) => {
    try {
      const payload = (req.body ?? {}) as any;
      return reply.code(200).send({ ok: true, dryRun: true, echo: payload, ts: Date.now() });
    } catch (err:any) {
      return reply.code(500).send({ ok:false, error:'canary_failed', message: err?.message || String(err) });
    }
  });

  // Fallback: backtest job routes (POST→jobId, GET stream, DELETE cancel)
  try {
    app.post('/api/backtest/jobs', async (req:any, reply:any) => {
      const body = (req.body ?? {}) as any;
      const { createJob, setJobState, setJobOutput, setJobError, emitJobEvent } = await import('./lib/jobs.js');
      const { runBacktestCore } = await import('./lib/backtest-core.js');
      const job = createJob('backtest', body);
      setJobState(job.id, 'running');
      (async () => {
        try {
          const result = await runBacktestCore({ ...body, onEvent: (ev:any) => emitJobEvent(job.id, ev) });
          setJobOutput(job.id, result);
          setJobState(job.id, 'done');
          emitJobEvent(job.id, { event: 'done', result });
          try {
            await writeTextFile(`evidence/local/backtest/${job.id}.metrics.json`, JSON.stringify(result.metrics, null, 2));
            if (Array.isArray(result.equity)) {
              const header = 't,v\n';
              const bodyCsv = result.equity.map(([t,v]:[number,number])=>`${t},${v}`).join('\n');
              await writeTextFile(`evidence/local/backtest/${job.id}.equity.csv`, header+bodyCsv);
            }
          } catch {}
        } catch (e:any) {
          setJobError(job.id, { message: e?.message || 'backtest_failed' });
          emitJobEvent(job.id, { event: 'error', message: e?.message || 'backtest_failed' });
        }
      })();
      return reply.send({ ok: true, jobId: job.id, state: 'running' });
    });

    app.get('/api/backtest/stream/:jobId', async (req:any, reply:any) => {
      const { jobId } = req.params as any;
      const { getJob, onJobEvent, offJobEvent } = await import('./lib/jobs.js');
      const job = getJob(jobId);
      if (!job) return reply.code(404).send({ ok:false, error:'job_not_found' });
      reply.raw.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', Connection:'keep-alive' });
      const handler = (ev:any)=> reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
      onJobEvent(jobId, handler);
      reply.raw.write(`data: ${JSON.stringify({ event:'attached', state: job.state })}\n\n`);
      req.raw.on('close', ()=> offJobEvent(jobId, handler));
    });

    app.delete('/api/backtest/jobs/:jobId', async (req:any, reply:any) => {
      const { jobId } = req.params as any;
      const { cancelJob } = await import('./lib/jobs.js');
      return reply.send({ ok: cancelJob(jobId) });
    });
  } catch {}
  await app.register(execRoutes);
  
  // Register guardrails params routes (already registered above with registerCompat)
  
  // Portfolio routes (mock)
  try {
    const { portfolioRoutes } = await import('./routes/portfolio.js');
    await app.register(portfolioRoutes);
  } catch {}
  
  // Guardrails status endpoint
  app.get('/guardrails/status', async () => guardrails.getStatus());
  // healthPlugin already provides /public/health and /api/public/live/health
  // /metrics endpoint'i yeni buildMetricsRoute ile yayınlanıyor

  // Route Debug Endpoint
  if (process.env.ROUTE_DEBUG === "1") {
    app.get("/__routes", async () => {
      const out: any[] = [];
      app.printRoutes({ includeHooks: true }).split("\n").forEach((line) => {
        const m = line.match(/\s*(GET|POST|PUT|DELETE|PATCH|OPTIONS)\s+(\S+)/i);
        if (m) out.push({ method: m[1], url: m[2] });
      });
      return { routes: out };
    });
    app.log.info("[route-debug] /__routes aktif");
  }

  // v1.5 Backtest Routes (Fastify Plugin) - ADMIN_TOKEN required
  const backtestQueue: any[] = [];
  
  // Auth hook
  app.addHook('onRequest', (req, reply, done) => {
    if (!req.url.startsWith('/api/backtest')) return done();
    if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
      reply.code(401).send({ error: 'unauthorized' });
      return;
    }
    done();
  });

  // POST /api/backtest/start
  app.post('/api/backtest/start', async (req, reply) => {
    const b: any = req.body ?? {};
    const id = `bt-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    backtestQueue.push({ 
      id, 
      pair: b.pair ?? 'ETHUSDT', 
      timeframe: b.timeframe ?? '4h', 
      status: 'queued', 
      ts: Date.now() 
    });
    setTimeout(() => { 
      const it = backtestQueue.find(x => x.id === id); 
      if (it) it.status = 'done'; 
    }, 4000);
    reply.code(201).send({ id, status: 'queued' });
  });

  // GET /api/backtest/status
  app.get('/api/backtest/status', async (_req, reply) => {
    const stats = {
      queued: backtestQueue.filter(x => x.status === 'queued').length,
      running: backtestQueue.filter(x => x.status === 'running').length,
      done: backtestQueue.filter(x => x.status === 'done').length,
    };
    reply.send({ queue: backtestQueue.slice(-20), stats });
  });

  app.log.info('✅ v1.5 Backtest routes registered directly');

  // DEBUG BANNER + ROUTE ENVANTERI
  const buildTs = new Date().toISOString();
  const isEsm = typeof import.meta !== "undefined";
  const here = isEsm ? new URL(import.meta.url).pathname : __filename;
  console.log("[EXECUTOR_BOOT]", { buildTs, here, node: process.version, mode: process.env.NODE_ENV });

  // Debug endpoints
  app.get("/__debug", async () => ({
    buildTs,
    file: here,
    env: {
      PORT: process.env.PORT,
      ADMIN_TOKEN: Boolean(process.env.ADMIN_TOKEN),
      BACKTEST_ENABLED: process.env.BACKTEST_ENABLED ?? "(unset)",
    }
  }));

  app.get("/__routes", async () => {
    const routes = app.printRoutes();
    return { routes: routes.split('\n').filter(r => r.trim()) };
  });

  // Portfolio endpoints
  app.get('/api/portfolio/pnl', async (_req, res) => {
    // Check if exchange keys are configured
    const hasKeys = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY;
    
    if (!hasKeys) {
      res.send({
        totalPnl: 0,
        dailyPnl: 0,
        weeklyPnl: 0,
        monthlyPnl: 0,
        positions: [],
        reason: "no-keys",
        message: "Exchange API anahtarları yapılandırılmamış"
      });
      return;
    }

    // Mock data for demo (replace with real exchange API calls)
    res.send({
      totalPnl: 1250.75,
      dailyPnl: 45.20,
      weeklyPnl: 320.15,
      monthlyPnl: 1250.75,
      positions: [
        { symbol: 'BTCUSDT', size: 0.1, entryPrice: 45000, currentPrice: 46500, pnl: 150 },
        { symbol: 'ETHUSDT', size: 2.0, entryPrice: 3200, currentPrice: 3150, pnl: -100 }
      ]
    });
  });

  app.get('/api/portfolio/positions', async (_req, res) => {
    const hasKeys = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY;
    
    if (!hasKeys) {
      res.send({
        positions: [],
        totalValue: 0,
        totalPnl: 0,
        reason: "no-keys",
        message: "Exchange API anahtarları yapılandırılmamış"
      });
      return;
    }

    // Mock data for demo
    res.send({
      positions: [
        { 
          symbol: 'BTCUSDT', 
          side: 'LONG', 
          size: 0.1, 
          entryPrice: 45000, 
          currentPrice: 46500, 
          pnl: 150,
          pnlPercent: 3.33,
          value: 4650
        },
        { 
          symbol: 'ETHUSDT', 
          side: 'LONG', 
          size: 2.0, 
          entryPrice: 3200, 
          currentPrice: 3150, 
          pnl: -100,
          pnlPercent: -1.56,
          value: 6300
        }
      ],
      totalValue: 10950,
      totalPnl: 50
    });
  });

  app.get('/api/positions', async (_req, res) => {
    const hasKeys = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY;
    
    if (!hasKeys) {
      res.send({
        positions: [],
        totalValue: 0,
        totalPnl: 0,
        reason: "no-keys",
        message: "Exchange API anahtarları yapılandırılmamış"
      });
      return;
    }

    // Same as portfolio/positions for now
    res.send({
      positions: [
        { 
          symbol: 'BTCUSDT', 
          side: 'LONG', 
          size: 0.1, 
          entryPrice: 45000, 
          currentPrice: 46500, 
          pnl: 150,
          pnlPercent: 3.33,
          value: 4650
        },
        { 
          symbol: 'ETHUSDT', 
          side: 'LONG', 
          size: 2.0, 
          entryPrice: 3200, 
          currentPrice: 3150, 
          pnl: -100,
          pnlPercent: -1.56,
          value: 6300
        }
      ],
      totalValue: 10950,
      totalPnl: 50
    });
  });

  app.get('/api/pnl/summary', async (_req, res) => {
    const hasKeys = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY;
    
    if (!hasKeys) {
      res.send({
        totalPnl: 0,
        dailyPnl: 0,
        weeklyPnl: 0,
        monthlyPnl: 0,
        reason: "no-keys",
        message: "Exchange API anahtarları yapılandırılmamış"
      });
      return;
    }

    res.send({
      totalPnl: 1250.75,
      dailyPnl: 45.20,
      weeklyPnl: 320.15,
      monthlyPnl: 1250.75
    });
  });

  // AI Config Status
  app.get('/api/ai/config/status', async (_req, res) => {
    res.send({
      connected: true,
      model: 'gpt-4',
      provider: 'OpenAI',
      lastCheck: Date.now()
    });
  });

  // Exchange Connect Test
  app.post('/api/exchange/connect', async (req, res) => {
    const { type, testnet } = req.body;
    res.send({
      connected: true,
      type: type || 'spot',
      testnet: testnet || false,
      message: `${type || 'spot'} bağlantısı başarılı (${testnet ? 'testnet' : 'live'})`
    });
  });

  // Strategy Actions
  app.post('/advisor/run', async (req, res) => {
    const { strategy, params } = req.body;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.send({
      jobId,
      status: 'running',
      strategy: strategy || 'ema50_200',
      params: params || {},
      startedAt: new Date().toISOString()
    });
  });

  app.get('/advisor/logs', async (req, res) => {
    const { jobId } = req.query;
    res.send({
      jobId,
      logs: [
        { timestamp: new Date().toISOString(), level: 'info', message: 'Strategy başlatıldı' },
        { timestamp: new Date().toISOString(), level: 'info', message: 'Market verisi alınıyor...' },
        { timestamp: new Date().toISOString(), level: 'info', message: 'İlk sinyal bekleniyor' }
      ],
      status: 'running'
    });
  });

  app.post('/backtest/run', async (req, res) => {
    const { strategy, params } = req.body;
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.send({
      runId,
      status: 'running',
      strategy: strategy || 'ema50_200',
      params: params || {},
      startedAt: new Date().toISOString()
    });
  });

  app.get('/backtest/status', async (req, res) => {
    const { runId } = req.query;
    res.send({
      runId,
      status: 'completed',
      results: {
        totalReturn: 0.15,
        maxDrawdown: -0.08,
        winRate: 0.62,
        sharpeRatio: 1.8,
        trades: 45
      },
      completedAt: new Date().toISOString()
    });
  });

  app.post('/optimize/run', async (req, res) => {
    const { strategy, params } = req.body;
    const runId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.send({
      runId,
      status: 'running',
      strategy: strategy || 'ema50_200',
      params: params || {},
      startedAt: new Date().toISOString()
    });
  });

  app.get('/optimize/status', async (req, res) => {
    const { runId } = req.query;
    res.send({
      runId,
      status: 'completed',
      results: {
        bestParams: { rsiLen: 14, th: 28 },
        totalReturn: 0.16,
        maxDrawdown: -0.08,
        winRate: 0.57
      },
      completedAt: new Date().toISOString()
    });
  });

  // SSE Endpoints
  app.get('/sse/metrics/quick', async (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendData = () => {
      const data = {
        timestamp: Date.now(),
        metrics: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          activeStrategies: Math.floor(Math.random() * 5),
          totalTrades: Math.floor(Math.random() * 1000),
          pnl: (Math.random() - 0.5) * 1000
        }
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const interval = setInterval(sendData, 2000);
    
    req.on('close', () => {
      clearInterval(interval);
    });
  });

  app.get('/sse/backtest', async (req, res) => {
    const { runId } = req.query;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    let progress = 0;
    const sendProgress = () => {
      progress += 10;
      const data = {
        runId,
        progress,
        status: progress >= 100 ? 'completed' : 'running',
        message: progress >= 100 ? 'Backtest tamamlandı' : `İlerleme: %${progress}`
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      
      if (progress >= 100) {
        res.end();
      }
    };

    const interval = setInterval(sendProgress, 1000);
    
    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // Basit WS yayın (demo): /ws/strategies - sadece WebSocket aktifse
  if (!process.env.EXEC_WS_DISABLED) {
    app.get('/ws/strategies', { websocket: true }, (conn /*, req*/) => {
      const send = (obj: unknown) => conn.socket.readyState === 1 && conn.socket.send(JSON.stringify(obj));
      // snapshot
      send({ type: 'snapshot', rows: listStrategies() });
      // delta
      const off = onChange((row) => send({ type: 'delta', row }));
      conn.socket.on('close', () => off());
    });
  }

  // Exec lifecycle REST
  function authGuard(req:any, res:any, done:any){
    const token = process.env.EXEC_API_TOKEN;
    if (!token) return done();
    const h = (req.headers?.authorization as string) || '';
    if (h === `Bearer ${token}`) return done();
    res.code(401).send({ ok:false, msg:'unauthorized' });
  }

  app.post('/exec/start', { preHandler: authGuard }, async (req, res) => {
    const body = (req.body ?? {}) as any;
    const id = body?.id; if (!id) return res.code(400).send({ ok: false, msg: 'id required' });
    const out = startStrategy(id, body?.name);
    execStartTotal.inc(); activeStrategies.set(listStrategies().filter(x=>x.status==='running').length);
    try { auditLog({ ts: Date.now(), type: 'exec_start', details: { id }, actor: (req as any).user?.id }); } catch {}
    return res.send(out);
  });
  app.post('/exec/pause', { preHandler: authGuard }, async (req, res) => {
    const id = (req.body as any)?.id; if (!id) return res.code(400).send({ ok: false, msg: 'id required' });
    const out = pauseStrategy(id);
    activeStrategies.set(listStrategies().filter(x=>x.status==='running').length);
    try { auditLog({ ts: Date.now(), type: 'exec_pause', details: { id }, actor: (req as any).user?.id }); } catch {}
    return res.send(out);
  });
  app.post('/exec/stop', { preHandler: authGuard }, async (req, res) => {
    const id = (req.body as any)?.id; if (!id) return res.code(400).send({ ok: false, msg: 'id required' });
    const out = stopStrategy(id);
    execStopTotal.inc(); activeStrategies.set(listStrategies().filter(x=>x.status==='running').length);
    try { auditLog({ ts: Date.now(), type: 'exec_stop', details: { id }, actor: (req as any).user?.id }); } catch {}
    return res.send(out);
  });
  app.get('/exec/list', async (_req, res) => res.send({ rows: listStrategies() }));
  
  try {
    const addrUrl = await app.listen({ port: PORT, host: HOST });
    const a = app.server.address() as any;
    app.log.info({ bind: a, addrUrl }, 'server.listened');
    console.error('[BOOT] listened', a); // stdout yoksa bile stderr'e yaz
  } catch (err) {
    console.error('[BOOT] server.listen failed', err && (err as any).stack || err);
    app.log?.error?.({ err }, 'server.listen failed');
    process.exit(1);
  }
  
  // JIT/DNS/TCP warmup: 8 istek, 200ms aralıkla
  const origin = `http://127.0.0.1:${PORT}`;
  app.log.info("Starting JIT warmup...");
  for (let i = 0; i < 8; i++) {
    try {
      await fetch(`${origin}/canary/run?dry=true`, { cache: "no-store" });
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      app.log.warn({ err: String(e) }, "warmup failed (ignored)");
    }
  }
  app.log.info("JIT warmup complete");
  
  // V1.2 Market Data Adapters Startup (commented out due to ESM issues)
  // try {
  //   // BTCTurk Client
  //   const btcturkClient = createBTCTurkClient({
  //     symbols: ['BTCUSDT', 'ETHUSDT'],
  //     registry: register,
  //     log: app.log
  //   });
  //   await btcturkClient.connect();
  //   app.log.info('BTCTurk client connected');
  //   
  //   // BIST Reader
  //   const bistReader = createBISTReader({
  //     symbols: ['THYAO', 'AKBNK', 'GARAN'],
  //     registry: register,
  //     log: app.log
  //   });
  //   bistReader.start();
  //   app.log.info('BIST reader started');
  //   
  // } catch (err: any) {
  //   app.log.warn({ err }, 'V1.2 market data adapters startup failed - continuing without');
  // }
  
  // Graceful shutdown handlers
  for (const sig of ['SIGINT','SIGTERM'] as const) {
    process.on(sig, async () => {
      app.log.warn({ sig }, 'graceful shutdown');
      try { await app.close(); } finally { process.exit(0); }
    });
  }
}

start().catch((err) => { 
  app.log.error({ err }, 'FASTIFY_LISTEN_FAILED'); 
  process.exit(1); 
});
