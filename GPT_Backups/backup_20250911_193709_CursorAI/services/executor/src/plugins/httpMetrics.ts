import type { FastifyPluginCallback } from 'fastify';
import { httpRequestsTotal, rateLimitHitsTotal } from '../metrics.js';

const httpMetricsPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.addHook('onResponse', (req, reply, next) => {
    const route = (req.routeOptions && req.routeOptions.url) || req.url || 'unknown';
    const code = String(reply.statusCode || 0);
    httpRequestsTotal.inc({ method: req.method, route, code });
    if (code === '429') rateLimitHitsTotal.inc({ route });
    next();
  });

  fastify.addHook('onError', (req, reply, _err, next) => {
    const route = (req.routeOptions && req.routeOptions.url) || req.url || 'unknown';
    const code = String(reply.statusCode || 500);
    httpRequestsTotal.inc({ method: req.method, route, code });
    if (code === '429') rateLimitHitsTotal.inc({ route });
    next();
  });

  done();
};

export default httpMetricsPlugin;


