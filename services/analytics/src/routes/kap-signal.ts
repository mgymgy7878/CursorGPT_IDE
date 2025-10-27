// services/analytics/src/routes/kap-signal.ts
import type { FastifyInstance } from 'fastify';
import { fetchKAPList, KAPDisclosure } from '../../marketdata/src/readers/kap.js';
import { classifyKAPDisclosure, suggestionFromClass } from '../nlp/kap-classifier.js';
import { kapMetrics } from '../metrics/kap.js';

interface KAPSignal {
  disclosure: KAPDisclosure;
  classification: ReturnType<typeof classifyKAPDisclosure>;
  suggestion: ReturnType<typeof suggestionFromClass>;
  generatedAt: string;
}

/**
 * KAP Signal routes
 * Scans KAP disclosures and generates trading signals
 */
export async function kapSignalRoutes(app: FastifyInstance) {
  /**
   * Scan KAP for new disclosures and generate signals
   */
  app.post<{ Body: { from?: string; to?: string; company?: string } }>(
    '/kap/scan',
    async (request, reply) => {
      const startTime = Date.now();
      const params = request.body || {};

      app.log.info({ params }, 'KAP scan request');

      try {
        // Fetch disclosures
        const disclosures = await fetchKAPList(params);

        // Classify and generate signals
        const signals: KAPSignal[] = disclosures.map((disclosure) => {
          const classification = classifyKAPDisclosure(
            disclosure.title,
            disclosure.summary
          );

          const suggestion = suggestionFromClass(
            classification.cls,
            classification.horizon
          );

          return {
            disclosure,
            classification,
            suggestion,
            generatedAt: new Date().toISOString(),
          };
        });

        // Sort by score (highest first)
        signals.sort((a, b) => b.classification.score - a.classification.score);

        // Update metrics
        kapMetrics.scans.inc();
        kapMetrics.lastScanTime.setToCurrentTime();
        
        const duration = Date.now() - startTime;
        app.log.info({
          count: signals.length,
          duration,
        }, 'KAP scan complete');

        return reply.send({
          ok: true,
          count: signals.length,
          signals,
          scanDuration: duration,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        app.log.error({ err }, 'KAP scan error');
        kapMetrics.errors.inc();

        return reply.code(500).send({
          error: 'KAPScanError',
          message: err.message,
        });
      }
    }
  );

  /**
   * Get specific KAP disclosure details
   */
  app.get<{ Querystring: { id: string } }>(
    '/kap/disclosure',
    async (request, reply) => {
      const { id } = request.query;

      if (!id) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'id query parameter required',
        });
      }

      // TODO: Fetch specific disclosure details
      return reply.send({
        ok: true,
        disclosure: {
          id,
          message: 'Specific disclosure fetch not yet implemented',
        },
      });
    }
  );

  /**
   * Get high-impact signals (recent + high score)
   */
  app.get('/kap/signals/high-impact', async (_request, reply) => {
    try {
      // Fetch recent disclosures
      const disclosures = await fetchKAPList({
        from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Last 24h
      });

      // Classify and filter high-impact
      const signals: KAPSignal[] = disclosures
        .map((disclosure) => {
          const classification = classifyKAPDisclosure(
            disclosure.title,
            disclosure.summary
          );

          const suggestion = suggestionFromClass(
            classification.cls,
            classification.horizon
          );

          return {
            disclosure,
            classification,
            suggestion,
            generatedAt: new Date().toISOString(),
          };
        })
        .filter((signal) => signal.classification.score > 0.7) // High confidence only
        .sort((a, b) => b.classification.score - a.classification.score)
        .slice(0, 10); // Top 10

      return reply.send({
        ok: true,
        count: signals.length,
        signals,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      app.log.error({ err }, 'High-impact signals error');
      return reply.code(500).send({
        error: 'SignalsError',
        message: err.message,
      });
    }
  });

  app.log.info('✅ KAP signal routes registered');
}

