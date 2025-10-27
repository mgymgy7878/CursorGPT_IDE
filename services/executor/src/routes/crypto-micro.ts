// services/executor/src/routes/crypto-micro.ts
// Crypto micro-structure: Funding rate, Open Interest, Liquidations
import type { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

/**
 * Crypto micro-structure routes
 * MVP: REST polling (Production: WebSocket streams)
 */
export async function cryptoMicroRoutes(app: FastifyInstance) {
  /**
   * Get funding rate
   */
  app.get<{ Querystring: { symbol?: string } }>(
    '/crypto/funding',
    async (request, reply) => {
      const { symbol = 'BTCUSDT' } = request.query;

      try {
        // Binance Futures funding rate
        const r = await fetch(
          `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=10`
        );
        const data = await r.json();

        if (!Array.isArray(data) || data.length === 0) {
          return reply.send({
            ok: false,
            message: 'No funding data',
          });
        }

        const latest = data[0];
        const fundingRate = parseFloat(latest.fundingRate);

        // Calculate 8h annualized rate
        const annualized = fundingRate * 3 * 365; // 3 times per day

        return reply.send({
          ok: true,
          symbol,
          fundingRate,
          annualized,
          time: latest.fundingTime,
          history: data.slice(0, 5),
        });
      } catch (err: any) {
        app.log.error({ err, symbol }, 'Funding rate fetch failed');
        return reply.send({
          ok: false,
          error: err.message,
        });
      }
    }
  );

  /**
   * Get Open Interest
   */
  app.get<{ Querystring: { symbol?: string } }>(
    '/crypto/oi',
    async (request, reply) => {
      const { symbol = 'BTCUSDT' } = request.query;

      try {
        // Binance Futures Open Interest history
        const r = await fetch(
          `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=24`
        );
        const data = await r.json();

        if (!Array.isArray(data) || data.length === 0) {
          return reply.send({
            ok: false,
            message: 'No OI data',
          });
        }

        const latest = data[data.length - 1];
        const previous = data[data.length - 2];

        // Calculate delta
        const oiDelta = previous
          ? ((parseFloat(latest.sumOpenInterest) - parseFloat(previous.sumOpenInterest)) /
              parseFloat(previous.sumOpenInterest)) *
            100
          : 0;

        return reply.send({
          ok: true,
          symbol,
          openInterest: parseFloat(latest.sumOpenInterest),
          openInterestValue: parseFloat(latest.sumOpenInterestValue),
          oiDeltaPct: oiDelta,
          time: latest.timestamp,
          history: data.slice(-10),
        });
      } catch (err: any) {
        app.log.error({ err, symbol }, 'OI fetch failed');
        return reply.send({
          ok: false,
          error: err.message,
        });
      }
    }
  );

  /**
   * Get liquidation data (last 24h)
   */
  app.get<{ Querystring: { symbol?: string } }>(
    '/crypto/liquidations',
    async (request, reply) => {
      const { symbol = 'BTCUSDT' } = request.query;

      try {
        // Binance Futures liquidation orders (force orders)
        const r = await fetch(
          `https://fapi.binance.com/fapi/v1/allForceOrders?symbol=${symbol}&limit=50`
        );
        const data = await r.json();

        if (!Array.isArray(data)) {
          return reply.send({
            ok: false,
            message: 'No liquidation data',
          });
        }

        // Aggregate by side
        let longLiquidations = 0;
        let shortLiquidations = 0;

        data.forEach((order: any) => {
          const qty = parseFloat(order.origQty);
          if (order.side === 'SELL') {
            longLiquidations += qty;
          } else {
            shortLiquidations += qty;
          }
        });

        return reply.send({
          ok: true,
          symbol,
          longLiquidations,
          shortLiquidations,
          total: data.length,
          recent: data.slice(0, 10),
        });
      } catch (err: any) {
        app.log.error({ err, symbol }, 'Liquidations fetch failed');
        return reply.send({
          ok: false,
          error: err.message,
        });
      }
    }
  );

  /**
   * Get taker buy/sell ratio
   */
  app.get<{ Querystring: { symbol?: string } }>(
    '/crypto/taker-ratio',
    async (request, reply) => {
      const { symbol = 'BTCUSDT' } = request.query;

      try {
        // Binance taker buy/sell volume
        const r = await fetch(
          `https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${symbol}&period=5m&limit=24`
        );
        const data = await r.json();

        if (!Array.isArray(data) || data.length === 0) {
          return reply.send({
            ok: false,
            message: 'No taker ratio data',
          });
        }

        const latest = data[data.length - 1];

        return reply.send({
          ok: true,
          symbol,
          buyRatio: parseFloat(latest.buySellRatio),
          timestamp: latest.timestamp,
          history: data.slice(-10),
        });
      } catch (err: any) {
        app.log.error({ err, symbol }, 'Taker ratio fetch failed');
        return reply.send({
          ok: false,
          error: err.message,
        });
      }
    }
  );

  app.log.info('✅ Crypto micro-structure routes registered');
}

