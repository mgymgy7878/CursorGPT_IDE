import WebSocket from "ws";

export type MarketState = {
  wsUp: boolean;
  lastPrice: number | undefined;
  lastTs: number | undefined;
};

export class BinancePublicFeed {
  private ws: WebSocket | null = null;
  public state: MarketState = { wsUp: false, lastPrice: undefined, lastTs: undefined };
  constructor(private symbol = "btcusdt") {}
  start() {
    const url = `wss://stream.binance.com:9443/ws/${this.symbol}@trade`;
    this.ws = new WebSocket(url);
    this.ws.on("open", () => { this.state.wsUp = true; });
    this.ws.on("message", (raw: WebSocket.RawData) => {
      try {
        const j = JSON.parse(raw.toString());
        const p = parseFloat(j.p);
        if (!isNaN(p)) {
          this.state.lastPrice = p;
          this.state.lastTs = Date.now();
        }
      } catch {}
    });
    this.ws.on("close", () => { this.state.wsUp = false; setTimeout(()=>this.start(), 1500); });
    this.ws.on("error", () => { /* swallow; close triggers reconnect */ });
  }
} 