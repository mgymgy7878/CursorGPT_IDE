// services/executor/src/plugins/risk-gate.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Risk parameters from environment
 */
const RISK_CONFIG = {
  maxNotional: Number(process.env.FUTURES_MAX_NOTIONAL || '100'), // USD
  maxPositionSize: Number(process.env.FUTURES_MAX_POSITION_SIZE || '0.1'), // BTC equivalent
  dailyLossLimit: Number(process.env.FUTURES_DAILY_LOSS_LIMIT || '50'), // USD
  maxLeverage: Number(process.env.FUTURES_MAX_LEVERAGE || '5'),
  circuitBreakerEnabled: process.env.FUTURES_CIRCUIT_BREAKER !== '0',
};

/**
 * Circuit breaker state
 */
let circuitBreakerOpen = false;
let circuitBreakerReason: string | null = null;
let dailyLoss = 0;
let lastResetDate = new Date().toDateString();

/**
 * Reset daily counters
 */
function resetDailyCounters() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyLoss = 0;
    lastResetDate = today;
    console.log('[RiskGate] Daily counters reset');
  }
}

/**
 * Open circuit breaker
 */
export function openCircuitBreaker(reason: string) {
  circuitBreakerOpen = true;
  circuitBreakerReason = reason;
  console.error(`[RiskGate] 🚨 CIRCUIT BREAKER OPENED: ${reason}`);
}

/**
 * Close circuit breaker (manual intervention required)
 */
export function closeCircuitBreaker() {
  circuitBreakerOpen = false;
  circuitBreakerReason = null;
  console.log('[RiskGate] ✅ Circuit breaker closed');
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus() {
  return {
    open: circuitBreakerOpen,
    reason: circuitBreakerReason,
    dailyLoss,
    dailyLossLimit: RISK_CONFIG.dailyLossLimit,
  };
}

/**
 * Risk gate plugin
 * Validates futures orders against risk parameters
 */
export async function riskGatePlugin(app: FastifyInstance) {
  console.log('[RiskGate] Initialized with config:', RISK_CONFIG);

  // Periodic reset of daily counters
  setInterval(resetDailyCounters, 60000); // Check every minute

  // Pre-handler hook for futures orders
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only apply to futures order endpoints
    if (!request.routerPath?.includes('/futures/order') || request.method !== 'POST') {
      return;
    }

    // Circuit breaker check
    if (RISK_CONFIG.circuitBreakerEnabled && circuitBreakerOpen) {
      return reply.code(503).send({
        error: 'CircuitBreakerOpen',
        reason: circuitBreakerReason,
        message: 'Trading is temporarily suspended. Contact admin to reset.',
      });
    }

    const body = (request as any).body || {};
    
    // Skip dry-run orders
    if (body.dryRun !== false) {
      return;
    }

    // Validate notional size
    const price = body.price || 0;
    const quantity = body.quantity || 0;
    const notional = price * quantity;

    if (notional > RISK_CONFIG.maxNotional) {
      console.warn(`[RiskGate] ❌ Max notional exceeded: ${notional} > ${RISK_CONFIG.maxNotional}`);
      return reply.code(400).send({
        error: 'MaxNotionalExceeded',
        limit: RISK_CONFIG.maxNotional,
        attempted: notional,
        message: `Order notional ${notional} USD exceeds limit ${RISK_CONFIG.maxNotional} USD`,
      });
    }

    // Validate position size (BTC equivalent)
    if (body.symbol === 'BTCUSDT' && quantity > RISK_CONFIG.maxPositionSize) {
      console.warn(`[RiskGate] ❌ Max position size exceeded: ${quantity} > ${RISK_CONFIG.maxPositionSize}`);
      return reply.code(400).send({
        error: 'MaxPositionSizeExceeded',
        limit: RISK_CONFIG.maxPositionSize,
        attempted: quantity,
        message: `Position size ${quantity} exceeds limit ${RISK_CONFIG.maxPositionSize}`,
      });
    }

    // Daily loss limit check
    if (dailyLoss >= RISK_CONFIG.dailyLossLimit) {
      console.warn(`[RiskGate] ❌ Daily loss limit reached: ${dailyLoss} >= ${RISK_CONFIG.dailyLossLimit}`);
      openCircuitBreaker(`Daily loss limit (${RISK_CONFIG.dailyLossLimit} USD) reached`);
      return reply.code(429).send({
        error: 'DailyLossLimitReached',
        limit: RISK_CONFIG.dailyLossLimit,
        current: dailyLoss,
        message: 'Daily loss limit reached. Trading suspended until next day.',
      });
    }

    console.log('[RiskGate] ✅ Order passed risk checks:', {
      symbol: body.symbol,
      notional,
      quantity,
      dailyLoss,
    });
  });

  // Endpoint to get risk status
  app.get('/futures/risk/status', async () => {
    return {
      config: RISK_CONFIG,
      circuitBreaker: getCircuitBreakerStatus(),
      timestamp: Date.now(),
    };
  });

  // Endpoint to manually close circuit breaker (admin only)
  app.post('/futures/risk/circuit-breaker/close', async () => {
    closeCircuitBreaker();
    return { success: true, status: getCircuitBreakerStatus() };
  });

  // Endpoint to record PnL (for daily loss tracking)
  app.post<{ Body: { pnl: number } }>('/futures/risk/record-pnl', async (request) => {
    const { pnl } = request.body;
    if (pnl < 0) {
      dailyLoss += Math.abs(pnl);
      console.log(`[RiskGate] Daily loss updated: ${dailyLoss} USD`);
    }
    return { dailyLoss, dailyLossLimit: RISK_CONFIG.dailyLossLimit };
  });
}

