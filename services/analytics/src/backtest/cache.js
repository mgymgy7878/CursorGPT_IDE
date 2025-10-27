"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacktestCache = void 0;
exports.getCacheStats = getCacheStats;
exports.getCache = getCache;
const duckdb_1 = require("duckdb");
const fs_1 = require("fs");
const path_1 = require("path");
// Metrics (imported from parent or defined here for MVP)
let cacheHitTotal = 0;
let cacheMissTotal = 0;
function getCacheStats() {
    return { hits: cacheHitTotal, misses: cacheMissTotal };
}
// DuckDB Cache Layer
class BacktestCache {
    db = null;
    dbPath;
    initialized = false;
    constructor(cachePath = ".cache/backtest.duckdb") {
        this.dbPath = cachePath;
    }
    /**
     * Open or create DuckDB database
     */
    async openOrCreate() {
        if (this.initialized)
            return;
        // Ensure cache directory exists
        const dir = (0, path_1.dirname)(this.dbPath);
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        return new Promise((resolve, reject) => {
            this.db = new duckdb_1.Database(this.dbPath, (err) => {
                if (err) {
                    reject(new Error(`DuckDB init failed: ${err.message}`));
                    return;
                }
                // Load schema
                const schemaPath = (0, path_1.join)(__dirname, "duckdb-init.sql");
                const schemaSql = (0, fs_1.readFileSync)(schemaPath, "utf-8");
                this.db.exec(schemaSql, (schemaErr) => {
                    if (schemaErr) {
                        reject(new Error(`Schema init failed: ${schemaErr.message}`));
                        return;
                    }
                    this.initialized = true;
                    resolve();
                });
            });
        });
    }
    /**
     * Load candles from cache or fetch if missing
     */
    async loadOrFetch(exchange, symbol, timeframe, start, end, fetchFn) {
        await this.openOrCreate();
        // 1. Check cache
        const cached = await this.queryCache(exchange, symbol, timeframe, start, end);
        // 2. Calculate missing ranges
        const expected = this.calculateExpectedCount(start, end, timeframe);
        const coverage = cached.length / expected;
        if (coverage > 0.95) {
            // Cache hit (>95% coverage)
            cacheHitTotal++;
            return cached;
        }
        // 3. Cache miss - fetch fresh data
        cacheMissTotal++;
        const fresh = await fetchFn(symbol, timeframe, start, end);
        // 4. Insert into cache (upsert logic)
        await this.insertCandles(exchange, fresh);
        // 5. Return fresh data
        return fresh;
    }
    /**
     * Query cached candles
     */
    async queryCache(exchange, symbol, timeframe, start, end) {
        if (!this.db)
            throw new Error("DB not initialized");
        const query = `
      SELECT exchange, symbol, timeframe, ts, open, high, low, close, volume
      FROM candles
      WHERE exchange = ? 
        AND symbol = ? 
        AND timeframe = ?
        AND ts BETWEEN ? AND ?
      ORDER BY ts ASC
    `;
        return new Promise((resolve, reject) => {
            this.db.all(query, [exchange, symbol, timeframe, start, end], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows || []);
            });
        });
    }
    /**
     * Insert candles into cache (upsert)
     */
    async insertCandles(exchange, candles) {
        if (!this.db || candles.length === 0)
            return;
        const stmt = `
      INSERT OR REPLACE INTO candles 
        (exchange, symbol, timeframe, ts, open, high, low, close, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        return new Promise((resolve, reject) => {
            const batch = this.db.prepare(stmt);
            // Batch insert
            for (const c of candles) {
                batch.run([exchange, c.symbol, c.timeframe, c.ts, c.open, c.high, c.low, c.close, c.volume], (err) => {
                    if (err)
                        console.error("Insert error:", err);
                });
            }
            batch.finalize((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Calculate expected candle count based on timeframe
     */
    calculateExpectedCount(start, end, timeframe) {
        const duration = end - start; // milliseconds
        const tfMs = this.timeframeToMs(timeframe);
        return Math.ceil(duration / tfMs);
    }
    /**
     * Convert timeframe string to milliseconds
     */
    timeframeToMs(tf) {
        const unit = tf.slice(-1);
        const value = parseInt(tf.slice(0, -1)) || 1;
        const multipliers = {
            m: 60 * 1000, // minutes
            h: 60 * 60 * 1000, // hours
            d: 24 * 60 * 60 * 1000, // days
        };
        return (multipliers[unit] || multipliers.m) * value;
    }
    /**
     * Cleanup old data (30 days retention)
     */
    async cleanup(retentionDays = 30) {
        if (!this.db)
            return;
        const query = `SELECT cleanup_old_data(${retentionDays})`;
        return new Promise((resolve, reject) => {
            this.db.run(query, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Load multiple symbols in batch (for portfolio backtests)
     * Uses single connection with parallel queries
     */
    async loadMultiple(exchange, symbols, timeframe, start, end, fetchFn) {
        await this.openOrCreate();
        const results = new Map();
        // Process symbols in parallel using Promise.all
        await Promise.all(symbols.map(async (symbol) => {
            try {
                const candles = await this.loadOrFetch(exchange, symbol, timeframe, start, end, fetchFn);
                results.set(symbol, candles);
            }
            catch (err) {
                console.error(`Failed to load ${symbol}:`, err);
                results.set(symbol, []);
            }
        }));
        return results;
    }
    /**
     * Close database connection
     */
    async close() {
        if (!this.db)
            return;
        return new Promise((resolve) => {
            this.db.close(() => {
                this.db = null;
                this.initialized = false;
                resolve();
            });
        });
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.db)
            return { totalCandles: 0, exchanges: 0, symbols: 0 };
        const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT exchange) as exchanges,
        COUNT(DISTINCT symbol) as symbols
      FROM candles
    `;
        return new Promise((resolve, reject) => {
            this.db.get(query, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    totalCandles: row?.total || 0,
                    exchanges: row?.exchanges || 0,
                    symbols: row?.symbols || 0,
                });
            });
        });
    }
}
exports.BacktestCache = BacktestCache;
// Singleton instance
let cacheInstance = null;
function getCache() {
    if (!cacheInstance) {
        cacheInstance = new BacktestCache();
    }
    return cacheInstance;
}
//# sourceMappingURL=cache.js.map