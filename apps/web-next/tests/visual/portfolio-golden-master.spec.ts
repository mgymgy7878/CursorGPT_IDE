import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003';

test.use({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

test.describe('Portfolio Golden Master', () => {
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

  test('portfolio - default state', async ({ page }) => {
    await page.goto(`${BASE_URL}/portfolio`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('portfolio-default.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('portfolio - loading state', async ({ page }) => {
    await page.goto(`${BASE_URL}/portfolio?state=loading`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('portfolio-loading.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('portfolio - empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/portfolio?state=empty`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('portfolio-empty.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

