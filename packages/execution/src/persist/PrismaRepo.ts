import { PrismaClient } from "@prisma/client";
import type { ExecutionData, TradeData } from "../types";

export class PrismaRepo {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async saveExecution(data: Partial<ExecutionData>): Promise<ExecutionData> {
    const execution = await this.prisma.execution.create({
      data: {
        id: data.id!,
        strategyId: data.strategyId,
        mode: data.mode!,
        symbol: data.symbol!,
        side: data.side!,
        qty: data.qty!,
        status: data.status!,
        exchangeOrderId: data.exchangeOrderId,
        clientOrderId: data.clientOrderId,
        startedAt: data.startedAt!,
        lastState: data.lastState || data.status!
      }
    });

    return execution as ExecutionData;
  }

  async updateExecutionStatus(executionId: string, status: string): Promise<void> {
    await this.prisma.execution.update({
      where: { id: executionId },
      data: { 
        status,
        lastState: status,
        ...(status === 'cancelled' || status === 'filled' ? { endedAt: new Date() } : {})
      }
    });
  }

  async updateExecutionOrder(executionId: string, orderData: { exchangeOrderId?: string; clientOrderId?: string; status: string }): Promise<void> {
    await this.prisma.execution.update({
      where: { id: executionId },
      data: {
        exchangeOrderId: orderData.exchangeOrderId,
        clientOrderId: orderData.clientOrderId,
        status: orderData.status,
        lastState: orderData.status
      }
    });
  }

  async getExecution(executionId: string): Promise<ExecutionData | null> {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId }
    });

    return execution as ExecutionData | null;
  }

  async saveTrade(data: Partial<TradeData>): Promise<TradeData> {
    const trade = await this.prisma.trade.create({
      data: {
        id: data.id!,
        symbol: data.symbol!,
        side: data.side!,
        qty: data.qty!,
        price: data.price,
        fee: data.fee,
        feeAsset: data.feeAsset,
        maker: data.maker,
        ts: data.ts!,
        clientId: data.clientId,
        executionId: data.executionId
      }
    });

    return trade as TradeData;
  }

  async getExecutionTrades(executionId: string, limit: number = 100): Promise<TradeData[]> {
    const trades = await this.prisma.trade.findMany({
      where: { executionId },
      orderBy: { ts: 'desc' },
      take: limit
    });

    return trades as TradeData[];
  }

  async getExecutions(limit: number = 50): Promise<ExecutionData[]> {
    const executions = await this.prisma.execution.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        trades: {
          orderBy: { ts: 'desc' },
          take: 10
        }
      }
    });

    return executions as ExecutionData[];
  }

  async saveAuditLog(actor: string, role: string, action: string, details: any): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actor,
        role,
        action,
        details: JSON.stringify(details)
      }
    });
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 