// Minimal Executor for v1.7 Export@Scale Testing
const Fastify = require('fastify');
const { mkdirSync, existsSync } = require('fs');
const { join } = require('path');

// Ensure exports directory exists
const EXPORT_DIR = join(process.cwd(), 'exports');
if (!existsSync(EXPORT_DIR)) {
  mkdirSync(EXPORT_DIR, { recursive: true });
}

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

async function start() {
  const PORT = 4001;
  const HOST = '127.0.0.1';
  
  // Health endpoint
  app.get('/health', async () => ({ ok: true, service: 'executor', version: '1.7.0-export-test' }));
  
  // Register v1.7 Export Plugin
  try {
    // Dynamic import for ESM plugin
    const exportPlugin = await import('./plugins/export.js');
    await app.register(exportPlugin.default || exportPlugin.exportPlugin);
    app.log.info('✅ v1.7 Export@Scale plugin registered');
  } catch (err) {
    app.log.error({ err }, '❌ Export plugin registration failed');
    process.exit(1);
  }
  
  // Start server
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`🚀 Export test executor listening on http://${HOST}:${PORT}`);
    app.log.info(`📊 Metrics: http://${HOST}:${PORT}/export/metrics`);
    app.log.info(`📝 Status: http://${HOST}:${PORT}/export/status`);
    console.log('\n✅ Server ready for export testing\n');
  } catch (err) {
    app.log.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();

