/**
 * Chart Attribution E2E Test
 *
 * Regression test for TradingView attribution removal:
 * - Chart canvas rendering (workspace + full view)
 * - Attribution link absence check
 *
 * ChatGPT önerisi: "Kalıcı güvence" için E2E test
 */

import { test, expect } from '@playwright/test';

test.describe('Chart Attribution Regression', () => {
  test('workspace view: chart renders and no TradingView attribution', async ({ page }) => {
    await page.goto('http://localhost:3003/market-data?symbol=BTC%2FUSDT&view=workspace');

    // Wait for chart to render
    await page.waitForTimeout(2000);

    // Check: Chart canvas exists and has size > 0
    const canvasCount = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      return Array.from(canvases).filter(canvas => {
        const rect = canvas.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
    });

    expect(canvasCount).toBeGreaterThan(0);

    // Check: No TradingView attribution link
    const attributionLink = await page.evaluate(() => {
      return document.querySelector('a[href*="tradingview.com"]');
    });

    expect(attributionLink).toBeNull();
  });

  test('full view: chart renders and no TradingView attribution', async ({ page }) => {
    await page.goto('http://localhost:3003/market-data?symbol=BTC%2FUSDT&view=full');

    // Wait for chart to render
    await page.waitForTimeout(2000);

    // Check: Chart canvas exists and has size > 0
    const canvasCount = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      return Array.from(canvases).filter(canvas => {
        const rect = canvas.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
    });

    expect(canvasCount).toBeGreaterThan(0);

    // Check: No TradingView attribution link
    const attributionLink = await page.evaluate(() => {
      return document.querySelector('a[href*="tradingview.com"]');
    });

    expect(attributionLink).toBeNull();
  });

  test('list view: mini charts render without attribution', async ({ page }) => {
    await page.goto('http://localhost:3003/market-data');

    // Wait for table to render
    await page.waitForSelector('table', { timeout: 5000 });

    // Check: Mini charts (SVG sparklines) exist
    const svgCount = await page.evaluate(() => {
      return document.querySelectorAll('svg').length;
    });

    // Should have at least some SVG elements (sparklines)
    expect(svgCount).toBeGreaterThan(0);

    // Check: No TradingView attribution link
    const attributionLink = await page.evaluate(() => {
      return document.querySelector('a[href*="tradingview.com"]');
    });

    expect(attributionLink).toBeNull();
  });

  test('chart canvas has valid dimensions', async ({ page }) => {
    await page.goto('http://localhost:3003/market-data?symbol=BTC%2FUSDT&view=workspace');

    await page.waitForTimeout(2000);

    // Check: Canvas dimensions are valid
    const canvasInfo = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      return canvases.map(canvas => {
        const rect = canvas.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(canvas);
        return {
          width: rect.width,
          height: rect.height,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
        };
      });
    });

    // At least one canvas should have valid dimensions
    const validCanvas = canvasInfo.find(c => c.width > 0 && c.height > 0);
    expect(validCanvas).toBeDefined();

    // Canvas should not be hidden
    expect(validCanvas?.display).not.toBe('none');
    expect(validCanvas?.visibility).not.toBe('hidden');
    expect(parseFloat(validCanvas?.opacity || '1')).toBeGreaterThan(0);
  });
});

