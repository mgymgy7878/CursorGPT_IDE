import type { FastifyPluginCallback } from 'fastify';
import { tail } from '../../utils/audit.js';

const auditRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/public/audit/tail', async (req) => {
    const q = (req.query ?? {}) as { limit?: string };
    const limit = q.limit ? Number(q.limit) : 200;
    return { items: tail(limit) };
  });
  done();
};

export default auditRoutes;


