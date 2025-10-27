import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import client from 'prom-client';

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: 'spark_' });

export const httpRequestsTotal = new client.Counter({
  name: 'spark_http_requests_total',
  help: 'HTTP requests',
  labelNames: ['route', 'method', 'status'],
  registers: [registry],
});

export default fp(async function metricsPlugin(fastify: FastifyInstance) {
  (fastify as any).addHook('onResponse', async (req: any, reply: any) => {
    try {
      httpRequestsTotal.labels({
        route: req.routerPath ?? 'unknown',
        method: req.method,
        status: String(reply.statusCode),
      }).inc();
    } catch {}
  });
});