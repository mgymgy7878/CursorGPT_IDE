// services/executor/src/routes/signals.ts
// Unified Signals Hub - Fan-in from all sources
import type { FastifyInstance } from 'fastify';

/**
 * Normalized Signal schema
 */
export interface Signal {
  id: string;
  timestamp: number;
  symbol: string;
  source: 'correlation' | 'news' | 'macro' | 'crypto_micro' | 'bist_breadth' | 'viop';
  direction: 'long' | 'short' | 'flat' | 'neutral';
  strength: number; // 0..1
  horizon: 'short' | 'mid' | 'long';
  reason: string;
  guardrails?: {
    staleness_ok: boolean;
    licensing_ok: boolean;
    regime_stable: boolean;
  };
  metadata?: Record<string, any>;
}

/**
 * In-memory signal buffer (MVP)
 * Production: Replace with Kafka/Redis stream
 */
const SIGNAL_BUFFER: Signal[] = [];
const MAX_BUFFER_SIZE = 5000;

/**
 * Push signal to buffer
 */
function pushSignal(signal: Signal): void {
  SIGNAL_BUFFER.unshift(signal);
  if (SIGNAL_BUFFER.length > MAX_BUFFER_SIZE) {
    SIGNAL_BUFFER.pop();
  }
}

/**
 * Signals Hub routes
 */
export async function signalsRoutes(app: FastifyInstance) {
  /**
   * Ingest signal (internal use by other modules)
   */
  app.post<{ Body: Signal }>('/signals/ingest', async (request, reply) => {
    const signal = request.body;

    // Validate
    if (!signal.id || !signal.symbol || !signal.source) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'id, symbol, source are required',
      });
    }

    pushSignal(signal);

    app.log.info({
      signal: signal.id,
      symbol: signal.symbol,
      source: signal.source,
      direction: signal.direction,
    }, 'Signal ingested');

    return reply.send({
      ok: true,
      size: SIGNAL_BUFFER.length,
    });
  });

  /**
   * Get unified signal feed
   */
  app.get<{ Querystring: { limit?: string; source?: string; symbol?: string } }>(
    '/signals/feed',
    async (request, reply) => {
      const { limit = '200', source, symbol } = request.query;

      let filtered = SIGNAL_BUFFER;

      // Filter by source
      if (source) {
        filtered = filtered.filter(s => s.source === source);
      }

      // Filter by symbol
      if (symbol) {
        filtered = filtered.filter(s => s.symbol === symbol);
      }

      // Limit
      const data = filtered.slice(0, Number(limit));

      return reply.send({
        ok: true,
        count: data.length,
        total: SIGNAL_BUFFER.length,
        data,
      });
    }
  );

  /**
   * Get signal summary
   */
  app.get('/signals/summary', async (_request, reply) => {
    // Count by source
    const bySource = SIGNAL_BUFFER.reduce((acc: Record<string, number>, s) => {
      acc[s.source] = (acc[s.source] || 0) + 1;
      return acc;
    }, {});

    // Count by direction
    const byDirection = SIGNAL_BUFFER.reduce((acc: Record<string, number>, s) => {
      acc[s.direction] = (acc[s.direction] || 0) + 1;
      return acc;
    }, {});

    // Get latest
    const latest = SIGNAL_BUFFER.slice(0, 10);

    return reply.send({
      ok: true,
      total: SIGNAL_BUFFER.length,
      bySource,
      byDirection,
      latest,
      lastTimestamp: SIGNAL_BUFFER[0]?.timestamp || 0,
    });
  });

  /**
   * Clear signal buffer (admin)
   */
  app.delete('/signals/clear', async (_request, reply) => {
    const count = SIGNAL_BUFFER.length;
    SIGNAL_BUFFER.length = 0;

    return reply.send({
      ok: true,
      cleared: count,
    });
  });

  app.log.info('✅ Signals Hub routes registered');
}

/**
 * Helper: Push signal from external modules
 */
export function emitSignal(signal: Signal): void {
  pushSignal(signal);
}

