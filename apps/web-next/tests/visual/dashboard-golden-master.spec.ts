/**
 * Dashboard Golden Master Test
 *
 * Tasarım drift'ini yakalamak için baseline screenshot'lar alır.
 * PR'da otomatik çalışır; snapshot farkı varsa PR kırmızı.
 *
 * KURAL: Baseline screenshot'ları değiştirmek için --update-snapshots flag'i kullan.
 *
 * Deterministik test için:
 * - Viewport sabit (1440x900)
 * - Dark mode
 * - Animasyonlar kapalı
 * - Locale/timezone sabit
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003';

// Deterministik test ortamı
test.use({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

test.describe('Dashboard Golden Master', () => {
  test.beforeEach(async ({ page }) => {
    // Animasyonları kapat (deterministik render için)
    await page.addStyleTag({
      content: `
        *,
        *::before,
        *::after {
          animation: none !important;
          transition: none !important;
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('dashboard - loading state', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard?state=loading`);
    await page.waitForLoadState('networkidle');

    // Shell yapısı yüklenene kadar bekle
    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});

    await expect(page).toHaveScreenshot('dashboard-loading.png', {
      fullPage: true,
      maxDiffPixels: 100, // Küçük farklara tolerans
    });
  });

  test('dashboard - empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard?state=empty`);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});

    await expect(page).toHaveScreenshot('dashboard-empty.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('dashboard - error state', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard?state=error`);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});

    await expect(page).toHaveScreenshot('dashboard-error.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('dashboard - data state', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard?state=data`);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});

    await expect(page).toHaveScreenshot('dashboard-data.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('dashboard - default (no state param)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});

    await expect(page).toHaveScreenshot('dashboard-default.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

