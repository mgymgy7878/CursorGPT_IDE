import { backtestMetrics } from '@spark/backtest-core';

export interface DataPoint {
  timestamp: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DatasetConfig {
  name: string;
  format: 'csv' | 'parquet' | 'json';
  path: string;
  schema: string[];
}

export class DataIngester {
  private config: DatasetConfig;
  private data: DataPoint[] = [];

  constructor(config: DatasetConfig) {
    this.config = config;
  }

  async ingest(): Promise<DataPoint[]> {
    try {
      // Simulate data ingestion
      this.data = this.generateSampleData();
      
      // Update metrics
      backtestMetrics.datasetBytes.set(
        { dataset: this.config.name, format: this.config.format },
        this.data.length * 100 // Simulate bytes per record
      );
      
      return this.data;
      
    } catch (error) {
      backtestMetrics.backtestErrors.inc(
        { strategy: 'data-ingest', error_type: 'ingestion' },
        1
      );
      throw error;
    }
  }

  private generateSampleData(): DataPoint[] {
    const data: DataPoint[] = [];
    const startTime = new Date('2024-01-01T00:00:00Z');
    
    for (let i = 0; i < 1000; i++) {
      const timestamp = new Date(startTime.getTime() + i * 60000); // 1 minute intervals
      data.push({
        timestamp: timestamp.toISOString(),
        symbol: 'BTC/USD',
        open: 50000 + Math.random() * 1000,
        high: 50000 + Math.random() * 1000,
        low: 50000 + Math.random() * 1000,
        close: 50000 + Math.random() * 1000,
        volume: Math.random() * 100
      });
    }
    
    return data;
  }
}
