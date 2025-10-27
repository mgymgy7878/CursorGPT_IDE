// services/marketdata/src/routes/moneyflow.ts
import type { FastifyInstance } from 'fastify';
import { startMoneyFlowV0, getAllMoneyFlowMetrics, resetMoneyFlowState } from '../moneyflow/engine.js';
import { startBISTEquityMock } from '../readers/bist-eq.js';

let engine: any = null;
let mockFeedCleanup: (() => void) | null = null;

/**
 * Money Flow routes
 * Provides money flow metrics and controls
 */
export async function moneyflowRoutes(app: FastifyInstance) {
  /**
   * Start money flow engine
   */
  app.post<{ Body: { symbols?: string[] } }>(
    '/moneyflow/start',
    async (request, reply) => {
      const symbols = request.body.symbols || ['THYAO', 'AKBNK', 'GARAN', 'ISCTR'];

      app.log.info({ symbols }, 'Starting Money Flow engine');

      try {
        // Start mock BIST feed (until vendor adapter ready)
        if (!mockFeedCleanup) {
          mockFeedCleanup = startBISTEquityMock(symbols);
        }

        // Start Money Flow engine
        if (!engine) {
          engine = startMoneyFlowV0(symbols);
        }

        return reply.send({
          ok: true,
          mode: 'mock',
          message: 'Money Flow engine started (PoC mode - mock data)',
          symbols,
          note: 'Real vendor adapter pending',
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        app.log.error({ err }, 'Failed to start Money Flow engine');
        return reply.code(500).send({
          error: 'MoneyFlowStartError',
          message: err.message,
        });
      }
    }
  );

  /**
   * Get money flow summary
   */
  app.get('/moneyflow/summary', async (_request, reply) => {
    if (!engine) {
      return reply.send({
        ok: false,
        message: 'Money Flow engine not started',
        data: {},
      });
    }

    const snapshot = engine.snapshot();

    return reply.send({
      ok: true,
      data: snapshot,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get money flow for specific symbol
   */
  app.get<{ Querystring: { symbol: string } }>(
    '/moneyflow/symbol',
    async (request, reply) => {
      const { symbol } = request.query;

      if (!symbol) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'symbol query parameter required',
        });
      }

      if (!engine) {
        return reply.send({
          ok: false,
          message: 'Money Flow engine not started',
          data: null,
        });
      }

      const snapshot = engine.snapshot();
      const symbolData = snapshot[symbol];

      return reply.send({
        ok: true,
        symbol,
        data: symbolData || null,
        timestamp: new Date().toISOString(),
      });
    }
  );

  /**
   * Stop money flow engine
   */
  app.post('/moneyflow/stop', async (_request, reply) => {
    app.log.info('Stopping Money Flow engine');

    if (mockFeedCleanup) {
      mockFeedCleanup();
      mockFeedCleanup = null;
    }

    engine = null;

    return reply.send({
      ok: true,
      message: 'Money Flow engine stopped',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Reset money flow state
   */
  app.post<{ Body: { symbol?: string } }>(
    '/moneyflow/reset',
    async (request, reply) => {
      const { symbol } = request.body;

      resetMoneyFlowState(symbol);

      return reply.send({
        ok: true,
        message: symbol ? `Reset for ${symbol}` : 'Reset all symbols',
        timestamp: new Date().toISOString(),
      });
    }
  );

  app.log.info('✅ Money Flow routes registered');
}

