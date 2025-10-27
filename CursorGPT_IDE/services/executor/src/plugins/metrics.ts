import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import * as client from 'prom-client';

async function metricsPlugin(app: FastifyInstance) {
  const registry = client.register;
  client.collectDefaultMetrics({ register: registry });

  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });
}

export default fp(metricsPlugin, { name: 'metrics-plugin' });