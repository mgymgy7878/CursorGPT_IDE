import { FastifyInstance } from 'fastify';
import { notifyTest } from '../notifications/notifier';

export default async function notifyRoutes(app: FastifyInstance) {
  app.post('/notify/test', async (_req, reply) => {
    await notifyTest('✅ Spark Alerts: test notification');
    return reply.send({ ok: true });
  });

  app.log.info('[Notify] Test endpoint registered');
}

