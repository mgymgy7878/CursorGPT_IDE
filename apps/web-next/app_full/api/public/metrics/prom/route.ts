import { NextResponse } from "next/server";

/** Global metrics interface */
declare global {
  var sparkProxyMetrics: {
    requests: { inc: (labels: { path: string; code: number }) => void };
    duration: { observe: (labels: { path: string }, value: number) => void };
    errors: { inc: (labels: { reason: string }) => void };
    bodyRejected: { inc: () => void };
    rateLimited: { inc: (labels: { path: string }) => void };
    circuitOpen: { inc: () => void };
  } | undefined;
  
  var sparkStrategyMetrics: {
    generate: { inc: (labels: { status: string }) => void };
    build: { inc: (labels: { status: string }) => void };
    backtest: { inc: (labels: { status: string }) => void };
    backtestDuration: { observe: (labels: { strategy: string }, value: number) => void };
    paperDeploy: { inc: (labels: { status: string }) => void };
    failures: { inc: (labels: { stage: string; reason: string }) => void };
  } | undefined;
  var sparkLiveMetrics: {
    orders: { inc: (labels: { status: string }) => void };
    trades: { inc: () => void };
    pnl: { observe: (labels: { type: string }, value: number) => void };
    blocked: { inc: (labels: { reason: string }) => void };
    reconciliation: { inc: (labels: { type: string }) => void };
    wsReconnects: { inc: () => void };
  } | undefined;
}

/** Mock metrics - gerçek Prometheus client ile değiştirilecek */
const mockMetrics = {
  requests: 0,
  errors: 0,
  duration: 0,
  bodyRejected: 0,
  rateLimited: 0,
  circuitOpen: 0,
  strategyGenerate: 0,
  strategyBuild: 0,
  strategyBacktest: 0,
  strategyPaperDeploy: 0,
  strategyFailures: 0,
  liveOrders: 0,
  liveTrades: 0,
  liveBlocked: 0,
  liveReconciliation: 0,
  liveWsReconnects: 0
};

export async function GET() {
  // Mock Prometheus format
  const metrics = `# HELP spark_proxy_requests_total Total number of proxy requests
# TYPE spark_proxy_requests_total counter
spark_proxy_requests_total ${mockMetrics.requests}

# HELP spark_proxy_errors_total Total number of proxy errors
# TYPE spark_proxy_errors_total counter
spark_proxy_errors_total ${mockMetrics.errors}

# HELP spark_proxy_duration_seconds Proxy request duration
# TYPE spark_proxy_duration_seconds histogram
spark_proxy_duration_seconds_bucket{le="0.1"} ${mockMetrics.duration}
spark_proxy_duration_seconds_bucket{le="0.5"} ${mockMetrics.duration}
spark_proxy_duration_seconds_bucket{le="1.0"} ${mockMetrics.duration}
spark_proxy_duration_seconds_bucket{le="5.0"} ${mockMetrics.duration}
spark_proxy_duration_seconds_bucket{le="+Inf"} ${mockMetrics.duration}

# HELP spark_proxy_body_rejected_total Total number of rejected bodies due to size
# TYPE spark_proxy_body_rejected_total counter
spark_proxy_body_rejected_total ${mockMetrics.bodyRejected}

# HELP spark_proxy_rate_limited_total Total number of rate limited requests
# TYPE spark_proxy_rate_limited_total counter
spark_proxy_rate_limited_total ${mockMetrics.rateLimited}

# HELP spark_proxy_circuit_open_total Total number of circuit breaker opens
# TYPE spark_proxy_circuit_open_total counter
spark_proxy_circuit_open_total ${mockMetrics.circuitOpen}

# HELP spark_strategy_generate_total Total number of strategy generations
# TYPE spark_strategy_generate_total counter
spark_strategy_generate_total ${mockMetrics.strategyGenerate}

# HELP spark_strategy_build_total Total number of strategy builds
# TYPE spark_strategy_build_total counter
spark_strategy_build_total ${mockMetrics.strategyBuild}

# HELP spark_strategy_backtest_total Total number of strategy backtests
# TYPE spark_strategy_backtest_total counter
spark_strategy_backtest_total ${mockMetrics.strategyBacktest}

# HELP spark_strategy_backtest_duration_seconds Strategy backtest duration
# TYPE spark_strategy_backtest_duration_seconds histogram
spark_strategy_backtest_duration_seconds_bucket{le="1.0"} ${mockMetrics.strategyBacktest}
spark_strategy_backtest_duration_seconds_bucket{le="5.0"} ${mockMetrics.strategyBacktest}
spark_strategy_backtest_duration_seconds_bucket{le="10.0"} ${mockMetrics.strategyBacktest}
spark_strategy_backtest_duration_seconds_bucket{le="+Inf"} ${mockMetrics.strategyBacktest}

# HELP spark_strategy_paper_deploy_total Total number of paper trading deployments
# TYPE spark_strategy_paper_deploy_total counter
spark_strategy_paper_deploy_total ${mockMetrics.strategyPaperDeploy}

# HELP spark_strategy_failures_total Total number of strategy pipeline failures
# TYPE spark_strategy_failures_total counter
spark_strategy_failures_total ${mockMetrics.strategyFailures}

# HELP spark_live_orders_total Total number of live orders
# TYPE spark_live_orders_total counter
spark_live_orders_total ${mockMetrics.liveOrders}

# HELP spark_live_trades_total Total number of live trades
# TYPE spark_live_trades_total counter
spark_live_trades_total ${mockMetrics.liveTrades}

# HELP spark_live_blocked_total Total number of blocked live orders
# TYPE spark_live_blocked_total counter
spark_live_blocked_total ${mockMetrics.liveBlocked}

# HELP spark_live_reconciliation_total Total number of reconciliation events
# TYPE spark_live_reconciliation_total counter
spark_live_reconciliation_total ${mockMetrics.liveReconciliation}

# HELP spark_live_ws_reconnects_total Total number of WebSocket reconnections
# TYPE spark_live_ws_reconnects_total counter
spark_live_ws_reconnects_total ${mockMetrics.liveWsReconnects}
`;

  return new Response(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
} 