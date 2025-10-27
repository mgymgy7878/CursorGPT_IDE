// ML Router Plugin (v1.8)
// Proxies ML predict requests to ml-engine service
import fp from 'fastify-plugin';

export default fp(async (fastify: any) => {
  const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://127.0.0.1:4010';
  
  // Proxy to ML engine
  fastify.post('/ml/predict', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1s'
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const response = await fetch(`${ML_ENGINE_URL}/ml/predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request.body)
      });
      
      const data = await response.json();
      return reply.send(data);
      
    } catch (error) {
      return reply.code(503).send({
        error: 'ML Engine unavailable',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ML health check (proxied)
  fastify.get('/ml/health', async (_request: any, reply: any) => {
    try {
      const response = await fetch(`${ML_ENGINE_URL}/ml/health`);
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      return reply.code(503).send({
        ok: false,
        error: 'ML Engine unavailable'
      });
    }
  });
  
  fastify.log.info('✅ v1.8 ML Router plugin registered');
}, { name: 'spark-ml-router' });

