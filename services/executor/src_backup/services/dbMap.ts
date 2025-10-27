import { Prisma } from "@prisma/client";
import { asOrderId, parseSymbol, toPrice, toQty } from "@spark/trading-core";

export const fromDbOrder = (row: any) => ({
  orderId: asOrderId(row.orderId ?? row.order_id),
  symbol: parseSymbol(row.symbol ?? row.symbol_code ?? row.ticker),
  qty: toQty(typeof row.qty === "string" ? Number(row.qty) : row.qty ?? row.quantity ?? 0),
  price: toPrice(typeof row.price === "string" ? Number(row.price) : row.price ?? row.avg_price ?? 0),
  ts: Number(row.ts ?? row.createdAt ?? Date.now())
});

export const toDbOrder = (o: ReturnType<typeof fromDbOrder>) => ({
  orderId: (o.orderId as unknown as string),
  symbol: (o.symbol as unknown as string),
  qty: (o.qty as unknown as Prisma.Decimal | number),
  price: (o.price as unknown as Prisma.Decimal | number),
  ts: o.ts
});

export const fromDbTrade = (row: any) => ({
  orderId: asOrderId(row.orderId ?? row.order_id),
  symbol: parseSymbol(row.symbol ?? row.symbol_code ?? row.ticker),
  qty: toQty(typeof row.qty === "string" ? Number(row.qty) : row.qty ?? row.quantity ?? 0),
  price: toPrice(typeof row.price === "string" ? Number(row.price) : row.price ?? 0),
  side: row.side ?? "BUY",
  pnl: row.pnl ? toPrice(row.pnl) : undefined,
  ts: Number(row.ts ?? row.createdAt ?? Date.now())
});

export const toDbTrade = (t: ReturnType<typeof fromDbTrade>) => ({
  orderId: (t.orderId as unknown as string),
  symbol: (t.symbol as unknown as string),
  qty: (t.qty as unknown as Prisma.Decimal | number),
  price: (t.price as unknown as Prisma.Decimal | number),
  side: t.side,
  pnl: t.pnl ? (t.pnl as unknown as Prisma.Decimal | number) : null,
  ts: t.ts
});

export const fromDbPosition = (row: any) => ({
  symbol: parseSymbol(row.symbol ?? row.symbol_code ?? row.ticker),
  qty: toQty(typeof row.qty === "string" ? Number(row.qty) : row.qty ?? row.quantity ?? 0),
  avgPrice: toPrice(typeof row.avgPrice === "string" ? Number(row.avgPrice) : row.avgPrice ?? row.avg_price ?? 0),
  unrealized: row.unrealized ? toPrice(row.unrealized) : undefined,
  ts: Number(row.ts ?? row.updatedAt ?? Date.now())
});

export const toDbPosition = (p: ReturnType<typeof fromDbPosition>) => ({
  symbol: (p.symbol as unknown as string),
  qty: (p.qty as unknown as Prisma.Decimal | number),
  avgPrice: (p.avgPrice as unknown as Prisma.Decimal | number),
  unrealized: p.unrealized ? (p.unrealized as unknown as Prisma.Decimal | number) : null,
  ts: p.ts
}); 