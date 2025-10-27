import type { ExchangeAdapter, Ticker } from "@spark/exchange-core";

type WsOpts = { url: string; symbol: string; onData: (t: Ticker & { source?: "ws" | "mock" }) => void };

function wsStream({ url, symbol, onData }: WsOpts) {
  const ws = new WebSocket(`${url}?symbol=${encodeURIComponent(symbol)}`);
  const handler = (e: MessageEvent) => {
    try {
      const m = JSON.parse((e as any).data as string);
      onData({ symbol, bid: m.bid, ask: m.ask, last: m.last, ts: m.ts, source: "ws" });
    } catch {
      // ignore
    }
  };
  (ws as any).addEventListener?.("message", handler);
  return () => {
    try {
      (ws as any).removeEventListener?.("message", handler);
      (ws as any).close?.();
    } catch {}
  };
}

export const btcturkHisseAdapter: ExchangeAdapter = {
  id: "btcturk-hisse",
  markets: ["equity"],

  streamTicker(symbol, cb) {
    const url = process.env.BTCTURK_HISSE_WS_URL || process.env.NEXT_PUBLIC_BTCTURK_HISSE_WS_URL || "";
    if (url) return wsStream({ url, symbol, onData: cb as any });

    let alive = true;
    (async function poll() {
      while (alive) {
        try {
          const base = process.env.PUBLIC_BASE_URL || "";
          const res = await fetch(`${base}/api/public/btcturk-hisse/ticker?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
          const j = await res.json();
          cb({ symbol, bid: j.bid, ask: j.ask, last: j.last, ts: j.ts });
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    })();
    return () => { alive = false; };
  },

  async placeOrder() {
    throw new Error("Not implemented: enable with broker endpoints");
  },
  async cancelOrder() {
    throw new Error("Not implemented");
  },
  async fetchOpenOrders() {
    return [];
  },
};

export default btcturkHisseAdapter;


