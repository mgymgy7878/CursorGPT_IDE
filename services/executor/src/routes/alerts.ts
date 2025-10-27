import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { initStore, createAlert, readAll, delAlert, setActive, readAlert, history } from '../alerts/store';
import { startScheduler, pollOnce } from '../alerts/engine';
import client from 'prom-client';

const createdTotal = new client.Counter({
  name: 'alerts_created_total',
  help: 'Alerts created',
  labelNames: ['type']
});

export default async function alertsRoutes(app: FastifyInstance) {
  // Initialize Redis store
  await initStore();
  
  // Start the 30s scheduler
  startScheduler();

  app.post('/alerts/create', async (req, reply) => {
    const body: any = (req as any).body || {};
    const id = body.id || randomUUID();
    
    const a = {
      id,
      symbol: String(body.symbol ?? 'BTCUSDT').toUpperCase(),
      timeframe: String(body.timeframe ?? '1h'),
      type: body.type,
      params: body.params ?? {},
      active: true,
      createdAt: Date.now(),
      lastTriggeredAt: 0
    };
    
    await createAlert(a);
    createdTotal.inc({ type: a.type });
    
    app.log.info({ id, symbol: a.symbol, type: a.type }, 'alert_created');
    return reply.send({ ok: true, id, alert: a });
  });

  app.get('/alerts/list', async (_req, reply) => {
    const items = await readAll();
    return reply.send({ items });
  });

  app.post('/alerts/delete', async (req, reply) => {
    const { id } = (req as any).body || {};
    await delAlert(id);
    
    app.log.info({ id }, 'alert_deleted');
    return reply.send({ ok: true });
  });

  app.post('/alerts/enable', async (req, reply) => {
    const { id } = (req as any).body || {};
    await setActive(id, true);
    
    app.log.info({ id }, 'alert_enabled');
    return reply.send({ ok: true });
  });

  app.post('/alerts/disable', async (req, reply) => {
    const { id } = (req as any).body || {};
    await setActive(id, false);
    
    app.log.info({ id }, 'alert_disabled');
    return reply.send({ ok: true });
  });

  app.get('/alerts/get', async (req, reply) => {
    const id = (req.query as any).id;
    const a = await readAlert(id);
    return reply.send({ alert: a });
  });

  app.get('/alerts/history', async (req, reply) => {
    const { id, limit } = (req.query as any);
    const events = await history(id, Number(limit ?? 50));
    return reply.send({ id, events });
  });

  app.post('/alerts/test', async (req, reply) => {
    const { id } = (req as any).body || {};
    const a = await readAlert(id);
    
    if (!a) {
      return reply.code(404).send({ error: 'not_found' });
    }
    
    // Manually trigger a poll to test this specific alert
    const evs = await pollOnce();
    const hit = evs.find(e => e.id === id) ?? null;
    
    app.log.info({ id, hit }, 'alert_tested');
    return reply.send({ id, hit });
  });

  app.log.info('[Alerts] Routes registered, Redis store initialized, scheduler started');
}
