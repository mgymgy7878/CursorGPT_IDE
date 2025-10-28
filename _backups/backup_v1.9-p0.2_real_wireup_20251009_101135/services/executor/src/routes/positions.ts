import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { makeFuturesFromEnv } from '../lib/binance-futures.js';

const requireJwt = (app: FastifyInstance) => (app as any).authenticate
  ? [(app as any).authenticate]
  : [];

export default fp(async function positionsRoutes(app: FastifyInstance) {
  const fut = makeFuturesFromEnv();

  app.get('/api/futures/positions', { preHandler: requireJwt(app) }, async (_req:any, reply:any) => {
    const r = await fut.positionRisk();
    reply.send({ positions: r });
  });

  app.get('/api/futures/fills', { preHandler: requireJwt(app) }, async (req:any, reply:any) => {
    const { symbol } = (req.query ?? {}) as any;
    // Placeholder: real fills require userDataStream aggregation; return empty shape for now
    reply.send({ fills: [], symbol });
  });
});


