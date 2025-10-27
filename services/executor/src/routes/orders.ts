import type { FastifyPluginAsync } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const routes: FastifyPluginAsync = async (app) => {
  const f = app.withTypeProvider<TypeBoxTypeProvider>();

  const Body = Type.Object({
    symbol: Type.String(),
    side: Type.Union([Type.Literal("BUY"), Type.Literal("SELL")]),
    qty: Type.Number({ minimum: 0 })
  });
  
  const Reply = Type.Object({ 
    id: Type.String() 
  });

  f.post("/orders", { 
    schema: { 
      body: Body, 
      response: { 200: Reply } 
    } 
  }, async (req) => {
    // req.body burada otomatik tipli
    return { id: "ok" };
  });
};

export default routes;
