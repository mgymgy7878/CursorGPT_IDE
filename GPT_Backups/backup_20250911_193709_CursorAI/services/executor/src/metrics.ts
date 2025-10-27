import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const execStartTotal = new Counter({
  name: 'exec_start_total',
  help: 'Number of strategy start requests',
  registers: [register],
});

export const execStopTotal = new Counter({
  name: 'exec_stop_total',
  help: 'Number of strategy stop requests',
  registers: [register],
});

export const activeStrategies = new Gauge({
  name: 'active_strategies',
  help: 'Current active strategy count',
  registers: [register],
});

// NEW: generic HTTP & rate-limit metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'HTTP requests labeled with method, route and code',
  labelNames: ['method', 'route', 'code'] as const,
  registers: [register],
});

export const rateLimitHitsTotal = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total requests blocked by rate limit, labeled by route',
  labelNames: ['route'] as const,
  registers: [register],
});
