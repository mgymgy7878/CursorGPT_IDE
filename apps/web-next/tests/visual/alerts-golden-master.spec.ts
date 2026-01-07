import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003';

test.use({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

test.describe('Alerts Golden Master', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('alerts - default state', async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('alerts-default.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('alerts - table overflow-x check', async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForLoadState('networkidle');
    // Check that horizontal scroll is only in table wrapper, not page level
    const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const pageClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(pageScrollWidth).toBeLessThanOrEqual(pageClientWidth + 10); // Allow small margin
    await expect(page).toHaveScreenshot('alerts-table-overflow.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

