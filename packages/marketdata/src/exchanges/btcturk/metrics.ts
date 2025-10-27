/**
 * BTCTurk Prometheus Metrics
 * Market data monitoring for Spark Trading Platform
 */

import { register, Counter, Gauge, Histogram } from 'prom-client';

// WebSocket Connection Metrics
export const btcturkWsConnected = new Gauge({
  name: 'btcturk_ws_connected',
  help: 'BTCTurk WebSocket connection status (0/1)',
  labelNames: ['symbol']
});

export const btcturkWsReconnectsTotal = new Counter({
  name: 'btcturk_ws_reconnects_total',
  help: 'Total BTCTurk WebSocket reconnection attempts',
  labelNames: ['symbol', 'reason']
});

export const btcturkWsMessagesTotal = new Counter({
  name: 'btcturk_ws_messages_total',
  help: 'Total BTCTurk WebSocket messages received',
  labelNames: ['channel', 'symbol']
});

export const btcturkLastMsgAgeSeconds = new Gauge({
  name: 'btcturk_last_msg_age_seconds',
  help: 'Age of last message from BTCTurk WebSocket',
  labelNames: ['channel', 'symbol']
});

// Market Data Metrics
export const marketdataNormalizedTradesTotal = new Counter({
  name: 'marketdata_normalized_trades_total',
  help: 'Total normalized trades processed',
  labelNames: ['exchange', 'symbol']
});

export const marketdataNormalizedOrderbookTotal = new Counter({
  name: 'marketdata_normalized_orderbook_total',
  help: 'Total normalized orderbook updates processed',
  labelNames: ['exchange', 'symbol']
});

export const marketdataNormalizedTickerTotal = new Counter({
  name: 'marketdata_normalized_ticker_total',
  help: 'Total normalized ticker updates processed',
  labelNames: ['exchange', 'symbol']
});

// Error Metrics
export const btcturkErrorsTotal = new Counter({
  name: 'btcturk_errors_total',
  help: 'Total BTCTurk errors',
  labelNames: ['type', 'symbol']
});

export const btcturkLatencyMs = new Histogram({
  name: 'btcturk_latency_ms',
  help: 'BTCTurk API latency in milliseconds',
  labelNames: ['endpoint', 'method'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

// Register all metrics
register.registerMetric(btcturkWsConnected);
register.registerMetric(btcturkWsReconnectsTotal);
register.registerMetric(btcturkWsMessagesTotal);
register.registerMetric(btcturkLastMsgAgeSeconds);
register.registerMetric(marketdataNormalizedTradesTotal);
register.registerMetric(marketdataNormalizedOrderbookTotal);
register.registerMetric(marketdataNormalizedTickerTotal);
register.registerMetric(btcturkErrorsTotal);
register.registerMetric(btcturkLatencyMs);
