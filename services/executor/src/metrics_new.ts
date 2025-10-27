// services/executor/src/metrics_new.ts
import type { FastifyInstance } from 'fastify';
import { Registry, collectDefaultMetrics } from "./lib/metrics.js";

declare global {
  // process restart olsa bile aynı instance'ı kullanabilmek için
  // (dev ortamında hot-reload sırasında çakışmayı engeller)
  // @ts-ignore
  var __sparkPromRegistry: Registry | undefined;
}

export const registry: Registry = globalThis.__sparkPromRegistry ??= new Registry();
collectDefaultMetrics({ register: registry });

export async function metricsPlugin(app: FastifyInstance) {
  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });
  // UI'nin health rozetleri için güvenli, ucuz kontroller:
  app.get('/health', async () => ({ ok: true, t: Date.now() }));
  app.get('/ops/health', async () => ({ status: 'ok', t: Date.now() }));
}