import { Database } from "duckdb";
import { promisify } from "util";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

// Type definitions
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

type FetchFunction = (
  symbol: string,
  timeframe: string,
  start: number,
  end: number
) => Promise<Candle[]>;

// Metrics (imported from parent or defined here for MVP)
let cacheHitTotal = 0;
let cacheMissTotal = 0;

export function getCacheStats() {
  return { hits: cacheHitTotal, misses: cacheMissTotal };
}

// DuckDB Cache Layer
export class BacktestCache {
  private db: Database | null = null;
  private dbPath: string;
  private initialized = false;

  constructor(cachePath = ".cache/backtest.duckdb") {
    this.dbPath = cachePath;
  }

  /**
   * Open or create DuckDB database
   */
  async openOrCreate(): Promise<void> {
    if (this.initialized) return;

    // Ensure cache directory exists
    const dir = dirname(this.dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`DuckDB init failed: ${err.message}`));
          return;
        }

        // Load schema
        const schemaPath = join(__dirname, "duckdb-init.sql");
        const schemaSql = readFileSync(schemaPath, "utf-8");

        this.db!.exec(schemaSql, (schemaErr) => {
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
  async loadOrFetch(
    exchange: string,
    symbol: string,
    timeframe: string,
    start: number,
    end: number,
    fetchFn: FetchFunction
  ): Promise<Candle[]> {
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
  private async queryCache(
    exchange: string,
    symbol: string,
    timeframe: string,
    start: number,
    end: number
  ): Promise<Candle[]> {
    if (!this.db) throw new Error("DB not initialized");

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
      this.db!.all(query, [exchange, symbol, timeframe, start, end], (err, rows: any[]) => {
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
  private async insertCandles(exchange: string, candles: Candle[]): Promise<void> {
    if (!this.db || candles.length === 0) return;

    const stmt = `
      INSERT OR REPLACE INTO candles 
        (exchange, symbol, timeframe, ts, open, high, low, close, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      const batch = this.db!.prepare(stmt);

      // Batch insert
      for (const c of candles) {
        batch.run(
          [exchange, c.symbol, c.timeframe, c.ts, c.open, c.high, c.low, c.close, c.volume],
          (err) => {
            if (err) console.error("Insert error:", err);
          }
        );
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
  private calculateExpectedCount(start: number, end: number, timeframe: string): number {
    const duration = end - start; // milliseconds
    const tfMs = this.timeframeToMs(timeframe);
    return Math.ceil(duration / tfMs);
  }

  /**
   * Convert timeframe string to milliseconds
   */
  private timeframeToMs(tf: string): number {
    const unit = tf.slice(-1);
    const value = parseInt(tf.slice(0, -1)) || 1;

    const multipliers: Record<string, number> = {
      m: 60 * 1000, // minutes
      h: 60 * 60 * 1000, // hours
      d: 24 * 60 * 60 * 1000, // days
    };

    return (multipliers[unit] || multipliers.m) * value;
  }

  /**
   * Cleanup old data (30 days retention)
   */
  async cleanup(retentionDays = 30): Promise<void> {
    if (!this.db) return;

    const query = `SELECT cleanup_old_data(${retentionDays})`;

    return new Promise((resolve, reject) => {
      this.db!.run(query, (err) => {
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
  async loadMultiple(
    exchange: string,
    symbols: string[],
    timeframe: string,
    start: number,
    end: number,
    fetchFn: FetchFunction
  ): Promise<Map<string, Candle[]>> {
    await this.openOrCreate();

    const results = new Map<string, Candle[]>();

    // Process symbols in parallel using Promise.all
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const candles = await this.loadOrFetch(exchange, symbol, timeframe, start, end, fetchFn);
          results.set(symbol, candles);
        } catch (err) {
          console.error(`Failed to load ${symbol}:`, err);
          results.set(symbol, []);
        }
      })
    );

    return results;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      this.db!.close(() => {
        this.db = null;
        this.initialized = false;
        resolve();
      });
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ totalCandles: number; exchanges: number; symbols: number }> {
    if (!this.db) return { totalCandles: 0, exchanges: 0, symbols: 0 };

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT exchange) as exchanges,
        COUNT(DISTINCT symbol) as symbols
      FROM candles
    `;

    return new Promise((resolve, reject) => {
      this.db!.get(query, (err, row: any) => {
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

// Singleton instance
let cacheInstance: BacktestCache | null = null;

export function getCache(): BacktestCache {
  if (!cacheInstance) {
    cacheInstance = new BacktestCache();
  }
  return cacheInstance;
}

