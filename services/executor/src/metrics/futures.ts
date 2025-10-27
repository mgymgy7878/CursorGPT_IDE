// services/executor/src/metrics/futures.ts
import { Counter, Gauge, Histogram } from 'prom-client';

/**
 * Futures order placement latency
 * Tracks how long it takes to place an order
 */
export const futuresOrderLatency = new Histogram({
  name: 'spark_futures_order_place_latency_ms',
  help: 'Futures order placement latency in milliseconds',
  labelNames: ['symbol', 'type', 'side'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
});

/**
 * Futures order acknowledgement counter
 * Tracks successful order placements
 */
export const futuresOrderAck = new Counter({
  name: 'spark_futures_order_ack_total',
  help: 'Total futures order acknowledgements',
  labelNames: ['symbol', 'side', 'type'],
});

/**
 * Futures order rejection counter
 * Tracks failed order placements
 */
export const futuresOrderReject = new Counter({
  name: 'spark_futures_order_reject_total',
  help: 'Total futures order rejections',
  labelNames: ['symbol', 'reason'],
});

/**
 * Futures WebSocket reconnection counter
 */
export const futuresWsReconnects = new Counter({
  name: 'spark_futures_ws_reconnects_total',
  help: 'Total futures WebSocket reconnections',
  labelNames: ['stream_type'],
});

/**
 * Futures WebSocket connection uptime
 */
export const futuresWsUptime = new Gauge({
  name: 'spark_futures_ws_uptime_seconds',
  help: 'Futures WebSocket connection uptime in seconds',
  labelNames: ['stream_type'],
});

/**
 * Futures unrealized PnL
 */
export const futuresPnlUnrealized = new Gauge({
  name: 'spark_futures_pnl_unrealized_usd',
  help: 'Unrealized PnL in USD for futures positions',
  labelNames: ['symbol', 'position_side'],
});

/**
 * Futures margin ratio
 */
export const futuresMarginRatio = new Gauge({
  name: 'spark_futures_margin_ratio',
  help: 'Futures account margin ratio',
  labelNames: [],
});

/**
 * Futures rate limit remaining
 */
export const futuresRateLimitRemaining = new Gauge({
  name: 'spark_futures_rate_limit_remaining',
  help: 'Remaining rate limit capacity',
  labelNames: ['limit_type'],
});

/**
 * Futures position count
 */
export const futuresPositionCount = new Gauge({
  name: 'spark_futures_position_count',
  help: 'Number of open futures positions',
  labelNames: ['position_side'],
});

/**
 * Futures account balance
 */
export const futuresAccountBalance = new Gauge({
  name: 'spark_futures_account_balance_usd',
  help: 'Futures account balance in USD',
  labelNames: ['balance_type'], // total, available, margin
});

/**
 * Helper: Record order placement
 */
export function recordFuturesOrder(
  symbol: string,
  side: string,
  type: string,
  startTime: number,
  success: boolean,
  error?: Error
) {
  const duration = Date.now() - startTime;
  
  futuresOrderLatency.observe({ symbol, type, side }, duration);
  
  if (success) {
    futuresOrderAck.inc({ symbol, side, type });
  } else if (error) {
    const reason = error.message.includes('insufficient')
      ? 'insufficient_margin'
      : error.message.includes('limit')
      ? 'rate_limit'
      : error.message.includes('notional')
      ? 'min_notional'
      : 'unknown';
    futuresOrderReject.inc({ symbol, reason });
  }
}

/**
 * Helper: Update position metrics
 */
export function updatePositionMetrics(positions: any[]) {
  const longCount = positions.filter(p => parseFloat(p.positionAmt) > 0).length;
  const shortCount = positions.filter(p => parseFloat(p.positionAmt) < 0).length;
  
  futuresPositionCount.set({ position_side: 'LONG' }, longCount);
  futuresPositionCount.set({ position_side: 'SHORT' }, shortCount);
  
  for (const pos of positions) {
    const amt = parseFloat(pos.positionAmt);
    if (amt !== 0) {
      const side = amt > 0 ? 'LONG' : 'SHORT';
      futuresPnlUnrealized.set(
        { symbol: pos.symbol, position_side: side },
        parseFloat(pos.unRealizedProfit)
      );
    }
  }
}

/**
 * Helper: Update account metrics
 */
export function updateAccountMetrics(account: any) {
  futuresAccountBalance.set(
    { balance_type: 'total' },
    parseFloat(account.totalWalletBalance || 0)
  );
  futuresAccountBalance.set(
    { balance_type: 'available' },
    parseFloat(account.availableBalance || 0)
  );
  futuresAccountBalance.set(
    { balance_type: 'margin' },
    parseFloat(account.totalMarginBalance || 0)
  );
  
  // Margin ratio calculation
  const marginBalance = parseFloat(account.totalMarginBalance || 0);
  const walletBalance = parseFloat(account.totalWalletBalance || 0);
  if (walletBalance > 0) {
    futuresMarginRatio.set(marginBalance / walletBalance);
  }
}

