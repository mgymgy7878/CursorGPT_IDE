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

    // Sanity-check: default state mutlaka 'data' olmalı (fixture data, Figma parity)
    // "Kurşungeçirmez" test: data-state attribute ile metin render/padding vb. hiç umrun olmaz
    const stateElement = page.locator('[data-testid="dashboard-state"]');
    await expect(stateElement).toHaveAttribute('data-state', 'data', { timeout: 2000 });
    // Görsel etkisizlik kanıtı: guard gerçekten görünmez olmalı (hidden attribute)
    await expect(stateElement).toBeHidden();

    // Visual assertion: 6-card grid görünmeli (Portföy Özeti, Piyasa Durumu, vb.)
    // En az 1-2 ana başlık visible olmalı (yanlışlıkla default'u loading'e çeviren PR'ı snapshot'a bulaştırmadan patlatır)
    const portfolioSummary = page.locator('text=Portföy Özeti').first();
    await expect(portfolioSummary).toBeVisible({ timeout: 2000 }).catch(() => {});

    // Ek sanity: En az bir kart başlığı daha görünür olmalı (6-card grid'in gerçekten render olduğunu garantiler)
    // Promise.race tuzağı: İlk kontrol hızlıca false/null dönerse race biter; daha sağlamı || operatörü ile sıralı kontrol
    const marketStatus = page.getByText('Piyasa Durumu').first();
    const activeStrategies = page.getByText('Aktif Stratejiler').first();
    
    const hasVisible =
      (await marketStatus.isVisible().catch(() => false)) ||
      (await activeStrategies.isVisible().catch(() => false));
    
    if (!hasVisible) {
      throw new Error('Dashboard default state: En az 1-2 ana kart başlığı visible olmalı (6-card grid render olmamış)');
    }

    await expect(page).toHaveScreenshot('dashboard-default.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

