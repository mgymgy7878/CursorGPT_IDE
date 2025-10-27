import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";
import { DurableQueue } from "../lib/durableQueue";
import { snapshot, retention } from "../lib/snapshots";

export const day9Router = Router();

// Chaos toggle
day9Router.post("/chaos/toggle", (req, res) => {
  const { httpErrorPct, latencyMs, wsFlapSec } = req.body || {};
  
  if (httpErrorPct !== undefined) {
    process.env.CHAOS_HTTP_ERROR_PCT = String(httpErrorPct);
  }
  if (latencyMs !== undefined) {
    process.env.CHAOS_HTTP_LATENCY_MS = String(latencyMs);
  }
  if (wsFlapSec !== undefined) {
    process.env.CHAOS_WS_FLAP_SEC = String(wsFlapSec);
  }
  
  res.json({
    ok: true,
    env: { httpErrorPct, latencyMs, wsFlapSec }
  });
});

// Queue enqueue
day9Router.post("/queue/enqueue", async (req, res) => {
  const q = new DurableQueue(
    process.env.QUEUE_DIR || "runtime/queue",
    process.env.QUEUE_NAME || "signals"
  );
  
  await q.init();
  const id = await q.enqueue(req.body || {});
  
  res.json({ id, stats: q.stats() });
});

// Snapshot
day9Router.post("/snapshot", async (req, res) => {
  const file = await snapshot(
    req.body?.name || "custom",
    req.body?.data || {}
  );
  
  await retention(Number(process.env.SNAPSHOT_RETENTION_DAYS || 7));
  
  res.json({ file });
}); 