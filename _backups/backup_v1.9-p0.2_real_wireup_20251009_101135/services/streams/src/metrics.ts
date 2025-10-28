import { register, Counter, Histogram, Gauge } from 'prom-client';

// Metrics registry
export const metrics = {
  // WebSocket mesaj sayısı
  wsMessagesTotal: new Counter({
    name: 'ws_msgs_total',
    help: 'Total number of WebSocket messages',
    labelNames: ['exchange', 'channel']
  }),
  
  // WebSocket gap histogram
  wsGapMs: new Histogram({
    name: 'ws_gap_ms_bucket',
    help: 'WebSocket message gap in milliseconds',
    labelNames: ['exchange', 'channel'],
    buckets: [10, 50, 100, 250, 500, 1000, 1500, 2000, 5000, 10000, Number.POSITIVE_INFINITY]
  }),
  
  // Ingest latency histogram
  ingestLatencyMs: new Histogram({
    name: 'ingest_latency_ms_bucket',
    help: 'Message ingestion latency in milliseconds',
    labelNames: ['exchange', 'channel'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, Number.POSITIVE_INFINITY]
  }),
  
  // WebSocket connection state
  wsConnState: new Gauge({
    name: 'ws_conn_state',
    help: 'WebSocket connection state (1=connected, 0=disconnected)',
    labelNames: ['exchange', 'channel']
  }),
  
  // Sequence gap counter
  seqGapTotal: new Counter({
    name: 'ws_seq_gap_total',
    help: 'Total sequence gaps detected',
    labelNames: ['exchange', 'channel']
  })
};

// Registry'ye ekle
register.registerMetric(metrics.wsMessagesTotal);
register.registerMetric(metrics.wsGapMs);
register.registerMetric(metrics.ingestLatencyMs);
register.registerMetric(metrics.wsConnState);
register.registerMetric(metrics.seqGapTotal);

// Export register
export { register };