import type { ExchangeAdapter, MarketType, Side, Ticker } from "@spark/exchange-core";

export const binanceAdapter: ExchangeAdapter = {
  id: "binance",
  markets: ["spot", "futures"],

  streamTicker(symbol, cb) {
    // Placeholder: implement public aggTrade/bookTicker WS
    let alive = true;
    (async function poll() {
      while (alive) {
        const now = Date.now();
        cb({ symbol, bid: 0, ask: 0, last: 0, ts: now });
        await new Promise((r) => setTimeout(r, 5000));
      }
    })();
    return () => { alive = false; };
  },

  async placeOrder(p: { symbol: string; side: Side; qty: number; price?: number; type: "limit" | "market"; }): Promise<{ id: string; }> {
    // TODO: sign and call Binance REST; env keys required
    return { id: `dev-${Date.now()}` };
  },

  async cancelOrder(id: string): Promise<void> {
    return;
  },

  async fetchOpenOrders(): Promise<any[]> {
    return [];
  },
};

export default binanceAdapter;


