import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";
import fetch from "node-fetch";

export const readyRouter = Router();

readyRouter.get("/ready", async (req, res) => {
  const wsMax = Number(process.env.READY_WS_MAX_AGE_MS || 15000);
  const minCalls = Number(process.env.READY_METRICS_MIN_CALLS || 1);

  // 1) Public health check
  let okPublic = false;
  try {
    const r = await fetch("http://127.0.0.1:4001/api/public/health");
    okPublic = r.ok;
  } catch {
    // Health check failed
  }

  // 2) Metrics availability check
  let okMetrics = false;
  let calls = 0;
  try {
    const m = await (await fetch("http://127.0.0.1:4001/api/public/metrics/prom")).text();
    const mm = m.match(/^spark_private_calls_total\s+(\d+(?:\.\d+)?)$/m);
    calls = mm ? Number(mm[1]) : 0;
    okMetrics = calls >= minCalls;
  } catch {
    // Metrics check failed
  }

  // 3) WebSocket status check
  let okWS = false;
  let age = Infinity;
  try {
    const j = await (await fetch("http://127.0.0.1:4001/api/private/websocket/status")).json();
    const lastPongTs = (j as any)?.lastPongTs || Date.now();
    const connected = (j as any)?.connected || false;
    age = Date.now() - (new Date(lastPongTs)).getTime();
    okWS = connected === true && age < wsMax;
  } catch {
    // WebSocket check failed
  }

  const ready = okPublic && okMetrics && okWS;
  
  res.status(ready ? 200 : 503).json({
    ok: ready,
    okPublic,
    okMetrics,
    calls,
    okWS,
    ageMs: age,
    timestamp: new Date().toISOString()
  });
}); 