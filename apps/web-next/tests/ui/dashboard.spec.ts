/**
 * Dashboard UI Screenshot Diff Test
 *
 * Golden Master Harness: /__gm__/dashboard route'u ile statik mock data kullanır.
 * 3 viewport'ta screenshot alır: 1200x800, 980x800, 760x800 (splitter simülasyonu).
 *
 * Kullanım:
 * - pnpm ui:snap → snapshot'ları güncelle
 * - pnpm ui:diff → snapshot farklarını kontrol et
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3003';

// Viewport'lar: splitter simülasyonu için
const VIEWPORTS = [
  { width: 1200, height: 800, name: '1200' },
  { width: 980, height: 800, name: '980' },
  { width: 760, height: 800, name: '760' },
] as const;

// Test edilecek sayfalar
const PAGES = [
  { route: '/__gm__/dashboard', name: 'dashboard' },
  { route: '/__gm__/strategies', name: 'strategies' },
  { route: '/__gm__/running', name: 'running' },
  { route: '/__gm__/market-data', name: 'market-data' },
  { route: '/__gm__/portfolio', name: 'portfolio' },
  { route: '/__gm__/alerts', name: 'alerts' },
  { route: '/__gm__/audit', name: 'audit' },
  { route: '/__gm__/guardrails', name: 'guardrails' },
  { route: '/__gm__/canary', name: 'canary' },
] as const;

test.describe('Dashboard UI Screenshot Diff', () => {
  // Her test için animasyonları kapat (deterministik render)
  test.beforeEach(async ({ page }) => {
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

    // Font hazır olana kadar bekle (deterministik render)
    await page.evaluate(async () => {
      // @ts-ignore
      if (document.fonts?.ready) await document.fonts.ready;
    }).catch(() => {});
  });

  // Her sayfa için her viewport'ta screenshot al
  for (const pageInfo of PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${pageInfo.name} - viewport ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Golden Master route'a git (statik mock data)
        await page.goto(`${BASE_URL}${pageInfo.route}`);
        await page.waitForLoadState('networkidle');

        // Shell yapısı yüklenene kadar bekle
        await page.waitForSelector('[data-testid="status-bar"], .status-bar, header', { timeout: 5000 }).catch(() => {});

        // Font hazır olana kadar bekle
        await page.waitForFunction(() => {
          // @ts-ignore
          return !document.fonts || document.fonts.status === 'loaded';
        }, { timeout: 5000 }).catch(() => {});

        // Dashboard için Portfolio Summary overlap kontrolü
        if (pageInfo.name === 'dashboard') {
          const portfolioSummary = page.locator('[data-testid="portfolio-summary"]');
          await expect(portfolioSummary).toBeVisible({ timeout: 5000 }).catch(() => {});

          const statCards = portfolioSummary.locator('div.min-w-0.overflow-hidden.rounded-xl');
          const statCardCount = await statCards.count();

          if (statCardCount >= 2) {
            const boxes: Array<{ x: number; y: number; width: number; height: number } | null> = [];
            for (let i = 0; i < Math.min(statCardCount, 3); i++) {
              await expect(statCards.nth(i)).toBeVisible({ timeout: 2000 }).catch(() => {});
              const box = await statCards.nth(i).boundingBox();
              if (box) boxes.push(box);
            }

            // Çakışma kontrolü
            for (let i = 0; i < boxes.length; i++) {
              for (let j = i + 1; j < boxes.length; j++) {
                const box1 = boxes[i];
                const box2 = boxes[j];
                if (!box1 || !box2) continue;

                const EPSILON = 1;
                const overlaps = !(
                  box1.x + box1.width < box2.x - EPSILON ||
                  box2.x + box2.width < box1.x - EPSILON ||
                  box1.y + box1.height < box2.y - EPSILON ||
                  box2.y + box2.height < box1.y - EPSILON
                );

                if (overlaps) {
                  throw new Error(
                    `UI Parity: Portfolio Summary overlap detected at viewport ${viewport.name} - boxes ${i} and ${j} are overlapping`
                  );
                }
              }
            }
          }
        }

        // Strategies/Running için MetricRibbon overlap kontrolü
        if (pageInfo.name === 'strategies' || pageInfo.name === 'running') {
          // MetricRibbon grid container'ını bul (grid-template-columns ile)
          const metricRibbon = page.locator('div[class*="grid"][class*="gap-2"]').first();
          await expect(metricRibbon).toBeVisible({ timeout: 5000 }).catch(() => {});

          // Grid kullanıldığı için overlap olmamalı, ama yine de kontrol edelim
          const metricItems = metricRibbon.locator('> *');
          const itemCount = await metricItems.count();

          if (itemCount >= 2) {
            const boxes: Array<{ x: number; y: number; width: number; height: number } | null> = [];
            for (let i = 0; i < Math.min(itemCount, 6); i++) {
              await expect(metricItems.nth(i)).toBeVisible({ timeout: 2000 }).catch(() => {});
              const box = await metricItems.nth(i).boundingBox();
              if (box) boxes.push(box);
            }

            // Çakışma kontrolü
            for (let i = 0; i < boxes.length; i++) {
              for (let j = i + 1; j < boxes.length; j++) {
                const box1 = boxes[i];
                const box2 = boxes[j];
                if (!box1 || !box2) continue;

                const EPSILON = 1;
                const overlaps = !(
                  box1.x + box1.width < box2.x - EPSILON ||
                  box2.x + box2.width < box1.x - EPSILON ||
                  box1.y + box1.height < box2.y - EPSILON ||
                  box2.y + box2.height < box1.y - EPSILON
                );

                if (overlaps) {
                  throw new Error(
                    `UI Parity: MetricRibbon overlap detected at viewport ${viewport.name} - boxes ${i} and ${j} are overlapping`
                  );
                }
              }
            }
          }
        }

        // Portfolio için ExchangeStatus kart overlap kontrolü
        if (pageInfo.name === 'portfolio') {
          const exchangeCard = page.locator('text=Borsa Bağlantısı').locator('..').first();
          await expect(exchangeCard).toBeVisible({ timeout: 5000 }).catch(() => {});

          // İçerideki satırların overlap kontrolü
          const statusRows = exchangeCard.locator('div[class*="flex"][class*="justify-between"]');
          const rowCount = await statusRows.count();

          if (rowCount >= 2) {
            const boxes: Array<{ x: number; y: number; width: number; height: number } | null> = [];
            for (let i = 0; i < Math.min(rowCount, 4); i++) {
              await expect(statusRows.nth(i)).toBeVisible({ timeout: 2000 }).catch(() => {});
              const box = await statusRows.nth(i).boundingBox();
              if (box) boxes.push(box);
            }

            // Çakışma kontrolü
            for (let i = 0; i < boxes.length; i++) {
              for (let j = i + 1; j < boxes.length; j++) {
                const box1 = boxes[i];
                const box2 = boxes[j];
                if (!box1 || !box2) continue;

                const EPSILON = 1;
                const overlaps = !(
                  box1.x + box1.width < box2.x - EPSILON ||
                  box2.x + box2.width < box1.x - EPSILON ||
                  box1.y + box1.height < box2.y - EPSILON ||
                  box2.y + box2.height < box1.y - EPSILON
                );

                if (overlaps) {
                  throw new Error(
                    `UI Parity: Portfolio ExchangeStatus overlap detected at viewport ${viewport.name} - rows ${i} and ${j} are overlapping`
                  );
                }
              }
            }
          }
        }

        // Screenshot al
        await expect(page).toHaveScreenshot(`${pageInfo.name}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixels: 100,
          threshold: 0.2,
        });
      });
    }
  }
});

