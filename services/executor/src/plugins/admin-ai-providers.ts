// Admin AI Providers Plugin - Mock endpoint with RBAC + audit
// v1.9-p1.ui

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import client from 'prom-client';
import { timingSafeEqual } from 'node:crypto';

const setTotal = new client.Counter({
  name: 'settings_ai_set_total',
  help: 'AI settings set requests',
  labelNames: ['result'],
});

export default fp(async (app: FastifyInstance) => {
  app.post('/admin/ai/providers/set', async (req, reply) => {
    const adminToken = (req.headers['x-admin-token'] || '') as string;
    const requiredToken = process.env.ADMIN_TOKEN || '';

    // RBAC: Check admin token
    if (
      !requiredToken ||
      adminToken.length !== requiredToken.length ||
      !timingSafeEqual(Buffer.from(adminToken), Buffer.from(requiredToken))
    ) {
      setTotal.inc({ result: 'forbidden' });
      app.log.warn({ route: '/admin/ai/providers/set' }, 'forbidden');
      return reply.code(403).send({ ok: false, error: 'forbidden' });
    }

    // Mock: Just log the request (real implementation will save to DB/config)
    const payload = (req as any).body || {};
    app.log.info(
      {
        route: '/admin/ai/providers/set',
        openai_model: payload?.openai?.model,
        has_anthropic: !!payload?.anthropic?.key,
      },
      'providers_set_mock'
    );

    setTotal.inc({ result: 'success' });
    return reply.code(200).send({ ok: true });
  });

  app.log.info('[Admin AI Providers] Mock endpoint registered: /admin/ai/providers/set');
});

