import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/db.js";
import { z } from "zod";
import crypto from "node:crypto";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
});

export default async function auditVerifyRoute(app: FastifyInstance) {
  // GET /v1/audit/verify - Verify audit log integrity (hash chain)
  app.get("/v1/audit/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = QuerySchema.parse(request.query);

      // Fetch audit logs in chronological order
      const auditLogs = await prisma.auditLog.findMany({
        take: query.limit,
        orderBy: { timestamp: "asc" },
      });

      if (auditLogs.length === 0) {
        return {
          ok: true,
          verified: true,
          message: "No audit logs to verify",
          total: 0,
        };
      }

      let prevHash: string | null = null;
      let firstBrokenId: string | null = null;
      let brokenAtIndex: number | null = null;

      for (let i = 0; i < auditLogs.length; i++) {
        const log = auditLogs[i];
        const payloadJson = JSON.stringify(log.payload);
        const hashInput = `${prevHash || ""}|${log.timestamp.getTime()}|${log.action}|${log.actor}|${payloadJson}`;
        const expectedHash = crypto
          .createHash("sha256")
          .update(hashInput)
          .digest("hex");

        if (log.hash !== expectedHash) {
          firstBrokenId = log.id;
          brokenAtIndex = i;
          break;
        }

        prevHash = log.hash;
      }

      const verified = firstBrokenId === null;

      return {
        ok: true,
        verified,
        total: auditLogs.length,
        ...(verified
          ? { message: "All audit logs verified successfully" }
          : {
              firstBrokenId,
              brokenAtIndex,
              message: `Integrity check failed at index ${brokenAtIndex}`,
            }),
      };
    } catch (error) {
      app.log.error("Error verifying audit logs:", error);
      reply.code(500);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}

