import { test, expect } from '@playwright/test';

test('home renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:3003/');
  await expect(page).toHaveTitle(/Spark|Anasayfa/i);
});

test('active strategies page', async ({ page }) => {
  await page.goto('http://127.0.0.1:3003/active-strategies');
  await expect(page.locator('text=Start').first()).toBeVisible();
});

test('settings connectivity test visible', async ({ page }) => {
  await page.goto('http://127.0.0.1:3003/settings');
  await expect(page.locator('text=Test Binance Connection')).toBeVisible();
});


