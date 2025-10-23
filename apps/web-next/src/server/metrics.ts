export type Metrics = {
  counters: {
    spark_ws_btcturk_msgs_total: number;
    spark_ws_trades_msgs_total: number;
    spark_ws_orderbook_msgs_total: number;
    spark_ws_trades_errors_total: number;
    spark_ws_orderbook_errors_total: number;
    spark_ws_reconnects_total: number;
  };
  gauges: { spark_ws_last_message_ts: number; spark_ws_staleness_seconds: number };
  flags: { spark_ws_paused: boolean };
};

const g = globalThis as any;
if (!g.__sparkMetrics) {
  g.__sparkMetrics = {
    counters: {
      spark_ws_btcturk_msgs_total: 0,
      spark_ws_trades_msgs_total: 0,
      spark_ws_orderbook_msgs_total: 0,
      spark_ws_trades_errors_total: 0,
      spark_ws_orderbook_errors_total: 0,
      spark_ws_reconnects_total: 0,
    },
    gauges: { spark_ws_last_message_ts: 0, spark_ws_staleness_seconds: 0 },
    flags: { spark_ws_paused: false },
  } as Metrics;

  // Server-side staleness ticker
  const t = setInterval(() => {
    const now = Date.now();
    const last = g.__sparkMetrics.gauges.spark_ws_last_message_ts || now;
    g.__sparkMetrics.gauges.spark_ws_staleness_seconds = Math.max(0, (now - last) / 1000);
  }, 1000);
  // avoid keeping process alive in node
  (t as any).unref?.();

  // In mock mode, periodically bump counters to simulate traffic
  try {
    const useMock = process.env.NEXT_PUBLIC_WS_MOCK === '1' || process.env.WS_MODE === 'mock';
    if (useMock) {
      const tm = setInterval(() => {
        g.__sparkMetrics.counters.spark_ws_btcturk_msgs_total += Math.floor(Math.random() * 3) + 1;
        g.__sparkMetrics.gauges.spark_ws_last_message_ts = Date.now();
        // staleness will be updated by the 1s ticker above
      }, 1500);
      (tm as any).unref?.();
    }
  } catch {}
}

export const metrics: Metrics = g.__sparkMetrics as Metrics;

export function onWsMessageServerSide() {
  metrics.counters.spark_ws_btcturk_msgs_total += 1;
  metrics.gauges.spark_ws_last_message_ts = Date.now();
}

export function incCounter(name: keyof Metrics['counters'], v = 1) {
  metrics.counters[name] = (metrics.counters[name] ?? 0) + v;
}

export function setGauge(name: keyof Metrics['gauges'], value: number) {
  metrics.gauges[name] = value;
}

export function onWsReconnect() {
  metrics.counters.spark_ws_reconnects_total += 1;
}


