import client from "prom-client";

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "spark_" });

export const btRunsTotal = new client.Counter({ 
  name: "bt_runs_total", 
  help: "Backtest runs", 
  registers: [registry], 
  labelNames: ["status"] 
});

export const btRuntimeMs = new client.Histogram({ 
  name: "bt_runtime_ms", 
  help: "Backtest runtime", 
  buckets: [100, 300, 1000, 3000, 10000, 30000], 
  registers: [registry] 
});

export const btMaxDD = new client.Gauge({ 
  name: "bt_max_dd", 
  help: "Backtest max drawdown", 
  registers: [registry] 
});

export const btSharpe = new client.Gauge({ 
  name: "bt_sharpe", 
  help: "Backtest sharpe", 
  registers: [registry] 
});

export function metricsRegistry() { 
  return registry; 
}