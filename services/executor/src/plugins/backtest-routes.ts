import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

// Basit in-memory kuyruk
const Q: any[] = [];

function requireAdmin(request: any, reply: any, done: any) {
  const token = request.headers["x-admin-token"];
  const expected = process.env.ADMIN_TOKEN ?? "test-secret-123";
  
  if (!token || token !== expected) {
    return reply.status(401).send({ error: "unauthorized" });
  }
  done();
}

export default async function backtestRoutes(fastify: FastifyInstance) {
  // POST /api/backtest/start
  fastify.post("/api/backtest/start", { preHandler: requireAdmin }, async (request, reply) => {
    const { pair = "ETHUSDT", timeframe = "4h", notes = "" } = request.body as any ?? {};
    const id = `bt-${Date.now()}-${randomUUID().slice(0, 8)}`;
    
    Q.push({ 
      id, 
      pair, 
      timeframe, 
      notes, 
      status: "queued", 
      ts: Date.now() 
    });

    // 4 saniye sonra "done" yap
    setTimeout(() => {
      const it = Q.find((x) => x.id === id);
      if (it) it.status = "done";
    }, 4000);

    return reply.status(201).send({ id, status: "queued" });
  });

  // GET /api/backtest/status
  fastify.get("/api/backtest/status", { preHandler: requireAdmin }, async (request, reply) => {
    const stats = {
      queued: Q.filter((x) => x.status === "queued").length,
      running: Q.filter((x) => x.status === "running").length,
      done: Q.filter((x) => x.status === "done").length,
    };
    return reply.send({ queue: Q.slice(-20), stats });
  });
}
