import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";

const r = Router();

// Mock data
const mockTicker = {
  symbol: "BTCUSDT",
  price: 50000 + Math.random() * 1000,
  ts: Date.now()
};

const mockKlines = Array.from({ length: 100 }, (_, i) => [
  Date.now() - (100 - i) * 60000,
  mockTicker.price + Math.random() * 100 - 50,
  mockTicker.price + Math.random() * 100 - 50,
  mockTicker.price + Math.random() * 100 - 50,
  mockTicker.price + Math.random() * 100 - 50,
  Math.random() * 100,
  Date.now() - (100 - i) * 60000,
  Math.random() * 1000,
  Math.random() * 100,
  Math.random() * 100,
  Math.random() * 100
]);

r.get("/health", async (_req, res) => {
  try { 
    res.json({ ok: true, mode: process.env.EXCHANGE_MODE || "mock" }); 
  } catch (e: any) { 
    res.status(502).json({ ok: false, error: e.message, mode: process.env.EXCHANGE_MODE || "mock" }); 
  }
});

r.get("/ticker", async (req, res) => {
  const symbol = (req.query.symbol as string) || "BTCUSDT";
  try { 
    const ticker = {
      symbol,
      price: mockTicker.price + Math.random() * 100 - 50,
      ts: Date.now()
    };
    res.json(ticker); 
  } catch (e: any) { 
    res.status(502).json({ error: e.message }); 
  }
});

r.get("/klines", async (req, res) => {
  const symbol = (req.query.symbol as string) || "BTCUSDT";
  const interval = (req.query.interval as string) || "1m";
  const limit = Number(req.query.limit || 100);
  try { 
    res.json(mockKlines.slice(0, limit)); 
  } catch (e: any) { 
    res.status(502).json({ error: e.message }); 
  }
});

// SSE stream: /api/public/market/stream?symbol=BTCUSDT
r.get("/stream", (req, res) => {
  const symbol = (req.query.symbol as string) || "BTCUSDT";
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  
  const interval = setInterval(() => {
    const ticker = {
      symbol,
      price: mockTicker.price + Math.random() * 100 - 50,
      ts: Date.now()
    };
    res.write(`event: ticker\ndata: ${JSON.stringify(ticker)}\n\n`);
  }, 1000);
  
  req.on("close", () => clearInterval(interval));
});

export default r; 