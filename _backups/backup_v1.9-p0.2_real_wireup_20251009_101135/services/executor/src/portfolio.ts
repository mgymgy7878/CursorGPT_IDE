// services/executor/src/portfolio.ts
import type { FastifyInstance } from 'fastify';

export async function portfolioPlugin(app: FastifyInstance) {
  app.get('/positions', async () => ({
    positions: [],     // UI boş listeyi kabul eder
    ts: Date.now()
  }));

  app.get('/pnl/summary', async () => ({
    realized: 0,
    unrealized: 0,
    currency: 'USDT',
    ts: Date.now()
  }));
}
