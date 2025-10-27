// Export@Scale + Observability Metrics (v1.7)
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Export request counters
export const exportRequestsTotal = new Counter({
  name: 'export_requests_total',
  help: 'Total number of export requests',
  labelNames: ['format', 'status', 'user']
});

// Export latency histogram
export const exportLatencyMsBucket = new Histogram({
  name: 'export_latency_ms_bucket',
  help: 'Export processing time in milliseconds',
  labelNames: ['format', 'size'],
  buckets: [100, 500, 1000, 2500, 5000, 10000, 30000, 60000, Number.POSITIVE_INFINITY]
});

// Export bytes total
export const exportBytesTotal = new Counter({
  name: 'export_bytes_total',
  help: 'Total bytes exported',
  labelNames: ['format', 'status']
});

// Concurrent exports running
export const exportConcurrentRunning = new Gauge({
  name: 'export_concurrent_running',
  help: 'Number of concurrent exports running'
});

// Export failures
export const exportFailTotal = new Counter({
  name: 'export_fail_total',
  help: 'Total number of export failures',
  labelNames: ['reason', 'format']
});

// Export queue depth
export const exportQueueDepth = new Gauge({
  name: 'export_queue_depth',
  help: 'Export queue depth'
});

// Export memory usage
export const exportMemoryBytes = new Gauge({
  name: 'export_memory_bytes',
  help: 'Export memory usage in bytes',
  labelNames: ['format']
});

// Export throughput
export const exportThroughputOpsPerSec = new Gauge({
  name: 'export_throughput_ops_per_sec',
  help: 'Export operations per second',
  labelNames: ['format']
});

// Export success rate
export const exportSuccessRate = new Gauge({
  name: 'export_success_rate',
  help: 'Export success rate (0-1)',
  labelNames: ['format']
});

export { register };
