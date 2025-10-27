const http = require('http');
const crypto = require('crypto');

// Auth configuration
const AUTH_CONFIG = {
  TOKEN: process.env.EXECUTOR_TOKEN || "dev-secret-change-me",
  HMAC_SECRET: process.env.EXECUTOR_HMAC_SECRET || "dev-hmac-change-me",
  MODE: process.env.EXECUTOR_AUTH_MODE || "bearer"
};

// Auth middleware
function authMiddleware(req, res, next) {
  // Skip auth for health and metrics endpoints
  if (req.url === "/api/public/health" || req.url === "/api/public/metrics/prom") {
    return next();
  }

  if (AUTH_CONFIG.MODE === "bearer") {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ") || auth.slice(7) !== AUTH_CONFIG.TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, code: "unauthorized" }));
      return;
    }
    return next();
  }

  if (AUTH_CONFIG.MODE === "hmac") {
    const ts = req.headers['x-timestamp'];
    const sig = req.headers['x-signature'];
    
    if (!ts || !sig) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, code: "unauthorized" }));
      return;
    }

    // Check timestamp skew (5 minutes)
    const skew = Math.abs(Date.now() - Number(ts));
    if (isNaN(Number(ts)) || skew > 300000) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, code: "unauthorized" }));
      return;
    }

    // For simplicity, we'll skip HMAC body verification in test
    return next();
  }

  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, code: "unauthorized" }));
}

// Request body parser
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

// Create server
const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, x-timestamp, x-signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Auth middleware
  authMiddleware(req, res, () => {
    handleRequest(req, res);
  });
});

