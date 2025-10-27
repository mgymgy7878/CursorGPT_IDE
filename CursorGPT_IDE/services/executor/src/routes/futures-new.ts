import { FastifyInstance } from 'fastify';
import { BinanceFuturesClient, FuturesOrderSchema, FuturesUtils } from '@spark/exchange-binance';

export async function futuresRoutes(fastify: FastifyInstance) {
  // Initialize Binance Futures client
  const futuresClient = new BinanceFuturesClient({
    apiKey: process.env.BINANCE_API_KEY || 'mock-key',
    secretKey: process.env.BINANCE_SECRET_KEY || 'mock-secret',
    testnet: process.env.BINANCE_TESTNET === 'true'
  });

  // Get account information
  fastify.get('/account', async (request, reply) => {
    try {
      const account = await futuresClient.getAccountInfo();
      return { success: true, data: account };
    } catch (error: any) {
      fastify.log.error('Futures account error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Account bilgisi alınamadı'
      });
    }
  });

  // Place order
  fastify.post('/order', async (request, reply) => {
    try {
      const orderData = request.body as any;
      const validatedOrder = FuturesOrderSchema.parse(orderData);
      const isDryRun = request.headers['x-dry-run'] === '1';
      
      if (isDryRun) {
        const mockOrder = {
          orderId: Date.now(),
          symbol: validatedOrder.symbol,
          status: 'NEW',
          dryRun: true
        };
        return { success: true, data: mockOrder };
      }
      
      const order = await futuresClient.placeOrder(validatedOrder);
      return { success: true, data: order };
      
    } catch (error: any) {
      fastify.log.error('Futures order error:', error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Emir gönderilemedi'
      });
    }
  });
}
