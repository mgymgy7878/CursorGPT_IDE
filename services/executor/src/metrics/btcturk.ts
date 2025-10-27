import client from "../lib/metrics.js";

// BTCTurk error metrics
export const btcturkErrors = new client.Counter({
  name: 'spark_btcturk_errors_total',
  help: 'BTCTurk API errors by type',
  labelNames: ['error_type', 'endpoint']
});

// BTCTurk request metrics
export const btcturkRequests = new client.Counter({
  name: 'spark_btcturk_requests_total',
  help: 'BTCTurk API requests',
  labelNames: ['endpoint', 'method', 'status']
});

// BTCTurk request duration
export const btcturkDuration = new client.Histogram({
  name: 'spark_btcturk_request_duration_seconds',
  help: 'BTCTurk API request duration',
  labelNames: ['endpoint', 'method'],
  buckets: [0.1, 0.2, 0.5, 1, 2, 5, 10]
});

// BIST session violations
export const bistSessionViolations = new client.Counter({
  name: 'spark_bist_session_violations_total',
  help: 'BIST session violations (attempts outside trading hours)',
  labelNames: ['symbol', 'operation']
});

// Clock drift metric
export const clockDrift = new client.Gauge({
  name: 'spark_clock_drift_seconds',
  help: 'Clock drift between local and server time',
  labelNames: ['exchange']
});

// Helper functions
export function recordBtcturkError(errorType: string, endpoint: string) {
  btcturkErrors.inc({ error_type: errorType, endpoint });
}

export function recordBtcturkRequest(endpoint: string, method: string, status: string) {
  btcturkRequests.inc({ endpoint, method, status });
}

export function recordBtcturkDuration(endpoint: string, method: string, duration: number) {
  btcturkDuration.observe({ endpoint, method }, duration);
}

export function recordBistSessionViolation(symbol: string, operation: string) {
  bistSessionViolations.inc({ symbol, operation });
}

export function recordClockDrift(exchange: string, driftMs: number) {
  clockDrift.set({ exchange }, driftMs / 1000);
}
