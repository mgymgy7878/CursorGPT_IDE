import { BtcturkClient } from './client';

describe('BtcturkClient', () => {
  const mockConfig = {
    apiKey: 'test-key',
    apiSecret: 'test-secret',
    baseURL: 'https://api.btcturk.com',
    sign: jest.fn().mockReturnValue('mock-signature'),
    dryRun: true
  };

  let client: BtcturkClient;

  beforeEach(() => {
    client = new BtcturkClient(mockConfig);
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    it('should place order in dry-run mode', async () => {
      const order = {
        symbol: 'BTCUSDT',
        side: 'buy' as const,
        type: 'limit' as const,
        quantity: 0.1,
        price: 50000
      };

      const result = await client.placeOrder(order);

      expect(result).toEqual({
        success: true,
        data: { id: expect.stringMatching(/^dry-run-/) },
        message: 'Dry-run mode: order not sent to exchange'
      });
    });

    it('should throw error when kill-switch is active', async () => {
      process.env.KILL_SWITCH = 'true';
      
      const order = {
        symbol: 'BTCUSDT',
        side: 'buy' as const,
        type: 'limit' as const,
        quantity: 0.1,
        price: 50000
      };

      await expect(client.placeOrder(order)).rejects.toThrow('Kill-switch active: trading disabled');
      
      delete process.env.KILL_SWITCH;
    });
  });

  describe('getOrder', () => {
    it('should get order status', async () => {
      const orderId = 'test-order-123';
      
      const result = await client.getOrder(orderId);

      expect(result).toEqual({
        success: true,
        data: { id: expect.stringMatching(/^dry-run-/) },
        message: 'Dry-run mode: order not sent to exchange'
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order', async () => {
      const orderId = 'test-order-123';
      
      const result = await client.cancelOrder(orderId);

      expect(result).toEqual({
        success: true,
        data: { id: expect.stringMatching(/^dry-run-/) },
        message: 'Dry-run mode: order not sent to exchange'
      });
    });
  });
});
