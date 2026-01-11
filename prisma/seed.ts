import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Load .env from root directory manually
const rootEnvPath = join(process.cwd(), ".env");
if (existsSync(rootEnvPath)) {
  const envContent = readFileSync(rootEnvPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create dev user
  const user = await prisma.user.upsert({
    where: { email: "dev@spark.local" },
    update: {},
    create: {
      email: "dev@spark.local",
      name: "Dev User",
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // 2. Create strategies (1 running, 1 paused, 1 draft)
  const strategies = await Promise.all([
    prisma.strategy.create({
      data: {
        name: "EMA Cross Strategy",
        code: `function run(price, signals) {
  const fastEMA = signals.ema(12);
  const slowEMA = signals.ema(26);
  if (fastEMA > slowEMA) return { action: "buy", symbol: "BTCUSDT" };
  return { action: "sell", symbol: "BTCUSDT" };
}`,
        params: { emaFast: 12, emaSlow: 26, symbol: "BTCUSDT" },
        status: "active",
        userId: user.id,
      },
    }),
    prisma.strategy.create({
      data: {
        name: "RSI Mean Reversion",
        code: `function run(price, signals) {
  const rsi = signals.rsi(14);
  if (rsi < 30) return { action: "buy", symbol: "ETHUSDT" };
  if (rsi > 70) return { action: "sell", symbol: "ETHUSDT" };
  return { action: "hold" };
}`,
        params: { rsiPeriod: 14, oversold: 30, overbought: 70, symbol: "ETHUSDT" },
        status: "paused",
        userId: user.id,
      },
    }),
    prisma.strategy.create({
      data: {
        name: "Bollinger Bands Breakout",
        code: `function run(price, signals) {
  const bb = signals.bollingerBands(20, 2);
  if (price > bb.upper) return { action: "sell", symbol: "BTCUSDT" };
  if (price < bb.lower) return { action: "buy", symbol: "BTCUSDT" };
  return { action: "hold" };
}`,
        params: { period: 20, stdDev: 2, symbol: "BTCUSDT" },
        status: "draft",
        userId: user.id,
      },
    }),
  ]);

  console.log(`✅ Created ${strategies.length} strategies`);

  // 3. Create 2 open positions
  const positions = await Promise.all([
    prisma.position.create({
      data: {
        strategyId: strategies[0].id,
        symbol: "BTCUSDT",
        side: "long",
        quantity: new Decimal("0.5"),
        avgPrice: new Decimal("65000.00"),
        exchange: "binance",
      },
    }),
    prisma.position.create({
      data: {
        strategyId: strategies[0].id,
        symbol: "ETHUSDT",
        side: "long",
        quantity: new Decimal("2.1"),
        avgPrice: new Decimal("3200.00"),
        exchange: "binance",
      },
    }),
  ]);

  console.log(`✅ Created ${positions.length} open positions`);

  // 4. Create 10 recent trades
  const tradeData = [
    { side: "buy", price: 65000, quantity: 0.5, pnl: null },
    { side: "sell", price: 65500, quantity: 0.1, pnl: 50 },
    { side: "buy", price: 3200, quantity: 2.1, pnl: null },
    { side: "sell", price: 3250, quantity: 0.5, pnl: 25 },
    { side: "buy", price: 65100, quantity: 0.2, pnl: null },
    { side: "buy", price: 3210, quantity: 1.0, pnl: null },
    { side: "sell", price: 65200, quantity: 0.3, pnl: 30 },
    { side: "sell", price: 3230, quantity: 0.8, pnl: 16 },
    { side: "buy", price: 64900, quantity: 0.4, pnl: null },
    { side: "sell", price: 3260, quantity: 0.6, pnl: 30 },
  ];

  const now = new Date();
  const trades = await Promise.all(
    tradeData.map((trade, i) =>
      prisma.trade.create({
        data: {
          strategyId: strategies[0].id,
          symbol: trade.side === "buy" && trade.price > 60000 ? "BTCUSDT" : "ETHUSDT",
          side: trade.side,
          type: "market",
          price: new Decimal(trade.price.toString()),
          quantity: new Decimal(trade.quantity.toString()),
          commission: new Decimal("0.001"),
          pnl: trade.pnl ? new Decimal(trade.pnl.toString()) : null,
          status: "filled",
          exchange: "binance",
          clientOrderId: `ORDER_${Date.now()}_${i}`,
          createdAt: new Date(now.getTime() - (10 - i) * 3600000), // Last 10 hours
          filledAt: new Date(now.getTime() - (10 - i) * 3600000 + 1000),
        },
      })
    )
  );

  console.log(`✅ Created ${trades.length} trades`);

  // 5. Create 20 audit logs
  const auditActions = [
    { action: "strategy.created", actor: user.email, payload: { strategyId: strategies[0].id } },
    { action: "strategy.started", actor: user.email, payload: { strategyId: strategies[0].id } },
    { action: "trade.executed", actor: "system", payload: { tradeId: trades[0].id } },
    { action: "position.opened", actor: "system", payload: { positionId: positions[0].id } },
    { action: "strategy.paused", actor: user.email, payload: { strategyId: strategies[1].id } },
    { action: "trade.executed", actor: "system", payload: { tradeId: trades[1].id } },
    { action: "position.closed", actor: "system", payload: { positionId: positions[0].id } },
    { action: "strategy.created", actor: user.email, payload: { strategyId: strategies[2].id } },
    { action: "trade.executed", actor: "system", payload: { tradeId: trades[2].id } },
    { action: "position.opened", actor: "system", payload: { positionId: positions[1].id } },
    { action: "strategy.stopped", actor: user.email, payload: { strategyId: strategies[0].id } },
    { action: "trade.executed", actor: "system", payload: { tradeId: trades[3].id } },
    { action: "guardrails.check", actor: "system", payload: { riskScore: 0.25 } },
    { action: "trade.executed", actor: "system", payload: { tradeId: trades[4].id } },
    { action: "strategy.resumed", actor: user.email, payload: { strategyId: strategies[0].id } },
    { action: "trade.executed", actor: "system", payload: { tradeId: trades[5].id } },
    { action: "position.updated", actor: "system", payload: { positionId: positions[1].id } },
    { action: "trade.executed", actor: "system", payload: { tradeId: trades[6].id } },
    { action: "backtest.completed", actor: user.email, payload: { backtestId: "backtest_123" } },
    { action: "system.health", actor: "system", payload: { status: "healthy" } },
  ];

  const crypto = await import("node:crypto");
  const auditLogs = await Promise.all(
    auditActions.map((audit, i) => {
      const payloadJson = JSON.stringify(audit.payload);
      const hash = crypto
        .createHmac("sha256", process.env.AUDIT_HMAC_SECRET || "dev-secret-key")
        .update(`${audit.action}|${audit.actor}|${payloadJson}`)
        .digest("hex");

      return prisma.auditLog.create({
        data: {
          action: audit.action,
          actor: audit.actor,
          payload: audit.payload as any,
          hash,
          timestamp: new Date(now.getTime() - (20 - i) * 1800000), // Last 10 hours (30 min intervals)
        },
      });
    })
  );

  console.log(`✅ Created ${auditLogs.length} audit logs`);

  console.log("\n✅ Seed completed successfully!");
  console.log(`   User: ${user.email}`);
  console.log(`   Strategies: ${strategies.length}`);
  console.log(`   Positions: ${positions.length}`);
  console.log(`   Trades: ${trades.length}`);
  console.log(`   Audit Logs: ${auditLogs.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

