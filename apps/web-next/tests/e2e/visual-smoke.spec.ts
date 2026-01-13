import { test, expect } from '@playwright/test';

/**
 * Visual Smoke Test Suite
 *
 * Core route'ların screenshot'larını alır ve snapshot karşılaştırması yapar.
 * UI regressions'ı otomatik yakalar.
 */

const CORE_ROUTES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/market-data', name: 'Market Data' },
  { path: '/strategies', name: 'Strategies' },
  { path: '/running', name: 'Running Strategies' },
  { path: '/control', name: 'Control Center' },
  { path: '/settings', name: 'Settings' },
];

test.describe('Visual Smoke Tests', () => {
  CORE_ROUTES.forEach(({ path, name }) => {
    test(`${name} (${path}) should render correctly`, async ({ page }) => {
      // Flakiness azaltma: animasyonları kapat (CSP-safe: addInitScript kullan)
      await page.addInitScript(() => {
        // CSS animasyonlarını kapat (inline style yerine class kullan)
        if (document.head) {
          const style = document.createElement('style');
          style.setAttribute('data-test', 'visual-smoke-animations-off');
          style.textContent = `
            *, *::before, *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `;
          document.head.appendChild(style);
        }
      });

      await page.goto(path);

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
        // Ignore timeout, continue with screenshot
      });

      // Wait for main content to be visible
      await page.waitForSelector('main, [data-testid*="page"], h1', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        // Continue even if selector not found
      });

      // Flakiness azaltma: input focus'ları kaldır
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach((input: HTMLElement) => {
          input.blur();
        });
      });

      // Flakiness azaltma: caret'i gizle (CSP-safe: evaluate kullan)
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.setAttribute('data-test', 'visual-smoke-caret-off');
        style.textContent = '* { caret-color: transparent !important; }';
        if (document.head) {
          document.head.appendChild(style);
        }
      });

      // Small delay to ensure everything is stable
      await page.waitForTimeout(500);

      // Take full page screenshot
      await expect(page).toHaveScreenshot(`${path.replace(/\//g, '_')}_full.png`, {
        fullPage: true,
        maxDiffPixels: 100, // Allow small differences (fonts, timestamps, etc.)
        threshold: 0.2, // 20% difference threshold
        timeout: 30000,
      });
    });
  });

  test('Command Palette should open and render correctly', async ({ page }) => {
    // Flakiness azaltma: animasyonları kapat
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });

    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Open command palette (Ctrl+K or Cmd+K)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

    // Wait for command palette to appear
    await page.waitForSelector('input[placeholder*="Komut" i], input[placeholder*="ara" i], input[placeholder*="command" i]', {
      timeout: 5000,
      state: 'visible'
    }).catch(() => {});

    // Wait for content to be visible (not just black box)
    await page.waitForSelector('div:has-text("komut"), div:has-text("command"), button', {
      timeout: 3000,
      state: 'visible'
    }).catch(() => {});

    // Flakiness azaltma: input focus'ları kaldır
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input: HTMLElement) => {
        input.blur();
      });
    });

    // Small delay to ensure everything is stable
    await page.waitForTimeout(500);

    // Take screenshot of command palette
    await expect(page).toHaveScreenshot('command_palette_open.png', {
      fullPage: false,
      maxDiffPixels: 100,
      threshold: 0.2,
      timeout: 30000,
    });
  });

  test('Empty states should render correctly', async ({ page }) => {
    // Test empty state on strategies page (if no strategies exist)
    await page.goto('/strategies');

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for empty state indicators
    const emptyStateSelectors = [
      'text=Henüz strateji bulunmuyor',
      'text=No strategies',
      'text=Henüz',
      '[data-testid*="empty"]',
      '.empty-state',
    ];

    let emptyStateFound = false;
    for (const selector of emptyStateSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
        emptyStateFound = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    if (emptyStateFound) {
      await expect(page).toHaveScreenshot('strategies_empty_state.png', {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2,
        timeout: 30000,
      });
    }
  });

  test('Dark theme should be consistent across routes', async ({ page }) => {
    // Check that dark theme is applied consistently
    const routes = ['/dashboard', '/strategies', '/settings'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      // Check body background color (should be dark)
      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      // Dark theme should have low RGB values
      const rgbMatch = bgColor.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        const [r, g, b] = rgbMatch.map(Number);
        const isDark = r < 50 && g < 50 && b < 50;
        expect(isDark).toBe(true);
      }
    }
  });
});
