import fastify from "fastify";
import { writeFile } from "node:fs/promises";
import fusionGate from "./plugins/fusion-gate.js";
import { metricsRegistry } from "./metrics.js";
// import { getMetrics, getContentType } from "../../streams/src/metrics.js";

const BUILD_ID = "v1.3.4-p4-contract-lock";

const app = fastify({ logger: true });

// TEK register, prefix YOK — çünkü kontrat mutlak path ile tanımlı
await app.register(fusionGate);

// Optimizer plugin (v1.6-p2)
try {
  const optimizerPlugin = await import("../../../../packages/optimization/src/index.js");
  await app.register(optimizerPlugin.default);
  app.log.info("Optimizer plugin loaded successfully");
} catch (error) {
  app.log.warn("Optimizer plugin not available:", error.message);
}

// Drift Gates plugin (v1.6-p3)
try {
  const gatesPlugin = await import("../../../../packages/drift-gates/src/index.js");
  await app.register(gatesPlugin.default);
  app.log.info("Drift Gates plugin loaded successfully");
} catch (error) {
  app.log.warn("Drift Gates plugin not available:", error.message);
}

// Copilot Tools plugin (v1.9-p0.1)
try {
  const copilotTools = await import("./plugins/copilot-tools.js");
  await app.register(copilotTools.default);
  app.log.info("Copilot Tools plugin loaded successfully");
} catch (error) {
  app.log.warn("Copilot Tools plugin not available:", error.message);
}

// Alerts Routes plugin (v1.9-p3)
try {
  const alertsRoutes = await import("./routes/alerts.js");
  await app.register(alertsRoutes.default);
  app.log.info("Alerts Routes plugin loaded successfully");
} catch (error) {
  app.log.warn("Alerts Routes plugin not available:", error.message);
}

// Notifications Routes plugin (v1.9-p3c)
try {
  const notifyRoutes = await import("./routes/notify.js");
  await app.register(notifyRoutes.default);
  app.log.info("Notifications Routes plugin loaded successfully");
} catch (error) {
  app.log.warn("Notifications Routes plugin not available:", error.message);
}

// Strategy Bot plugin (v1.9-p1.x)
try {
  const strategyBot = await import("./plugins/strategy-bot.js");
  await app.register(strategyBot.default);
  app.log.info("Strategy Bot plugin loaded successfully");
} catch (error) {
  app.log.warn("Strategy Bot plugin not available:", error.message);
}

// Admin AI Providers plugin (v1.9-p1.ui)
try {
  const adminAI = await import("./plugins/admin-ai-providers.js");
  await app.register(adminAI.default);
  app.log.info("Admin AI Providers plugin loaded successfully");
} catch (error) {
  app.log.warn("Admin AI Providers plugin not available:", error.message);
}

// WebSocket Live plugin (v1.9-p2)
try {
  const wsLive = await import("./plugins/ws-live.js");
  await app.register(wsLive.default);
  app.log.info("WebSocket Live plugin loaded successfully");
} catch (error) {
  app.log.warn("WebSocket Live plugin not available:", error.message);
}

// Gürültülü kanıtlar (finalize'da sadeleştirin)
app.get("/__ping", async (req, reply) => {
  reply.header("x-build-id", BUILD_ID);
  return { ok: true, build: BUILD_ID };
});

app.get("/metrics", async (req, reply) => {
  // Executor metrics only
  const executorMetrics = await metricsRegistry().metrics();
  
  reply.header("Content-Type", "text/plain");
  return executorMetrics;
});

await app.ready();
const tree = app.printRoutes();
app.log.info(`[ready] ${BUILD_ID}\n--- ROUTE TREE ---\n${tree}\n--- END TREE ---`);
await writeFile(new URL("./route-tree.txt", import.meta.url), tree).catch(() => {});

await app.listen({ port: 4001, host: "0.0.0.0" });
