// services/executor/src/portfolio.ts
import type { FastifyInstance } from 'fastify';
import { fetchAllPortfolios } from './services/portfolioService.js';

export async function portfolioPlugin(app: FastifyInstance) {
  // Eski endpoint'ler (uyumluluk için korunuyor)
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

  // Yeni portfolio endpoint - gerçek exchange verisi
  app.get('/api/portfolio', async (_req, reply) => {
    try {
      const portfolio = await fetchAllPortfolios();
      return reply.send(portfolio);
    } catch (err: any) {
      app.log.error({ err }, 'Portfolio fetch error');
      // Hata durumunda boş portfolio dön
      return reply.send({
        accounts: [],
        updatedAt: new Date().toISOString(),
      });
    }
  });
}
