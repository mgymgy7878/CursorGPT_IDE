/**
 * E2E Test: Hydration Safety
 *
 * Bu test, Next.js hydration mismatch hatalarını yakalar.
 * Console'da "Hydration failed" veya "Text content does not match" mesajlarını arar.
 */

import { test, expect } from '@playwright/test';

test.describe('Hydration Safety', () => {
  test('should not have hydration errors in console', async ({ page }) => {
    // Console mesajlarını yakala
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Sayfaları test et
    const pages = [
      '/dashboard',
      '/market-data',
      '/strategies',
      '/running',
      '/control',
      '/control?tab=alerts',
      '/control?tab=audit',
      '/control?tab=canary',
      '/settings',
      '/settings?tab=ai',
      '/settings?tab=app',
    ];

    for (const path of pages) {
      await page.goto(`http://localhost:3003${path}`, { waitUntil: 'networkidle' });

      // Sayfanın yüklendiğini doğrula
      await expect(page).toHaveTitle(/Spark Trading/i);

      // Hydration hatalarını kontrol et
      const hydrationErrors = [
        ...consoleErrors.filter(msg =>
          msg.includes('Hydration failed') ||
          msg.includes('Text content does not match') ||
          msg.includes('hydration') ||
          msg.includes('server-rendered HTML')
        ),
        ...consoleWarnings.filter(msg =>
          msg.includes('Hydration failed') ||
          msg.includes('Text content does not match')
        ),
      ];

      if (hydrationErrors.length > 0) {
        console.error(`Hydration errors on ${path}:`, hydrationErrors);
      }

      expect(hydrationErrors.length).toBe(0);
    }
  });

  test('should render timestamps correctly without mismatch', async ({ page }) => {
    await page.goto('http://localhost:3003/settings', { waitUntil: 'networkidle' });

    // Connection Health kartındaki timestamp'i kontrol et
    const timestampElement = page.locator('text=/Son test:/');
    await expect(timestampElement).toBeVisible();

    // Hard reload yap (hydration'ı tetikle)
    await page.reload({ waitUntil: 'networkidle' });

    // Console'da hydration hatası olmamalı
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Hydration') || text.includes('Text content does not match')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.reload({ waitUntil: 'networkidle' });
    expect(consoleErrors.length).toBe(0);
  });
});

