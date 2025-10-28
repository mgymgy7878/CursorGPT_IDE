import { check } from '@spark/guardrails';
import * as prom from '@metrics';

export const canaryAckMs = new prom.Histogram({
  name: 'canary_ack_ms',
  help: 'Canary ack latency',
  buckets: [50, 100, 200, 400, 800, 1600],
  labelNames: ['route', 'status'],
});

export default async function (fastify: any) {
  fastify.get('/canary/strategies', async (req: any, res: any) => {
    const end = canaryAckMs.startTimer({ 
      route: '/canary/strategies', 
      status: 'start' 
    });
    
    try {
      const ctx = { 
        portfolioNotional: 10_000, 
        drawdownPct: 0.0, 
        pnlDay: 0.0 
      }; // stub
      
      const th = {
        maxNotional: Number(process.env.RISK_MAX_NOTIONAL || 0) || undefined,
        maxDrawdownPct: Number(process.env.RISK_MAX_DRAWDOWN_PCT || 0) || undefined,
        pnlDayLimit: Number(process.env.RISK_PNL_DAY_LIMIT || 0) || undefined,
      };
      
      const d = check(ctx, th);
      
      end({ 
        route: '/canary/strategies', 
        status: d.allow ? 'ok' : 'blocked' 
      });
      
      return { 
        ok: true, 
        dry: Boolean(req.query?.dry !== 'false'), 
        decision: d, 
        ctx, 
        th,
        evidence: {
          ctx,
          th,
          decision: d,
          ts: Date.now()
        }
      };
    } catch (e) { 
      end({ 
        route: '/canary/strategies', 
        status: 'error' 
      }); 
      throw e; 
    }
  });
}
