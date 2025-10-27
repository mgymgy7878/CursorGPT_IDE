// Market Data Service
// Fastify app (yalnızca feed servis)

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { FeedOrchestrator } from './orchestrator.js';
import { feedRoutes } from './routes/feeds.js';

const app = Fastify({
  logger: true
});

// CORS
await app.register(cors, {
  origin: true
});

// Feed orchestrator
const orchestrator = new FeedOrchestrator();

// Routes
await app.register(feedRoutes, { orchestrator });

// Health check
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: Date.now() };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 4005;
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port: Number(port), host });
    console.log(`Market data service running on http://${host}:${port}`);
    
    // Start orchestrator
    await orchestrator.start();
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down market data service...');
  await orchestrator.stop();
  await app.close();
  process.exit(0);
});

start();
