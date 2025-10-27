import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __spark_prisma__: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
  if (!global.__spark_prisma__) {
    global.__spark_prisma__ = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });
  }
  return global.__spark_prisma__;
} 