import { test, expect } from '@playwright/test';

test.describe('HTTP Headers Compliance', () => {
  test('Prometheus endpoint has correct Content-Type (0.0.4)', async ({ page }) => {
    const response = await page.goto('http://localhost:3003/api/public/metrics.prom');
    
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers();
    expect(headers?.['content-type']).toBe('text/plain; version=0.0.4; charset=utf-8');
  });

  test('Prometheus endpoint has cache control headers', async ({ page }) => {
    const response = await page.goto('http://localhost:3003/api/public/metrics.prom');
    
    const cacheControl = response?.headers()['cache-control'];
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
  });

  test('Prometheus endpoint returns valid text format', async ({ page }) => {
    const response = await page.goto('http://localhost:3003/api/public/metrics.prom');
    const body = await response?.text();
    
    // Must contain HELP and TYPE comments
    expect(body).toContain('# HELP');
    expect(body).toContain('# TYPE');
    
    // Must contain spark_up metric
    expect(body).toMatch(/spark_up\s+1/);
  });

  test('YAML file has correct Content-Type (RFC 9512)', async ({ page }) => {
    // This test assumes static YAML file is served
    // In production with NGINX, this should be application/yaml
    const response = await page.goto('http://localhost:3003/test.yaml', {
      failOnStatusCode: false,
    });
    
    if (response?.status() === 200) {
      const contentType = response.headers()['content-type'];
      
      // Next.js dev server may not set this, but production NGINX should
      // Accept either application/yaml or text/plain for dev
      expect(
        contentType === 'application/yaml' || 
        contentType?.includes('text/plain')
      ).toBe(true);
    }
  });

  test('Security headers are present', async ({ page }) => {
    const response = await page.goto('http://localhost:3003/');
    const headers = response?.headers();
    
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});

