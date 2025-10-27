// services/executor/src/routes/health.ts
import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (req, reply) => {
    const uptimeSec = process.uptime();
    const now = Date.now();
    return {
      ok: true,
      service: "executor",
      pid: process.pid,
      uptimeSec,
      now,
      env: {
        NODE_ENV: process.env.NODE_ENV ?? null,
      },
    };
  });
}