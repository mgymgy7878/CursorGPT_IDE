import fp from "fastify-plugin";
import { RateLimiterMemory } from "rate-limiter-flexible";

const limiter = new RateLimiterMemory({
  points: 60,
  duration: 60,
  execEvenly: true,
});

export default fp(async (app) => {
  app.addHook("onRequest", async (req: any, reply: any) => {
    const id = (typeof req.headers?.authorization === "string" && req.headers.authorization.slice(0, 64))
      || req.ip
      || "anon";
    try {
      await limiter.consume(id);
    } catch {
      return reply.code(429).send({ ok: false, error: "rate_limited" });
    }
  });
});
