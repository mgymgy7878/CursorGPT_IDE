import type { FastifyInstance } from 'fastify';

function mockEquity(len = 60) {
  const now = Date.now();
  return Array.from({ length: len }, (_, i) => ({
    t: now - (len - i) * 60_000,
    equity: 10000 + Math.sin(i / 6) * 220 + i * 6,
  }));
}

export async function execRoutes(app: FastifyInstance) {
  app.post('/exec/backtest', async (request, reply) => {
    const body: any = request.body ?? {};
    const { params } = body;
    return reply.send({
      points: mockEquity(120),
      stats: { totalReturn: 0.14, maxDD: -0.06, winRate: 0.58, symbol: params?.symbol ?? 'BTCUSDT' },
    });
  });

  app.post('/exec/optimize', async (request, reply) => {
    const rows = [
      { rsiLen: 7, th: 30, totalReturn: 0.11, maxDD: -0.07, winRate: 0.55 },
      { rsiLen: 14, th: 28, totalReturn: 0.16, maxDD: -0.08, winRate: 0.57 },
      { rsiLen: 21, th: 25, totalReturn: 0.13, maxDD: -0.05, winRate: 0.59 },
    ];
    return reply.send({ rows, best: rows[1] });
  });

  app.post('/exec/start', async (_req, reply) => reply.send({ ok: true, msg: 'start (stub)' }));
  app.post('/exec/stop', async (_req, reply) => reply.send({ ok: true, msg: 'stop (stub)' }));
}


