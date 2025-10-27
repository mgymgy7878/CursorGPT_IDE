/**
 * BIST Reader Types
 * Type definitions for BIST market data processing
 */

export type BISTRawData = {
  symbol: string;
  name: string;
  price: number;
  volume: number;
  change: number;
  timestamp: number;
  source: string;
};

export type BISTNormalizedData = {
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: number;
  exchange: 'bist';
};

export type BISTConfig = {
  sources: BISTSource[];
  symbols: string[];
  updateInterval: number; // minutes
  maxRetries: number;
  timeout: number; // milliseconds
};

export type BISTSource = {
  name: string;
  type: 'http' | 'csv' | 'websocket';
  url?: string;
  format: 'bist-api' | 'custom';
  headers?: Record<string, string>;
  enabled: boolean;
};

export type BISTJobResult = {
  success: boolean;
  dataCount: number;
  errors: string[];
  duration: number;
  timestamp: number;
};

export type BISTSchedulerConfig = {
  intervals: {
    marketOpen: number; // minutes
    marketClose: number; // minutes
    afterHours: number; // minutes
  };
  marketHours: {
    open: string; // HH:MM
    close: string; // HH:MM
    timezone: string;
  };
};
