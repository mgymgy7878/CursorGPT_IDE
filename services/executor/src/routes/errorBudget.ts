import type { FastifyInstance } from 'fastify';

// ENV
const PROM_URL = process.env.PROM_URL || ''; // örn: http://localhost:9090
const ALLOWED = Number(process.env.SLO_ALLOWED_ERROR_RATE || '0.01'); // 1%
const WINDOW = process.env.SLO_WINDOW || '5m';

export default async function errorBudgetRoute(fastify: FastifyInstance) {
  fastify.get('/error-budget/summary', async (_req, reply) => {
    if (!PROM_URL) {
      // Prom yoksa güvenli mock
      const current = 0.003;
      const remaining = Math.max(0, (ALLOWED - current) / ALLOWED) * 100;
      return reply.send({ 
        window: WINDOW, 
        error_rate: current, 
        allowed: ALLOWED, 
        remaining_pct: remaining, 
        _mock: true 
      });
    }
    
    // Prometheus HTTP API — /api/v1/query (rate fonksiyonu)
    // error_rate = sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
    const q = `sum(rate(http_requests_total{status=~"5.."}[${WINDOW}])) / sum(rate(http_requests_total[${WINDOW}]))`;
    const url = `${PROM_URL}/api/v1/query?query=${encodeURIComponent(q)}`;
    
    try {
      const r = await fetch(url);
      const j = await r.json() as any;
      const v = Number(j?.data?.result?.[0]?.value?.[1] || 0);
      const remaining = Math.max(0, (ALLOWED - v) / ALLOWED) * 100;
      return reply.send({ 
        window: WINDOW, 
        error_rate: v, 
        allowed: ALLOWED, 
        remaining_pct: remaining 
      });
    } catch (err) {
      // Prometheus error ise mock döndür
      const current = 0.003;
      const remaining = Math.max(0, (ALLOWED - current) / ALLOWED) * 100;
      return reply.send({ 
        window: WINDOW, 
        error_rate: current, 
        allowed: ALLOWED, 
        remaining_pct: remaining, 
        _mock: true,
        _err: String(err)
      });
    }
  });
}

