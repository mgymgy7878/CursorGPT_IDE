-- Spark Trading Platform - Backtest Cache Schema
-- DuckDB initialization for persistent candle storage

-- Candles table: stores historical OHLCV data
CREATE TABLE IF NOT EXISTS candles (
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  ts BIGINT NOT NULL,
  open DOUBLE NOT NULL,
  high DOUBLE NOT NULL,
  low DOUBLE NOT NULL,
  close DOUBLE NOT NULL,
  volume DOUBLE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (exchange, symbol, timeframe, ts)
);

-- Index for fast date range queries
CREATE INDEX IF NOT EXISTS idx_candles_range 
  ON candles(exchange, symbol, timeframe, ts);

-- Cache metadata table: track fetch history
CREATE TABLE IF NOT EXISTS cache_metadata (
  id INTEGER PRIMARY KEY,
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  first_ts BIGINT NOT NULL,
  last_ts BIGINT NOT NULL,
  count INTEGER NOT NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cleanup old data (retention: 30 days)
CREATE OR REPLACE MACRO cleanup_old_data(retention_days INTEGER) AS (
  DELETE FROM candles 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL (retention_days) DAY
);

-- Query helper: get cached range
CREATE OR REPLACE MACRO get_cached_range(
  p_exchange TEXT, 
  p_symbol TEXT, 
  p_timeframe TEXT
) AS (
  SELECT 
    MIN(ts) as first_ts, 
    MAX(ts) as last_ts, 
    COUNT(*) as count
  FROM candles
  WHERE exchange = p_exchange 
    AND symbol = p_symbol 
    AND timeframe = p_timeframe
);

