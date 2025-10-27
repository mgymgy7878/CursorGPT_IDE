import { register, Counter, Histogram, Gauge } from 'prom-client';
// Optimizer Concurrency Metrics
export const optimizerMetrics = {
    // Job counters
    optimizerJobsTotal: new Counter({
        name: 'optimizer_jobs_total',
        help: 'Total number of optimizer jobs',
        labelNames: ['kind', 'source', 'status']
    }),
    // Preemptions
    optimizerPreemptionsTotal: new Counter({
        name: 'optimizer_preemptions_total',
        help: 'Total number of job preemptions',
        labelNames: ['reason']
    }),
    // Workers
    optimizerWorkersRunning: new Gauge({
        name: 'optimizer_workers_running',
        help: 'Number of running workers',
        labelNames: []
    }),
    // Queue depth
    optimizerQueueDepth: new Gauge({
        name: 'optimizer_queue_depth',
        help: 'Queue depth by priority',
        labelNames: ['priority']
    }),
    // Resource usage
    optimizerResourceCpuPct: new Gauge({
        name: 'optimizer_resource_cpu_pct',
        help: 'CPU usage percentage',
        labelNames: []
    }),
    optimizerResourceMemPct: new Gauge({
        name: 'optimizer_resource_mem_pct',
        help: 'Memory usage percentage',
        labelNames: []
    }),
    // Step latency
    optimizerStepLatencyMs: new Histogram({
        name: 'optimizer_step_latency_ms_bucket',
        help: 'Step latency in milliseconds',
        labelNames: ['step'],
        buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, '+Inf']
    }),
    // Queue wait time
    optimizerQueueWaitMs: new Histogram({
        name: 'optimizer_queue_wait_ms_bucket',
        help: 'Queue wait time in milliseconds',
        labelNames: ['priority'],
        buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, '+Inf']
    }),
    // Job runtime
    optimizerJobRuntimeMs: new Histogram({
        name: 'optimizer_job_runtime_ms_bucket',
        help: 'Total job runtime in milliseconds',
        labelNames: ['kind'],
        buckets: [100, 500, 1000, 2500, 5000, 10000, 30000, 60000, '+Inf']
    }),
    // Job payload size
    optimizerJobPayloadKb: new Histogram({
        name: 'optimizer_job_payload_kb',
        help: 'Job payload size in kilobytes',
        labelNames: ['kind'],
        buckets: [1, 5, 10, 50, 100, 500, 1000, 5000, '+Inf']
    })
};
// Register all metrics
register.registerMetric(optimizerMetrics.optimizerJobsTotal);
register.registerMetric(optimizerMetrics.optimizerPreemptionsTotal);
register.registerMetric(optimizerMetrics.optimizerWorkersRunning);
register.registerMetric(optimizerMetrics.optimizerQueueDepth);
register.registerMetric(optimizerMetrics.optimizerResourceCpuPct);
register.registerMetric(optimizerMetrics.optimizerResourceMemPct);
register.registerMetric(optimizerMetrics.optimizerStepLatencyMs);
register.registerMetric(optimizerMetrics.optimizerQueueWaitMs);
register.registerMetric(optimizerMetrics.optimizerJobRuntimeMs);
register.registerMetric(optimizerMetrics.optimizerJobPayloadKb);
export { register };
