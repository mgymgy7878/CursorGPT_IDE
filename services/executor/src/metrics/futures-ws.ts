// services/executor/src/metrics/futures-ws.ts
import { Counter, Gauge } from 'prom-client';

/**
 * Futures WebSocket connection counter
 * Tracks total number of WS connections
 */
export const futuresWsConnects = new Counter({
  name: 'spark_futures_ws_connects_total',
  help: 'Total Futures WebSocket connections',
  labelNames: ['stream_type'], // market, userData
});

/**
 * Futures WebSocket reconnection counter
 * Tracks reconnection attempts
 */
export const futuresWsReconnects = new Counter({
  name: 'spark_futures_ws_reconnects_total',
  help: 'Total Futures WebSocket reconnections',
  labelNames: ['stream_type'],
});

/**
 * Futures WebSocket message counter
 * Tracks total messages received
 */
export const futuresWsMessages = new Counter({
  name: 'spark_futures_ws_messages_total',
  help: 'Total Futures WebSocket messages received',
  labelNames: ['stream_type', 'message_type'],
});

/**
 * Futures WebSocket error counter
 * Tracks WebSocket errors
 */
export const futuresWsErrors = new Counter({
  name: 'spark_futures_ws_errors_total',
  help: 'Total Futures WebSocket errors',
  labelNames: ['stream_type', 'error_type'],
});

/**
 * Futures WebSocket connection duration
 * Tracks how long the connection has been alive
 */
export const futuresWsConnectionDuration = new Gauge({
  name: 'spark_futures_ws_connection_duration_seconds',
  help: 'Futures WebSocket connection duration in seconds',
  labelNames: ['stream_type'],
});

/**
 * Futures WebSocket connection status
 * 1 = connected, 0 = disconnected
 */
export const futuresWsConnectionStatus = new Gauge({
  name: 'spark_futures_ws_connection_status',
  help: 'Futures WebSocket connection status (1=connected, 0=disconnected)',
  labelNames: ['stream_type'],
});

/**
 * Helper: Record WS metrics
 */
export const futuresWsMetrics = {
  connects: futuresWsConnects,
  reconnects: futuresWsReconnects,
  messages: futuresWsMessages,
  errors: futuresWsErrors,
  connectionSeconds: futuresWsConnectionDuration,
  connectionStatus: futuresWsConnectionStatus,
};

