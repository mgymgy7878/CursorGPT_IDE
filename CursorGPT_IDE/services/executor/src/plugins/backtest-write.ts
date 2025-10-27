import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { mBacktestRunsTotal } from "../metrics/backtest-metrics.js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "backtest");
const AUDIT_DIR = path.join(process.cwd(), "logs", "audit");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

/**
 * Timing-safe token comparison
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    // Fallback if crypto not available
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }
}

/**
 * Admin token validation middleware
 */
function validateAdmin(req: FastifyRequest, reply: FastifyReply): boolean {
  if (!ADMIN_TOKEN) {
    reply.code(500).send({ error: "Server misconfigured: ADMIN_TOKEN not set" });
    return false;
  }

  const token =
    req.headers["x-admin-token"] ||
    (req.headers.authorization || "").toString().replace(/^Bearer\s+/i, "") ||
    (req.cookies as any)?.["admin-token"];

  if (!token) {
    reply.code(401).send({ error: "Unauthorized: Missing admin token" });
    return false;
  }

  const tokenBuf = Buffer.from(String(token));
  const adminBuf = Buffer.from(ADMIN_TOKEN);

  if (!timingSafeEqual(tokenBuf, adminBuf)) {
    reply.code(401).send({ error: "Unauthorized: Invalid admin token" });
    return false;
  }

  return true;
}

/**
 * Audit log writer
 */
async function writeAudit(action: string, details: any) {
  try {
    await fs.mkdir(AUDIT_DIR, { recursive: true });
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const logFile = path.join(AUDIT_DIR, `backtest_${date}.log`);
    
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      ...details,
    };
    
    await fs.appendFile(logFile, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error("[audit] Failed to write log:", err);
  }
}

export default fp(async function backtestWritePlugin(app: FastifyInstance) {
  /**
   * POST /api/backtest/start
   * Start a new backtest run (queued state)
   */
  app.post("/api/backtest/start", async (req, reply) => {
    if (!validateAdmin(req, reply)) return;

    const body = req.body as any || {};
    const { notes, pair, timeframe, params } = body;
    
    const id = `bt-${Date.now()}`;
    const run = {
      id,
      status: "queued" as const,
      startedAt: Date.now(),
      notes: notes || "Manual backtest",
      pair: pair || "BTCUSDT",
      timeframe: timeframe || "1h",
      params: params || {},
      metrics: {},
    };

    try {
      // Write evidence
      await fs.mkdir(EVIDENCE_DIR, { recursive: true });
      const runFile = path.join(EVIDENCE_DIR, `run_${id}.json`);
      await fs.writeFile(runFile, JSON.stringify({ runs: [run] }, null, 2));

      // Update metrics
      mBacktestRunsTotal.labels("queued").inc();

      // Audit log
      await writeAudit("start", {
        ip: req.ip,
        user: "admin",
        id,
        payload: { pair, timeframe, notes },
        success: true,
      });

      app.log.info({ id, pair, timeframe }, "[backtest-write] New backtest queued");

      return reply.send({ id, status: "queued", startedAt: run.startedAt });
    } catch (err: any) {
      app.log.error({ err }, "[backtest-write] Failed to create backtest");
      
      await writeAudit("start", {
        ip: req.ip,
        user: "admin",
        error: err.message,
        success: false,
      });

      return reply.code(500).send({
        error: "Failed to create backtest",
        message: err.message,
      });
    }
  });

  /**
   * DELETE /api/backtest/cancel/:id
   * Cancel a running/queued backtest
   */
  app.delete("/api/backtest/cancel/:id", async (req, reply) => {
    if (!validateAdmin(req, reply)) return;

    const { id } = req.params as { id: string };
    const runFile = path.join(EVIDENCE_DIR, `run_${id}.json`);

    try {
      // Load existing run
      let data;
      try {
        const raw = await fs.readFile(runFile, "utf8");
        data = JSON.parse(raw);
      } catch (err) {
        return reply.code(404).send({ error: "Run not found", id });
      }

      // Update run status
      const runs = Array.isArray(data?.runs) ? data.runs : [data];
      const run = runs.find((r: any) => r.id === id);
      
      if (!run) {
        return reply.code(404).send({ error: "Run not found in file", id });
      }

      if (run.status === "done" || run.status === "failed") {
        return reply.code(400).send({ 
          error: "Cannot cancel completed run", 
          id, 
          status: run.status 
        });
      }

      // Mark as failed/canceled
      run.status = "failed";
      run.finishedAt = Date.now();
      run.notes = (run.notes || "") + " [canceled by admin]";

      // Write back
      await fs.writeFile(runFile, JSON.stringify({ runs }, null, 2));

      // Update metrics
      mBacktestRunsTotal.labels("failed").inc();

      // Audit log
      await writeAudit("cancel", {
        ip: req.ip,
        user: "admin",
        id,
        previousStatus: "queued/running",
        success: true,
      });

      app.log.info({ id }, "[backtest-write] Backtest canceled");

      return reply.send({ ok: true, id, status: "failed" });
    } catch (err: any) {
      app.log.error({ err, id }, "[backtest-write] Failed to cancel backtest");
      
      await writeAudit("cancel", {
        ip: req.ip,
        user: "admin",
        id,
        error: err.message,
        success: false,
      });

      return reply.code(500).send({
        error: "Failed to cancel backtest",
        message: err.message,
      });
    }
  });
});

