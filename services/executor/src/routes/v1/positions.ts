import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/db.js";
import { z } from "zod";

const QuerySchema = z.object({
  exchange: z.string().optional(),
  symbol: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(6),
});

export default async function positionsRoute(app: FastifyInstance) {
  // GET /v1/positions/open - List open positions
  app.get("/v1/positions/open", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = QuerySchema.parse(request.query);

      const where: any = {};
      // Open positions: no closedAt field in schema, so all positions are "open"
      // In future, add a status field or closedAt timestamp
      if (query.exchange) {
        where.exchange = query.exchange;
      }
      if (query.symbol) {
        where.symbol = { contains: query.symbol, mode: "insensitive" };
      }

      const positions = await prisma.position.findMany({
        where,
        take: query.limit,
        orderBy: { updatedAt: "desc" },
        include: {
          strategy: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return {
        ok: true,
        data: positions.map((p) => ({
          id: p.id,
          symbol: p.symbol,
          side: p.side,
          quantity: p.quantity.toString(),
          avgPrice: p.avgPrice.toString(),
          exchange: p.exchange,
          strategyId: p.strategyId,
          strategy: p.strategy,
          updatedAt: p.updatedAt.toISOString(),
        })),
        count: positions.length,
        limit: query.limit,
      };
    } catch (error) {
      app.log.error("Error fetching positions:", error);
      reply.code(500);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}

