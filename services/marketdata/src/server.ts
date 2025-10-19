import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Registry, collectDefaultMetrics } from 'prom-client';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// Prometheus metrics
const register = new Registry();
collectDefaultMetrics({ register });

// Health
app.get('/healthz', async () => ({ status: 'ok', service: 'marketdata', ts: Date.now() }));

// Metrics
app.get('/metrics', async (_req, reply) => {
  reply.type('text/plain');
  return register.metrics();
});

// (gelecekte: /ohlcv, /ws feed vs.)

const PORT = Number(process.env.PORT || 5001);
const HOST = process.env.HOST || '0.0.0.0';
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`✅ marketdata on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}