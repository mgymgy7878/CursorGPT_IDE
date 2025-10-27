// services/marketdata/src/metrics/bist.ts
import { Counter, Gauge } from 'prom-client';

/**
 * BIST WebSocket connection counter
 */
export const bistWsConnects = new Counter({
  name: 'spark_bist_ws_connects_total',
  help: 'Total BIST WebSocket connections',
  labelNames: [],
});

/**
 * BIST WebSocket message counter
 */
export const bistWsMessages = new Counter({
  name: 'spark_bist_ws_messages_total',
  help: 'Total BIST WebSocket messages received',
  labelNames: ['message_type'], // trade, depth, etc.
});

/**
 * BIST WebSocket error counter
 */
export const bistWsErrors = new Counter({
  name: 'spark_bist_ws_errors_total',
  help: 'Total BIST WebSocket errors',
  labelNames: ['error_type'],
});

/**
 * BIST data staleness (seconds since last update)
 */
export const bistStaleness = new Gauge({
  name: 'spark_bist_staleness_seconds',
  help: 'Seconds since last BIST tick',
  labelNames: [],
});

/**
 * BIST last update timestamp
 */
export const bistLastUpdate = new Gauge({
  name: 'spark_bist_last_update_timestamp',
  help: 'Unix timestamp of last BIST update',
  labelNames: [],
});

/**
 * BIST Money Flow - CVD
 */
export const bistCVD = new Gauge({
  name: 'spark_bist_cvd',
  help: 'BIST Cumulative Volume Delta',
  labelNames: ['symbol'],
});

/**
 * BIST Money Flow - NMF
 */
export const bistNMF = new Gauge({
  name: 'spark_bist_nmf',
  help: 'BIST Net Money Flow',
  labelNames: ['symbol', 'timeframe'],
});

/**
 * BIST Money Flow - OBI
 */
export const bistOBI = new Gauge({
  name: 'spark_bist_obi',
  help: 'BIST Order Book Imbalance',
  labelNames: ['symbol'],
});

/**
 * BIST VWAP
 */
export const bistVWAP = new Gauge({
  name: 'spark_bist_vwap',
  help: 'BIST Volume Weighted Average Price',
  labelNames: ['symbol'],
});

/**
 * Metrics export object
 */
export const bistMetrics = {
  wsConnects: bistWsConnects,
  wsMessages: bistWsMessages,
  wsErrors: bistWsErrors,
  staleness: bistStaleness,
  lastUpdate: bistLastUpdate,
  cvd: bistCVD,
  nmf: bistNMF,
  obi: bistOBI,
  vwap: bistVWAP,
};

