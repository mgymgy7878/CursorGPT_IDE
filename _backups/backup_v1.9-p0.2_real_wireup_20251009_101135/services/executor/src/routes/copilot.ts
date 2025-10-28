import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

export default fp(async function copilotRoutes(app: FastifyInstance) {
  app.get("/copilot/stream", { preHandler: [(app as any).authenticate].filter(Boolean) }, async (req: any, reply: any) => {
    const prompt = (req.query as any)?.prompt ?? "";
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const send = (d:string)=> reply.raw.write(`data: ${d}\n\n`);
    send(JSON.stringify({ status:"stub", receivedPromptLength: String(prompt).length }));
    reply.raw.end();
  });
});


