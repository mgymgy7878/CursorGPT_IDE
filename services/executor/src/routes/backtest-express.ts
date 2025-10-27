import { Router } from "express";
import { randomUUID } from "node:crypto";

export const backtestRouter = Router();

// Hafif in-memory kuyruk (kanıt amacıyla)
const Q: any[] = [];

function requireAdmin(req: any, res: any, next: any) {
  if (req.header("x-admin-token") !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// POST /api/backtest/start
backtestRouter.post("/start", requireAdmin, (req, res) => {
  const { pair = "ETHUSDT", timeframe = "4h", notes = "" } = req.body ?? {};
  const id = `bt-${Date.now()}-${randomUUID().slice(0, 8)}`;
  Q.push({ id, pair, timeframe, notes, status: "queued", ts: Date.now() });
  setTimeout(() => {
    const it = Q.find((x) => x.id === id);
    if (it) it.status = "done";
  }, 4000);
  res.status(201).json({ id, status: "queued" });
});

// GET /api/backtest/status
backtestRouter.get("/status", requireAdmin, (_req, res) => {
  const stats = {
    queued: Q.filter((x) => x.status === "queued").length,
    running: Q.filter((x) => x.status === "running").length,
    done: Q.filter((x) => x.status === "done").length,
  };
  res.json({ queue: Q.slice(-20), stats });
});
