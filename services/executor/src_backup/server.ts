import "./bootstrap/env";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { metrics } from "./metrics";
import { diagHandler } from "./routes/diag";

const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = Number(process.env.PORT ?? 4001);

// Market feed mock
const mockFeed = {
  state: {
    lastPrice: 45000,
    wsUp: true
  }
};

app.get("/api/public/live/health", async (_req, res) => {
  res.json({
    exchange: mockFeed.state.lastPrice ? "up" : "down",
    ws: mockFeed.state.wsUp ? "up" : "down",
    drift: 0,
    killSwitch: Number(process.env.TRADING_KILL_SWITCH || "0"),
    circuit: "closed",
    db: "up"
  });
});

app.get("/api/public/live/snapshot", async (_req, res) => {
  res.json({
    tradesLastMin: 0,
    openOrders: 0,
    positions: [],
    recentTrades: [],
    lastPrice: mockFeed.state.lastPrice
  });
});

app.post("/api/public/strategy/deploy-live", (req, res) => {
  const mode = Number(process.env.LIVE_TRADING ?? "0");
  const body = (req.body || {}) as { symbol?: string; qty?: number; price?: number; side?: string; type?: string };
  
  if (mode === 1) { 
    metrics.incBlocked("arm_only"); 
    return res.status(403).json({ code: "arm_only" }); 
  }
  
  if (mode === 2) {
    return res.status(202).json({ code: "confirm_required", echo: body });
  }
  
  return res.status(400).json({ code: "invalid_trading_mode" });
});

app.post("/api/public/strategy/confirm", async (req, res) => {
  const body = req.body || {};
  const clientId = `cli_${Date.now()}`;
  const symbol = (body.symbol || "BTCUSDT").toUpperCase();
  const qty = Number(body.qty || 0.0002);
  const side = (body.side || "BUY").toString().toUpperCase() as "BUY" | "SELL";
  const price = mockFeed.state.lastPrice || null;

  // Emir gönderim mantığı
  const mode = Number(process.env.LIVE_TRADING ?? "0");
  const shadow = Number(process.env.SHADOW_MODE ?? "1") === 1;
  const apiKey = process.env.BINANCE_MAINNET_API_KEY || "";
  const apiSecret = process.env.BINANCE_MAINNET_API_SECRET || "";

  // Gate: yalnızca LIVE_TRADING===2 ise canlı emir düşünülebilir
  if (mode !== 2) {
    metrics.incTrade();
    return res.status(202).json({ accepted: true, clientId, echo: body, note: "mode!=2; exchange_not_called" });
  }

  if (shadow) {
    metrics.incTrade();
    return res.status(202).json({ accepted: true, clientId, echo: body, shadow: true });
  }

  if (!apiKey || !apiSecret) {
    metrics.incBlocked("no_keys");
    return res.status(403).json({ code: "no_keys", message: "BINANCE_* keys missing" });
  }

  // Mock successful order
  metrics.incFilled();
  return res.status(202).json({
    accepted: true,
    clientId,
    exchange: { orderId: `ord_${Date.now()}`, transactTime: Date.now(), status: "FILLED" }
  });
});

// --- Metrics Snapshot Endpoint ---
app.get("/api/public/metrics/snapshot", (_req, res) => {
  res.setHeader("cache-control", "no-store");
  res.json(metrics.snapshot());
});

// --- Diagnostic Endpoint ---
app.get("/api/public/diag/env", diagHandler);

// --- Settings endpoint (for token sync) ---
app.post("/api/private/settings", (req, res) => {
  const { type, token } = req.body || {};
  
  if (type === "token_sync" && token) {
    process.env.EXECUTOR_TOKEN = token;
    console.log(`[executor] Token synced: ${token.slice(0, 8)}...`);
    return res.json({ ok: true, message: "Token synced successfully" });
  }
  
  return res.status(400).json({ error: "invalid_request" });
});

app.get("/api/public/metrics/prom", (_req, res) => {
  res.set("content-type", "text/plain; version=0.0.4");
  res.send(metrics.renderProm());
});

app.listen(PORT, () => console.log(`[EXECUTOR] READY on ${PORT}`)); 