import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/db.js";
import { z } from "zod";

const QuerySchema = z.object({
  status: z.enum(["draft", "active", "paused", "stopped", "archived"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(6),
  cursor: z.string().optional(), // Cursor for pagination
});

export default async function strategiesRoute(app: FastifyInstance) {
  // GET /v1/strategies - List strategies with optional filtering
  app.get("/v1/strategies", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = QuerySchema.parse(request.query);

      const where: any = {};
      if (query.status) {
        where.status = query.status;
      }

      const take = query.limit + 1; // Fetch one extra to check if there's more
      const cursor = query.cursor ? { id: query.cursor } : undefined;

      const strategies = await prisma.strategy.findMany({
        where,
        take,
        cursor,
        skip: cursor ? 1 : 0,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              trades: true,
              positions: true,
              backtests: true,
            },
          },
        },
      });

      const hasMore = strategies.length > query.limit;
      const data = strategies.slice(0, query.limit);

      return {
        ok: true,
        data: data.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          params: s.params,
          userId: s.userId,
          user: s.user,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          _count: s._count,
        })),
        count: data.length,
        limit: query.limit,
        hasMore,
        nextCursor: hasMore && data.length > 0 ? data[data.length - 1].id : null,
      };
    } catch (error) {
      app.log.error("Error fetching strategies:", error);
      reply.code(500);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}

