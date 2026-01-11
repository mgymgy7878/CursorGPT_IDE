import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/db.js";
import { z } from "zod";

const QuerySchema = z.object({
  action: z.string().optional(),
  actor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(6),
  cursor: z.string().optional(), // Cursor for pagination
});

export default async function auditRoute(app: FastifyInstance) {
  // GET /v1/audit - List audit logs with optional filtering
  app.get("/v1/audit", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = QuerySchema.parse(request.query);

      const where: any = {};
      if (query.action) {
        where.action = { contains: query.action, mode: "insensitive" };
      }
      if (query.actor) {
        where.actor = { contains: query.actor, mode: "insensitive" };
      }

      const take = query.limit + 1; // Fetch one extra to check if there's more
      const cursor = query.cursor ? { id: query.cursor } : undefined;

      const auditLogs = await prisma.auditLog.findMany({
        where,
        take,
        cursor,
        skip: cursor ? 1 : 0,
        orderBy: { timestamp: "desc" },
      });

      const hasMore = auditLogs.length > query.limit;
      const data = auditLogs.slice(0, query.limit);

      return {
        ok: true,
        data: data.map((log) => ({
          id: log.id,
          action: log.action,
          actor: log.actor,
          payload: log.payload,
          hash: log.hash,
          timestamp: log.timestamp.toISOString(),
        })),
        count: data.length,
        limit: query.limit,
        hasMore,
        nextCursor: hasMore && data.length > 0 ? data[data.length - 1].id : null,
      };
    } catch (error) {
      app.log.error("Error fetching audit logs:", error);
      reply.code(500);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}

