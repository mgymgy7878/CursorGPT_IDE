/**
 * BIST Data Normalizer
 * Normalizes BIST market data to Spark Trading Platform format
 */

import type { BISTRawData, BISTNormalizedData } from './types.js';
import { 
  bistReaderDataTotal,
  bistReaderDataErrorsTotal
} from './metrics.js';

export class BISTNormalizer {
  private exchange = 'bist' as const;

  /**
   * Normalize BIST raw data
   */
  normalize(raw: BISTRawData): BISTNormalizedData {
    try {
      const normalized: BISTNormalizedData = {
        symbol: this.normalizeSymbol(raw.symbol),
        name: raw.name,
        price: this.normalizePrice(raw.price),
        volume24h: this.normalizeVolume(raw.volume),
        change24h: this.normalizeChange(raw.change),
        timestamp: raw.timestamp,
        exchange: this.exchange
      };

      // Validate normalized data
      if (!this.validate(normalized)) {
        throw new Error('Invalid normalized data');
      }

      bistReaderDataTotal.inc({ 
        source: raw.source, 
        symbol: normalized.symbol 
      });

      return normalized;

    } catch (error) {
      bistReaderDataErrorsTotal.inc({ 
        source: raw.source, 
        type: 'normalize_error' 
      });
      throw new Error(`Failed to normalize BIST data: ${error}`);
    }
  }

  /**
   * Normalize multiple records
   */
  normalizeBatch(rawData: BISTRawData[]): BISTNormalizedData[] {
    const results: BISTNormalizedData[] = [];

    for (const raw of rawData) {
      try {
        const normalized = this.normalize(raw);
        results.push(normalized);
      } catch (error) {
        console.error(`Failed to normalize ${raw.symbol}:`, error);
        bistReaderDataErrorsTotal.inc({ 
          source: raw.source, 
          type: 'batch_normalize_error' 
        });
      }
    }

    return results;
  }

  /**
   * Normalize symbol format
   */
  private normalizeSymbol(symbol: string): string {
    // Convert to standard format (e.g., "THYAO" -> "THYAO.IS")
    if (!symbol.includes('.')) {
      return `${symbol}.IS`;
    }
    return symbol.toUpperCase();
  }

  /**
   * Normalize price value
   */
  private normalizePrice(price: number): number {
    if (typeof price !== 'number' || isNaN(price) || price < 0) {
      throw new Error(`Invalid price: ${price}`);
    }
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Normalize volume value
   */
  private normalizeVolume(volume: number): number {
    if (typeof volume !== 'number' || isNaN(volume) || volume < 0) {
      return 0;
    }
    return Math.round(volume);
  }

  /**
   * Normalize change percentage
   */
  private normalizeChange(change: number): number {
    if (typeof change !== 'number' || isNaN(change)) {
      return 0;
    }
    return Math.round(change * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate normalized data
   */
  private validate(data: BISTNormalizedData): boolean {
    return (
      typeof data.symbol === 'string' &&
      data.symbol.length > 0 &&
      typeof data.name === 'string' &&
      data.name.length > 0 &&
      typeof data.price === 'number' &&
      data.price > 0 &&
      typeof data.volume24h === 'number' &&
      data.volume24h >= 0 &&
      typeof data.change24h === 'number' &&
      typeof data.timestamp === 'number' &&
      data.timestamp > 0 &&
      data.exchange === this.exchange
    );
  }

  /**
   * Filter data by symbol list
   */
  filterBySymbols(data: BISTNormalizedData[], symbols: string[]): BISTNormalizedData[] {
    if (symbols.length === 0) {
      return data;
    }

    return data.filter(item => 
      symbols.some(symbol => 
        item.symbol === symbol || 
        item.symbol === `${symbol}.IS` ||
        item.symbol === symbol.replace('.IS', '')
      )
    );
  }

  /**
   * Get data summary
   */
  getSummary(data: BISTNormalizedData[]): {
    totalSymbols: number;
    totalVolume: number;
    avgChange: number;
    topGainers: BISTNormalizedData[];
    topLosers: BISTNormalizedData[];
  } {
    const totalSymbols = data.length;
    const totalVolume = data.reduce((sum, item) => sum + item.volume24h, 0);
    const avgChange = data.length > 0 
      ? data.reduce((sum, item) => sum + item.change24h, 0) / data.length 
      : 0;

    const sortedByChange = [...data].sort((a, b) => b.change24h - a.change24h);
    const topGainers = sortedByChange.slice(0, 5);
    const topLosers = sortedByChange.slice(-5).reverse();

    return {
      totalSymbols,
      totalVolume,
      avgChange: Math.round(avgChange * 100) / 100,
      topGainers,
      topLosers
    };
  }
}
