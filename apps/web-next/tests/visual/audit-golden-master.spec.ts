import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003';

test.use({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

test.describe('Audit Golden Master', () => {
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

  test('audit - default state', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('audit-default.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('audit - filter bar dark theme', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);
    await page.waitForLoadState('networkidle');
    // Verify filter inputs are dark theme (not white)
    const inputBg = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      return input ? window.getComputedStyle(input).backgroundColor : null;
    });
    expect(inputBg).not.toContain('255, 255, 255'); // Not white
    await expect(page).toHaveScreenshot('audit-filters.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

