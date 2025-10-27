import WebSocket from "ws";
import type { ExchangePublic, Ticker, Kline, Symbol } from "./binance";

const REST = "https://api.binance.com/api/v3";
const WS = "wss://stream.binance.com:9443/ws";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchJson(url: string, timeoutMs = 7000, retries = 3, backoff = 500) {
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (r.status === 429) throw new Error("429 rate limited");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === retries) throw e;
      await sleep(backoff * Math.pow(2, i));
    } finally { 
      clearTimeout(t); 
    }
  }
  throw new Error("unreachable");
}

export class BinancePublic implements ExchangePublic {
  private useMock = (process.env.EXCHANGE_MODE || "mock").toLowerCase() !== "binance";

  async getTicker(symbol: Symbol): Promise<Ticker> {
    if (this.useMock) {
      return { symbol, price: String(50000 + Math.random() * 1000), volume: String(Math.random() * 100), timestamp: Date.now() };
    }
    const j = await fetchJson(
      `${REST}/ticker/price?symbol=${symbol}`,
      +(process.env.EXCHANGE_TIMEOUT_MS || 7000),
      +(process.env.EXCHANGE_RETRY_MAX || 3),
      +(process.env.EXCHANGE_BACKOFF_MS || 500)
    );
    return { symbol: j.symbol, price: String(j.price), volume: String(j.volume || 0), timestamp: Date.now() };
  }

  async getKlines(symbol: Symbol, interval: string, limit = 100): Promise<Kline[]> {
    if (this.useMock) {
      const now = Date.now();
      return Array.from({ length: limit }).map((_, i) => ({
        openTime: now - (limit - i) * 60_000,
        open: String(50000),
        high: String(50500),
        low: String(49500),
        close: String(50200),
        volume: String(10),
        closeTime: now - (limit - i - 1) * 60_000
      }));
    }
    const a = await fetchJson(
      `${REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      +(process.env.EXCHANGE_TIMEOUT_MS || 7000),
      +(process.env.EXCHANGE_RETRY_MAX || 3),
      +(process.env.EXCHANGE_BACKOFF_MS || 500)
    ) as any[];
    return a.map(x => ({
      openTime: x[0],
      open: String(x[1]),
      high: String(x[2]),
      low: String(x[3]),
      close: String(x[4]),
      volume: String(x[5]),
      closeTime: x[6]
    }));
  }

  streamTrades(symbol: Symbol, onData: (t: Ticker) => void, onClose?: (e?: Error) => void) {
    if (this.useMock) {
      const id = setInterval(() => onData({ 
        symbol, 
        price: String(50000 + Math.random() * 1000), 
        volume: String(Math.random() * 100), 
        timestamp: Date.now() 
      }), 1000);
      return () => clearInterval(id);
    }
    const s = symbol.toLowerCase();
    const ws = new WebSocket(`${WS}/${s}@trade`);
    ws.on("message", (buf) => {
      try {
        const m = JSON.parse(buf.toString());
        if (m?.p && m?.s) onData({ 
          symbol: m.s, 
          price: String(m.p), 
          volume: String(m.q || 0), 
          timestamp: m.E || Date.now() 
        });
      } catch {}
    });
    ws.on("close", () => onClose?.());
    ws.on("error", (e) => onClose?.(e as any));
    return () => ws.close();
  }
}

export const binance = new BinancePublic(); 