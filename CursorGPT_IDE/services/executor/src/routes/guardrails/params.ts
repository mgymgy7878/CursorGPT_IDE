import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

async function guardrailsParams(app: FastifyInstance) {
  app.get('/guardrails/params', async () => {
    return { status: 'ok', source: 'guardrails/params' };
  });
}

export default fp(guardrailsParams, { name: 'guardrails-params' });
