// Standalone Export Runner - Cycle-free bootstrap for v1.7 testing
// Purpose: Boot executor with ONLY export plugin (no full bootstrap cycle)

import Fastify from 'fastify';

const createServer = async () => {
  const app = Fastify({ 
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    }
  });

  // Health endpoint
  app.get('/health', async () => ({ 
    status: 'ok', 
    service: 'standalone-export',
    version: '1.7.0-export-scale',
    timestamp: new Date().toISOString()
  }));

  // Register export plugin (cycle-free)
  try {
    const mod = await import('../plugins/export.js').catch(async () => await import('../plugins/export'));
    const plugin = (mod as any).default ?? (mod as any).exportPlugin ?? mod;
    
    await app.register(plugin);
    app.log.info('✅ v1.7 Export@Scale plugin registered (standalone mode)');
  } catch (err) {
    app.log.error({ err }, '❌ Export plugin registration failed');
    throw err;
  }

  // Start server
  const port = Number(process.env.PORT ?? 4001);
  const host = process.env.HOST ?? '0.0.0.0';
  
  await app.listen({ port, host });
  
  app.log.info({ port, host, pid: process.pid }, '🚀 Standalone export server ready');
  console.log('');
  console.log('✅ Server ready for testing');
  console.log('📊 Health:  http://127.0.0.1:' + port + '/health');
  console.log('📊 Status:  http://127.0.0.1:' + port + '/export/status');
  console.log('📊 Metrics: http://127.0.0.1:' + port + '/export/metrics');
  console.log('');
  
  return app;
};

// Boot server
createServer().catch((err) => {
  console.error('');
  console.error('❌ Standalone export server failed to start:');
  console.error(err);
  console.error('');
  process.exit(1);
});

