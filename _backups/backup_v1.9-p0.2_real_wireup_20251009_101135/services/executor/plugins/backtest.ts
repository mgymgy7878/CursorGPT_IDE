import { FastifyPluginAsync } from 'fastify';
import { BacktestRunner, BacktestConfig, BacktestResult } from "../../../packages/backtest-core/src/runner.js";
import { backtestMetrics } from "../../../packages/backtest-core/src/metrics.js";

const backtestPlugin: FastifyPluginAsync = async (fastify) => {
  // Backtest run endpoint
  fastify.post('/backtest/run', {
    schema: {
      body: {
        type: 'object',
        required: ['strategy', 'dataset', 'timeframe', 'startDate', 'endDate', 'initialCapital'],
        properties: {
          strategy: { type: 'string' },
          dataset: { type: 'string' },
          timeframe: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          initialCapital: { type: 'number' },
          seed: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const config = request.body as BacktestConfig;
    
    try {
      const runner = new BacktestRunner(config);
      const result = await runner.run();
      
      return {
        success: true,
        result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Backtest status endpoint
  fastify.get('/backtest/status', async (request, reply) => {
    return {
      status: 'ready',
      activeBacktests: 0,
      queueDepth: 0,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // Backtest metrics endpoint
  fastify.get('/backtest/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await backtestMetrics.register.metrics();
  });
};

export default backtestPlugin;
