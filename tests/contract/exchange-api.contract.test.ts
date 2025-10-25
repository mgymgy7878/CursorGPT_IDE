/**
 * Contract Tests for Exchange APIs
 * Validates that our client code matches the actual API contracts
 */

import { describe, test, expect } from '@jest/globals';
import { Pact, Matchers } from '@pact-foundation/pact';
import path from 'path';

const { like, eachLike, term, iso8601DateTime } = Matchers;

// Pact mock provider
const provider = new Pact({
  consumer: 'SparkTradingPlatform',
  provider: 'BinanceAPI',
  port: 8989,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('Binance API Contract Tests', () => {
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  describe('Ticker Price Endpoint', () => {
    test('should return ticker price for BTCUSDT', async () => {
      // Define expected interaction
      await provider.addInteraction({
        state: 'BTCUSDT ticker exists',
        uponReceiving: 'a request for BTCUSDT ticker',
        withRequest: {
          method: 'GET',
          path: '/api/v3/ticker/price',
          query: {
            symbol: 'BTCUSDT',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            symbol: 'BTCUSDT',
            price: like('43250.50'),
          },
        },
      });

      // Make actual request
      const response = await fetch(
        `${provider.mockService.baseUrl}/api/v3/ticker/price?symbol=BTCUSDT`
      );
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('symbol', 'BTCUSDT');
      expect(data).toHaveProperty('price');
      expect(typeof data.price).toBe('string');
    });
  });

  describe('Account Information Endpoint', () => {
    test('should return account balances', async () => {
      await provider.addInteraction({
        state: 'user account exists',
        uponReceiving: 'a request for account information',
        withRequest: {
          method: 'GET',
          path: '/api/v3/account',
          headers: {
            'X-MBX-APIKEY': like('test-api-key'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            makerCommission: like(10),
            takerCommission: like(10),
            buyerCommission: like(0),
            sellerCommission: like(0),
            canTrade: like(true),
            canWithdraw: like(true),
            canDeposit: like(true),
            updateTime: like(1635340800000),
            accountType: like('SPOT'),
            balances: eachLike({
              asset: like('BTC'),
              free: like('0.00100000'),
              locked: like('0.00000000'),
            }),
            permissions: eachLike(like('SPOT')),
          },
        },
      });

      const response = await fetch(`${provider.mockService.baseUrl}/api/v3/account`, {
        headers: {
          'X-MBX-APIKEY': 'test-api-key',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('balances');
      expect(Array.isArray(data.balances)).toBe(true);
      expect(data.canTrade).toBe(true);
    });
  });

  describe('New Order Endpoint', () => {
    test('should create market order successfully', async () => {
      await provider.addInteraction({
        state: 'user has sufficient balance',
        uponReceiving: 'a market buy order request',
        withRequest: {
          method: 'POST',
          path: '/api/v3/order',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-MBX-APIKEY': like('test-api-key'),
          },
          body: term({
            generate: 'symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001',
            matcher: 'symbol=.*&side=.*&type=.*&quantity=.*',
          }),
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            symbol: 'BTCUSDT',
            orderId: like(123456789),
            orderListId: like(-1),
            clientOrderId: like('test-order-123'),
            transactTime: like(1635340800000),
            price: like('0.00000000'),
            origQty: like('0.00100000'),
            executedQty: like('0.00100000'),
            cummulativeQuoteQty: like('43.25050000'),
            status: like('FILLED'),
            timeInForce: like('GTC'),
            type: like('MARKET'),
            side: like('BUY'),
            fills: eachLike({
              price: like('43250.50'),
              qty: like('0.00100000'),
              commission: like('0.00000100'),
              commissionAsset: like('BTC'),
            }),
          },
        },
      });

      const response = await fetch(`${provider.mockService.baseUrl}/api/v3/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-MBX-APIKEY': 'test-api-key',
        },
        body: 'symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('orderId');
      expect(data).toHaveProperty('status', 'FILLED');
      expect(data.fills).toBeDefined();
      expect(Array.isArray(data.fills)).toBe(true);
    });

    test('should handle insufficient balance error', async () => {
      await provider.addInteraction({
        state: 'user has insufficient balance',
        uponReceiving: 'a market buy order request with insufficient balance',
        withRequest: {
          method: 'POST',
          path: '/api/v3/order',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-MBX-APIKEY': like('test-api-key'),
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            code: like(-2010),
            msg: like('Account has insufficient balance for requested action.'),
          },
        },
      });

      const response = await fetch(`${provider.mockService.baseUrl}/api/v3/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-MBX-APIKEY': 'test-api-key',
        },
        body: 'symbol=BTCUSDT&side=BUY&type=MARKET&quantity=100',
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('code', -2010);
      expect(data).toHaveProperty('msg');
    });
  });

  describe('Rate Limiting', () => {
    test('should handle 429 rate limit response', async () => {
      await provider.addInteraction({
        state: 'rate limit exceeded',
        uponReceiving: 'too many requests',
        withRequest: {
          method: 'GET',
          path: '/api/v3/ticker/price',
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': like('60'),
            'X-MBX-USED-WEIGHT-1M': like('1200'),
          },
          body: {
            code: like(-1003),
            msg: like('Too many requests; current limit is 1200 requests per minute.'),
          },
        },
      });

      const response = await fetch(`${provider.mockService.baseUrl}/api/v3/ticker/price`);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeDefined();
      expect(data).toHaveProperty('code', -1003);
    });
  });
});

describe('BTCTurk API Contract Tests', () => {
  const btcturkProvider = new Pact({
    consumer: 'SparkTradingPlatform',
    provider: 'BTCTurkAPI',
    port: 8990,
    log: path.resolve(process.cwd(), 'logs', 'pact-btcturk.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info',
  });

  beforeAll(() => btcturkProvider.setup());
  afterAll(() => btcturkProvider.finalize());
  afterEach(() => btcturkProvider.verify());

  describe('Ticker Endpoint', () => {
    test('should return all tickers', async () => {
      await btcturkProvider.addInteraction({
        state: 'tickers exist',
        uponReceiving: 'a request for all tickers',
        withRequest: {
          method: 'GET',
          path: '/api/v2/ticker',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike({
              pair: like('BTCTRY'),
              pairNormalized: like('BTC_TRY'),
              timestamp: like(1635340800000),
              last: like(1234567.89),
              high: like(1250000.00),
              low: like(1200000.00),
              bid: like(1234000.00),
              ask: like(1235000.00),
              open: like(1220000.00),
              volume: like(123.456),
              average: like(1225000.00),
              daily: like(12345.67),
              dailyPercent: like(1.01),
              denominatorSymbol: like('TRY'),
              numeratorSymbol: like('BTC'),
              order: like(1000),
            }),
          },
        },
      });

      const response = await fetch(`${btcturkProvider.mockService.baseUrl}/api/v2/ticker`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data[0]).toHaveProperty('pair');
      expect(data.data[0]).toHaveProperty('last');
    });
  });
});
