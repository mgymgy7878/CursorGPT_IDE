import express from "express";
import bodyParser from "body-parser";
import { Registry, collectDefaultMetrics, Counter, Histogram } from "prom-client";
import { randomUUID } from "crypto";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

const app = express();
app.use(bodyParser.json());

// --- Debug banner
const buildTs = new Date().toISOString();
console.log("[EXECUTOR_LITE_BOOT]", { 
  buildTs, 
  node: process.version, 
  file: __filename
});

// --- Metrics
const registry = new Registry();
collectDefaultMetrics({ register: registry });

const uiHits = new Counter({ 
  name: "spark_ui_hits_total", 
  help: "UI hits", 
  registers: [registry] 
});

const backtestStart = new Counter({ 
  name: "backtest_start_total", 
  help: "Backtest starts", 
  registers: [registry] 
});

const backtestDone = new Counter({ 
  name: "backtest_done_total", 
  help: "Backtests done", 
  registers: [registry] 
});

const enqueueLatency = new Histogram({
  name: "backtest_enqueue_ms",
  help: "Start handler latency (ms)",
  buckets: [5, 10, 20, 50, 100, 200, 500, 1000],
  registers: [registry]
});

app.get("/metrics", async (_req, res) => {
  uiHits.inc();
  res.setHeader("content-type", registry.contentType);
  res.end(await registry.metrics());
});

// --- Audit logging
function audit(entry: any) {
  try {
    const auditDir = join(process.cwd(), "..", "..", "logs", "audit");
    mkdirSync(auditDir, { recursive: true });
    const line = JSON.stringify({ ...entry, ts: Date.now() }) + "\n";
    appendFileSync(join(auditDir, "backtest.log"), line);
  } catch (err) {
    console.error("[AUDIT_ERROR]", err);
  }
}

// --- Auth
function requireAdmin(req: any, res: any, next: any) {
  const token = req.header("x-admin-token");
  const expected = process.env.ADMIN_TOKEN || "test-secret-123";
  
  if (!token || token !== expected) {
    audit({ evt: "auth_failed", path: req.path, ip: req.ip });
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// --- Rate limiting (simple in-memory)
const rateLimitBuckets = new Map<string, { count: number; resetTime: number }>();
app.use((req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || { count: 0, resetTime: now };
  
  if (now > bucket.resetTime) {
    bucket.count = 0;
    bucket.resetTime = now + 60_000; // 1 minute window
  }
  
  if (++bucket.count > 60) {
    audit({ evt: "rate_limited", ip: req.ip, path: req.path });
    return res.status(429).json({ error: "rate_limited" });
  }
  
  rateLimitBuckets.set(key, bucket);
  next();
});

// --- Backtest (engine integration)
const USE_ENGINE = (process.env.BACKTEST_IMPL ?? "mock") === "engine";

type Job = { id: string; pair: string; timeframe: string; notes: string; status: "queued"|"running"|"done"; ts: number };
const Q: Job[] = [];

app.post("/api/backtest/start", requireAdmin, async (req: any, res: any) => {
  const endTimer = enqueueLatency.startTimer();
  const { pair = "ETHUSDT", timeframe = "4h", notes = "", params = {} } = req.body ?? {};
  
  backtestStart.inc();
  
  try {
    if (!USE_ENGINE) {
      // Mock mode (v1.1 behavior)
      const id = `mock-${Date.now()}`;
      audit({ evt: "start", id, pair, timeframe, notes, ip: req.ip, ua: req.headers["user-agent"] });
      Q.push({ id, pair, timeframe, notes, status: "queued", ts: Date.now() });
      setTimeout(() => { 
        const j = Q.find(x => x.id === id); 
        if (j) {
          j.status = "done";
          backtestDone.inc();
          audit({ evt: "done", id });
        }
      }, 3500);
      endTimer();
      return res.status(202).json({ id, status: "queued", impl: "mock" });
    }
    
    // Engine mode (v1.2)
    const { runBacktestJob } = await import("./jobs/backtest.js");
    const result = await runBacktestJob({ pair, timeframe, params });
    
    backtestDone.inc();
    audit({ evt: "start", id: result.id, pair, timeframe, notes, ip: req.ip, ua: req.headers["user-agent"] });
    audit({ evt: "done", id: result.id, summary: result.summary });
    
    Q.push({ id: result.id, pair, timeframe, notes, status: "done", ts: Date.now() });
    
    endTimer();
    return res.status(201).json({ 
      id: result.id, 
      status: "done", 
      summary: result.summary, 
      impl: "engine" 
    });
  } catch (e: any) {
    endTimer();
    return res.status(500).json({ error: "engine_failed", detail: String(e?.message ?? e) });
  }
});

app.get("/api/backtest/status", requireAdmin, (_req: any, res: any) => {
  if (!USE_ENGINE) {
    const stats = { 
      queued: Q.filter(x=>x.status==="queued").length, 
      running: Q.filter(x=>x.status==="running").length, 
      done: Q.filter(x=>x.status==="done").length 
    };
    return res.json({ queue: Q.slice(-20), stats, impl: "mock" });
  }
  
  // Engine mode - simple summary (gerçek kuyruk yönetimi Iteration 1.5)
  const stats = { 
    queued: 0, 
    running: 0, 
    done: Q.filter(x=>x.status==="done").length 
  };
  return res.json({ queue: Q.slice(-20), stats, impl: "engine" });
});

// Implementation probe (hangi modda çalışıyor?)
app.get("/api/backtest/__impl", (_req: any, res: any) => {
  res.json({ engine: USE_ENGINE, env: process.env.BACKTEST_IMPL ?? "(unset)" });
});

// --- Route inventory (kanıt)
app.get("/__routes", (_req, res) => {
  const stack = (app as any)._router?.stack ?? [];
  const routes:any[] = [];
  for (const l of stack) if (l.route?.path) routes.push({ path: l.route.path, methods: Object.keys(l.route.methods).join(",").toUpperCase() });
  res.json({ routes });
});

const PORT = Number(process.env.PORT ?? 4010);
app.listen(PORT, "127.0.0.1", () => console.log("[EXECUTOR_LITE_LISTENING]", { port: PORT }));

