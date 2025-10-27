import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

export default fp(async function healthPlugin(app: FastifyInstance) {
  const payload = () => ({
    status: "ok",
    service: "executor",
    now: Date.now(),
    uptime: process.uptime(),
  });

  app.get("/api/public/ping", async (_req: any, reply: any) => {
    reply.send(payload());
  });

  app.get("/api/public/health", async (_req: any, reply: any) => {
    reply.send(payload());
  });
});


