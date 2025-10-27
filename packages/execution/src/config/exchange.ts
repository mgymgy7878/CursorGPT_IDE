export type ExchangeMode = 'spot-testnet' | 'futures-testnet' | 'spot-live' | 'futures-live';

export interface ExchangeConfig {
  mode: ExchangeMode;
  apiKey: string;
  apiSecret: string;
  recvWindow: number;
  timestampDrift: number;
}

export interface BinanceEndpoints {
  rest: {
    base: string;
    order: string;
    account: string;
    userDataStream: string;
  };
  ws: {
    userData: string;
    market: string;
  };
}

export const BINANCE_ENDPOINTS: Record<ExchangeMode, BinanceEndpoints> = {
  'spot-testnet': {
    rest: {
      base: 'https://testnet.binance.vision',
      order: '/api/v3/order',
      account: '/api/v3/account',
      userDataStream: '/api/v3/userDataStream'
    },
    ws: {
      userData: 'wss://testnet.binance.vision/ws',
      market: 'wss://testnet.binance.vision/ws'
    }
  },
  'futures-testnet': {
    rest: {
      base: 'https://testnet.binancefuture.com',
      order: '/fapi/v1/order',
      account: '/fapi/v2/account',
      userDataStream: '/fapi/v1/listenKey'
    },
    ws: {
      userData: 'wss://stream.binancefuture.com/ws',
      market: 'wss://stream.binancefuture.com/ws'
    }
  },
  'spot-live': {
    rest: {
      base: 'https://api.binance.com',
      order: '/api/v3/order',
      account: '/api/v3/account',
      userDataStream: '/api/v3/userDataStream'
    },
    ws: {
      userData: 'wss://stream.binance.com:9443/ws',
      market: 'wss://stream.binance.com:9443/ws'
    }
  },
  'futures-live': {
    rest: {
      base: 'https://fapi.binance.com',
      order: '/fapi/v1/order',
      account: '/fapi/v2/account',
      userDataStream: '/fapi/v1/listenKey'
    },
    ws: {
      userData: 'wss://stream.binance.com:9443/ws',
      market: 'wss://stream.binance.com:9443/ws'
    }
  }
};

export function getExchangeConfig(): ExchangeConfig {
  const mode = (process.env.SPARK_EXCHANGE_MODE || 'spot-testnet') as ExchangeMode;
  const apiKey = process.env.BINANCE_API_KEY || '';
  const apiSecret = process.env.BINANCE_API_SECRET || '';
  
  if (!apiKey || !apiSecret) {
    throw new Error('BINANCE_API_KEY ve BINANCE_API_SECRET environment variable\'ları gerekli');
  }

  return {
    mode,
    apiKey,
    apiSecret,
    recvWindow: 5000,
    timestampDrift: 0
  };
}

export function getBinanceEndpoints(mode: ExchangeMode): BinanceEndpoints {
  return BINANCE_ENDPOINTS[mode];
} 