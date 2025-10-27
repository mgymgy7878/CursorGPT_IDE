// services/executor/src/metrics/portfolio.ts
import { Counter, Histogram, Gauge } from 'prom-client';

/**
 * Portfolio refresh latency histogram
 * Tracks how long it takes to fetch portfolio data from each exchange
 */
export const portfolioRefreshLatency = new Histogram({
  name: 'spark_portfolio_refresh_latency_ms',
  help: 'Portfolio refresh latency in milliseconds',
  labelNames: ['exchange', 'status'], // binance/btcturk, success/error
  buckets: [50, 100, 200, 500, 1000, 2000, 5000, 10000], // ms
});

/**
 * Exchange API error counter
 * Tracks API errors by exchange and error type
 */
export const exchangeApiErrorTotal = new Counter({
  name: 'spark_exchange_api_error_total',
  help: 'Total exchange API errors',
  labelNames: ['exchange', 'error_type'], // exchange name, error code/type
});

/**
 * Portfolio total value gauge
 * Current total portfolio value in USD per exchange
 */
export const portfolioTotalValueUsd = new Gauge({
  name: 'spark_portfolio_total_value_usd',
  help: 'Total portfolio value in USD',
  labelNames: ['exchange'],
});

/**
 * Portfolio asset count gauge
 * Number of assets with non-zero balance
 */
export const portfolioAssetCount = new Gauge({
  name: 'spark_portfolio_asset_count',
  help: 'Number of assets with non-zero balance',
  labelNames: ['exchange'],
});

/**
 * Portfolio last update timestamp
 * Unix timestamp of last successful portfolio update
 */
export const portfolioLastUpdate = new Gauge({
  name: 'spark_portfolio_last_update_timestamp',
  help: 'Unix timestamp of last successful portfolio update',
  labelNames: ['exchange'],
});

/**
 * Helper function to record portfolio refresh with timing
 */
export function recordPortfolioRefresh(
  exchange: string,
  startTime: number,
  success: boolean,
  error?: Error
) {
  const duration = Date.now() - startTime;
  const status = success ? 'success' : 'error';
  
  portfolioRefreshLatency.observe({ exchange, status }, duration);
  
  if (!success && error) {
    const errorType = error.message.includes('timeout') ? 'timeout' 
                    : error.message.includes('401') ? 'unauthorized'
                    : error.message.includes('429') ? 'rate_limit'
                    : 'unknown';
    exchangeApiErrorTotal.inc({ exchange, error_type: errorType });
  }
}

/**
 * Helper function to update portfolio metrics after successful fetch
 */
export function updatePortfolioMetrics(
  exchange: string,
  totalValueUsd: number,
  assetCount: number
) {
  portfolioTotalValueUsd.set({ exchange }, totalValueUsd);
  portfolioAssetCount.set({ exchange }, assetCount);
  portfolioLastUpdate.set({ exchange }, Date.now() / 1000);
}

