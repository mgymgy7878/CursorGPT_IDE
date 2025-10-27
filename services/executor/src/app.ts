// services/executor/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

export const SAFE_MODE = process.env.EXECUTOR_SAFE_MODE === '1';

export function buildServer() {
  const app = Fastify({ 
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
    }
  });

  // Startup sentinels
  app.addHook('onReady', async () => { 
    app.log.info('[BOOT] onReady hook reached'); 
  });

  process.on('uncaughtException', (e) => { 
    console.error('[FATAL] uncaughtException', e); 
  });

  process.on('unhandledRejection', (e) => { 
    console.error('[FATAL] unhandledRejection', e); 
  });

  // Common plugins and decorators
  app.register(cors, {
    origin: true,
    credentials: true
  });

  app.register(websocket);

  return app;
}
