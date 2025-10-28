import fs from 'node:fs';
import path from 'node:path';

const hasPrisma = !!process.env.PRISMA_DATABASE_URL;
let prismaStore: any = null;
if (hasPrisma) prismaStore = require('./store.prisma.js');

interface PendingItem {
  strategy: string;
  diff: Record<string, { from: any; to: any }>;
  newParams: Record<string, any>;
  ts: number;
  requestedBy?: string;
}

interface HistoryItem {
  strategy: string;
  action: 'approved' | 'denied';
  diff: Record<string, { from: any; to: any }>;
  newParams: Record<string, any>;
  ts: number;
  actor?: string;
  reason?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data', 'guardrails');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getTodayFile(prefix: string): string {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return path.join(DATA_DIR, `${prefix}-${today}.jsonl`);
}

function readJsonl(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  return content.trim().split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

function appendJsonl(filePath: string, item: any) {
  ensureDir();
  fs.appendFileSync(filePath, JSON.stringify(item) + '\n');
}

// JSONL fallback functions
async function appendPendingJSONL(item: PendingItem): Promise<void> {
  const filePath = getTodayFile('pending');
  appendJsonl(filePath, item);
}

async function listPendingJSONL(): Promise<PendingItem[]> {
  const filePath = getTodayFile('pending');
  return readJsonl(filePath);
}

async function approveJSONL(strategy: string, actor: string): Promise<boolean> {
  const pending = await listPendingJSONL();
  const item = pending.find(p => p.strategy === strategy);
  
  if (!item) return false;
  
  // Move to history
  const historyItem: HistoryItem = {
    strategy: item.strategy,
    action: 'approved',
    diff: item.diff,
    newParams: item.newParams,
    ts: Date.now(),
    actor,
    reason: undefined
  };
  
  appendJsonl(getTodayFile('history'), historyItem);
  
  // Remove from pending
  const updatedPending = pending.filter(p => p.strategy !== strategy);
  const filePath = getTodayFile('pending');
  fs.writeFileSync(filePath, updatedPending.map(p => JSON.stringify(p)).join('\n') + '\n');
  
  return true;
}

async function denyJSONL(strategy: string, actor: string): Promise<boolean> {
  const pending = await listPendingJSONL();
  const item = pending.find(p => p.strategy === strategy);
  
  if (!item) return false;
  
  // Move to history
  const historyItem: HistoryItem = {
    strategy: item.strategy,
    action: 'denied',
    diff: item.diff,
    newParams: item.newParams,
    ts: Date.now(),
    actor,
    reason: undefined
  };
  
  appendJsonl(getTodayFile('history'), historyItem);
  
  // Remove from pending
  const updatedPending = pending.filter(p => p.strategy !== strategy);
  const filePath = getTodayFile('pending');
  fs.writeFileSync(filePath, updatedPending.map(p => JSON.stringify(p)).join('\n') + '\n');
  
  return true;
}

async function getHistoryJSONL(limit = 100): Promise<HistoryItem[]> {
  const filePath = getTodayFile('history');
  const items = readJsonl(filePath);
  return items.slice(0, limit);
}

async function addAuditJSONL(action: string, actor: string, reason?: string, payload?: any): Promise<void> {
  const auditItem = {
    action,
    actor,
    reason,
    payload,
    ts: Date.now()
  };
  const filePath = getTodayFile('audit');
  appendJsonl(filePath, auditItem);
}

// Main API with runtime switch
export async function appendPending(item: PendingItem): Promise<void> {
  if (hasPrisma) return prismaStore.appendPending(item);
  return appendPendingJSONL(item);
}

export async function listPending(): Promise<PendingItem[]> {
  if (hasPrisma) return prismaStore.listPending();
  return listPendingJSONL();
}

export async function approve(strategy: string, actor: string): Promise<boolean> {
  if (hasPrisma) return prismaStore.approve(strategy, actor);
  return approveJSONL(strategy, actor);
}

export async function deny(strategy: string, actor: string): Promise<boolean> {
  if (hasPrisma) return prismaStore.deny(strategy, actor);
  return denyJSONL(strategy, actor);
}

export async function getHistory(limit = 100): Promise<HistoryItem[]> {
  if (hasPrisma) return prismaStore.getHistory(limit);
  return getHistoryJSONL(limit);
}

export async function addAudit(action: string, actor: string, reason?: string, payload?: any): Promise<void> {
  if (hasPrisma) return prismaStore.addAudit(action, actor, reason, payload);
  return addAuditJSONL(action, actor, reason, payload);
}

export function rotate(): void {
  // Clean up old files (keep last 7 days)
  const files = fs.readdirSync(DATA_DIR);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  
  files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    const stats = fs.statSync(filePath);
    if (stats.mtime < cutoff) {
      fs.unlinkSync(filePath);
    }
  });
}
