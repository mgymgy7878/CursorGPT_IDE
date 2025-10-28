import { FastifyInstance } from "fastify";
import { headerStr } from "../lib/http-helpers.js";

interface SuggestRequest {
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  leverage: number;
  risk?: "low" | "med" | "high";
  testnet?: boolean;
}

interface SuggestResponse {
  id: string;
  symbol: string;
  side: string;
  leverage: number;
  entry: string;
  stop: string;
  takeProfits: Array<{ tp: string }>;
  confidence: number;
  rationale: string;
  tokens: number;
  model: string;
  timestamp: string;
  riskLevel: string;
  notional: number;
}

export default async function registerAdvisorSuggestRoutes(app: FastifyInstance) {
  // AI Advisor suggestion endpoint
  app.post<{ Body: SuggestRequest; Reply: SuggestResponse }>('/api/advisor/suggest', async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { symbol, side, qty, leverage, risk = 'low', testnet = true } = request.body;

      // Validation
      const allowedSymbols = ['BTCUSDT', 'ETHUSDT'];
      if (!allowedSymbols.includes(symbol)) {
        return reply.status(400).send({
          error: `Symbol ${symbol} not in whitelist. Allowed: ${allowedSymbols.join(', ')}`
        });
      }

      if (leverage < 1 || leverage > 20) {
        return reply.status(400).send({
          error: 'Leverage must be between 1 and 20'
        });
      }

      if (qty <= 0) {
        return reply.status(400).send({
          error: 'Quantity must be positive'
        });
      }

      // Risk-based configuration
      const riskConfig = {
        low: { stopPct: 0.8, tpPct: [0.6, 1.2], confidence: 0.75 },
        med: { stopPct: 1.2, tpPct: [1.0, 2.0], confidence: 0.65 },
        high: { stopPct: 1.8, tpPct: [1.5, 3.0], confidence: 0.55 }
      };

      const config = riskConfig[risk] || riskConfig.low;
      
      // Generate suggestion ID
      const id = `sg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      
      // Mock price estimation (in real implementation, fetch from market data)
      const priceEstimate = symbol === 'BTCUSDT' ? 50000 : 3000;
      const notional = qty * priceEstimate;

      const suggestion: SuggestResponse = {
        id,
        symbol,
        side,
        leverage,
        entry: "market",
        stop: `-${config.stopPct}%`,
        takeProfits: config.tpPct.map(tp => ({ tp: `${tp}%` })),
        confidence: config.confidence,
        rationale: `AI analizi: ${symbol} ${side} pozisyonu için ${risk} risk seviyesi. Teknik göstergeler ve piyasa momentumu değerlendirildi. Stop loss ${config.stopPct}%, take profit seviyeleri ${config.tpPct.join('% ve ')}% olarak öneriliyor. Kaldıraç ${leverage}x, notional ${notional.toFixed(2)} USDT.`,
        tokens: Math.floor(Math.random() * 500) + 800,
        model: "gpt-4o-mini",
        timestamp: new Date().toISOString(),
        riskLevel: risk,
        notional
      };

      // Record metrics
      const latency = Date.now() - startTime;
      app.metrics?.advisorSuggestTotal?.inc({ status: 'ok' });
      app.metrics?.advisorTokensTotal?.inc({ model: suggestion.model }, suggestion.tokens);
      app.metrics?.advisorLatencyMs?.observe({ risk }, latency);

      return reply.send(suggestion);

    } catch (error) {
      const latency = Date.now() - startTime;
      app.metrics?.advisorSuggestTotal?.inc({ status: 'error' });
      app.metrics?.advisorLatencyMs?.observe({ risk: 'error' }, latency);
      
      app.log.error('Advisor suggest error:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check for advisor service
  app.get('/api/advisor/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'advisor-suggest',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
}
