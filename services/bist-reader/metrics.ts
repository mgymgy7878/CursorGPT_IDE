/**
 * BIST Reader Prometheus Metrics
 * Monitoring for BIST market data processing
 */

import { register, Counter, Gauge, Histogram } from 'prom-client';

// Job Execution Metrics
export const bistReaderJobSeconds = new Histogram({
  name: 'bist_reader_job_seconds',
  help: 'BIST Reader job execution time in seconds',
  labelNames: ['source', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300]
});

export const bistReaderSuccessTotal = new Counter({
  name: 'bist_reader_success_total',
  help: 'Total successful BIST Reader jobs',
  labelNames: ['source']
});

export const bistReaderFailTotal = new Counter({
  name: 'bist_reader_fail_total',
  help: 'Total failed BIST Reader jobs',
  labelNames: ['source', 'type']
});

export const bistReaderLatencyMs = new Histogram({
  name: 'bist_reader_latency_ms',
  help: 'BIST Reader fetch latency in milliseconds',
  labelNames: ['source'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

// Data Processing Metrics
export const bistReaderDataTotal = new Counter({
  name: 'bist_reader_data_total',
  help: 'Total BIST data records processed',
  labelNames: ['source', 'symbol']
});

export const bistReaderDataErrorsTotal = new Counter({
  name: 'bist_reader_data_errors_total',
  help: 'Total BIST data processing errors',
  labelNames: ['source', 'type']
});

// Scheduler Metrics
export const bistReaderSchedulerRunsTotal = new Counter({
  name: 'bist_reader_scheduler_runs_total',
  help: 'Total BIST Reader scheduler runs',
  labelNames: ['interval', 'status']
});

export const bistReaderLastRunTimestamp = new Gauge({
  name: 'bist_reader_last_run_timestamp',
  help: 'Timestamp of last BIST Reader run',
  labelNames: ['source']
});

export const bistReaderNextRunTimestamp = new Gauge({
  name: 'bist_reader_next_run_timestamp',
  help: 'Timestamp of next scheduled BIST Reader run',
  labelNames: ['interval']
});

// Market Status Metrics
export const bistReaderMarketStatus = new Gauge({
  name: 'bist_reader_market_status',
  help: 'BIST market status (0=closed, 1=open)',
  labelNames: ['market']
});

export const bistReaderActiveJobs = new Gauge({
  name: 'bist_reader_active_jobs',
  help: 'Number of active BIST Reader jobs',
  labelNames: ['source']
});

// Register all metrics
register.registerMetric(bistReaderJobSeconds);
register.registerMetric(bistReaderSuccessTotal);
register.registerMetric(bistReaderFailTotal);
register.registerMetric(bistReaderLatencyMs);
register.registerMetric(bistReaderDataTotal);
register.registerMetric(bistReaderDataErrorsTotal);
register.registerMetric(bistReaderSchedulerRunsTotal);
register.registerMetric(bistReaderLastRunTimestamp);
register.registerMetric(bistReaderNextRunTimestamp);
register.registerMetric(bistReaderMarketStatus);
register.registerMetric(bistReaderActiveJobs);
