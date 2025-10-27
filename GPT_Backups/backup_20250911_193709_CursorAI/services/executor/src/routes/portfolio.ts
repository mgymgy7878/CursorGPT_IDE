import { FastifyInstance } from 'fastify';

export async function portfolioRoutes(app: FastifyInstance){
  app.get('/portfolio/summary', async (_req, res) => {
    return res.send({
      accounts: [
        { exchange: 'Binance', equityUSD: 12543.12, pnl24h: 142.8, positions: 3 },
        { exchange: 'BTCTurk', equityUSD: 4850.55, pnl24h: -23.4, positions: 1 },
      ],
      byAsset: [
        { asset: 'USDT', qty: 8200, price: 1.0, value: 8200, pct: 46.2 },
        { asset: 'BTC', qty: 0.18, price: 64000, value: 11520, pct: 50.2 },
        { asset: 'TRY', qty: 1200, price: 0.031, value: 37.2, pct: 0.1 },
      ],
    });
  });
}


