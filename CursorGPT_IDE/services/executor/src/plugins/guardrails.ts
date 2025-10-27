import * as prom from '../lib/metrics.js';
import { check } from '@spark/guardrails';
import { listPending } from './guardrails/store.js';

export const guardrailsBlocksTotal = new prom.Counter({
  name: 'guardrails_blocks_total',
  help: 'Blocked actions',
  labelNames: ['reason'],
});

export const guardrailsPendingAge = new prom.Gauge({
  name: 'guardrails_pending_age_seconds',
  help: 'Oldest pending diff age',
  labelNames: ['strategy'],
});

export const guardrailsApplyTotal = new prom.Counter({
  name: 'guardrails_param_apply_total',
  help: 'Param apply events',
  labelNames: ['status'],
});

export async function guardOrder(req: any, ctx: any) {
  // ctx: { portfolioNotional, drawdownPct, pnlDay } from analytics service (TODO: wire)
  const th = {
    maxNotional: Number(process.env.RISK_MAX_NOTIONAL || 0) || undefined,
    maxDrawdownPct: Number(process.env.RISK_MAX_DRAWDOWN_PCT || 0) || undefined,
    pnlDayLimit: Number(process.env.RISK_PNL_DAY_LIMIT || 0) || undefined,
  };
  
  const decision = check(ctx, th);
  
  if (!decision.allow) {
    guardrailsBlocksTotal.inc({ reason: decision.reason || 'unknown' });
    req.audit = { 
      action: 'order.block', 
      reason: decision.reason, 
      th, 
      ctx 
    };
    throw new Error(`guardrails_block:${decision.reason}`);
  }
}

export function updatePendingAgeMetrics() {
  const pending = listPending();
  const now = Date.now();
  
  // Group by strategy and find oldest for each
  const byStrategy: Record<string, number> = {};
  pending.forEach(item => {
    const age = (now - item.ts) / 1000; // seconds
    if (!byStrategy[item.strategy] || age > byStrategy[item.strategy]) {
      byStrategy[item.strategy] = age;
    }
  });
  
  // Update metrics
  Object.entries(byStrategy).forEach(([strategy, age]) => {
    guardrailsPendingAge.set({ strategy }, age);
  });
}