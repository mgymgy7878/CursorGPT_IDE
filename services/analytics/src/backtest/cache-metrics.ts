import { Counter, Gauge } from "prom-client";

// Cache hit/miss counters
export const cacheHitTotal = new Counter({
  name: "spark_backtest_cache_hit_total",
  help: "Total number of backtest cache hits",
  labelNames: ["exchange", "symbol", "timeframe"],
});

export const cacheMissTotal = new Counter({
  name: "spark_backtest_cache_miss_total",
  help: "Total number of backtest cache misses",
  labelNames: ["exchange", "symbol", "timeframe"],
});

// Cache size gauge
export const cacheSizeBytes = new Gauge({
  name: "spark_backtest_cache_size_bytes",
  help: "Current size of backtest cache in bytes",
});

export const cachedCandlesTotal = new Gauge({
  name: "spark_backtest_cached_candles_total",
  help: "Total number of candles in cache",
});

// Cache operations
export const cacheInsertTotal = new Counter({
  name: "spark_backtest_cache_insert_total",
  help: "Total number of cache insert operations",
  labelNames: ["exchange", "symbol"],
});

export const cacheCleanupTotal = new Counter({
  name: "spark_backtest_cache_cleanup_total",
  help: "Total number of cache cleanup operations",
});

// Helper: Record cache hit
export function recordCacheHit(exchange: string, symbol: string, timeframe: string) {
  cacheHitTotal.inc({ exchange, symbol, timeframe });
}

// Helper: Record cache miss
export function recordCacheMiss(exchange: string, symbol: string, timeframe: string) {
  cacheMissTotal.inc({ exchange, symbol, timeframe });
}

// Helper: Record cache insert
export function recordCacheInsert(exchange: string, symbol: string, count: number) {
  cacheInsertTotal.inc({ exchange, symbol });
  cachedCandlesTotal.inc(count);
}

// Helper: Record cache cleanup
export function recordCacheCleanup(deletedCount: number) {
  cacheCleanupTotal.inc();
  cachedCandlesTotal.dec(deletedCount);
}

