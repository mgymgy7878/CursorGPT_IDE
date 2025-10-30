import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('dashboard page loads with heading', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for heading to appear (web-first assertion)
    await expect(page.getByRole('heading', { name: /spark trading/i })).toBeVisible({ timeout: 10000 });
  });

  test('market page loads with heading', async ({ page }) => {
    await page.goto('/market');

    // Wait for heading to appear (web-first assertion)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('alerts page loads with heading', async ({ page }) => {
    await page.goto('/alerts');

    // Wait for heading to appear (web-first assertion)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('portfolio page loads with heading', async ({ page }) => {
    await page.goto('/portfolio');

    // Wait for heading to appear (web-first assertion)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('strategy-lab page loads with heading', async ({ page }) => {
    await page.goto('/strategy-lab');

    // Wait for heading to appear (web-first assertion)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('metrics API responds with 200', async ({ page }) => {
    const response = await page.request.get('/api/public/metrics', { timeout: 10000 });
    expect(response.ok()).toBeTruthy();

    const text = await response.text();
    expect(text).toBeTruthy();
  });

  test('engine-health API responds (optional)', async ({ page }) => {
    const response = await page.request.get('/api/public/engine-health', { timeout: 10000 });
    // Soft assertion - endpoint might not be available
    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeTruthy();
    }
  });

  test('healthz endpoint responds (optional)', async ({ page }) => {
    const response = await page.request.get('/api/healthz', { timeout: 10000 });
    // Soft assertion - endpoint might return 503 if executor is down
    if (response.ok()) {
      const text = await response.text();
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
