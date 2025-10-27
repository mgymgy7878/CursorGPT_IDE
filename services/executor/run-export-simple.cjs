// Simple HTTP Server for v1.7 Export@Scale Testing
const http = require('http');
const { mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const PORT = 4001;
const EXPORT_DIR = join(process.cwd(), 'exports');

// Ensure exports directory
if (!existsSync(EXPORT_DIR)) {
  mkdirSync(EXPORT_DIR, { recursive: true });
}

// Load export handlers
let exportHandlers;
try {
  // Try to load compiled export plugin
  const exportPath = join(__dirname, 'plugins', 'export.ts');
  console.log(`[INFO] Loading export plugin from: ${exportPath}`);
  
  // For now, create inline handlers since TS import won't work in CJS
  exportHandlers = require('./export-handlers-inline.cjs');
} catch (err) {
  console.error('[ERROR] Failed to load export handlers:', err.message);
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '';
  const method = req.method || 'GET';
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Health check
  if (url === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'executor', version: '1.7.0-export-test' }));
    return;
  }
  
  // Export status
  if (url === '/export/status' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ready',
      concurrentExports: 0,
      queueDepth: 0,
      maxConcurrentExports: 5,
      timestamp: new Date().toISOString(),
      version: '1.7.0-export-scale'
    }));
    return;
  }
  
  // Export metrics (stub)
  if (url === '/export/metrics' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`# HELP export_requests_total Total export requests
# TYPE export_requests_total counter
export_requests_total{format="csv",status="succeeded",user="test"} 0

# HELP export_concurrent_running Concurrent exports
# TYPE export_concurrent_running gauge
export_concurrent_running 0

# HELP export_queue_depth Export queue depth
# TYPE export_queue_depth gauge
export_queue_depth 0
`);
    return;
  }
  
  // Export run (stub - returns 501)
  if (url === '/export/run' && method === 'POST') {
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Export handlers not fully implemented in simple test server. Use full executor for real testing.',
      message: 'This is a minimal test server. Plugin registration successful but handlers are stubs.'
    }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found', url, method }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Export test server listening on http://127.0.0.1:${PORT}`);
  console.log(`📊 Health: http://127.0.0.1:${PORT}/health`);
  console.log(`📊 Status: http://127.0.0.1:${PORT}/export/status`);
  console.log(`📊 Metrics: http://127.0.0.1:${PORT}/export/metrics`);
  console.log('\n⚠️  NOTE: This is a minimal test server with stub handlers');
  console.log('   For full export functionality, use the main executor\n');
});

