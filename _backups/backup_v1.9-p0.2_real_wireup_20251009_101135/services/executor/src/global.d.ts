declare namespace NodeJS {
  interface ProcessEnv {
    BINANCE_API_KEY?: string;
    BINANCE_API_SECRET?: string;
    IS_TESTNET?: "true" | "false" | string;
    NODE_ENV?: "development" | "production" | "test";
    BINANCE_API_BASE?: string;
    TRADE_WINDOW?: string;
    TRADE_WHITELIST?: string;
    LIVE_MAX_NOTIONAL?: string;
    TRADING_KILL_SWITCH?: string;
  }
}

declare global {
  type MetricKey =
    | "placed_total" | "fills_total"
    | "latency_ack_p95" | "latency_db_p95"
    | "errors_total" | "live_trades_total"
    | "live_orders_filled_total" | "live_orders_cancelled_total"
    | "live_orders_rejected_total" | "live_exchange_errors_total"
    | "backtest_runs_total" | "optimize_runs_total"
    | "rbac_blocked_total" | "audit_ui_queries_total"
    | "metrics_rollup_jobs_total" | "metrics_rollup_events_total"
    | "live_blocked_total_arm_only" | "live_blocked_total_rule_violation"
    | "live_blocked_total_notional_limit" | "live_blocked_total_whitelist_violation"
    | "live_blocked_total_outside_window" | "live_blocked_total_cooldown_active"
    | "live_blocked_total_kill_switch" | "live_blocked_total_no_keys"
    | string;

  interface Global {
    sparkLiveMetrics?: {
      reconciliation: {
        inc: (params: { type: string }) => void;
      };
    };
  }
}

export {}; 