// services/executor/src/routes/metrics.ts
import type { FastifyInstance } from "fastify";
import { registry } from "../metrics.js";

export async function metricsRoutes(app: FastifyInstance) {
  app.get("/public/metrics/prom", async (_req, reply) => {
    const body = await registry.metrics();
    reply.header("Content-Type", registry.contentType).send(body);
  });
}