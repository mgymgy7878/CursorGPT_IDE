// Market Data Service Configuration
// ENV-first configuration for BTCTurk and BIST sources

export interface MarketDataConfig {
  port: number;
  host: string;
  btcturk: {
    baseUrl?: string;
    wsUrl?: string;
    pingPath?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  bist: {
    source: 'file' | 'pipe' | 'api';
    pingPath?: string;
    filePath?: string;
  };
}

export function loadConfig(): MarketDataConfig {
  return {
    port: parseInt(process.env.MARKETDATA_PORT || '4005'),
    host: process.env.MARKETDATA_HOST || '0.0.0.0',
    btcturk: {
      baseUrl: process.env.BTCTURK_BASE_URL,
      wsUrl: process.env.BTCTURK_WS_URL,
      pingPath: process.env.BTCTURK_PING_PATH || '/ping',
      apiKey: process.env.BTCTURK_API_KEY,
      apiSecret: process.env.BTCTURK_API_SECRET
    },
    bist: {
      source: (process.env.BIST_SOURCE as 'file' | 'pipe' | 'api') || 'file',
      pingPath: process.env.BIST_PING_PATH || '/healthz',
      filePath: process.env.BIST_FILE_PATH || '/tmp/bist-data.json'
    }
  };
}
