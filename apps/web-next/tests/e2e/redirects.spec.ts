import { test, expect } from '@playwright/test';

test('legacy redirects → 308', async ({ request }) => {
  const r1 = await request.head('/home', { maxRedirects: 0 });
  expect(r1.status()).toBe(308);
  expect((r1.headers()['location'] || '').includes('/dashboard')).toBeTruthy();

  const r2 = await request.head('/backtest-lab', { maxRedirects: 0 });
  expect(r2.status()).toBe(308);
  expect((r2.headers()['location'] || '').includes('/backtest')).toBeTruthy();
});

