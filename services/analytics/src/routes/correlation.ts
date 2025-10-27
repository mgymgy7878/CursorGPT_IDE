// services/analytics/src/routes/correlation.ts
import type { FastifyInstance } from 'fastify';
import { CorrEngine } from '../correlation/engine.js';
import { getUniverse, getAllUniverses } from '../correlation/universe.js';
import {
  followerContinuation,
  followerMeanRevert,
  betaBreak,
  leadConfirm,
  type SignalParams,
  type MoneyFlowContext,
} from '../correlation/signals.js';

let engine: CorrEngine | null = null;
let previousEdges: Map<string, any> = new Map();

/**
 * Correlation analysis routes
 */
export async function correlationRoutes(app: FastifyInstance) {
  /**
   * Start correlation engine
   */
  app.post<{ Body: { universe: string; windowSec?: number; lagMax?: number; customSymbols?: string[] } }>(
    '/correlation/start',
    async (request, reply) => {
      const { universe, windowSec = 900, lagMax = 3, customSymbols } = request.body;

      app.log.info({ universe, windowSec, lagMax }, 'Starting correlation engine');

      const universeData = getUniverse(universe, customSymbols);

      if (!universeData || universeData.symbols.length === 0) {
        return reply.code(400).send({
          error: 'InvalidUniverse',
          message: 'Universe not found or empty',
        });
      }

      // Create engine
      engine = new CorrEngine(windowSec, lagMax);

      return reply.send({
        ok: true,
        universe: universeData.name,
        symbols: universeData.symbols,
        windowSec,
        lagMax,
        message: 'Correlation engine started',
      });
    }
  );

  /**
   * Get correlation matrix
   */
  app.get<{ Querystring: { universe?: string } }>(
    '/correlation/matrix',
    async (request, reply) => {
      if (!engine) {
        return reply.send({
          ok: false,
          message: 'Correlation engine not started',
          edges: [],
        });
      }

      const { universe = 'BIST_CORE' } = request.query;
      const universeData = getUniverse(universe);

      const edges = engine.computeMatrix(universeData.symbols);

      return reply.send({
        ok: true,
        universe,
        edges,
        timestamp: new Date().toISOString(),
      });
    }
  );

  /**
   * Get leaders for a follower symbol
   */
  app.get<{ Querystring: { symbol: string; universe?: string } }>(
    '/correlation/leaders',
    async (request, reply) => {
      if (!engine) {
        return reply.send({
          ok: false,
          message: 'Correlation engine not started',
          leaders: [],
        });
      }

      const { symbol, universe = 'BIST_CORE' } = request.query;

      if (!symbol) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'symbol query parameter required',
        });
      }

      const universeData = getUniverse(universe);
      const edges = engine.computeMatrix(universeData.symbols);
      const leaders = engine.getLeaders(symbol, edges);

      return reply.send({
        ok: true,
        symbol,
        leaders,
        timestamp: new Date().toISOString(),
      });
    }
  );

  /**
   * Generate correlation-based signal
   */
  app.post<{ Body: { follower: string; leader: string; rule: string; params?: SignalParams; moneyFlow?: MoneyFlowContext } }>(
    '/correlation/signal',
    async (request, reply) => {
      if (!engine) {
        return reply.send({
          ok: false,
          message: 'Correlation engine not started',
        });
      }

      const { follower, leader, rule, params = {}, moneyFlow = { nmf: 0, obi: 0, cvd: 0 } } = request.body;

      if (!follower || !leader || !rule) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'follower, leader, rule are required',
        });
      }

      // Compute current edge
      const allEdges = engine.computeMatrix([leader, follower]);
      const currentEdge = allEdges.find(e => e.leader === leader && e.follower === follower);

      if (!currentEdge) {
        return reply.send({
          ok: false,
          message: 'No correlation edge found',
        });
      }

      // Get previous edge for regime detection
      const edgeKey = `${leader}:${follower}`;
      const prevEdge = previousEdges.get(edgeKey);

      // Calculate z-scores
      const leaderZScore = engine.calculateZScore(leader);
      const followerZScore = engine.calculateZScore(follower);
      const spreadZScore = leaderZScore - followerZScore; // Simplified

      // Generate signal based on rule
      let signal;
      
      switch (rule) {
        case 'FOLLOWER_CONTINUATION':
          signal = followerContinuation(currentEdge, leaderZScore, moneyFlow, params);
          break;
        case 'FOLLOWER_MEAN_REVERT':
          signal = followerMeanRevert(currentEdge, spreadZScore, moneyFlow, params);
          break;
        case 'BETA_BREAK':
          signal = betaBreak(currentEdge, prevEdge);
          break;
        case 'LEAD_CONFIRM':
          signal = leadConfirm(currentEdge, leaderZScore, params);
          break;
        default:
          return reply.code(400).send({
            error: 'UnknownRule',
            message: `Rule ${rule} not recognized`,
          });
      }

      // Store current edge for next comparison
      previousEdges.set(edgeKey, currentEdge);

      app.log.info({
        follower,
        leader,
        rule,
        signal: signal.action,
        confidence: signal.confidence,
      }, 'Correlation signal generated');

      return reply.send({
        ok: true,
        signal,
        edge: currentEdge,
        context: {
          leaderZScore,
          followerZScore,
          spreadZScore,
          moneyFlow,
        },
        timestamp: new Date().toISOString(),
      });
    }
  );

  /**
   * Get all available universes
   */
  app.get('/correlation/universes', async (_request, reply) => {
    const universes = getAllUniverses();
    return reply.send({
      ok: true,
      universes,
    });
  });

  /**
   * Stop correlation engine
   */
  app.post('/correlation/stop', async (_request, reply) => {
    engine = null;
    previousEdges.clear();

    return reply.send({
      ok: true,
      message: 'Correlation engine stopped',
    });
  });

  app.log.info('✅ Correlation routes registered');
}

