export type Candle = {
    exchange: string;
    symbol: string;
    timeframe: string;
    ts: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};
type FetchFunction = (symbol: string, timeframe: string, start: number, end: number) => Promise<Candle[]>;
export declare function getCacheStats(): {
    hits: number;
    misses: number;
};
export declare class BacktestCache {
    private db;
    private dbPath;
    private initialized;
    constructor(cachePath?: string);
    /**
     * Open or create DuckDB database
     */
    openOrCreate(): Promise<void>;
    /**
     * Load candles from cache or fetch if missing
     */
    loadOrFetch(exchange: string, symbol: string, timeframe: string, start: number, end: number, fetchFn: FetchFunction): Promise<Candle[]>;
    /**
     * Query cached candles
     */
    private queryCache;
    /**
     * Insert candles into cache (upsert)
     */
    private insertCandles;
    /**
     * Calculate expected candle count based on timeframe
     */
    private calculateExpectedCount;
    /**
     * Convert timeframe string to milliseconds
     */
    private timeframeToMs;
    /**
     * Cleanup old data (30 days retention)
     */
    cleanup(retentionDays?: number): Promise<void>;
    /**
     * Load multiple symbols in batch (for portfolio backtests)
     * Uses single connection with parallel queries
     */
    loadMultiple(exchange: string, symbols: string[], timeframe: string, start: number, end: number, fetchFn: FetchFunction): Promise<Map<string, Candle[]>>;
    /**
     * Close database connection
     */
    close(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<{
        totalCandles: number;
        exchanges: number;
        symbols: number;
    }>;
}
export declare function getCache(): BacktestCache;
export {};
//# sourceMappingURL=cache.d.ts.map