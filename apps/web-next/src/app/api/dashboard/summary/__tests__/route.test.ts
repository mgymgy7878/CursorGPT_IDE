/**
 * Dashboard Summary API Route Integration Tests
 *
 * Tests partial failure scenarios and ensures UI never crashes
 *
 * @jest-environment node
 */

// Mock fetch
global.fetch = jest.fn();

async function loadGet() {
  jest.resetModules();
  const mod = await import('../route');
  return mod.GET;
}

describe('Dashboard Summary API - Partial Failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('all sources fail → returns degraded summary', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const GET = await loadGet();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.system).toBeDefined();
    expect(data.market).toBeDefined();
    expect(data._meta?.sources.system).toBe('live');
    expect(data._meta?.dataQuality?.market).toBe('seed');
  });

  test('only Binance fails → market degraded, others live', async () => {
    // Mock /api/live/status success
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/live/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { ok: true },
            feed: { ok: true, stalenessSec: 2 },
            executor: { ok: true, latencyMs: 15 },
            metrics: { p95Ms: 12 },
          }),
        });
      }
      // Binance fails
      if (url.includes('api.binance.com')) {
        return Promise.reject(new Error('Binance timeout'));
      }
      // Portfolio/Strategies/Risk fail
      return Promise.reject(new Error('Service unavailable'));
    });

    const GET = await loadGet();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.system.executor.ok).toBe(true);
    expect(data.market.symbols.every((s: any) => s.price === null)).toBe(true);
    expect(data._meta?.dataQuality?.market).toBe('seed');
    expect(data.portfolio).toBeNull();
    expect(data.strategies).toBeDefined();
    expect(data.strategies?.dataQuality).toBe('seed');
    expect(data.strategies?.sourceHealth).toBe('error');
    expect(data.strategies?.top).toEqual([]);
    expect(data.risk).toBeNull();
  });

  test('partial success → returns mixed live/fallback', async () => {
    // Mock /api/live/status success
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/live/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { ok: true },
            feed: { ok: true },
            executor: { ok: true, latencyMs: 10 },
            metrics: { p95Ms: 8 },
          }),
        });
      }
      // Binance success
      if (url.includes('api.binance.com') && url.includes('BTCUSDT')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            lastPrice: '42150.00',
            priceChangePercent: '1.20',
          }),
        });
      }
      // Other symbols fail
      if (url.includes('api.binance.com')) {
        return Promise.reject(new Error('Timeout'));
      }
      // Portfolio success
      if (url.includes('/api/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            accounts: [{
              exchange: 'binance',
              currency: 'USD',
              totals: { totalUsd: 124592 },
            }],
          }),
        });
      }
      // Strategies/Risk fail
      return Promise.reject(new Error('Service unavailable'));
    });

    const GET = await loadGet();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.system.executor.ok).toBe(true);
    expect(data.market.symbols[0].price).toBeGreaterThan(0); // BTCUSDT has price
    expect(data.market.symbols[1].price).toBeNull(); // ETHUSDT failed
    expect(data.portfolio?.totalAsset).toBe(124592);
    expect(data.strategies).toBeDefined();
    expect(data.strategies?.dataQuality).toBe('seed');
    expect(data.strategies?.sourceHealth).toBe('error');
    expect(data.strategies?.top).toEqual([]);
    expect(data.risk).toBeNull();
    expect(data._meta?.sources.system).toBe('live');
    expect(data._meta?.sources.portfolio).toBe('live');
    expect(data._meta?.sources.strategies).toBe('fallback');
  });

  test('strategies endpoint success → returns top 3 strategies', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/live/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { ok: true },
            feed: { ok: true },
            executor: { ok: true, latencyMs: 10 },
            metrics: { p95Ms: 8 },
          }),
        });
      }
      // Binance fails
      if (url.includes('api.binance.com')) {
        return Promise.reject(new Error('Timeout'));
      }
      // Portfolio fails
      if (url.includes('/api/portfolio')) {
        return Promise.reject(new Error('Service unavailable'));
      }
      // Strategies success
      if (url.includes('/api/strategies') || url.includes('/advisor/strategies/list')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            strategies: [
              { name: 'BTC Mean Rev', market: 'Crypto', status: 'running', pnl24hUsd: 450 },
              { name: 'Gold Trend', market: 'Commodities', status: 'running', pnl24hUsd: 1200 },
              { name: 'ETH Scalp', market: 'Crypto', status: 'running', pnl24hUsd: -120 },
              { name: 'SOL Swing', market: 'Crypto', status: 'paused', pnl24hUsd: 50 },
            ],
          }),
        });
      }
      // Risk fails
      return Promise.reject(new Error('Service unavailable'));
    });

    const GET = await loadGet();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.strategies).toBeDefined();
    expect(data.strategies?.active).toBe(3); // 3 running
    expect(data.strategies?.paused).toBe(1); // 1 paused
    expect(data.strategies?.top).toHaveLength(3);
    expect(data.strategies?.top[0].name).toBe('Gold Trend'); // Highest PnL
    expect(data.strategies?.top[1].name).toBe('BTC Mean Rev');
    expect(data.strategies?.top[2].name).toBe('SOL Swing'); // Only 3 with PnL (ETH Scalp negative, but still included)
    expect(data.strategies?.dataQuality).toBe('live');
    expect(data.strategies?.sourceHealth).toBe('ok');
    expect(data._meta?.dataQuality?.strategies).toBe('live');
  });

  test('strategies endpoint timeout → returns degraded with seed data', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/live/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { ok: true },
            feed: { ok: true },
            executor: { ok: true, latencyMs: 10 },
            metrics: { p95Ms: 8 },
          }),
        });
      }
      // Binance fails
      if (url.includes('api.binance.com')) {
        return Promise.reject(new Error('Timeout'));
      }
      // Portfolio fails
      if (url.includes('/api/portfolio')) {
        return Promise.reject(new Error('Service unavailable'));
      }
      // Strategies timeout
      if (url.includes('/api/strategies') || url.includes('/advisor/strategies/list')) {
        return Promise.reject({ name: 'AbortError' }); // Simulate timeout
      }
      // Risk fails
      return Promise.reject(new Error('Service unavailable'));
    });

    const GET = await loadGet();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.strategies).toBeDefined(); // Timeout → seed data (degraded)
    expect(data.strategies?.dataQuality).toBe('seed');
    expect(data.strategies?.sourceHealth).not.toBe('ok');
    expect(data.strategies?.top).toEqual([]);
    expect(data._meta?.sources.strategies).toBe('fallback');
  });

  test('ai decisions success → returns live decisions', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/live/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { ok: true },
            feed: { ok: true },
            executor: { ok: true, latencyMs: 10 },
            metrics: { p95Ms: 8 },
          }),
        });
      }
      if (url.includes('/api/audit/list')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              { action: 'BUY', details: 'BUY BTCUSDT', confidence: 98, timestamp: Date.now() },
              { action: 'SELL', details: 'SELL ETHUSDT', confidence: 72, timestamp: Date.now() - 1000 },
            ],
          }),
        });
      }
      return Promise.reject(new Error('Service unavailable'));
    });

    const GET = await loadGet();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiDecisions).toBeDefined();
    expect(data.aiDecisions?.dataQuality).toBe('live');
    expect(data.aiDecisions?.sourceHealth).toBe('ok');
    expect(data.aiDecisions?.recent.length).toBeGreaterThan(0);
    expect(data._meta?.dataQuality?.aiDecisions).toBe('live');
  });

  test('ai decisions timeout → seed + empty list', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/live/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { ok: true },
            feed: { ok: true },
            executor: { ok: true, latencyMs: 10 },
            metrics: { p95Ms: 8 },
          }),
        });
      }
      if (url.includes('/api/audit/list')) {
        return Promise.reject({ name: 'AbortError' });
      }
      return Promise.reject(new Error('Service unavailable'));
    });

    const GET = await loadGet();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiDecisions).toBeDefined();
    expect(data.aiDecisions?.dataQuality).toBe('seed');
    expect(data.aiDecisions?.recent).toEqual([]);
  });
});
