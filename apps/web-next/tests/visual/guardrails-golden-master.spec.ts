import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003';

test.use({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

test.describe('Guardrails Golden Master', () => {
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

  test('guardrails - default state', async ({ page }) => {
    await page.goto(`${BASE_URL}/guardrails`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('guardrails-default.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('guardrails - loading state', async ({ page }) => {
    await page.goto(`${BASE_URL}/guardrails`);
    await page.waitForLoadState('networkidle');
    // Wait for any loading indicators
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('guardrails-loading.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

