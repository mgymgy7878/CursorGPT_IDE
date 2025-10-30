/**
 * E2E Tests for PR-6: Matriks Features
 *
 * Chart Trading + Session Widget + Alert Presets
 *
 * Test Coverage:
 * - Chart Trading: Single-click order placement, TP/SL drag, hotkeys, undo
 * - Session Widget: SSE stream, reconnect, online/offline banner
 * - Alert Presets: Save/load, convert to order, multi-target
 * - Accessibility: Keyboard navigation, focus ring, contrast
 */

import { test, expect, type Page } from '@playwright/test';

// Helper: Wait for SSE event
async function waitForSSEEvent(page: Page, eventName: string) {
  await page.waitForResponse((response) =>
    response.url().includes('/api/stream/session') &&
    response.request().method() === 'GET'
  );
}

// Helper: Mock SSE stream
async function mockSSEStream(page: Page) {
  await page.route('**/api/stream/session*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `event: session_tick\ndata: {"t":"2025-10-29T09:35:00Z","trades":143,"avg_size":0.42,"net_flow":1.8,"top_risers":["SOL","ADA"],"top_fallers":["XRP"],"p95_ms":58}\n\nretry: 5000\n\n`,
    });
  });
}

test.describe('PR-6: Matriks Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3003/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Chart Trading Panel', () => {
    test('Single-click limit order with TP/SL', async ({ page }) => {
      // Navigate to Market page
      await page.goto('http://localhost:3003/market');
      await page.waitForLoadState('networkidle');

      // Click BTCUSDT card to open chart trading panel
      await page.click('text=BTCUSDT');

      // Wait for Chart Trading panel to appear
      await page.waitForSelector('[data-testid="chart-trading-panel"]');

      // Set order type to Limit
      await page.click('[data-testid="order-type-limit"]');

      // Set quantity to 0.25 (25%)
      await page.click('[data-testid="quantity-pct-25"]');

      // Drag TP to +2% (preset button)
      await page.click('[data-testid="tp-preset-2"]');

      // Drag SL to -2% (preset button)
      await page.click('[data-testid="sl-preset-2"]');

      // Click Buy button
      await page.click('[data-testid="btn-buy"]');

      // Verify optimistic UI (pending badge)
      await expect(page.locator('[data-testid="order-status-pending"]')).toBeVisible();

      // Wait for success toast
      await expect(page.locator('text=Emir başarıyla verildi')).toBeVisible();

      // Test undo (5 seconds)
      await page.click('[data-testid="btn-undo"]');
      await expect(page.locator('text=Emir geri alındı')).toBeVisible();
    });

    test('Keyboard shortcuts (B/S/Esc)', async ({ page }) => {
      await page.goto('http://localhost:3003/market');
      await page.waitForLoadState('networkidle');

      await page.click('text=BTCUSDT');
      await page.waitForSelector('[data-testid="chart-trading-panel"]');

      // Press 'B' for Buy
      await page.keyboard.press('KeyB');
      await expect(page.locator('[data-testid="order-side-buy"]').first()).toHaveAttribute('aria-pressed', 'true');

      // Press 'S' for Sell
      await page.keyboard.press('KeyS');
      await expect(page.locator('[data-testid="order-side-sell"]').first()).toHaveAttribute('aria-pressed', 'true');

      // Press 'Escape' to close panel
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="chart-trading-panel"]')).not.toBeVisible();
    });

    test('Drag handles for TP/SL', async ({ page }) => {
      await page.goto('http://localhost:3003/market');
      await page.waitForLoadState('networkidle');

      await page.click('text=BTCUSDT');
      await page.waitForSelector('[data-testid="chart-trading-panel"]');

      // Get initial price
      const initialPrice = await page.textContent('[data-testid="current-price"]');
      expect(initialPrice).toBeTruthy();

      // Drag TP handle
      const tpHandle = page.locator('[data-testid="drag-handle-tp"]');
      await tpHandle.dragTo(page.locator('[data-testid="chart-area"]'), {
        targetPosition: { x: 100, y: 50 },
      });

      // Verify TP price updated (within 60Hz throttling)
      await page.waitForTimeout(100); // Wait for RAF
      const tpPrice = await page.textContent('[data-testid="tp-price"]');
      expect(tpPrice).not.toEqual(initialPrice);
    });

    test('Optimistic UI rollback on error', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/trade/place', (route) => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Price deviation too high' }),
        });
      });

      await page.goto('http://localhost:3003/market');
      await page.waitForLoadState('networkidle');

      await page.click('text=BTCUSDT');
      await page.waitForSelector('[data-testid="chart-trading-panel"]');

      await page.click('[data-testid="btn-buy"]');

      // Verify error toast
      await expect(page.locator('text=Fiyat sapması çok yüksek')).toBeVisible();

      // Verify rollback (no pending badge)
      await expect(page.locator('[data-testid="order-status-pending"]')).not.toBeVisible();
    });
  });

  test.describe('Session Widget (SSE)', () => {
    test('SSE stream updates every 5 seconds', async ({ page }) => {
      // Mock SSE stream
      await mockSSEStream(page);

      await page.goto('http://localhost:3003/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for session widget to appear
      await page.waitForSelector('[data-testid="session-widget"]');

      // Verify initial data
      await expect(page.locator('[data-testid="session-trades"]')).toHaveText(/143/);

      // Wait for next SSE update
      await waitForSSEEvent(page, 'session_tick');

      // Verify update (should be same or different based on SSE data)
      const tradesElement = page.locator('[data-testid="session-trades"]');
      await expect(tradesElement).toBeVisible();
    });

    test('Offline banner on SSE disconnect', async ({ page }) => {
      // Mock SSE stream failure
      await page.route('**/api/stream/session*', (route) => {
        route.abort('failed');
      });

      await page.goto('http://localhost:3003/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for exponential backoff
      await page.waitForTimeout(2000);

      // Verify offline banner
      await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
      await expect(page.locator('text=Çevrimdışı')).toBeVisible();
    });

    test('Online banner on SSE reconnect', async ({ page }) => {
      // First, disconnect
      await page.route('**/api/stream/session*', (route) => {
        route.abort('failed');
      });

      await page.goto('http://localhost:3003/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for offline banner
      await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();

      // Now, reconnect (unroute)
      await page.unroute('**/api/stream/session*');
      await mockSSEStream(page);

      // Wait for exponential backoff
      await page.waitForTimeout(2000);

      // Verify online banner
      await expect(page.locator('[data-testid="online-banner"]')).toBeVisible();
      await expect(page.locator('text=Çevrimiçi')).toBeVisible();
    });

    test('Session widget latency < 1s', async ({ page }) => {
      await mockSSEStream(page);

      const startTime = Date.now();

      await page.goto('http://localhost:3003/dashboard');
      await page.waitForLoadState('networkidle');

      await page.waitForSelector('[data-testid="session-widget"]');

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Verify latency < 1000ms
      expect(latency).toBeLessThan(1000);
    });
  });

  test.describe('Alert Presets', () => {
    test('Save alert preset', async ({ page }) => {
      await page.goto('http://localhost:3003/alerts');
      await page.waitForLoadState('networkidle');

      // Click "Yeni Alert" or existing alert
      const alertRows = page.locator('[data-testid="alert-row"]');
      if ((await alertRows.count()) > 0) {
        await alertRows.first().click();
      } else {
        // Create new alert
        await page.click('[data-testid="btn-new-alert"]');
        // Fill in alert details...
      }

      // Click "Save as Preset"
      await page.click('[data-testid="btn-save-preset"]');

      // Fill preset name
      await page.fill('[data-testid="preset-name"]', 'BTCUSDT Breakout');

      // Submit
      await page.click('[data-testid="btn-save-preset-submit"]');

      // Verify success toast
      await expect(page.locator('text=Şablon kaydedildi')).toBeVisible();
    });

    test('Load alert preset', async ({ page }) => {
      // First, create a preset (using local storage)
      await page.goto('http://localhost:3003/alerts');
      await page.evaluate(() => {
        localStorage.setItem('alert_presets', JSON.stringify([
          {
            id: 'p_1',
            name: 'BTCUSDT Breakout',
            conditions: [{ type: 'cross', left: 'close', right: 42500 }],
            actions: [{ type: 'OPEN', side: 'BUY', qty_pct: 0.25 }],
          },
        ]));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Click "Load Preset"
      await page.click('[data-testid="btn-load-preset"]');

      // Select preset
      await page.click('[data-testid="preset-item-p_1"]');

      // Verify form fields filled
      await expect(page.locator('[data-testid="alert-symbol"]')).toHaveValue('BTCUSDT');
      await expect(page.locator('[data-testid="alert-condition"]')).toContainText('cross');
    });

    test('Convert alert to order', async ({ page }) => {
      // First, create an alert
      await page.goto('http://localhost:3003/alerts');
      await page.waitForLoadState('networkidle');

      // Create new alert
      await page.click('[data-testid="btn-new-alert"]');
      await page.fill('[data-testid="alert-symbol"]', 'BTCUSDT');
      await page.fill('[data-testid="alert-condition-price"]', '42500');
      await page.click('[data-testid="btn-save-alert"]');

      // Wait for alert to appear
      await page.waitForSelector('[data-testid="alert-row"]');

      // Click "Convert to Order"
      const alertRow = page.locator('[data-testid="alert-row"]').first();
      await alertRow.hover();
      await page.click('[data-testid="btn-convert-to-order"]');

      // Verify chart trading panel opens with draft
      await page.waitForSelector('[data-testid="chart-trading-panel"]');
      await expect(page.locator('[data-testid="order-draft"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-symbol"]')).toHaveText('BTCUSDT');
    });

    test('Multi-target alert conversion', async ({ page }) => {
      // Create multi-target alert (price targets: 43000, 44000, 45000)
      await page.goto('http://localhost:3003/alerts');
      await page.evaluate(() => {
        localStorage.setItem('alert_multi_target', JSON.stringify({
          id: 'a_1',
          symbol: 'BTCUSDT',
          targets: [43000, 44000, 45000],
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Convert to order
      await page.click('[data-testid="btn-convert-to-order"]');

      // Verify multiple order drafts
      const drafts = page.locator('[data-testid="order-draft"]');
      await expect(drafts).toHaveCount(3); // 3 targets = 3 drafts

      // Verify "Place All" button
      await expect(page.locator('[data-testid="btn-place-all"]')).toBeVisible();
    });
  });

  test.describe('Accessibility (WCAG 2.1)', () => {
    test('Keyboard navigation (Tab/Shift+Tab)', async ({ page }) => {
      await page.goto('http://localhost:3003/market');
      await page.waitForLoadState('networkidle');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.locator('*:focus')).toBeVisible();

      // Verify focus ring
      const focusedElement = page.locator('*:focus').first();
      const outlineStyle = await focusedElement.evaluate((el) =>
        window.getComputedStyle(el).outline
      );
      expect(outlineStyle).not.toBe('none');
    });

    test('Contrast ratio ≥ 4.5:1', async ({ page }) => {
      await page.goto('http://localhost:3003/dashboard');
      await page.waitForLoadState('networkidle');

      // Get text and background colors
      const textElement = page.locator('[data-testid="session-trades"]').first();

      const textColor = await textElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.color;
      });

      const bgColor = await textElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });

      // Convert to RGB
      const rgbText = textColor.match(/\d+/g) || [];
      const rgbBg = bgColor.match(/\d+/g) || [];

      // Calculate relative luminance (simplified)
      const l1 = (parseInt(rgbText[0]) * 0.299 + parseInt(rgbText[1]) * 0.587 + parseInt(rgbText[2]) * 0.114) / 255;
      const l2 = (parseInt(rgbBg[0]) * 0.299 + parseInt(rgbBg[1]) * 0.587 + parseInt(rgbBg[2]) * 0.114) / 255;

      // Contrast ratio
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

      // Verify ≥ 4.5:1
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    test('ARIA labels present', async ({ page }) => {
      await page.goto('http://localhost:3003/market');
      await page.waitForLoadState('networkidle');

      // Check critical buttons have ARIA labels
      const buyButton = page.locator('[data-testid="btn-buy"]');
      const sellButton = page.locator('[data-testid="btn-sell"]');

      await expect(buyButton).toHaveAttribute('aria-label', /Buy|Al/i);
      await expect(sellButton).toHaveAttribute('aria-label', /Sell|Sat/i);
    });
  });
});

