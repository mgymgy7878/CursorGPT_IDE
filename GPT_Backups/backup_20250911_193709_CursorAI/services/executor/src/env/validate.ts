import { z } from "zod";

const Env = z.object({
  BINANCE_API_KEY: z.string().min(10),
  BINANCE_API_SECRET: z.string().min(10),
  IS_TESTNET: z.string().transform(v => v === "true"),
  TRADE_MODE: z.enum(["paper","live"]).default("paper"),
  EXECUTOR_HOST: z.string().default(process.env.HOST ?? "127.0.0.1"),
  EXECUTOR_PORT: z.coerce.number().default(Number(process.env.PORT ?? 4001))
});

export type EnvType = z.infer<typeof Env>;

export function loadEnv(): EnvType {
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error("ENV_INVALID: " + issues);
  }
  return parsed.data;
} 