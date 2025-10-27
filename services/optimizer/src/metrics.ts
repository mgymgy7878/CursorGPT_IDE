import { register, Counter, Histogram, Gauge } from 'prom-client';

// Optimizer Concurrency Metrics
export const optimizerMetrics = {
  // Active strategies count
  optimizerRunning: new Gauge({
    name: 'optimizer_running',
    help: 'Number of currently running strategies',
    labelNames: ['strategy_type', 'priority']
  }),
  
  // Queue depth
  optimizerQueueDepth: new Gauge({
    name: 'optimizer_queue_depth',
    help: 'Number of strategies waiting in queue',
    labelNames: ['strategy_type', 'priority']
  }),
  
  // Execution time histogram
  optimizerStepLatencyMs: new Histogram({
    name: 'optimizer_step_latency_ms',
    help: 'Strategy execution step latency in milliseconds',
    labelNames: ['strategy_type', 'step_name'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, '+Inf']
  }),
  
  // Resource usage per strategy
  optimizerResourceUsage: new Gauge({
    name: 'optimizer_resource_usage',
    help: 'Resource usage per strategy (CPU %, Memory MB)',
    labelNames: ['strategy_id', 'resource_type', 'strategy_type']
  }),
  
  // Deadlock detection
  optimizerDeadlockTotal: new Counter({
    name: 'optimizer_deadlock_total',
    help: 'Total number of deadlocks detected',
    labelNames: ['strategy_type', 'deadlock_type']
  }),
  
  // Strategy completion rate
  optimizerCompletionRate: new Counter({
    name: 'optimizer_completion_total',
    help: 'Total number of strategy completions',
    labelNames: ['strategy_type', 'status']
  }),
  
  // Queue wait time
  optimizerQueueWaitMs: new Histogram({
    name: 'optimizer_queue_wait_ms',
    help: 'Time strategies spend waiting in queue',
    labelNames: ['strategy_type', 'priority'],
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, '+Inf']
  }),
  
  // Resource limit violations
  optimizerResourceLimitViolations: new Counter({
    name: 'optimizer_resource_limit_violations_total',
    help: 'Total number of resource limit violations',
    labelNames: ['strategy_id', 'resource_type', 'limit_type']
  })
};

// Registry'ye ekle
register.registerMetric(optimizerMetrics.optimizerRunning);
register.registerMetric(optimizerMetrics.optimizerQueueDepth);
register.registerMetric(optimizerMetrics.optimizerStepLatencyMs);
register.registerMetric(optimizerMetrics.optimizerResourceUsage);
register.registerMetric(optimizerMetrics.optimizerDeadlockTotal);
register.registerMetric(optimizerMetrics.optimizerCompletionRate);
register.registerMetric(optimizerMetrics.optimizerQueueWaitMs);
register.registerMetric(optimizerMetrics.optimizerResourceLimitViolations);
