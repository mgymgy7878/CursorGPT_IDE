import Fastify from "fastify";
import cors from "@fastify/cors";
import { registry } from "./metrics";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// Prometheus metrics (already initialized in metrics.ts)

// Health
app.get("/healthz", async () => ({
  status: "ok",
  service: "marketdata",
  ts: Date.now(),
}));

// Metrics
app.get("/metrics", async (_req, reply) => {
  reply.type("text/plain");
  return registry.metrics();
});

// Start BTCTurk WS client
import { createBTCTurkClient } from "./ws/btcturk.js";
import { observeTick } from "./metrics.js";

const btcturkClient = createBTCTurkClient();

// Subscribe to ticker with metrics
btcturkClient.subscribe("ticker", (data) => {
  const now = Date.now();
  observeTick("BTCTURK", now);
});

// (gelecekte: /ohlcv, /ws feed vs.)

const PORT = Number(process.env.PORT || 5001);
const HOST = process.env.HOST || "0.0.0.0";
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`✅ marketdata on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Cleanup on exit
process.on("SIGTERM", () => {
  btcturkClient.disconnect();
  process.exit(0);
});
process.on("SIGINT", () => {
  btcturkClient.disconnect();
  process.exit(0);
});
