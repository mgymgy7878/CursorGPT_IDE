"use client";
import { create } from "zustand";
import { Ticker, startTickerPolling, fetchBtcturkTicker } from "@/lib/api/btcturk";
import { connectTickerWS, ConnectionState, TickerMessage } from "@/lib/api/btcturk-ws";
import { startMarketFeed } from "@/lib/api/market-feed";

// TEMP debug
console.log('[BTCTURK WS ENV]',
  process.env.NEXT_PUBLIC_WS_ENABLED,
  process.env.NEXT_PUBLIC_WS_URL);

type ConnStatus = "idle" | "loading" | "open" | "degraded";
type WSStatus = "OPEN" | "CLOSED" | "DEGRADED";
type FeedMode = "ws" | "polling";

type State = {
  symbol: string;
  status: ConnStatus;
  lastUpdate: number | null;
  lastError: string | null;
  ticker: Ticker | null;
  unsubscribe?: () => void;
  // WebSocket state
  wsStatus: WSStatus;
  wsLatency: number;
  wsReconnectAttempts: number;
  wsEnabled: boolean;
  wsCleanup?: () => void;
  // Feed mode
  feedMode: FeedMode;
  lastUpdatedAt?: number;
};

type Actions = {
  setSymbol: (s: string) => void;
  start: () => void;
  stop: () => void;
  // WebSocket actions
  startWS: () => void;
  stopWS: () => void;
  toggleWS: () => void;
};

export const useBtcturkStore = create<State & Actions>((set, get) => ({
  symbol: "BTCTRY",
  status: "idle",
  lastUpdate: null,
  lastError: null,
  ticker: null,
  // WebSocket state
  wsStatus: "CLOSED",
  wsLatency: 0,
  wsReconnectAttempts: 0,
  wsEnabled: process.env.NEXT_PUBLIC_WS_ENABLED === "true",
  // Feed mode
  feedMode: "polling",
  lastUpdatedAt: undefined,

  setSymbol: (s) => {
    const running = !!get().unsubscribe;
    const wsRunning = !!get().wsCleanup;
    if (running) get().stop();
    if (wsRunning) get().stopWS();
    set({ 
      symbol: s, 
      status: "idle", 
      lastError: null, 
      lastUpdate: null, 
      ticker: null,
      wsStatus: "CLOSED",
      wsLatency: 0,
      wsReconnectAttempts: 0
    });
  },

  start: () => {
    if (get().unsubscribe) return; // already running
    set({ status: "loading", lastError: null });

    const symbol = get().symbol;
    const useWs = ["1", "true", "yes"].includes(String(process.env.NEXT_PUBLIC_WS_ENABLED).toLowerCase());
    const wsBase = String(process.env.NEXT_PUBLIC_WS_URL || "");

    const startPollingFallback = () => {
      const unsub = startTickerPolling({
        symbol,
        intervalMs: 2000,
        onData: (t) => set({
          ticker: t, 
          status: "degraded", 
          feedMode: "polling", 
          lastUpdatedAt: Date.now()
        }),
        onError: (e) => set({ status: "degraded", lastError: String(e) }),
      });
      set({ unsubscribe: unsub });
    };

    if (useWs && wsBase) {
      // --- WS PRIMARY ---
      const unsub = connectTickerWS(
        symbol,
        (t) => set({
          ticker: {
            symbol: t.sym,
            bid: t.bid,
            ask: t.ask,
            last: t.last,
            volume: t.volume,
            ts: t.timestamp.toString()
          } as any,
          status: "open", 
          lastUpdatedAt: Date.now(), 
          wsStatus: "OPEN", 
          feedMode: "ws"
        }),
        (s) => {
          set({ wsStatus: s.status });
          if (s.status === "CLOSED") {
            set({ status: "degraded" });
            startPollingFallback(); // fallback
          }
        }
      );
      set({ unsubscribe: unsub });
    } else {
      // --- POLLING FALLBACK ---
      startPollingFallback();
    }
  },

  stop: () => {
    const u = get().unsubscribe;
    if (u) try { u(); } catch {}
    set({ unsubscribe: undefined, status: "idle", wsStatus: "CLOSED", feedMode: "polling" });
  },

  startWS: () => {
    if (!get().wsEnabled || get().wsCleanup) return; // already running or disabled
    
    const cleanup = connectTickerWS(
      get().symbol,
      (data: TickerMessage) => {
        set({
          ticker: {
            symbol: data.sym,
            bid: data.bid,
            ask: data.ask,
            last: data.last,
            volume: data.volume,
            ts: data.timestamp.toString()
          } as any,
          lastUpdate: data.timestamp,
          status: "live" as any,
          lastError: null
        });
      },
      (state: ConnectionState) => {
        set({
          wsStatus: state.status,
          wsLatency: state.latency,
          wsReconnectAttempts: state.reconnectAttempts
        });
      }
    );
    
    set({ wsCleanup: cleanup });
  },

  stopWS: () => {
    get().wsCleanup?.();
    set({ 
      wsCleanup: undefined, 
      wsStatus: "CLOSED",
      wsLatency: 0,
      wsReconnectAttempts: 0
    });
  },

  toggleWS: () => {
    if (get().wsCleanup) {
      get().stopWS();
    } else {
      get().startWS();
    }
  },
}));

// Debug için window'a bağla
if (typeof window !== "undefined") {
  (window as any).bt = useBtcturkStore;
}
