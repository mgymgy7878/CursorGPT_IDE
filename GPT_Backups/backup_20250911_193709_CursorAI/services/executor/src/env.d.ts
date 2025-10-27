declare namespace NodeJS {
  interface ProcessEnv {
    BINANCE_API_KEY?: string;
    BINANCE_API_SECRET?: string;
    BINANCE_MAINNET_API_KEY?: string;
    BINANCE_MAINNET_API_SECRET?: string;
    BINANCE_API_BASE?: string;
    IS_TESTNET?: 'true'|'false'|string;
    NODE_ENV?: 'development'|'production'|'test';
    PORT?: string;
    LIVE_TRADING?: 'true'|'false'|string;
    SHADOW_MODE?: 'true'|'false'|string;
  }
} 