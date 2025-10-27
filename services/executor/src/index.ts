// services/executor/src/index.ts
// V1.6 Executor Recovery - Hybrid Mode with REAL_ROUTES gating
import { buildServer, SAFE_MODE } from './app.js';
import dotenv from 'dotenv';

// Load .env.local if exists
dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
const HOST = process.env.HOST || '0.0.0.0';

// Comma-separated list: "run,walkforward,portfolio,optimize"
const REAL_ROUTES = (process.env.REAL_ROUTES || '').split(',').map(s => s.trim()).filter(Boolean);
const isReal = (name: string) => REAL_ROUTES.includes(name);

// Critical error handlers - prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] unhandledRejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err);
  process.exit(1);
});

async function main() {
  console.log('[BOOT] pre-import');
  console.log('[BOOT] ENV: PORT=%s HOST=%s REDIS_URL=%s NODE_ENV=%s', 
    process.env.PORT, 
    process.env.HOST, 
    process.env.REDIS_URL?.replace(/:[^@]+@/, ':***@'), // mask password if any
    process.env.NODE_ENV
  );
  
  const app = buildServer();

  console.log('[BOOT] SAFE_MODE =', SAFE_MODE);
  console.log('[BOOT] REAL_ROUTES =', REAL_ROUTES.length ? REAL_ROUTES : '(none - all mocked)');

  if (SAFE_MODE) {
    const { registerSafeMode } = await import('./routes/safe-mode.js');
    await registerSafeMode(app);
    console.log('[BOOT] SAFE MODE routes registered (lightweight mock endpoints)');
  } else {
    // Always register safe-mode base (health, metrics, mock fallbacks)
    const { registerSafeMode } = await import('./routes/safe-mode.js');
    await registerSafeMode(app);
    console.log('[BOOT] Safe-mode base registered (health/metrics + conditional mocks)');

    // Conditionally replace mock endpoints with real ones (lazy import heavy deps)
    if (isReal('run')) {
      console.log('[BOOT] enabling REAL /backtest/run');
      const { registerBacktestSimple } = await import('./routes/backtest-simple.js');
      await registerBacktestSimple(app, { override: true });
    }
    if (isReal('walkforward')) {
      console.log('[BOOT] enabling REAL /backtest/walkforward');
      const { registerWalkforward } = await import('./routes/backtest-walkforward.js');
      await registerWalkforward(app);
    }
    if (isReal('portfolio')) {
      console.log('[BOOT] enabling REAL /backtest/portfolio');
      const { registerPortfolio } = await import('./routes/backtest-portfolio.js');
      await registerPortfolio(app);
    }
    if (isReal('optimize')) {
      console.log('[BOOT] enabling REAL /backtest/optimize');
      const { registerOptimize } = await import('./routes/backtest-optimize.js');
      await registerOptimize(app);
    }

    console.log('[BOOT] post-import');
  }

  // Root endpoint (informational)
  app.get('/', async () => ({
    service: 'executor',
    version: 'v1.6-hybrid',
    mode: SAFE_MODE ? 'safe-mode' : (REAL_ROUTES.length ? 'hybrid' : 'full-mock'),
    realRoutes: REAL_ROUTES,
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      backtest: '/backtest/run',
      walkforward: '/backtest/walkforward',
      portfolio: '/backtest/portfolio',
      optimize: '/backtest/optimize'
    },
    ts: Date.now()
  }));

  console.log('[BOOT] listen() →', HOST, PORT);
  await app.listen({ port: PORT, host: HOST });
  console.log('[BOOT] executor up on :' + PORT);
}

main().catch((err) => {
  console.error('[BOOT] crash before listen()', err);
  process.exit(1); 
});

// Graceful shutdown hooks
process.on('SIGINT', () => { console.log('[BOOT] SIGINT received'); process.exit(0); });
process.on('SIGTERM', () => { console.log('[BOOT] SIGTERM received'); process.exit(0); });
process.on('exit', (code) => { console.log('[BOOT] exit, code =', code); });