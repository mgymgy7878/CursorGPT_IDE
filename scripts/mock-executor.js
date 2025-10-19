const http = require('http');
const url = require('url');

const PORT = Number(process.env.PORT || 4001);
const HOST = process.env.HOST || '0.0.0.0';

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;
  const method = req.method || 'GET';

  // Health
  if (method === 'GET' && path === '/health') {
    return send(res, 200, { ok: true, service: 'mock-executor', ts: Date.now() });
  }

  // Metrics (Prometheus text format)
  if (method === 'GET' && path === '/metrics') {
    const lines = [
      '# HELP spark mock metrics',
      'spark_backtest_cache_hit_total 180',
      'spark_backtest_cache_miss_total 1',
      'spark_backtest_overfitting_detected_total 0',
      'spark_backtest_opt_latency_ms_sum 25000',
      'spark_backtest_portfolio_diversification_benefit 0.26',
    ];
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(lines.join('\n'));
  }

  // Mock POST routes
  if (method === 'POST' && path === '/backtest/run') {
    await readJson(req); // ignore body
    return send(res, 200, { ok: true, result: { pnl: 1234, trades: 42, sharpe: 1.6 } });
  }

  if (method === 'POST' && path === '/backtest/walkforward') {
    await readJson(req);
    const thr = Number(process.env.WFO_THRESHOLD || 0.6);
    return send(res, 200, { ok: true, result: { overfitting: { detected: false, ratio: 0.85, threshold: thr }, summary: { train: { sharpe: 1.8 }, test: { sharpe: 1.5 } } } });
  }

  if (method === 'POST' && path === '/backtest/portfolio') {
    await readJson(req);
    return send(res, 200, { ok: true, result: { combined: { sharpe: 1.82, winRate: 0.61, pnl: 1850 }, correlation: { matrix: [[1,0.85,0.72],[0.85,1,0.68],[0.72,0.68,1]], avgCorrelation: 0.75, diversificationBenefit: 0.26 } } });
  }

  if (method === 'POST' && path === '/backtest/optimize') {
    await readJson(req);
    return send(res, 200, { ok: true, bestParams: { emaFast: 20, emaSlow: 50, atr: 14 }, bestScore: 1.92, totalCombinations: 180, timing: { totalMs: 25000, avgPerRun: 139 } });
  }

  // Fallback 404
  send(res, 404, { ok: false, error: 'Not found' });
});

server.on('listening', () => {
  console.log(`[MOCK] executor up on http://${HOST}:${PORT}`);
});
server.on('error', (e) => {
  console.error('[MOCK] server error', e);
  process.exit(1);
});

server.listen(PORT, HOST);

