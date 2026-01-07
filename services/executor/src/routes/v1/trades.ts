import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/db.js";
import { z } from "zod";

const QuerySchema = z.object({
  exchange: z.string().optional(),
  symbol: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  cursor: z.string().optional(), // Cursor for pagination
});

export default async function tradesRoute(app: FastifyInstance) {
  // GET /v1/trades/recent - List recent trades
  app.get("/v1/trades/recent", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = QuerySchema.parse(request.query);

      const where: any = {};
      if (query.exchange) {
        where.exchange = query.exchange;
      }
      if (query.symbol) {
        where.symbol = { contains: query.symbol, mode: "insensitive" };
      }

      const take = query.limit + 1; // Fetch one extra to check if there's more
      const cursor = query.cursor ? { id: query.cursor } : undefined;

      const trades = await prisma.trade.findMany({
        where,
        take,
        cursor,
        skip: cursor ? 1 : 0,
        orderBy: { createdAt: "desc" },
        include: {
          strategy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const hasMore = trades.length > query.limit;
      const data = trades.slice(0, query.limit);

      return {
        ok: true,
        data: data.map((t) => ({
          id: t.id,
          symbol: t.symbol,
          side: t.side,
          type: t.type,
          price: t.price.toString(),
          quantity: t.quantity.toString(),
          commission: t.commission.toString(),
          pnl: t.pnl ? t.pnl.toString() : null,
          status: t.status,
          exchange: t.exchange,
          clientOrderId: t.clientOrderId,
          strategyId: t.strategyId,
          strategy: t.strategy,
          createdAt: t.createdAt.toISOString(),
          filledAt: t.filledAt ? t.filledAt.toISOString() : null,
        })),
        count: data.length,
        limit: query.limit,
        hasMore,
        nextCursor: hasMore && data.length > 0 ? data[data.length - 1].id : null,
      };
    } catch (error) {
      app.log.error("Error fetching trades:", error);
      reply.code(500);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}

