import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PendingItem = {
  strategy: string;
  diff: any;
  newParams: any;
  requestedBy: string;
  ts: number;
};

export async function appendPending(it: PendingItem) {
  await prisma.paramChange.create({
    data: {
      strategy: it.strategy,
      diff: it.diff,
      newParams: it.newParams,
      requestedBy: it.requestedBy,
      requestedAt: new Date(it.ts),
      status: 'pending'
    }
  });
}

export async function listPending() {
  const rows = await prisma.paramChange.findMany({ 
    where: { status: 'pending' }, 
    orderBy: { requestedAt: 'asc' } 
  });
  return rows.map(r => ({ 
    strategy: r.strategy, 
    diff: r.diff, 
    newParams: r.newParams, 
    requestedBy: r.requestedBy, 
    ts: r.requestedAt.getTime() 
  }));
}

export async function approve(strategy: string, actor: string) {
  await prisma.paramChange.updateMany({
    where: { strategy, status: 'pending' },
    data: { status: 'approved', decidedBy: actor, decidedAt: new Date() }
  });
}

export async function deny(strategy: string, actor: string) {
  await prisma.paramChange.updateMany({
    where: { strategy, status: 'pending' },
    data: { status: 'denied', decidedBy: actor, decidedAt: new Date() }
  });
}

export async function getHistory(limit = 100) {
  const rows = await prisma.paramChange.findMany({ 
    orderBy: { requestedAt: 'desc' }, 
    take: limit 
  });
  return rows;
}

export async function addAudit(action: string, actor: string, reason: string | undefined, payload: any) {
  await prisma.auditEvent.create({ 
    data: { 
      action, 
      actor, 
      reason: reason ?? null, 
      payload 
    } 
  });
}
