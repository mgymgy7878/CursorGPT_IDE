import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/db.js";
import { z } from "zod";
import crypto from "node:crypto";

const ActionSchema = z.enum(["start", "pause", "stop"]);

// Generate idempotency key
function generateIdempotencyKey(strategyId: string, action: string): string {
  return `strategy_${action}_${strategyId}_${Date.now()}`;
}

// Write audit log
async function writeAuditLog(
  action: string,
  actor: string,
  payload: any,
  prevHash?: string
): Promise<string> {
  const payloadJson = JSON.stringify(payload);
  const hashInput = `${prevHash || ""}|${Date.now()}|${action}|${actor}|${payloadJson}`;
  const hash = crypto
    .createHash("sha256")
    .update(hashInput)
    .digest("hex");

  await prisma.auditLog.create({
    data: {
      action,
      actor,
      payload,
      hash,
    },
  });

  return hash;
}

export default async function strategyActionsRoute(app: FastifyInstance) {
  // POST /v1/strategies/:id/start - Start a strategy
  app.post(
    "/v1/strategies/:id/start",
    async (request: FastifyRequest<{ Params: { id: string }; Body: { idempotencyKey?: string; actor?: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { idempotencyKey: providedKey, actor = "system" } = request.body || {};

      // Check if strategy exists
      const strategy = await prisma.strategy.findUnique({ where: { id } });
      if (!strategy) {
        reply.code(404);
        return { ok: false, error: "Strategy not found" };
      }

      // Check idempotency (action-specific key to prevent conflicts)
      const idempotencyKey = providedKey || generateIdempotencyKey(id, "start");
        const existingKey = await prisma.idempotencyKey.findUnique({
          where: { key: idempotencyKey },
        });

        if (existingKey && existingKey.status === "completed") {
          return {
            ok: true,
            idempotencyKey,
            message: "Strategy already started (idempotent)",
            strategy: { id: strategy.id, status: strategy.status },
          };
        }

        // Create or update idempotency key
        await prisma.idempotencyKey.upsert({
          where: { key: idempotencyKey },
          update: { status: "pending" },
          create: {
            key: idempotencyKey,
            status: "pending",
            ttlAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
          },
        });

        // Update strategy status
        const updated = await prisma.strategy.update({
          where: { id },
          data: { status: "active" },
        });

        // Get last audit hash for chain
        const lastAudit = await prisma.auditLog.findFirst({
          orderBy: { timestamp: "desc" },
          select: { hash: true },
        });

        // Write audit log (include prevStatus -> newStatus transition)
        const hash = await writeAuditLog(
          "strategy.started",
          actor,
          {
            strategyId: id,
            idempotencyKey,
            prevStatus: strategy.status,
            newStatus: "active",
          },
          lastAudit?.hash
        );

        // Mark idempotency as completed
        await prisma.idempotencyKey.update({
          where: { key: idempotencyKey },
          data: { status: "completed", result: { strategyId: id, status: "active" } },
        });

        return {
          ok: true,
          idempotencyKey,
          strategy: {
            id: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
          },
          auditHash: hash,
        };
      } catch (error) {
        app.log.error("Error starting strategy:", error);
        reply.code(500);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // POST /v1/strategies/:id/pause - Pause a strategy
  app.post(
    "/v1/strategies/:id/pause",
    async (request: FastifyRequest<{ Params: { id: string }; Body: { idempotencyKey?: string; actor?: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { idempotencyKey: providedKey, actor = "system" } = request.body || {};

        const strategy = await prisma.strategy.findUnique({ where: { id } });
        if (!strategy) {
          reply.code(404);
          return { ok: false, error: "Strategy not found" };
        }

        const idempotencyKey = providedKey || generateIdempotencyKey(id, "pause");
        const existingKey = await prisma.idempotencyKey.findUnique({
          where: { key: idempotencyKey },
        });

        if (existingKey && existingKey.status === "completed") {
          return {
            ok: true,
            idempotencyKey,
            message: "Strategy already paused (idempotent)",
            strategy: { id: strategy.id, status: strategy.status },
          };
        }

        await prisma.idempotencyKey.upsert({
          where: { key: idempotencyKey },
          update: { status: "pending" },
          create: {
            key: idempotencyKey,
            status: "pending",
            ttlAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const updated = await prisma.strategy.update({
          where: { id },
          data: { status: "paused" },
        });

        const lastAudit = await prisma.auditLog.findFirst({
          orderBy: { timestamp: "desc" },
          select: { hash: true },
        });

        const hash = await writeAuditLog(
          "strategy.paused",
          actor,
          {
            strategyId: id,
            idempotencyKey,
            prevStatus: strategy.status,
            newStatus: "paused",
          },
          lastAudit?.hash
        );

        await prisma.idempotencyKey.update({
          where: { key: idempotencyKey },
          data: { status: "completed", result: { strategyId: id, status: "paused" } },
        });

        return {
          ok: true,
          idempotencyKey,
          strategy: {
            id: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
          },
          auditHash: hash,
        };
      } catch (error) {
        app.log.error("Error pausing strategy:", error);
        reply.code(500);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // POST /v1/strategies/:id/stop - Stop a strategy
  app.post(
    "/v1/strategies/:id/stop",
    async (request: FastifyRequest<{ Params: { id: string }; Body: { idempotencyKey?: string; actor?: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { idempotencyKey: providedKey, actor = "system" } = request.body || {};

        const strategy = await prisma.strategy.findUnique({ where: { id } });
        if (!strategy) {
          reply.code(404);
          return { ok: false, error: "Strategy not found" };
        }

        const idempotencyKey = providedKey || generateIdempotencyKey(id, "stop");
        const existingKey = await prisma.idempotencyKey.findUnique({
          where: { key: idempotencyKey },
        });

        if (existingKey && existingKey.status === "completed") {
          return {
            ok: true,
            idempotencyKey,
            message: "Strategy already stopped (idempotent)",
            strategy: { id: strategy.id, status: strategy.status },
          };
        }

        await prisma.idempotencyKey.upsert({
          where: { key: idempotencyKey },
          update: { status: "pending" },
          create: {
            key: idempotencyKey,
            status: "pending",
            ttlAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const updated = await prisma.strategy.update({
          where: { id },
          data: { status: "stopped" },
        });

        const lastAudit = await prisma.auditLog.findFirst({
          orderBy: { timestamp: "desc" },
          select: { hash: true },
        });

        const hash = await writeAuditLog(
          "strategy.stopped",
          actor,
          {
            strategyId: id,
            idempotencyKey,
            prevStatus: strategy.status,
            newStatus: "stopped",
          },
          lastAudit?.hash
        );

        await prisma.idempotencyKey.update({
          where: { key: idempotencyKey },
          data: { status: "completed", result: { strategyId: id, status: "stopped" } },
        });

        return {
          ok: true,
          idempotencyKey,
          strategy: {
            id: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
          },
          auditHash: hash,
        };
      } catch (error) {
        app.log.error("Error stopping strategy:", error);
        reply.code(500);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );
}

