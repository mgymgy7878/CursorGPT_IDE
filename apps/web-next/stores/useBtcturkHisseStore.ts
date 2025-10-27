"use client";
import { create } from "zustand";

type FeedMode = "ws" | "polling" | "mock";

type State = {
  symbol: string;
  status: "idle" | "loading" | "open" | "degraded";
  feedMode: FeedMode;
  ticker?: { bid: number; ask: number; last: number; ts: number };
  unsubscribe?: () => void;
  lastError?: string | null;
};

type Actions = {
  start: () => void;
  stop: () => void;
  setSymbol: (s: string) => void;
};

export const useBtcturkHisseStore = create<State & Actions>((set, get) => ({
  symbol: process.env.NEXT_PUBLIC_EQUITY_DEFAULT || "ISCTR.E",
  status: "idle",
  feedMode: "mock",
  start() {
    if (get().unsubscribe) return;
    set({ status: "loading", lastError: null });

    const wsUrl = process.env.NEXT_PUBLIC_BTCTURK_HISSE_WS_URL;
    const symbol = get().symbol;
    let unsubscribe: (() => void) | undefined;

    const onData = (t: { bid: number; ask: number; last: number; ts: number; source?: string }) =>
      set({ ticker: t, status: t.source === "ws" ? "open" : "degraded", feedMode: (t.source as FeedMode) || "mock" });

    if (wsUrl) {
      try {
        const ws = new WebSocket(`${wsUrl}?symbol=${encodeURIComponent(symbol)}`);
        ws.onmessage = (e) => onData({ ...(JSON.parse(e.data as any)), source: "ws" } as any);
        ws.onerror = () => set({ status: "degraded", feedMode: "polling" });
        ws.onopen = () => set({ feedMode: "ws" });
        unsubscribe = () => ws.close();
      } catch (e: any) {
        set({ lastError: String(e), status: "degraded", feedMode: "polling" });
      }
    }
    if (!unsubscribe) {
      let alive = true;
      (async function loop() {
        while (alive) {
          try {
            const r = await fetch(`/api/public/btcturk-hisse/ticker?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
            const j = await r.json();
            onData({ ...j, source: "mock" });
          } catch (e: any) {
            set({ lastError: String(e) });
          }
          await new Promise((res) => setTimeout(res, 2000));
        }
      })();
      unsubscribe = () => {
        alive = false;
      };
    }
    set({ unsubscribe });
  },
  stop() {
    get().unsubscribe?.();
    set({ unsubscribe: undefined, status: "idle" });
  },
  setSymbol(s) {
    set({ symbol: s });
    get().stop();
    get().start();
  },
}));


