// services/executor/src/routes/copilot.ts
import type { FastifyInstance } from 'fastify';

interface Action {
  action: string;
  params?: any;
  dryRun?: boolean;
  confirm_required?: boolean;
  reason?: string;
}

interface ChatRequest {
  prompt: string;
  history?: any[];
}

/**
 * Copilot AI routes
 * Simple rule-based action generation (MVP)
 * Future: LLM integration for advanced NLP
 */
export async function copilotRoutes(app: FastifyInstance) {
  /**
   * Chat endpoint - converts natural language to action JSON
   */
  app.post<{ Body: ChatRequest }>(
    '/ai/chat',
    async (request, reply) => {
      const { prompt } = request.body;
      
      if (!prompt || !prompt.trim()) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Prompt is required',
        });
      }

      app.log.info({ prompt }, 'Copilot chat request');

      // Simple rule-based mapping (MVP)
      const p = prompt.toLowerCase();
      let action: Action;

      // WebSocket başlatma
      if ((p.includes('ws') || p.includes('websocket')) && p.includes('başlat')) {
        action = {
          action: '/futures/ws.start',
          params: { symbols: ['BTCUSDT', 'ETHUSDT'] },
          dryRun: true,
          confirm_required: false,
          reason: 'WebSocket market + userData streams başlat',
        };
      }
      // Dry-run / simülasyon
      else if (p.includes('dry') || p.includes('simülasyon') || p.includes('dene')) {
        action = {
          action: '/futures/order.place',
          params: {
            symbol: 'BTCUSDT',
            side: 'BUY',
            type: 'MARKET',
            quantity: 0.001,
            dryRun: true,
          },
          dryRun: true,
          confirm_required: false,
          reason: 'Güvenli emir simülasyonu',
        };
      }
      // Canary confirm
      else if (p.includes('canary') && (p.includes('onay') || p.includes('confirm') || p.includes('uygula'))) {
        action = {
          action: '/canary/confirm',
          params: { scope: 'futures-testnet' },
          dryRun: false,
          confirm_required: true,
          reason: 'Canary testnet uygulaması (onaylı)',
        };
      }
      // Canary run
      else if (p.includes('canary')) {
        action = {
          action: '/canary/run',
          params: {
            scope: 'futures-testnet',
            symbol: 'BTCUSDT',
            side: 'BUY',
            quantity: 0.001,
          },
          dryRun: true,
          confirm_required: false,
          reason: 'Canary dry-run simülasyonu',
        };
      }
      // Portfolio özeti
      else if (p.includes('portföy') || p.includes('portfolio')) {
        action = {
          action: '/api/portfolio',
          params: {},
          dryRun: true,
          confirm_required: false,
          reason: 'Portföy verilerini getir',
        };
      }
      // Futures risk durumu
      else if (p.includes('risk') || p.includes('limit')) {
        action = {
          action: '/futures/risk/status',
          params: {},
          dryRun: true,
          confirm_required: false,
          reason: 'Risk gate durumunu kontrol et',
        };
      }
      // Açık pozisyonlar
      else if (p.includes('pozisyon') || p.includes('position')) {
        action = {
          action: '/futures/positions',
          params: {},
          dryRun: true,
          confirm_required: false,
          reason: 'Açık pozisyonları listele',
        };
      }
      // Açık emirler
      else if (p.includes('emir') || p.includes('order')) {
        action = {
          action: '/futures/openOrders',
          params: {},
          dryRun: true,
          confirm_required: false,
          reason: 'Açık emirleri listele',
        };
      }
      // Metrics kontrol
      else if (p.includes('metric') || p.includes('performans') || p.includes('durum')) {
        action = {
          action: '/metrics',
          params: {},
          dryRun: true,
          confirm_required: false,
          reason: 'Sistem metriklerini kontrol et',
        };
      }
      // Default: metrics check
      else {
        action = {
          action: '/health',
          params: {},
          dryRun: true,
          confirm_required: false,
          reason: 'Sistem sağlık kontrolü',
        };
      }

      return reply.send({
        ok: true,
        action,
        prompt,
        timestamp: new Date().toISOString(),
      });
    }
  );

  /**
   * Generate strategy from natural language prompt
   * Returns strategy skeleton for review
   */
  app.post<{ Body: { prompt: string } }>(
    '/ai/generate-strategy',
    async (request, reply) => {
      const { prompt } = request.body;

      if (!prompt || !prompt.trim()) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Prompt is required',
        });
      }

      app.log.info({ prompt }, 'Strategy generation request');

      // Simple pattern matching (MVP)
      const p = prompt.toLowerCase();
      
      // Extract symbol (default BTC/USDT)
      let pair = 'BTCUSDT';
      if (p.includes('eth')) pair = 'ETHUSDT';
      else if (p.includes('sol')) pair = 'SOLUSDT';

      // Extract timeframe
      let timeframe = '1h';
      if (p.includes('15m') || p.includes('15 dakika')) timeframe = '15m';
      else if (p.includes('30m') || p.includes('30 dakika')) timeframe = '30m';
      else if (p.includes('4h') || p.includes('4 saat')) timeframe = '4h';
      else if (p.includes('1d') || p.includes('günlük')) timeframe = '1d';

      // Detect indicators
      const indicators: string[] = [];
      if (p.includes('rsi')) indicators.push('RSI');
      if (p.includes('macd')) indicators.push('MACD');
      if (p.includes('ema') || p.includes('üstel')) indicators.push('EMA');
      if (p.includes('bollinger') || p.includes('bb')) indicators.push('Bollinger Bands');
      if (p.includes('volume')) indicators.push('Volume');

      // Default indicators if none specified
      if (indicators.length === 0) {
        indicators.push('RSI', 'MACD');
      }

      // Generate strategy name
      const strategyName = `${pair}_${timeframe}_${indicators.join('_')}`;

      // Generate conditions based on indicators
      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (indicators.includes('RSI')) {
        conditions.push('RSI < 30 → BUY signal');
        conditions.push('RSI > 70 → SELL signal');
        params.rsiPeriod = 14;
        params.rsiBuyThreshold = 30;
        params.rsiSellThreshold = 70;
      }

      if (indicators.includes('MACD')) {
        conditions.push('MACD histogram > 0 → Bullish');
        conditions.push('MACD line crosses signal line → Signal');
        params.macdFast = 12;
        params.macdSlow = 26;
        params.macdSignal = 9;
      }

      if (indicators.includes('EMA')) {
        conditions.push('Price > EMA(21) → Uptrend');
        conditions.push('EMA(9) crosses EMA(21) → Trend change');
        params.emaFast = 9;
        params.emaSlow = 21;
      }

      if (indicators.includes('Bollinger Bands')) {
        conditions.push('Price < Lower Band → Oversold');
        conditions.push('Price > Upper Band → Overbought');
        params.bbPeriod = 20;
        params.bbStdDev = 2;
      }

      const strategy = {
        name: strategyName,
        pair,
        timeframe,
        indicators,
        conditions,
        params,
        type: p.includes('momentum') ? 'momentum' 
            : p.includes('trend') ? 'trend'
            : p.includes('reversion') || p.includes('mean') ? 'mean-reversion'
            : 'momentum',
      };

      return reply.send({
        ok: true,
        strategy,
        prompt,
        timestamp: new Date().toISOString(),
      });
    }
  );

  app.log.info('✅ Copilot AI routes registered');
}
