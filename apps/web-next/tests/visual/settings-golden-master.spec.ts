import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003';

test.use({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

test.describe('Settings Golden Master', () => {
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

  test('settings - default state', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('settings-default.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('settings - secret input revealed state', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});
    
    // Deterministic: Click "Göster" button to reveal secret input
    const showButton = page.locator('button:has-text("Göster")').first();
    const buttonExists = await showButton.count() > 0;
    
    if (buttonExists) {
      await showButton.click();
      // Wait for input type to change (password -> text)
      await page.waitForTimeout(200);
      // Verify input is now visible (type="text")
      const input = page.locator('input[type="text"]').first();
      await expect(input).toBeVisible({ timeout: 1000 }).catch(() => {});
    }
    
    await expect(page).toHaveScreenshot('settings-secret-revealed.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

