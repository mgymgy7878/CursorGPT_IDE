import Fastify from "fastify";
import cors from "@fastify/cors";
import { Registry, collectDefaultMetrics } from "prom-client";

// --- Server bootstrap
const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// --- Metrics
const register = new Registry();
collectDefaultMetrics({ register });

// --- Health
app.get("/healthz", async () => ({
  status: "ok",
  service: "executor",
  ts: Date.now(),
}));

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
