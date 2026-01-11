-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('pending', 'submitted', 'filled', 'settled', 'cancelled', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "StrategyStatus" AS ENUM ('draft', 'active', 'paused', 'stopped', 'archived');

-- CreateEnum
CREATE TYPE "BacktestStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "status" "StrategyStatus" NOT NULL DEFAULT 'draft',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backtest" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "BacktestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Backtest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "commission" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "pnl" DECIMAL(38,18),
    "status" "TradeStatus" NOT NULL DEFAULT 'pending',
    "exchange" TEXT NOT NULL,
    "clientOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" TIMESTAMP(3),

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "avgPrice" DECIMAL(38,18) NOT NULL,
    "exchange" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ttlAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Strategy_userId_status_idx" ON "Strategy"("userId", "status");

-- CreateIndex
CREATE INDEX "Strategy_status_updatedAt_idx" ON "Strategy"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Strategy_userId_createdAt_idx" ON "Strategy"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Backtest_strategyId_status_idx" ON "Backtest"("strategyId", "status");

-- CreateIndex
CREATE INDEX "Backtest_userId_createdAt_idx" ON "Backtest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Backtest_status_createdAt_idx" ON "Backtest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Backtest_strategyId_createdAt_idx" ON "Backtest"("strategyId", "createdAt");

-- CreateIndex
CREATE INDEX "Trade_strategyId_createdAt_idx" ON "Trade"("strategyId", "createdAt");

-- CreateIndex
CREATE INDEX "Trade_symbol_exchange_idx" ON "Trade"("symbol", "exchange");

-- CreateIndex
CREATE INDEX "Trade_status_createdAt_idx" ON "Trade"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Trade_exchange_createdAt_idx" ON "Trade"("exchange", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_exchange_clientOrderId_key" ON "Trade"("exchange", "clientOrderId");

-- CreateIndex
CREATE INDEX "Position_exchange_symbol_idx" ON "Position"("exchange", "symbol");

-- CreateIndex
CREATE INDEX "Position_strategyId_updatedAt_idx" ON "Position"("strategyId", "updatedAt");

-- CreateIndex
CREATE INDEX "Position_symbol_exchange_side_idx" ON "Position"("symbol", "exchange", "side");

-- CreateIndex
CREATE UNIQUE INDEX "Position_strategyId_symbol_exchange_key" ON "Position"("strategyId", "symbol", "exchange");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_actor_timestamp_idx" ON "AuditLog"("actor", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "IdempotencyKey_ttlAt_idx" ON "IdempotencyKey"("ttlAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_createdAt_idx" ON "IdempotencyKey"("createdAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_status_ttlAt_idx" ON "IdempotencyKey"("status", "ttlAt");

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backtest" ADD CONSTRAINT "Backtest_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backtest" ADD CONSTRAINT "Backtest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
