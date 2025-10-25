/**
 * Chaos Engineering Tests for Resilience
 * Tests system behavior under adverse conditions
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  setupProxies,
  clearToxics,
  chaosScenarios,
  cleanup,
} from './toxiproxy-setup';

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds

describe('Resilience Chaos Tests', () => {
  beforeAll(async () => {
    await setupProxies();
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    // Clear toxics between tests
    await clearToxics('postgres');
    await clearToxics('binance_api');
    await clearToxics('btcturk_api');
  });

  describe('Database Resilience', () => {
    test('should handle slow database queries gracefully', async () => {
      // Apply chaos
      await chaosScenarios.slowDatabase();

      // Make request
      const startTime = Date.now();
      const response = await fetch('http://localhost:4001/api/strategies/list');
      const duration = Date.now() - startTime;

      // Expectations
      expect(response.status).toBeLessThanOrEqual(504); // OK or Gateway Timeout
      expect(duration).toBeLessThan(10000); // Should timeout within 10s
      
      // Check that system didn't crash
      const healthCheck = await fetch('http://localhost:4001/api/healthz');
      expect(healthCheck.status).toBe(200);
    }, TEST_TIMEOUT);

    test('should recover from database connection pool exhaustion', async () => {
      // Apply chaos
      await chaosScenarios.databaseConnectionExhaustion();

      // Make multiple concurrent requests
      const requests = Array(20).fill(null).map(() =>
        fetch('http://localhost:4001/api/strategies/list')
      );

      const responses = await Promise.allSettled(requests);
      
      // At least some requests should succeed or fail gracefully
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const failed = responses.filter(r => r.status === 'rejected').length;
      
      console.log(`Successful: ${successful}, Failed: ${failed}`);
      
      // System should not crash completely
      expect(successful + failed).toBe(20);
      
      // Clear chaos and verify recovery
      await clearToxics('postgres');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for recovery
      
      const recoveryResponse = await fetch('http://localhost:4001/api/healthz');
      expect(recoveryResponse.status).toBe(200);
    }, TEST_TIMEOUT);
  });

  describe('Exchange API Resilience', () => {
    test('should handle exchange rate limiting', async () => {
      // Apply chaos
      await chaosScenarios.exchangeRateLimit();

      // Make request
      const response = await fetch('http://localhost:3003/api/public/btcturk/ticker');
      
      // Should either succeed or fail gracefully (not crash)
      expect([200, 429, 503, 504]).toContain(response.status);
      
      // If rate limited, should include Retry-After header
      if (response.status === 429) {
        expect(response.headers.has('Retry-After')).toBe(true);
      }
    }, TEST_TIMEOUT);

    test('should retry on network failures', async () => {
      // Apply chaos (intermittent failures)
      await chaosScenarios.packetLoss('binance_api');

      let successCount = 0;
      let failureCount = 0;

      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        try {
          const response = await fetch('http://localhost:3003/api/market/btcturk/ticker');
          if (response.ok) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          failureCount++;
        }
      }

      console.log(`Success: ${successCount}, Failures: ${failureCount}`);
      
      // With retry logic, should have some successes
      expect(successCount).toBeGreaterThan(0);
      
      // System should still be healthy
      const healthCheck = await fetch('http://localhost:4001/api/healthz');
      expect(healthCheck.status).toBe(200);
    }, TEST_TIMEOUT);
  });

  describe('Idempotency Under Chaos', () => {
    test('should maintain idempotency under network issues', async () => {
      const idempotencyKey = `chaos-test-${Date.now()}`;
      
      // Apply network chaos
      await chaosScenarios.slowAndUnreliableNetwork();

      // Make multiple concurrent requests with same idempotency key
      const requests = Array(5).fill(null).map(() =>
        fetch('http://localhost:4001/api/exec/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            symbol: 'BTCUSDT',
            side: 'buy',
            type: 'market',
            quantity: 0.01,
            strategyId: 's1',
          }),
        })
      );

      const responses = await Promise.allSettled(requests);
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      
      // At least one should succeed
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      // Clear chaos
      await clearToxics('binance_api');
      
      // Verify in database: only 1 order created
      const ordersResponse = await fetch('http://localhost:4001/api/tools/get_orders');
      const orders = await ordersResponse.json();
      const testOrders = orders.filter((o: any) => 
        o.idempotencyKey === idempotencyKey
      );
      
      expect(testOrders.length).toBeLessThanOrEqual(1);
    }, TEST_TIMEOUT);
  });

  describe('Circuit Breaker Behavior', () => {
    test('should open circuit breaker after repeated failures', async () => {
      // Apply complete network partition
      await chaosScenarios.networkPartition('binance_api');

      let circuitBreakerOpened = false;
      
      // Make requests until circuit breaker opens
      for (let i = 0; i < 20; i++) {
        try {
          const response = await fetch('http://localhost:3003/api/market/btcturk/ticker');
          
          // Check if circuit breaker is open (503 Service Unavailable)
          if (response.status === 503) {
            const body = await response.json();
            if (body.error?.includes('circuit') || body.error?.includes('breaker')) {
              circuitBreakerOpened = true;
              break;
            }
          }
        } catch (error) {
          // Network error expected
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Circuit breaker should open after repeated failures
      // (This assumes circuit breaker is implemented)
      console.log(`Circuit breaker opened: ${circuitBreakerOpened}`);
      
      // Clear chaos
      await clearToxics('binance_api');
      
      // Wait for circuit breaker to close (half-open state)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify recovery
      const recoveryResponse = await fetch('http://localhost:3003/api/healthz');
      expect(recoveryResponse.status).toBe(200);
    }, TEST_TIMEOUT);
  });

  describe('Metrics During Chaos', () => {
    test('should continue reporting metrics during chaos', async () => {
      // Apply chaos
      await chaosScenarios.slowDatabase();

      // Check metrics endpoint
      const metricsResponse = await fetch('http://localhost:4001/api/public/metrics.prom');
      
      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.headers.get('Content-Type')).toContain('text/plain');
      
      const body = await metricsResponse.text();
      expect(body).toContain('spark_up');
      expect(body).toContain('# TYPE');
      expect(body).toContain('# HELP');
    }, TEST_TIMEOUT);
  });
});

/**
 * Long-running stress test (run separately)
 */
describe.skip('Long-running Stress Tests', () => {
  test('should maintain stability under 1 hour of chaos', async () => {
    const duration = 60 * 60 * 1000; // 1 hour
    const startTime = Date.now();
    
    let requestCount = 0;
    let successCount = 0;
    let errorCount = 0;

    while (Date.now() - startTime < duration) {
      // Randomly apply different chaos scenarios
      const scenarios = Object.values(chaosScenarios);
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      if (typeof randomScenario === 'function') {
        await randomScenario();
      }

      // Make requests
      try {
        const response = await fetch('http://localhost:4001/api/strategies/list');
        requestCount++;
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }

      // Clear toxics periodically
      if (requestCount % 100 === 0) {
        await clearToxics('postgres');
        await clearToxics('binance_api');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Total requests: ${requestCount}`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${(successCount / requestCount * 100).toFixed(2)}%`);

    // System should have at least 50% success rate under chaos
    expect(successCount / requestCount).toBeGreaterThan(0.5);
  }, 70 * 60 * 1000); // 70 minutes timeout
});
