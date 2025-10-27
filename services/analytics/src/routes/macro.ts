// services/analytics/src/routes/macro.ts
import type { FastifyInstance } from 'fastify';
import {
  generateImpactScenarios,
  type RateExpectation,
  type RateDecision,
} from '../macro/rate-scenarios.js';

const rateExpectations: Map<string, RateExpectation> = new Map();

/**
 * Macro analysis routes
 * Central bank rate decisions and impact scenarios
 */
export async function macroRoutes(app: FastifyInstance) {
  /**
   * Set rate expectations
   */
  app.post<{ Body: RateExpectation }>(
    '/macro/rate/expectations',
    async (request, reply) => {
      const expectation = request.body;

      if (!expectation.bank || !expectation.expectedBps || !expectation.decisionTime) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'bank, expectedBps, decisionTime are required',
        });
      }

      app.log.info({ expectation }, 'Rate expectation set');

      // Store expectation
      rateExpectations.set(expectation.bank, expectation);

      return reply.send({
        ok: true,
        expectation,
        message: `Expectation set for ${expectation.bank}`,
      });
    }
  );

  /**
   * Process actual rate decision and generate impact scenarios
   */
  app.post<{ Body: RateDecision }>(
    '/macro/rate/decision',
    async (request, reply) => {
      const decision = request.body;

      if (!decision.bank || decision.actualBps === undefined) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'bank, actualBps are required',
        });
      }

      app.log.info({ decision }, 'Rate decision received');

      // Get expectation
      const expectation = rateExpectations.get(decision.bank);

      if (!expectation) {
        return reply.send({
          ok: false,
          message: `No expectation found for ${decision.bank}`,
        });
      }

      // Generate impact scenarios
      const { surprise, impacts } = generateImpactScenarios(expectation, decision);

      app.log.info({
        bank: decision.bank,
        surprise: surprise.surpriseBps,
        type: surprise.surpriseType,
        impactCount: impacts.length,
      }, 'Impact scenarios generated');

      return reply.send({
        ok: true,
        surprise,
        impacts,
        decision,
        expectation,
        timestamp: new Date().toISOString(),
      });
    }
  );

  /**
   * Get upcoming rate decisions
   */
  app.get('/macro/rate/upcoming', async (_request, reply) => {
    const now = new Date();
    const upcoming = Array.from(rateExpectations.values())
      .filter(exp => new Date(exp.decisionTime) > now)
      .sort((a, b) => new Date(a.decisionTime).getTime() - new Date(b.decisionTime).getTime());

    return reply.send({
      ok: true,
      upcoming,
      count: upcoming.length,
    });
  });

  app.log.info('✅ Macro routes registered');
}

