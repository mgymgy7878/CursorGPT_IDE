import type { FastifyPluginCallback } from 'fastify';

const httpMetricsPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  // Tüm metrics çağrıları tamamen kaldırıldı - label sorunu nedeniyle
  done();
};

export default httpMetricsPlugin;


