import { test, expect } from '@playwright/test';

/**
 * CSS Smoke Test - Tailwind/CSS yüklenmesini doğrular
 *
 * Bu test, CSS'in düzgün yüklendiğini ve Tailwind class'larının
 * gerçekten stil uyguladığını kontrol eder.
 */
test.describe('CSS Smoke Test', () => {
  test('Tailwind CSS düzgün yükleniyor', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Flex container kontrolü
    const flexContainer = page.locator('.flex').first();
    await expect(flexContainer).toBeVisible();

    const display = await flexContainer.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });

    expect(display).toBe('flex');

    // Gap kontrolü (flex + gap kombinasyonu)
    const gapContainer = page.locator('.flex.gap-2, .flex.gap-3, .flex.gap-4').first();
    if (await gapContainer.count() > 0) {
      const gap = await gapContainer.evaluate((el) => {
        return window.getComputedStyle(el).gap;
      });
      // Gap değeri boş olmamalı (Tailwind gap-* class'ı uygulanmış olmalı)
      expect(gap).not.toBe('');
    }

    // Background color kontrolü (dark theme)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Dark theme için koyu bir background beklenir
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // Transparent olmamalı
  });

  test('CSS dosyaları yükleniyor', async ({ page }) => {
    const cssRequests: string[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/_next/static/css/')) {
        cssRequests.push(response.url());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // En az bir CSS dosyası yüklenmiş olmalı
    expect(cssRequests.length).toBeGreaterThan(0);
  });
});
