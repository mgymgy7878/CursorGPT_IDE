import { Decimal } from "@prisma/client/runtime/library";
import { getPrisma } from "@spark/db";
import { fromDbOrder, fromDbTrade, fromDbPosition, toDbOrder, toDbTrade, toDbPosition } from "./dbMap";

export interface OrderDraft {
  symbol: string;
  side: string;
  type: string;
  qty: number;
  price?: number;
  exchangeId?: string;
  clientId?: string;
  runId: string;
  requestId: string;
  reason?: string;
}

export interface TradeRecord {
  orderId: string;
  symbol: string;
  qty: number;
  price: number;
  commission?: number;
  pnl?: number;
}

export interface PositionUpdate {
  symbol: string;
  qty: number;
  avgPrice: number;
  unrealized?: number;
}

export async function createPendingOrder(draft: OrderDraft) {
  const dbData = {
    symbol: draft.symbol,
    side: draft.side,
    type: draft.type,
    qty: new Decimal(draft.qty),
    price: draft.price ? new Decimal(draft.price) : null,
    status: 'NEW',
    exchangeId: draft.exchangeId || null,
    clientId: draft.clientId || null,
    runId: draft.runId,
    requestId: draft.requestId,
    reason: draft.reason || null
  };

  const result = await getPrisma().order.create({ data: dbData });
  return fromDbOrder(result);
}

export async function updateOrderFromExchange(orderId: string, updates: {
  status?: string;
  exchangeId?: string;
  price?: number;
  reason?: string;
}) {
  const data: any = {};
  
  if (updates.status) data.status = updates.status;
  if (updates.exchangeId) data.exchangeId = updates.exchangeId;
  if (updates.price) data.price = new Decimal(updates.price);
  if (updates.reason) data.reason = updates.reason;
  
  const result = await getPrisma().order.update({
    where: { id: orderId },
    data
  });
  return fromDbOrder(result);
}

export async function recordTrade(trade: TradeRecord) {
  const dbData = {
    orderId: trade.orderId,
    symbol: trade.symbol,
    qty: new Decimal(trade.qty),
    price: new Decimal(trade.price),
    commission: trade.commission ? new Decimal(trade.commission) : null,
    pnl: trade.pnl ? new Decimal(trade.pnl) : null
  };

  const result = await getPrisma().trade.create({ data: dbData });
  return fromDbTrade(result);
}

export async function upsertPosition(update: PositionUpdate) {
  const dbData = {
    qty: new Decimal(update.qty),
    avgPrice: new Decimal(update.avgPrice),
    unrealized: update.unrealized ? new Decimal(update.unrealized) : null,
    ts: new Date()
  };

  const result = await getPrisma().position.upsert({
    where: { symbol: update.symbol },
    update: dbData,
    create: {
      symbol: update.symbol,
      ...dbData
    }
  });
  return fromDbPosition(result);
}

export async function getOrderById(orderId: string) {
  const result = await getPrisma().order.findUnique({
    where: { id: orderId }
  });
  return result ? fromDbOrder(result) : null;
}

export async function getOrdersByStatus(status: string) {
  const results = await getPrisma().order.findMany({
    where: { status },
    orderBy: { ts: 'desc' }
  });
  return results.map(fromDbOrder);
}

export async function getTradesByOrderId(orderId: string) {
  const results = await getPrisma().trade.findMany({
    where: { orderId },
    orderBy: { ts: 'asc' }
  });
  return results.map(fromDbTrade);
}

export async function getPositionBySymbol(symbol: string) {
  const result = await getPrisma().position.findUnique({
    where: { symbol }
  });
  return result ? fromDbPosition(result) : null;
}

export async function getAllPositions() {
  const results = await getPrisma().position.findMany({
    orderBy: { symbol: 'asc' }
  });
  return results.map(fromDbPosition);
}

export async function getDailyPnL(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const trades = await getPrisma().trade.findMany({
    where: {
      ts: {
        gte: startOfDay,
        lte: endOfDay
      },
      pnl: {
        not: null
      }
    }
  });
  
  return trades.reduce((total, trade) => {
    return total + (trade.pnl ? Number(trade.pnl) : 0);
  }, 0);
} 