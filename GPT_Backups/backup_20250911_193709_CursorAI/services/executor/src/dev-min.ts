/// Minimal bağımsız dev sunucu (sistem importlarına dokunmadan smoke için)
import fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";

const app: FastifyInstance = fastify({ logger: true });

app.get("/health", async (_req: FastifyRequest, _rep: FastifyReply) => {
  return { ok: true, service: "executor", ts: new Date().toISOString() };
});

const port = Number(process.env.PORT_EXECUTOR ?? 4001);
app.listen({ port, host: "127.0.0.1" })
  .then(() => app.log.info({ port }, "executor dev-min listening"))
  .catch((err) => { app.log.error(err); process.exit(1); });
