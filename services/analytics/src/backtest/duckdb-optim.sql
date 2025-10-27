-- Optimization Results Table
-- Stores grid search and optimization results for analysis

CREATE TABLE IF NOT EXISTS optim_results (
  id VARCHAR PRIMARY KEY,
  ts BIGINT NOT NULL,
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_ts BIGINT NOT NULL,
  end_ts BIGINT NOT NULL,
  params JSON NOT NULL,           -- Strategy parameters (e.g., {"emaFast": 20, "emaSlow": 50})
  metrics JSON NOT NULL,          -- Backtest metrics (sharpe, winRate, ddMax, pnl, trades)
  wfo JSON,                       -- Walk-forward validation results (optional)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by symbol/timeframe
CREATE INDEX IF NOT EXISTS idx_optim_symbol_tf 
  ON optim_results(symbol, timeframe, ts DESC);

-- Index for finding best performers
CREATE INDEX IF NOT EXISTS idx_optim_sharpe
  ON optim_results((CAST(metrics->>'sharpe' AS DOUBLE)) DESC);

-- Cleanup old optimization results (retention: 90 days)
CREATE OR REPLACE MACRO cleanup_old_optim(retention_days INTEGER) AS (
  DELETE FROM optim_results 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL (retention_days) DAY
);

-- Get top N results by metric
CREATE OR REPLACE MACRO get_top_results(
  p_symbol TEXT,
  p_timeframe TEXT,
  p_metric TEXT,
  p_limit INTEGER
) AS (
  SELECT *
  FROM optim_results
  WHERE symbol = p_symbol 
    AND timeframe = p_timeframe
  ORDER BY CAST(metrics->>p_metric AS DOUBLE) DESC
  LIMIT p_limit
);

