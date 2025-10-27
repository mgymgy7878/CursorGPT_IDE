/**
 * BIST Reader Fetcher
 * Fetches BIST market data from various sources
 */

import { EventEmitter } from 'events';
import type { BISTConfig, BISTRawData } from './types.js';
import { 
  bistReaderJobSeconds,
  bistReaderSuccessTotal,
  bistReaderFailTotal,
  bistReaderLatencyMs
} from './metrics.js';

export class BISTFetcher extends EventEmitter {
  private config: BISTConfig;
  private isRunning = false;

  constructor(config: BISTConfig) {
    super();
    this.config = config;
  }

  /**
   * Fetch BIST market data
   */
  async fetchData(): Promise<BISTRawData[]> {
    const start = Date.now();
    this.isRunning = true;

    try {
      const data: BISTRawData[] = [];

      // Fetch from multiple sources
      for (const source of this.config.sources) {
        try {
          const sourceData = await this.fetchFromSource(source);
          data.push(...sourceData);
        } catch (error) {
          console.error(`Failed to fetch from ${source.name}:`, error);
          bistReaderFailTotal.inc({ source: source.name, type: 'fetch_error' });
        }
      }

      // Record success metrics
      bistReaderSuccessTotal.inc({ source: 'all' });
      bistReaderLatencyMs.observe({ source: 'all' }, Date.now() - start);

      this.emit('data', data);
      return data;

    } catch (error) {
      bistReaderFailTotal.inc({ source: 'all', type: 'fetch_error' });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Fetch data from a specific source
   */
  private async fetchFromSource(source: any): Promise<BISTRawData[]> {
    const start = Date.now();

    try {
      let data: BISTRawData[] = [];

      switch (source.type) {
        case 'http':
          data = await this.fetchHTTP(source);
          break;
        case 'csv':
          data = await this.fetchCSV(source);
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      bistReaderLatencyMs.observe({ source: source.name }, Date.now() - start);
      return data;

    } catch (error) {
      bistReaderFailTotal.inc({ source: source.name, type: 'source_error' });
      throw error;
    }
  }

  /**
   * Fetch data from HTTP endpoint
   */
  private async fetchHTTP(source: any): Promise<BISTRawData[]> {
    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Spark-Trading-Platform/1.0',
        ...source.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseHTTPData(data, source);
  }

  /**
   * Fetch data from CSV file
   */
  private async fetchCSV(source: any): Promise<BISTRawData[]> {
    // Implementation for CSV fetching
    // This would read from local file or remote CSV
    throw new Error('CSV fetching not implemented yet');
  }

  /**
   * Parse HTTP response data
   */
  private parseHTTPData(data: any, source: any): BISTRawData[] {
    // Parse based on source format
    if (source.format === 'bist-api') {
      return this.parseBISTAPI(data);
    } else if (source.format === 'custom') {
      return this.parseCustom(data, source);
    }
    
    throw new Error(`Unsupported format: ${source.format}`);
  }

  /**
   * Parse BIST API format
   */
  private parseBISTAPI(data: any): BISTRawData[] {
    const results: BISTRawData[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        results.push({
          symbol: item.symbol || item.code,
          name: item.name || item.description,
          price: parseFloat(item.price || item.lastPrice || '0'),
          volume: parseFloat(item.volume || item.volume24h || '0'),
          change: parseFloat(item.change || item.changePercent || '0'),
          timestamp: Date.now(),
          source: 'bist-api'
        });
      }
    }

    return results;
  }

  /**
   * Parse custom format
   */
  private parseCustom(data: any, source: any): BISTRawData[] {
    // Custom parsing logic based on source configuration
    return [];
  }

  /**
   * Get running status
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Stop fetching
   */
  stop(): void {
    this.isRunning = false;
  }
}
