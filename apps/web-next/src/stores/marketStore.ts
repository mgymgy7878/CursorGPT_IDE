import { create } from 'zustand';
import type { Health, Staleness } from '@/types/market';

// Minimal ticker shape used by realtime market UI
export type Ticker = {
  symbol: string;
  price: number;
  ts: number;
  source?: 'binance' | 'btcturk' | 'mock';
  bid?: number;
  ask?: number;
  change24h?: number;
};

const TTL = { warn: 10_000, stale: 30_000 }; // 10s → yellow, 30s → red

interface MarketState {
  tickers: Record<string, Ticker>;
  status: Health;
  lastUpdate?: number;
  wsReconnectTotal: number;
  setTicker: (t: Ticker) => void;
  markStatus: (s: Health) => void;
  staleness: (symbol?: string) => Staleness;
  incReconnect: () => void;
  clear: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  tickers: {},
  status: 'connecting',
  wsReconnectTotal: 0,

  setTicker: (t) => set((s) => ({
    tickers: { ...s.tickers, [t.symbol]: t },
    lastUpdate: Date.now(),
  })),

  markStatus: (status) => set({ status }),

  staleness: (symbol) => {
    const now = Date.now();
    const ts = symbol ? get().tickers[symbol]?.ts : get().lastUpdate ?? 0;
    const age = now - (ts || 0);
    if (age > TTL.stale) return 'stale';
    if (age > TTL.warn) return 'warn';
    return 'ok';
  },

  incReconnect: () => set((s) => ({ wsReconnectTotal: s.wsReconnectTotal + 1 })),

  clear: () => set({ tickers: {}, status: 'down', lastUpdate: undefined }),
}));

