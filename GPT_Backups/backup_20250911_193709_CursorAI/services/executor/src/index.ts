import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { startStrategy, pauseStrategy, stopStrategy, listStrategies, onChange } from './state/strategies.js';
import rateLimit from '@fastify/rate-limit';

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
import { register, execStartTotal, execStopTotal, activeStrategies } from './metrics.js';
import os from 'node:os';
import httpMetricsPlugin from './plugins/httpMetrics.js';
import auditRoutes from './routes/public/audit.js';
import binanceTestRoute from './routes/test/binance.js';
import btcturkTestRoute from './routes/test/btcturk.js';
import { log as auditLog } from './utils/audit.js';
import typeProvider from './plugins/type-provider.js';
import { placeRoutes } from './routes/place.js';
import { feedRoutes } from './routes/feed.js';
import btcturkRoutes from './routes/btcturk.js';
import { guardrails } from './guardrails.js';
import { execRoutes } from './routes/exec.js';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true, ts: Date.now(), host: os.hostname(), mode: 'NORMAL' }));

process.on('unhandledRejection', (e) => app.log.error({ err: e }, 'UNHANDLED_REJECTION'));
process.on('uncaughtException', (e) => { app.log.error({ err: e }, 'UNCAUGHT_EXCEPTION'); process.exit(1); });

const port = Number(process.env.PORT) || 4001;
const host = process.env.HOST || '127.0.0.1';

async function start() {
  await app.register(typeProvider);
  await app.register(httpMetricsPlugin);
  
  // Rate limit plugin - guard ile koru
  if (process.env.EXEC_RATE_LIMIT_DISABLED !== '1') {
    await safeRegister(() =>
      app.register(rateLimit, {
        max: Number(process.env.RATE_LIMIT_PER_MIN_DEV ?? 10),
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
  await app.register(placeRoutes);
  await app.register(feedRoutes);
  await app.register(btcturkRoutes);
  await app.register(auditRoutes);
  await app.register(binanceTestRoute);
  await app.register(btcturkTestRoute);
  // await app.register(execRoutes); // Duplicate route sorunu nedeniyle kapatıldı
  // Portfolio routes (mock)
  try {
    const { portfolioRoutes } = await import('./routes/portfolio.js');
    await app.register(portfolioRoutes);
  } catch {}
  
  // Guardrails status endpoint
  app.get('/guardrails/status', async () => guardrails.getStatus());
  app.get('/public/health', async (_req, res) => res.send({ ok: true, ts: Date.now() }));
  app.get('/public/metrics/prom', async (_req, res) => { res.header('Content-Type', register.contentType); res.send(await register.metrics()); });

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
  
  await app.listen({ port, host });
  app.log.info(`executor listening on http://${host}:${port}`);
}

start().catch((err) => { 
  app.log.error({ err }, 'FASTIFY_LISTEN_FAILED'); 
  process.exit(1); 
});
