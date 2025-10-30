/**
 * Feature Tests for Chart Trading Panel
 *
 * @feature-chart-trading — Market page with floating order panel
 *
 * References:
 * - TradingView: Order Ticket paradigm
 * - MDN: Keyboard shortcuts and accessibility
 */

import { test, expect } from '@playwright/test';

/** @feature-chart-trading — Single-click BUY places optimistic order */
test('single-click BUY places optimistic order', async ({ page }) => {
  // Mock API response
  await page.route('**/api/trade/place', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'ord_123', status: 'accepted' }),
      });
    }
    return route.fallback();
  });

  await page.goto('/market');

  // Wait for Market page to load
  await page.waitForLoadState('networkidle');

  // Click Buy button (should open chart trading panel)
  await page.getByRole('button', { name: /Al|Buy/i }).first().click();

  // Verify optimistic order appears
  await expect(page.getByTestId('order-status-pending')).toBeVisible();

  // Verify success toast
  await expect(page.getByText(/Emir.*verildi|Order.*placed/i)).toBeVisible();
});

/** @feature-chart-trading — TP/SL presets work */
test('TP/SL presets calculate correctly', async ({ page }) => {
  await page.goto('/market');
  await page.waitForLoadState('networkidle');

  // Open chart trading panel
  await page.getByRole('button', { name: /Al|Buy/i }).first().click();

  // Get current price
  const currentPriceText = await page.getByTestId('current-price').textContent();
  const currentPrice = parseFloat(currentPriceText || '0');

  // Click +2% TP preset
  await page.getByTestId('tp-preset-2').click();

  // Verify TP price = currentPrice * 1.02
  const tpPriceText = await page.getByTestId('tp-price').textContent();
  const tpPrice = parseFloat(tpPriceText || '0');

  const expectedTP = currentPrice * 1.02;
  expect(Math.abs(tpPrice - expectedTP)).toBeLessThan(0.01);
});

/** @feature-chart-trading — Keyboard shortcuts work */
test('keyboard shortcuts navigate correctly', async ({ page }) => {
  await page.goto('/market');
  await page.waitForLoadState('networkidle');

  // Open chart trading panel
  await page.getByRole('button', { name: /Al|Buy/i }).first().click();

  // Press 'B' for Buy
  await page.keyboard.press('KeyB');
  await expect(page.getByTestId('order-side-buy').first()).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  // Press 'S' for Sell
  await page.keyboard.press('KeyS');
  await expect(page.getByTestId('order-side-sell').first()).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  // Press 'Escape' to close
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('chart-trading-panel')).not.toBeVisible();
});

/** @feature-chart-trading — Undo works after order success */
test('undo works after order success', async ({ page }) => {
  await page.route('**/api/trade/place', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'ord_123', status: 'accepted' }),
      });
    }
    return route.fallback();
  });

  await page.goto('/market');
  await page.waitForLoadState('networkidle');

  // Place order
  await page.getByRole('button', { name: /Al|Buy/i }).first().click();

  // Wait for success
  await expect(page.getByText(/Emir.*verildi|Order.*placed/i)).toBeVisible();

  // Click undo
  await page.getByRole('button', { name: /Undo|Geri Al/i }).click();

  // Verify order cancelled
  await expect(page.getByText(/Geri.*alındı|Undone/i)).toBeVisible();
});

