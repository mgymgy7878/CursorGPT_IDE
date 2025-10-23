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
  paused: boolean;
  lastMessageTs?: number;
  counters: { spark_ws_btcturk_msgs_total: number };
  gauges: { spark_ws_last_message_ts: number; spark_ws_staleness_seconds: number };
  flags: { spark_ws_paused: boolean };
  setTicker: (t: Ticker) => void;
  markStatus: (s: Health) => void;
  staleness: (symbol?: string) => Staleness;
  incReconnect: () => void;
  clear: () => void;
  setPaused: (v: boolean) => void;
  setLastMessageTs: (ts: number) => void;
  onWsMessage: () => void;
  tickStaleness: (now?: number) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  tickers: {},
  status: 'connecting',
  wsReconnectTotal: 0,
  paused: false,
  lastMessageTs: undefined,
  counters: { spark_ws_btcturk_msgs_total: 0 },
  gauges: { spark_ws_last_message_ts: 0, spark_ws_staleness_seconds: 0 },
  flags: { spark_ws_paused: false },

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
  setPaused: (v) => set((s) => ({ paused: v, flags: { ...s.flags, spark_ws_paused: v } })),
  setLastMessageTs: (ts) => set((s) => ({ lastMessageTs: ts, gauges: { ...s.gauges, spark_ws_last_message_ts: ts } })),
  onWsMessage: () => set((s) => ({
    counters: { ...s.counters, spark_ws_btcturk_msgs_total: s.counters.spark_ws_btcturk_msgs_total + 1 },
    gauges: { ...s.gauges, spark_ws_last_message_ts: Date.now() },
  })),
  tickStaleness: (now) => set((s) => {
    const t = now ?? Date.now();
    const last = s.gauges.spark_ws_last_message_ts || t;
    const secs = Math.max(0, (t - last) / 1000);
    return { gauges: { ...s.gauges, spark_ws_staleness_seconds: secs } };
  }),
}));

