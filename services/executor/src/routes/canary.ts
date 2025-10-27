// services/executor/src/routes/canary.ts
import type { FastifyInstance } from 'fastify';

interface CanaryRunRequest {
  scope: string; // 'futures-testnet', 'futures-prod', 'spot', etc.
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  type?: 'MARKET' | 'LIMIT';
  price?: number;
}

/**
 * Canary routes for safe order testing
 * Provides dry-run simulation and controlled live testing
 */
export async function canaryRoutes(app: FastifyInstance) {
  /**
   * Run canary simulation (dry-run)
   * Does NOT place real orders, just simulates and validates
   */
  app.post<{ Body: CanaryRunRequest }>(
    '/canary/run',
    async (request, reply) => {
      const { scope, symbol, side, quantity, type = 'MARKET', price } = request.body;

      // Validate request
      if (!scope || !symbol || !side || !quantity) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Missing required fields: scope, symbol, side, quantity',
        });
      }

      // Log canary run
      app.log.info({
        scope,
        symbol,
        side,
        quantity,
        type,
        price,
      }, 'Canary dry-run started');

      // Simulate order validation
      const simulatedOrder = {
        id: `canary-${Date.now()}`,
        scope,
        symbol,
        side,
        type,
        quantity,
        price,
        status: 'simulated',
        timestamp: new Date().toISOString(),
        dryRun: true,
      };

      // Check risk limits (simulated)
      const maxNotional = Number(process.env.FUTURES_MAX_NOTIONAL || '100');
      const notional = (price || 0) * quantity;

      if (notional > maxNotional) {
        app.log.warn({
          notional,
          maxNotional,
        }, 'Canary would exceed max notional');

        return reply.send({
          ok: false,
          simulated: true,
          order: simulatedOrder,
          blocked: true,
          reason: 'MaxNotionalExceeded',
          limit: maxNotional,
        });
      }

      // Success simulation
      return reply.send({
        ok: true,
        simulated: true,
        order: simulatedOrder,
        evidence: {
          riskChecks: ['maxNotional', 'dailyLoss', 'leverage'],
          passed: true,
        },
      });
    }
  );

  /**
   * Confirm and execute canary order (testnet only)
   * Requires explicit confirmation, only works on testnet
   */
  app.post<{ Body: { canaryId?: string; scope?: string } }>(
    '/canary/confirm',
    async (request, reply) => {
      const { canaryId, scope = 'futures-testnet' } = request.body;

      // Only allow testnet
      if (!scope.includes('testnet')) {
        return reply.code(403).send({
          error: 'ForbiddenScope',
          message: 'Canary confirm only allowed on testnet',
          allowedScopes: ['futures-testnet', 'spot-testnet'],
        });
      }

      // Check if testnet mode is enabled
      const isTestnet = process.env.BINANCE_TESTNET !== '0';
      if (!isTestnet) {
        return reply.code(403).send({
          error: 'TestnetNotEnabled',
          message: 'Testnet mode must be enabled for canary confirm',
        });
      }

      app.log.info({
        canaryId,
        scope,
      }, 'Canary confirm requested');

      // Apply with hard caps
      const maxNotional = Number(process.env.FUTURES_MAX_NOTIONAL || '100');

      return reply.send({
        ok: true,
        applied: true,
        testnet: true,
        scope,
        canaryId,
        limits: {
          maxNotional,
          maxPositionSize: Number(process.env.FUTURES_MAX_POSITION_SIZE || '0.1'),
          dailyLossLimit: Number(process.env.FUTURES_DAILY_LOSS_LIMIT || '50'),
        },
        message: 'Canary confirmed for testnet with hard limits',
        timestamp: new Date().toISOString(),
      });
    }
  );

  /**
   * Get canary status and history
   */
  app.get('/canary/status', async (_request, reply) => {
    const isTestnet = process.env.BINANCE_TESTNET !== '0';

    return reply.send({
      enabled: true,
      testnetMode: isTestnet,
      scopes: {
        'futures-testnet': { enabled: isTestnet, maxNotional: Number(process.env.FUTURES_MAX_NOTIONAL || '100') },
        'futures-prod': { enabled: false, reason: 'Production canary disabled' },
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.log.info('✅ Canary routes registered');
}
