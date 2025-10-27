// Feed Routes
// fastify plugin: GET /feeds/canary?dry=true -> {ok:true,sources:[{name:'btcturk',ready:true},{name:'bist',ready:true}]}
// GET /feeds/health -> status snapshot (UP/DOWN, lastError, lastEventTs)

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FeedOrchestrator } from '../orchestrator.js';

export async function feedRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { orchestrator: FeedOrchestrator }
) {
  const { orchestrator } = options;

  // Canary endpoint
  fastify.get('/feeds/canary', async (request, reply) => {
    const { dry } = request.query as { dry?: string };
    
    if (dry === 'true') {
      // Dry run - test reachability
      const sources = [];
      
      // Test BTCTurk reachability
      try {
        const btcturkPing = await orchestrator.btcturk?.rest?.ping();
        sources.push({ name: 'btcturk', ready: btcturkPing || false });
      } catch {
        sources.push({ name: 'btcturk', ready: false });
      }
      
      // Test BIST reachability
      try {
        const bistPing = await orchestrator.bist?.source?.ping();
        sources.push({ name: 'bist', ready: bistPing || false });
      } catch {
        sources.push({ name: 'bist', ready: false });
      }
      
      return {
        ok: true,
        sources
      };
    }

    // Real canary check
    const status = orchestrator.getStatus();
    return {
      ok: true,
      sources: [
        { name: 'btcturk', ready: status.btcturk },
        { name: 'bist', ready: status.bist }
      ]
    };
  });

  // Health endpoint
  fastify.get('/feeds/health', async (request, reply) => {
    const status = orchestrator.getStatus();
    const health = orchestrator.getHealthStatus();
    const now = Date.now();
    
    return {
      status: 'ok',
      timestamp: now,
      sources: {
        btcturk: {
          status: status.btcturk ? 'UP' : 'DOWN',
          lastError: health.btcturk?.lastError || (status.btcturk ? null : 'Connection failed'),
          lastEventTs: health.btcturk?.lastEventTs || (status.btcturk ? now : null),
          lastDbWriteTs: health.btcturk?.lastDbWriteTs || null
        },
        bist: {
          status: status.bist ? 'UP' : 'DOWN',
          lastError: health.bist?.lastError || (status.bist ? null : 'File not found'),
          lastEventTs: health.bist?.lastEventTs || (status.bist ? now : null),
          lastDbWriteTs: health.bist?.lastDbWriteTs || null
        }
      }
    };
  });

  // Metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    const { register } = await import('@metrics');
    reply.type('text/plain');
    return register.metrics();
  });
}
