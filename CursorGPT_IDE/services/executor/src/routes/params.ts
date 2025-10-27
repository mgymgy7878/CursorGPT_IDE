import * as prom from '../lib/metrics.js';
import { diffParams } from '@spark/guardrails';
import * as store from '../guardrails/store.js';
import { guardrailsApplyTotal, updatePendingAgeMetrics } from '../plugins/guardrails.js';

const paramDiffPending = new prom.Gauge({
  name: 'guardrails_param_diff_pending_total',
  help: 'Pending param diffs',
  labelNames: ['strategy'],
});

function actorFrom(req: any) {
  return (req.headers['x-actor'] as string) || 'system';
}

export default async function (fastify: any) {
  fastify.post('/params/submit', async (req: any, res: any) => {
    const { strategy, oldParams, newParams } = req.body || {};
    const diff = diffParams(oldParams || {}, newParams || {});
    const actor = actorFrom(req);
    
    await store.appendPending({ 
      strategy, 
      diff, 
      newParams, 
      requestedBy: actor, 
      ts: Date.now() 
    });
    
    await store.addAudit('params.submit', actor, undefined, { strategy, diff });
    
    // Update metrics
    const pending = await store.listPending();
    paramDiffPending.set({ strategy }, pending.filter(i => i.strategy === strategy).length);
    updatePendingAgeMetrics();
    
    return { 
      ok: true, 
      pending: true, 
      strategy, 
      changed: Object.keys(diff) 
    };
  });

  fastify.get('/params/pending', async (req: any, res: any) => {
    const items = await store.listPending();
    
    // Set oldest age per strategy
    const by = new Map<string, number>();
    for (const it of items) {
      const age = Math.max(0, Math.floor((Date.now() - it.ts) / 1000));
      by.set(it.strategy, Math.max(by.get(it.strategy) || 0, age));
    }
    for (const [strategy, age] of by) {
      fastify.metrics.guardrailsPendingAge.set({ strategy }, age);
    }
    
    return { ok: true, items };
  });

  fastify.post('/params/approve', async (req: any, res: any) => {
    const actor = actorFrom(req);
    const { strategy } = req.body || {};
    
    const success = await store.approve(String(strategy), actor);
    if (success) {
      await store.addAudit('params.approve', actor, undefined, { strategy });
      guardrailsApplyTotal.inc({ status: 'approved' });
    }
    
    // Update metrics
    const pending = await store.listPending();
    paramDiffPending.set({ strategy }, pending.filter(i => i.strategy === strategy).length);
    updatePendingAgeMetrics();
    
    return { 
      ok: true, 
      applied: success, 
      strategy 
    };
  });

  fastify.post('/params/deny', async (req: any, res: any) => {
    const actor = actorFrom(req);
    const { strategy } = req.body || {};
    
    const success = await store.deny(String(strategy), actor);
    if (success) {
      await store.addAudit('params.deny', actor, undefined, { strategy });
      guardrailsApplyTotal.inc({ status: 'denied' });
    }
    
    // Update metrics
    const pending = await store.listPending();
    paramDiffPending.set({ strategy }, pending.filter(i => i.strategy === strategy).length);
    updatePendingAgeMetrics();
    
    return { 
      ok: true, 
      denied: success, 
      strategy 
    };
  });

  fastify.get('/params/history', async (req: any, res: any) => {
    const rows = await store.getHistory(200);
    return { ok: true, items: rows };
  });
}
