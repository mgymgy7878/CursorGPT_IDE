/**
 * BTCTurk Exchange Package
 * Public API for Spark Trading Platform
 */

export { BTCTurkClient } from './client';
export { BTCTurkAdapter } from './adapter';
export * from './types';
export * from './metrics';

// Default configuration
export const defaultBTCTurkConfig = {
  wsUrl: 'wss://ws-feed.btcturk.com/',
  restUrl: 'https://api.btcturk.com/api/v2/',
  reconnectDelay: 1000,
  maxReconnectAttempts: 10,
  symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT']
};

// Factory function for easy setup
export function createBTCTurkClient(config?: Partial<typeof defaultBTCTurkConfig> & { symbols?: string[], registry?: any, log?: any }) {
  const finalConfig = { ...defaultBTCTurkConfig, ...config };
  return new BTCTurkClient(finalConfig);
}
