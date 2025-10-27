import "fastify";
import type { PrismaClient } from "@prisma/client";
import type { TypedEmitter, SparkEvents } from "@spark/types";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    bus: TypedEmitter<SparkEvents>;
  }
}
export {};
