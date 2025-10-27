import "./bootstrap/env";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4001);

// Diagnostic endpoint
app.get("/api/public/diag/env", (_req, res) => {
  res.json({
    port: Number(process.env.PORT || 4001),
    liveTrading: Number(process.env.LIVE_TRADING ?? "0"),
    shadowMode: Number(process.env.SHADOW_MODE ?? "1"),
    hasToken: Boolean(process.env.EXECUTOR_TOKEN),
    hasKeys: Boolean(process.env.BINANCE_MAINNET_API_KEY && process.env.BINANCE_MAINNET_API_SECRET),
    whitelist: (process.env.TRADE_WHITELIST || "").split(",").filter(Boolean),
    tradeWindow: process.env.TRADE_WINDOW || "N-A",
  });
});

// Metrics snapshot endpoint
app.get("/api/public/metrics/snapshot", (_req, res) => {
  res.setHeader("cache-control", "no-store");
  res.json({
    live_trades_total: 0,
    live_blocked_total: {
      arm_only: 0,
      rule_violation: 0,
      notional_limit: 0,
      whitelist_violation: 0,
      outside_window: 0,
      cooldown_active: 0,
      kill_switch: 0,
      no_keys: 0
    },
    live_orders_filled_total: 0,
    live_exchange_errors_total: 0,
    backtest_runs_total: 0,
    optimize_runs_total: 0,
    rbac_blocked_total: 0,
    audit_ui_queries_total: 0,
    metrics_rollup_jobs_total: 0,
    metrics_rollup_events_total: 0
  });
});

// ARM test endpoint
app.post("/api/public/strategy/deploy-live", (req, res) => {
  const mode = Number(process.env.LIVE_TRADING ?? "0");
  const body = req.body || {};
  
  if (mode === 1) { 
    return res.status(403).json({ code: "arm_only" }); 
  }
  
  if (mode === 2) {
    return res.status(202).json({ code: "confirm_required", echo: body });
  }
  
  return res.status(400).json({ code: "invalid_trading_mode" });
});

// Confirm test endpoint
app.post("/api/public/strategy/confirm", (req, res) => {
  const body = req.body || {};
  const clientId = `cli_${Date.now()}`;
  const shadow = Number(process.env.SHADOW_MODE ?? "1") === 1;

  if (shadow) {
    return res.status(202).json({ 
      accepted: true, 
      clientId, 
      echo: body, 
      shadow: true 
    });
  }

  return res.status(202).json({
    accepted: true,
    clientId,
    exchange: { orderId: `ord_${Date.now()}`, transactTime: Date.now(), status: "FILLED" }
  });
});

// Health endpoint
app.get("/api/public/live/health", (_req, res) => {
  res.json({
    exchange: "up",
    ws: "up",
    drift: 0,
    killSwitch: Number(process.env.TRADING_KILL_SWITCH || "0"),
    circuit: "closed",
    db: "up"
  });
});

// Snapshot endpoint
app.get("/api/public/live/snapshot", (_req, res) => {
  res.json({
    tradesLastMin: 0,
    openOrders: 0,
    positions: [],
    recentTrades: [],
    lastPrice: 45000
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server listening on :${PORT}`);
  console.log(`📊 Environment:`, {
    PORT: process.env.PORT,
    LIVE_TRADING: process.env.LIVE_TRADING,
    SHADOW_MODE: process.env.SHADOW_MODE,
    TRADE_WHITELIST: process.env.TRADE_WHITELIST,
    TRADE_WINDOW: process.env.TRADE_WINDOW
  });
}); 