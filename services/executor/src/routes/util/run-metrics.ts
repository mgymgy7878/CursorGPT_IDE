import { Counter, Histogram } from 'prom-client';

export const runJobsTotal = new Counter({
  name: 'spark_backtest_run_jobs_total',
  help: 'Count of /backtest/run jobs',
  labelNames: ['exchange','timeframe']
});

export const runErrorsTotal = new Counter({
  name: 'spark_backtest_run_errors_total',
  help: 'Errors in /backtest/run'
});

export const runLatency = new Histogram({
  name: 'spark_backtest_run_latency_ms',
  help: 'Latency of /backtest/run',
  buckets: [50,100,200,400,800,1200,2000,5000,10000]
});

