// Copilot Tools Plugin - Minimal Mock Endpoints
// v1.9-p0.1 - Temporary mocks for Copilot integration
// Replace with real implementations in future sprints

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  // AI Chat endpoint (mock)
  app.post('/ai/chat', async (req, reply) => {
    const body = (req as any).body || {};
    const messages = body?.messages || [];
    const lastMessage = messages.slice(-1)?.[0]?.content ?? 'empty';
    
    return reply.send({
      id: `copilot-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'mock-v1',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `🤖 Copilot Mock Response:\n\nReceived: "${lastMessage}"\n\nThis is a mock response. Real AI integration coming soon.`,
          },
          finish_reason: 'stop',
        },
      ],
    });
  });

  // Get Status (health + queues)
  app.get('/tools/get_status', async (_, reply) => {
    return reply.send({
      ok: true,
      uptime: process.uptime(),
      timestamp: Date.now(),
      health: 'healthy',
      services: {
        executor: { status: 'running', port: 4001 },
        optimizer: { status: 'idle', queue_depth: 0 },
        export: { status: 'idle', active_jobs: 0 },
        backtest: { status: 'idle', running: 0 },
      },
      metrics: {
        p95_latency_ms: 42,
        error_rate: 0.3,
        requests_total: 1234,
      },
    });
  });

  // Get Metrics (performance summary)
  app.get('/tools/get_metrics', async (_, reply) => {
    return reply.send({
      ml: {
        p95_ms: 3,
        error_rate: 0.3,
        psi: 1.25,
        match_rate: 98.5,
        total_predictions: 5678,
      },
      backtest: {
        total_runs: 42,
        active_runs: 0,
        completed: 40,
        failed: 2,
        p95_duration_sec: 120,
      },
      export: {
        total_exports: 15,
        active: 0,
        success_rate: 93.3,
      },
      optimizer: {
        jobs_processed: 234,
        queue_depth: 0,
        avg_latency_ms: 85,
      },
    });
  });

  // Get Orders (open orders)
  app.post('/tools/get_orders', async (_, reply) => {
    return reply.send({
      success: true,
      open_orders: [
        {
          id: 'ord-1',
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'LIMIT',
          price: 45000,
          quantity: 0.1,
          status: 'NEW',
          created_at: Date.now() - 60000,
        },
        {
          id: 'ord-2',
          symbol: 'ETHUSDT',
          side: 'SELL',
          type: 'LIMIT',
          price: 2800,
          quantity: 0.5,
          status: 'PARTIALLY_FILLED',
          created_at: Date.now() - 120000,
        },
      ],
      total: 2,
    });
  });

  // Get Positions (open positions)
  app.post('/tools/get_positions', async (_, reply) => {
    return reply.send({
      success: true,
      positions: [
        {
          symbol: 'BTCUSDT',
          side: 'LONG',
          size: 0.1,
          entry_price: 44500,
          current_price: 45000,
          pnl: 50,
          pnl_percent: 1.12,
          leverage: 1,
          liquidation_price: 0,
        },
        {
          symbol: 'ETHUSDT',
          side: 'SHORT',
          size: 0.5,
          entry_price: 2850,
          current_price: 2800,
          pnl: 25,
          pnl_percent: 1.75,
          leverage: 1,
          liquidation_price: 0,
        },
      ],
      total: 2,
      total_pnl: 75,
    });
  });

  app.log.info('[Copilot Tools] Mock endpoints registered: /ai/chat, /tools/get_*');
});

