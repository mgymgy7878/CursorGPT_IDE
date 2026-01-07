// --- Environment loading (monorepo-safe) - MUST BE FIRST
// Import and immediately await env loading before any other imports
const envModule = await import("./lib/env.js");
await envModule.loadEnv();

// --- Database client (after env load)
import { prisma } from "./lib/db.js";

// --- Fastify and dependencies
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Registry, collectDefaultMetrics } from "prom-client";

// --- Server bootstrap
const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// --- Metrics
const register = new Registry();
collectDefaultMetrics({ register });

// --- Health endpoints
app.get("/healthz", async () => ({
  status: "ok",
  service: "executor",
  ts: Date.now(),
}));

// Health with DB check (deterministic response)
app.get("/health", async () => {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbError: string | null = null;

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbError =
      error instanceof Error ? error.message : String(error);
  }

  const status = dbStatus === "connected" ? "healthy" : "degraded";

  return {
    status,
    service: "executor",
    db: dbStatus,
    ...(dbError && { error: dbError }),
    ts: Date.now(),
  };
});

// --- Metrics endpoint
app.get("/metrics", async (_req, reply) => {
  reply.type("text/plain");
  return register.metrics();
});

// --- Backtest dry-run (mock)
app.post("/backtest/dry-run", async (req) => {
  // Minimal mock payload & response
  return {
    ok: true,
    jobId: `dry_${Date.now()}`,
    received: await req.body,
    startedAt: new Date().toISOString(),
  };
});

// --- Error Budget
import errorBudgetRoute from "./routes/errorBudget.js";
await app.register(errorBudgetRoute);

// --- Backtest
import backtestRoute from "./routes/backtest.js";
await app.register(backtestRoute);

// --- Guardrails
import guardrailsRoute from "./routes/guardrails.js";
await app.register(guardrailsRoute);

// --- V1 API Routes
import strategiesRoute from "./routes/v1/strategies.js";
await app.register(strategiesRoute);

import auditRoute from "./routes/v1/audit.js";
await app.register(auditRoute);

import positionsRoute from "./routes/v1/positions.js";
await app.register(positionsRoute);

import tradesRoute from "./routes/v1/trades.js";
await app.register(tradesRoute);

import strategyActionsRoute from "./routes/v1/strategy-actions.js";
await app.register(strategyActionsRoute);

import auditVerifyRoute from "./routes/v1/audit-verify.js";
await app.register(auditVerifyRoute);

// --- Start
const PORT = Number(process.env.PORT || 4001);
const HOST = process.env.HOST || "0.0.0.0";
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`✅ executor running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
