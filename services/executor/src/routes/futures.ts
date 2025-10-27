// services/executor/src/routes/futures.ts
import type { FastifyInstance } from 'fastify';
import { BinanceFutures, FuturesOrderRequest } from '../connectors/binance-futures.js';
import { BinanceFuturesWS } from '../connectors/binance-futures-ws.js';
import {
  recordFuturesOrder,
  updatePositionMetrics,
  updateAccountMetrics,
  futuresOrderLatency,
} from '../metrics/futures.js';
import { futuresWsMetrics } from '../metrics/futures-ws.js';

/**
 * Futures trading routes
 * Provides REST API for Binance Futures operations
 */
export async function futuresRoutes(app: FastifyInstance) {
  // Initialize Binance Futures connector
  const futures = new BinanceFutures(
    process.env.BINANCE_API_KEY,
    process.env.BINANCE_API_SECRET,
    process.env.BINANCE_TESTNET !== '0' // Default testnet
  );

  // Initialize WebSocket connector
  const ws = new BinanceFuturesWS(
    process.env.BINANCE_API_KEY,
    process.env.BINANCE_TESTNET !== '0'
  );

  // Health check for futures connector
  app.get('/futures/health', async () => {
    try {
      const { serverTime } = await futures.serverTime();
      return {
        status: 'ok',
        testnet: process.env.BINANCE_TESTNET !== '0',
        serverTime,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        status: 'error',
        error: err.message,
        timestamp: Date.now(),
      };
    }
  });

  // Get account information
  app.get('/futures/account', async (_request, reply) => {
    try {
      const account = await futures.getAccount();
      updateAccountMetrics(account);
      return reply.send(account);
    } catch (err: any) {
      app.log.error({ err }, 'Futures account fetch error');
      return reply.code(500).send({
        error: 'AccountFetchError',
        message: err.message,
      });
    }
  });

  // Get all positions
  app.get<{ Querystring: { symbol?: string } }>(
    '/futures/positions',
    async (request, reply) => {
      try {
        const { symbol } = request.query;
        const positions = await futures.getPositions(symbol);
        updatePositionMetrics(positions);
        return reply.send(positions);
      } catch (err: any) {
        app.log.error({ err }, 'Futures positions fetch error');
        return reply.code(500).send({
          error: 'PositionsFetchError',
          message: err.message,
        });
      }
    }
  );

  // Get open orders
  app.get<{ Querystring: { symbol?: string } }>(
    '/futures/openOrders',
    async (request, reply) => {
      try {
        const { symbol } = request.query;
        const orders = await futures.getOpenOrders(symbol);
        return reply.send(orders);
      } catch (err: any) {
        app.log.error({ err }, 'Futures open orders fetch error');
        return reply.code(500).send({
          error: 'OpenOrdersFetchError',
          message: err.message,
        });
      }
    }
  );

  // Place order
  app.post<{ Body: FuturesOrderRequest }>(
    '/futures/order.place',
    async (request, reply) => {
      const startTime = Date.now();
      const orderReq = request.body;

      try {
        // Validate request
        if (!orderReq.symbol || !orderReq.side || !orderReq.type || !orderReq.quantity) {
          return reply.code(400).send({
            error: 'ValidationError',
            message: 'Missing required fields: symbol, side, type, quantity',
          });
        }

        // Place order
        const result = await futures.placeOrder(orderReq);

        // Record metrics
        recordFuturesOrder(
          orderReq.symbol,
          orderReq.side,
          orderReq.type,
          startTime,
          true
        );

        app.log.info({
          symbol: orderReq.symbol,
          side: orderReq.side,
          type: orderReq.type,
          quantity: orderReq.quantity,
          dryRun: orderReq.dryRun !== false,
          duration: Date.now() - startTime,
        }, 'Futures order placed');

        return reply.send(result);
      } catch (err: any) {
        app.log.error({ err, orderReq }, 'Futures order placement error');
        
        // Record failure metrics
        recordFuturesOrder(
          orderReq.symbol,
          orderReq.side,
          orderReq.type,
          startTime,
          false,
          err
        );

        return reply.code(500).send({
          error: 'OrderPlacementError',
          message: err.message,
          code: err.code,
        });
      }
    }
  );

  // Cancel order
  app.post<{ Body: { symbol: string; orderId: number } }>(
    '/futures/order.cancel',
    async (request, reply) => {
      try {
        const { symbol, orderId } = request.body;

        if (!symbol || !orderId) {
          return reply.code(400).send({
            error: 'ValidationError',
            message: 'Missing required fields: symbol, orderId',
          });
        }

        const result = await futures.cancelOrder(symbol, orderId);
        
        app.log.info({ symbol, orderId }, 'Futures order cancelled');
        
        return reply.send(result);
      } catch (err: any) {
        app.log.error({ err }, 'Futures order cancellation error');
        return reply.code(500).send({
          error: 'OrderCancellationError',
          message: err.message,
        });
      }
    }
  );

  // Cancel all orders for a symbol
  app.post<{ Body: { symbol: string } }>(
    '/futures/order.cancelAll',
    async (request, reply) => {
      try {
        const { symbol } = request.body;

        if (!symbol) {
          return reply.code(400).send({
            error: 'ValidationError',
            message: 'Missing required field: symbol',
          });
        }

        const result = await futures.cancelAllOrders(symbol);
        
        app.log.info({ symbol }, 'All futures orders cancelled');
        
        return reply.send(result);
      } catch (err: any) {
        app.log.error({ err }, 'Futures cancel all orders error');
        return reply.code(500).send({
          error: 'CancelAllOrdersError',
          message: err.message,
        });
      }
    }
  );

  // Get order status
  app.get<{ Querystring: { symbol: string; orderId: number } }>(
    '/futures/order',
    async (request, reply) => {
      try {
        const { symbol, orderId } = request.query;

        if (!symbol || !orderId) {
          return reply.code(400).send({
            error: 'ValidationError',
            message: 'Missing required fields: symbol, orderId',
          });
        }

        const order = await futures.getOrder(symbol, orderId);
        return reply.send(order);
      } catch (err: any) {
        app.log.error({ err }, 'Futures order fetch error');
        return reply.code(500).send({
          error: 'OrderFetchError',
          message: err.message,
        });
      }
    }
  );

  // Change leverage
  app.post<{ Body: { symbol: string; leverage: number } }>(
    '/futures/leverage',
    async (request, reply) => {
      try {
        const { symbol, leverage } = request.body;

        if (!symbol || !leverage) {
          return reply.code(400).send({
            error: 'ValidationError',
            message: 'Missing required fields: symbol, leverage',
          });
        }

        const result = await futures.changeLeverage(symbol, leverage);
        
        app.log.info({ symbol, leverage }, 'Futures leverage changed');
        
        return reply.send(result);
      } catch (err: any) {
        app.log.error({ err }, 'Futures leverage change error');
        return reply.code(500).send({
          error: 'LeverageChangeError',
          message: err.message,
        });
      }
    }
  );

  // Change margin type
  app.post<{ Body: { symbol: string; marginType: 'ISOLATED' | 'CROSSED' } }>(
    '/futures/marginType',
    async (request, reply) => {
      try {
        const { symbol, marginType } = request.body;

        if (!symbol || !marginType) {
          return reply.code(400).send({
            error: 'ValidationError',
            message: 'Missing required fields: symbol, marginType',
          });
        }

        const result = await futures.changeMarginType(symbol, marginType);
        
        app.log.info({ symbol, marginType }, 'Futures margin type changed');
        
        return reply.send(result);
      } catch (err: any) {
        app.log.error({ err }, 'Futures margin type change error');
        return reply.code(500).send({
          error: 'MarginTypeChangeError',
          message: err.message,
        });
      }
    }
  );

  // WebSocket management endpoints
  app.post<{ Body: { symbols?: string[] } }>(
    '/futures/ws.start',
    async (request, reply) => {
      try {
        const symbols = request.body.symbols?.length
          ? request.body.symbols
          : ['BTCUSDT', 'ETHUSDT'];

        app.log.info({ symbols }, 'Starting Futures WebSocket streams');

        // Connect to market data streams
        await ws.connectMarketStreams(symbols, (msg) => {
          futuresWsMetrics.messages.inc({ stream_type: 'market', message_type: msg.e || 'unknown' });
          app.log.debug({ src: 'market', event: msg.e }, 'Market data received');
        });

        // Connect to user data stream
        await ws.connectUserData((msg) => {
          futuresWsMetrics.messages.inc({ stream_type: 'userData', message_type: msg.e || 'unknown' });
          app.log.info({ src: 'userData', event: msg.e }, 'User data received');
        });

        futuresWsMetrics.connectionStatus.set({ stream_type: 'market' }, 1);
        futuresWsMetrics.connectionStatus.set({ stream_type: 'userData' }, 1);

        return reply.send({
          ok: true,
          symbols,
          streams: ['market', 'userData'],
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        app.log.error({ err }, 'Failed to start Futures WebSocket');
        return reply.code(500).send({
          error: 'WebSocketStartError',
          message: err.message,
        });
      }
    }
  );

  app.post('/futures/ws.stop', async (_request, reply) => {
    try {
      app.log.info('Stopping Futures WebSocket streams');
      ws.stop();

      futuresWsMetrics.connectionStatus.set({ stream_type: 'market' }, 0);
      futuresWsMetrics.connectionStatus.set({ stream_type: 'userData' }, 0);

      return reply.send({
        ok: true,
        message: 'WebSocket streams stopped',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      app.log.error({ err }, 'Failed to stop Futures WebSocket');
      return reply.code(500).send({
        error: 'WebSocketStopError',
        message: err.message,
      });
    }
  });

  app.log.info('✅ Futures routes registered');
}
