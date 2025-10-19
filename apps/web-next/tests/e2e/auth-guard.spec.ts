import { test, expect } from '@playwright/test';

function fakeJwt(roles: string[] = ['user']) {
  const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const p = Buffer.from(JSON.stringify({ sub: 'u1', roles, iat: now, exp: now + 3600 })).toString('base64url');
  return `${h}.${p}.x`;
}

test.describe('Auth Guard', () => {
  test('login-yok → /login redirect', async ({ request }) => {
    const res = await request.get('/strategies', { maxRedirects: 0 });
    const s = res.status();
    const h = res.headers();
    const loc = (h['location'] ?? h['Location'] ?? '');
    console.log('[login-yok] status=%s location=%s', s, loc);
    expect([301,302,303,307,308]).toContain(s);
    expect(loc).toMatch(/\/login(?:$|\?)/);
  });

  test('login-var (user) → /strategies 200', async ({ context, page }) => {
    await context.addCookies([{ name: 'spark_session', value: fakeJwt(['user']), domain: 'localhost', path: '/' }]);
    const res = await page.request.get('/strategies', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('role-yetersiz (user) → 403 ya da redirect', async ({ context, request }) => {
    await context.addCookies([{ name: 'spark_session', value: fakeJwt(['user']), domain: 'localhost', path: '/' }]);
    const res = await request.get('/reports/verify', { maxRedirects: 0 });
    const s = res.status();
    const h = res.headers();
    const loc = (h['location'] ?? h['Location'] ?? '');
    console.log('[role-yetersiz] status=%s location=%s', s, loc);
    if (s === 403) {
      expect(s).toBe(403);
    } else {
      expect([301,302,303,307,308]).toContain(s);
      expect(loc && loc.length).toBeGreaterThan(0);
    }
  });
});