async function handleRequest(req, res) {
  try {
    if (req.url === '/api/public/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        ok: true, 
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: 'test-executor'
      }));
      return;
    }

    if (req.url === '/api/public/metrics/prom' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`# HELP test_requests_total Total requests
# TYPE test_requests_total counter
test_requests_total 42
`);
      return;
    }

    if (req.url === '/api/public/echo' && req.method === 'POST') {
      const body = await parseBody(req);
      let parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        parsedBody = body;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        echo: parsedBody,
        timestamp: Date.now(),
        method: req.method,
        path: req.url,
        auth: AUTH_CONFIG.MODE
      }));
      return;
    }

    // Strategy pipeline endpoints
    if (req.url === '/api/public/strategy/generate' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = JSON.parse(body);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        dsl: {
          name: "Generated Strategy",
          description: data.prompt || "AI generated strategy",
          symbol: "BTCUSDT",
          timeframe: "1h",
          indicators: {
            sma: { period: 20 },
            rsi: { period: 14 }
          },
          conditions: {
            price_above_sma: { indicator: "sma", operator: ">" },
            rsi_oversold: { indicator: "rsi", operator: "<", value: 30 }
          },
          rules: {
            entry: {
              condition: "price_above_sma && rsi_oversold",
              action: "buy",
              quantity: 0.1,
              priceType: "market"
            },
            exit: {
              condition: "rsi > 70",
              action: "sell",
              quantity: "all",
              priceType: "market"
            }
          },
          risk: {
            riskPct: 2,
            maxPos: 1,
            maxDailyLoss: 100,
            stopLoss: 5,
            takeProfit: 10
          }
        }
      }));
      return;
    }

    if (req.url === '/api/public/strategy/build' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = JSON.parse(body);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        artifactId: `ART-${data.dsl.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
        code: `// Generated strategy code for ${data.dsl.name}`,
        metadata: {
          name: data.dsl.name,
          symbol: data.dsl.symbol,
          timeframe: data.dsl.timeframe,
          generatedAt: new Date().toISOString()
        }
      }));
      return;
    }

    if (req.url === '/api/public/strategy/backtest' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = JSON.parse(body);
      
      // Mock backtest results
      const totalReturn = Math.random() * 20 - 5; // -5% to +15%
      const maxDrawdown = Math.random() * 10; // 0% to 10%
      const winRate = Math.random() * 40 + 30; // 30% to 70%
      const sharpeRatio = Math.random() * 2 - 1; // -1 to +1
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        report: {
          artifactId: data.artifactId,
          symbol: data.symbol,
          initialCapital: data.initialCapital,
          finalCapital: data.initialCapital * (1 + totalReturn / 100),
          totalReturn: totalReturn.toFixed(2),
          maxDrawdown: maxDrawdown.toFixed(2),
          winRate: winRate.toFixed(1),
          sharpeRatio: sharpeRatio.toFixed(2),
          profitFactor: (Math.random() * 2 + 0.5).toFixed(2),
          totalTrades: Math.floor(Math.random() * 50) + 10,
          winningTrades: Math.floor(Math.random() * 30) + 5,
          losingTrades: Math.floor(Math.random() * 20) + 5,
          avgWin: (Math.random() * 5 + 1).toFixed(2),
          avgLoss: (Math.random() * 3 + 1).toFixed(2),
          backtestPeriod: "2024-01-01 to 2024-12-31",
          generatedAt: new Date().toISOString()
        }
      }));
      return;
    }

    if (req.url === '/api/public/strategy/deploy-paper' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = JSON.parse(body);
      
      // Check kill switch
      if (process.env.TRADING_KILL_SWITCH === '1') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: 'trading_disabled',
          message: 'Trading is currently disabled'
        }));
        return;
      }
      
      // Check risk limits
      if (data.risk && data.risk.maxPos > 5) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: 'risk_limit_exceeded',
          message: 'Max position limit exceeded'
        }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        runId: `RUN-${data.artifactId}-${Date.now()}`,
        status: 'deployed',
        symbol: data.symbol,
        risk: data.risk,
        deployedAt: new Date().toISOString()
      }));
      return;
    }

    // Live trading endpoints
    if (req.url === '/api/public/strategy/deploy-live' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = JSON.parse(body);
      
      // Check live trading mode
      const liveTrading = parseInt(process.env.LIVE_TRADING || '0');
      const confirmPhrase = process.env.REQUIRE_CONFIRM_PHRASE || 'CONFIRM LIVE TRADE';
      
      if (liveTrading === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: 'live_trading_disabled',
          message: 'Live trading is disabled'
        }));
        return;
      }
      
      if (liveTrading === 1) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: 'arm_only',
          message: 'System is armed but not confirmed'
        }));
        return;
      }
      
      if (liveTrading === 2 && data.confirmPhrase !== confirmPhrase) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: 'confirm_required',
          message: 'Invalid confirmation phrase'
        }));
        return;
      }
      
      // Check whitelist
      const whitelist = (process.env.TRADE_WHITELIST || 'BTCUSDT,ETHUSDT').split(',');
      if (!whitelist.includes(data.symbol)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: 'whitelist_violation',
          message: `Symbol ${data.symbol} not in whitelist`
        }));
        return;
      }
      
      // Check notional limit
      const maxNotional = parseFloat(process.env.LIVE_MAX_NOTIONAL || '20');
      const notional = data.qty * (data.price || 50000); // Mock price
      if (notional > maxNotional) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: 'notional_limit_exceeded',
          message: `Notional ${notional.toFixed(2)} exceeds limit ${maxNotional}`
        }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        orderId: `ORDER-${Date.now()}`,
        clientId: `CLIENT-${Date.now()}`,
        exchangeId: `EXCHANGE-${Date.now()}`,
        status: 'NEW'
      }));
      return;
    }

    if (req.url === '/api/public/live/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        exchange: 'up',
        ws: 'todo',
        drift: 0,
        killSwitch: process.env.TRADING_KILL_SWITCH === '1' ? 1 : 0,
        circuit: 'closed',
        liveTrading: parseInt(process.env.LIVE_TRADING || '0'),
        shadowMode: process.env.SHADOW_MODE === '1'
      }));
      return;
    }

    if (req.url === '/api/public/strategy/kill-switch' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = JSON.parse(body);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        killSwitch: data.on,
        message: data.on ? 'Kill switch activated' : 'Kill switch deactivated'
      }));
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not_found' }));

  } catch (error) {
    console.error('Error handling request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'internal_error' }));
  }
}

const PORT = 4001;
server.listen(PORT, () => {
  console.log(`Test executor running on http://127.0.0.1:${PORT}`);
  console.log(`Auth mode: ${AUTH_CONFIG.MODE}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/public/health`);
  console.log(`  GET  /api/public/metrics/prom`);
  console.log(`  POST /api/public/echo`);
  console.log(`  POST /api/public/strategy/deploy-live`);
  console.log(`  GET  /api/public/live/health`);
  console.log(`  POST /api/public/strategy/kill-switch`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 