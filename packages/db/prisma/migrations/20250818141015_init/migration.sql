-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "price" DECIMAL,
    "status" TEXT NOT NULL,
    "exchangeId" TEXT,
    "clientId" TEXT,
    "runId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "reason" TEXT
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "price" DECIMAL NOT NULL,
    "commission" DECIMAL,
    "pnl" DECIMAL
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "avgPrice" DECIMAL NOT NULL,
    "unrealized" DECIMAL,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "meta" TEXT
);

-- CreateIndex
CREATE INDEX "Order_symbol_ts_idx" ON "Order"("symbol", "ts");

-- CreateIndex
CREATE INDEX "Order_status_ts_idx" ON "Order"("status", "ts");

-- CreateIndex
CREATE INDEX "Trade_orderId_ts_idx" ON "Trade"("orderId", "ts");

-- CreateIndex
CREATE INDEX "Trade_symbol_ts_idx" ON "Trade"("symbol", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "Position_symbol_key" ON "Position"("symbol");
