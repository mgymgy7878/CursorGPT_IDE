import { FastifyInstance } from 'fastify';
import { measurePlaceAck, isDryRunMode, isKillSwitchActive } from '../metrics/placeAck';
import { BTCTurkRestClient } from '@spark/exchange-btcturk';
import { recordBtcturkError, recordBtcturkRequest, recordBtcturkDuration } from '../metrics/btcturk';
import { isBistOpen } from '../bistSession';

export async function placeRoutes(fastify: FastifyInstance) {
  // Dev/live gate for BTCTurk
  const live = String(process.env.BTCTURK_ENABLE_LIVE || 'false') === 'true';

  // Initialize BTCTurk client (or no-op in dev)
  const btcturkClient = live
    ? new BTCTurkRestClient(
        process.env.BTCTURK_API_KEY || 'mock-key',
        process.env.BTCTURK_API_SECRET || 'mock-secret'
      )
    : null as any;

  // Initialize client (check clock drift)
  if (live) {
    try {
      await btcturkClient.initialize?.();
    } catch (error) {
      fastify.log.warn('Failed to initialize BTCTurk client:', error);
    }
  }

  fastify.post('/place', async (req, reply) => {
    const startTime = Date.now();
    
    try {
      // Kill-switch check
      if (isKillSwitchActive()) {
        return reply.status(503).send({
          error: 'Trading disabled',
          reason: 'Kill-switch active'
        });
      }

      const { symbol, side, qty, price } = req.body as {
        symbol: string;
        side: 'buy' | 'sell';
        qty: number;
        price?: number;
      };

      // BIST session check for BIST symbols
      if (symbol.includes('TRY') && !isBistOpen(new Date().toISOString())) {
        recordBtcturkError('session_violation', 'place');
        return reply.status(403).send({
          error: 'Market closed',
          reason: 'BIST session is not open',
          symbol,
          nextOpen: '10:00 TR time'
        });
      }

      const route = 'spot.limit';
      
      const result = await measurePlaceAck(
        { exchange: 'btcturk', symbol, route },
        async () => {
          if (!live) {
            // Dev: no-op
            return { ok: true, id: 'dev-noop', dryRun: true, timestamp: Date.now() } as const;
          }
          // Live: place real order
          const orderResult = await btcturkClient.placeOrder({
            symbol,
            side,
            type: 'limit',
            quantity: qty,
            price: price || 0
          });

          return {
            ok: true,
            id: orderResult.data?.id || 'unknown',
            dryRun: isDryRunMode(),
            timestamp: Date.now()
          };
        }
      );

      // Record successful request
      recordBtcturkRequest('place', 'POST', '200');
      recordBtcturkDuration('place', 'POST', (Date.now() - startTime) / 1000);

      reply.send(result);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      // Classify error and record metrics
      let errorType = 'unknown';
      let status = '500';
      
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          errorType = 'rate_limit';
          status = '429';
        } else if (error.message.includes('invalid_nonce')) {
          errorType = 'invalid_nonce';
          status = '401';
        } else if (error.message.includes('server_error')) {
          errorType = 'server_error';
          status = '500';
        }
      }
      
      recordBtcturkError(errorType, 'place');
      recordBtcturkRequest('place', 'POST', status);
      recordBtcturkDuration('place', 'POST', duration);
      
      fastify.log.error('Place order error:', error);
      reply.status(500).send({
        error: 'Order placement failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType,
        duration
      });
    }
  });

  // BTCTurk balances endpoint for smoke testing
  fastify.get('/btcturk/balances', async (req, reply) => {
    const startTime = Date.now();
    
    try {
      const balances = live ? await btcturkClient.getBalances() : [];
      
      recordBtcturkRequest('balances', 'GET', '200');
      recordBtcturkDuration('balances', 'GET', (Date.now() - startTime) / 1000);
      
      reply.send({
        success: true,
        data: balances,
        timestamp: Date.now()
      });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      let errorType = 'unknown';
      let status = '500';
      
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          errorType = 'rate_limit';
          status = '429';
        } else if (error.message.includes('invalid_nonce')) {
          errorType = 'invalid_nonce';
          status = '401';
        }
      }
      
      recordBtcturkError(errorType, 'balances');
      recordBtcturkRequest('balances', 'GET', status);
      recordBtcturkDuration('balances', 'GET', duration);
      
      fastify.log.error('Get balances error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get balances',
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType
      });
    }
  });

  // BTCTurk open orders endpoint
  fastify.get('/btcturk/orders', async (req, reply) => {
    const startTime = Date.now();
    const { pairSymbol } = req.query as { pairSymbol?: string };
    
    try {
      const orders = live ? await btcturkClient.getOpenOrders(pairSymbol) : [];
      
      recordBtcturkRequest('openOrders', 'GET', '200');
      recordBtcturkDuration('openOrders', 'GET', (Date.now() - startTime) / 1000);
      
      reply.send({
        success: true,
        data: orders,
        timestamp: Date.now()
      });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      let errorType = 'unknown';
      let status = '500';
      
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          errorType = 'rate_limit';
          status = '429';
        } else if (error.message.includes('invalid_nonce')) {
          errorType = 'invalid_nonce';
          status = '401';
        }
      }
      
      recordBtcturkError(errorType, 'openOrders');
      recordBtcturkRequest('openOrders', 'GET', status);
      recordBtcturkDuration('openOrders', 'GET', duration);
      
      fastify.log.error('Get open orders error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get open orders',
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType
      });
    }
  });

  fastify.get('/place/status/:orderId', async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string };
      
      const orderStatus = await btcturkClient.getOrder(orderId);
      
      reply.send({
        orderId,
        status: orderStatus.data?.status || 'unknown',
        timestamp: Date.now()
      });
    } catch (error) {
      fastify.log.error('Get order status error:', error);
      reply.status(500).send({
        error: 'Failed to get order status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  fastify.delete('/place/:orderId', async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string };
      
      const cancelResult = await btcturkClient.cancelOrder(orderId);
      
      reply.send({
        orderId,
        cancelled: true,
        result: cancelResult,
        timestamp: Date.now()
      });
    } catch (error) {
      fastify.log.error('Cancel order error:', error);
      reply.status(500).send({
        error: 'Failed to cancel order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
