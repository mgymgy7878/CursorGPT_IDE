/**
 * BIST Reader Service
 * Main entry point for BIST market data processing
 */

export { BISTFetcher } from './fetcher.js';
export { BISTNormalizer } from './normalize.js';
export { BISTScheduler } from './scheduler.js';
export * from './types.js';
export * from './metrics.js';

// Default configuration
export const defaultBISTConfig = {
  sources: [
    {
      name: 'bist-api',
      type: 'http' as const,
      url: 'https://api.bist.com/api/v1/market-data',
      format: 'bist-api' as const,
      enabled: true
    }
  ],
  symbols: ['THYAO', 'AKBNK', 'GARAN', 'ISCTR', 'SAHOL'],
  updateInterval: 1, // minutes
  maxRetries: 3,
  timeout: 10000 // milliseconds
};

export const defaultBISTSchedulerConfig = {
  intervals: {
    marketOpen: 1, // minutes
    marketClose: 5, // minutes
    afterHours: 15 // minutes
  },
  marketHours: {
    open: '09:30',
    close: '18:00',
    timezone: 'Europe/Istanbul'
  }
};

// Factory function for easy setup
export function createBISTReader(
  config?: Partial<typeof defaultBISTConfig>,
  schedulerConfig?: Partial<typeof defaultBISTSchedulerConfig>
) {
  const finalConfig = { ...defaultBISTConfig, ...config };
  const finalSchedulerConfig = { ...defaultBISTSchedulerConfig, ...schedulerConfig };
  
  const scheduler = new BISTScheduler(finalConfig, finalSchedulerConfig);
  return scheduler;
}
