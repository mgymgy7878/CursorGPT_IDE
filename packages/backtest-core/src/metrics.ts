import { register, Counter, Histogram, Gauge } from 'prom-client';

// Backtest Engine Metrics
export const backtestMetrics = {
  // Runtime metrics
  backtestRuntime: new Histogram({
    name: 'backtest_runtime_ms_bucket',
    help: 'Backtest execution time in milliseconds',
    labelNames: ['strategy', 'dataset', 'timeframe'],
    buckets: [100, 500, 1000, 2500, 5000, 10000, 30000, 60000, '+Inf']
  }),
  
  // Dataset metrics
  datasetBytes: new Gauge({
    name: 'dataset_bytes_total',
    help: 'Total dataset size in bytes',
    labelNames: ['dataset', 'format']
  }),
  
  // Simulation metrics
  simFills: new Counter({
    name: 'sim_fills_total',
    help: 'Total number of simulated fills',
    labelNames: ['strategy', 'symbol', 'side']
  }),
  
  // PnL metrics
  simPnL: new Histogram({
    name: 'sim_pnl_hist_bucket',
    help: 'Simulated PnL distribution',
    labelNames: ['strategy', 'symbol'],
    buckets: [-1000, -500, -100, -50, -10, 0, 10, 50, 100, 500, 1000, '+Inf']
  }),
  
  // Performance metrics
  backtestThroughput: new Gauge({
    name: 'backtest_throughput_ops_per_sec',
    help: 'Backtest operations per second',
    labelNames: ['strategy', 'dataset']
  }),
  
  // Error metrics
  backtestErrors: new Counter({
    name: 'backtest_errors_total',
    help: 'Total number of backtest errors',
    labelNames: ['strategy', 'error_type']
  }),
  
  // Memory metrics
  backtestMemory: new Gauge({
    name: 'backtest_memory_bytes',
    help: 'Backtest memory usage in bytes',
    labelNames: ['strategy', 'dataset']
  })
};

// Registry'ye ekle
register.registerMetric(backtestMetrics.backtestRuntime);
register.registerMetric(backtestMetrics.datasetBytes);
register.registerMetric(backtestMetrics.simFills);
register.registerMetric(backtestMetrics.simPnL);
register.registerMetric(backtestMetrics.backtestThroughput);
register.registerMetric(backtestMetrics.backtestErrors);
register.registerMetric(backtestMetrics.backtestMemory);

export { register };
