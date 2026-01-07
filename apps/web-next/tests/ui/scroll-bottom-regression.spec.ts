import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3003';
const OUTPUT_DIR = path.join(process.cwd(), 'evidence', 'local', 'ui-regression', 'scroll-bottom');

test.describe('Scroll Bottom Padding Regression (PATCH W.5b)', () => {
  test.beforeEach(async ({ page }) => {
    // Viewport ayarla (standart desktop)
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Dashboard - alt kartlar kesilmemeli', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // En alta scroll (main scroll container'a)
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        const scrollContainer = main.querySelector('[style*="overflow-y: auto"]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500); // Scroll animasyonu için bekle

    // Screenshot al
    await page.screenshot({
      path: `${OUTPUT_DIR}/dashboard-scroll-bottom.png`,
      fullPage: false // Sadece viewport
    });

    // Son kartın görünür olduğunu doğrula
    const lastCard = page.locator('[class*="card"], [class*="Card"]').last();
    await expect(lastCard).toBeVisible();
  });

  test('Market Data - liste son satırı kesilmemeli', async ({ page }) => {
    await page.goto(`${BASE_URL}/market-data`);
    await page.waitForLoadState('networkidle');

    // En alta scroll
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        const scrollContainer = main.querySelector('[style*="overflow-y: auto"]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/market-data-scroll-bottom.png`,
      fullPage: false
    });

    // Son satırın görünür olduğunu doğrula
    const lastRow = page.locator('tbody tr').last();
    if (await lastRow.count() > 0) {
      await expect(lastRow).toBeVisible();
    }
  });

  test('Strategies - tablo alt border kesilmemeli', async ({ page }) => {
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        const scrollContainer = main.querySelector('[style*="overflow-y: auto"]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/strategies-scroll-bottom.png`,
      fullPage: false
    });

    const lastRow = page.locator('tbody tr').last();
    if (await lastRow.count() > 0) {
      await expect(lastRow).toBeVisible();
    }
  });

  test('Running - tablo alt border kesilmemeli', async ({ page }) => {
    await page.goto(`${BASE_URL}/running`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        const scrollContainer = main.querySelector('[style*="overflow-y: auto"]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/running-scroll-bottom.png`,
      fullPage: false
    });

    const lastRow = page.locator('tbody tr').last();
    if (await lastRow.count() > 0) {
      await expect(lastRow).toBeVisible();
    }
  });

  test('Control - Risk Parametreleri kartı kesilmemeli (collapsed)', async ({ page }) => {
    await page.goto(`${BASE_URL}/control`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        const scrollContainer = main.querySelector('[style*="overflow-y: auto"]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/control-scroll-bottom-collapsed.png`,
      fullPage: false
    });

    // "Risk Parametreleri" kartını bul
    const riskParamsCard = page.locator('text=Risk Parametreleri').first();
    if (await riskParamsCard.count() > 0) {
      await expect(riskParamsCard).toBeVisible();
    }
  });

  test('Control - Risk Parametreleri kartı expanded durumda kesilmemeli', async ({ page }) => {
    await page.goto(`${BASE_URL}/control`);
    await page.waitForLoadState('networkidle');

    // Risk Parametreleri'ni expand et
    const riskParamsButton = page.locator('text=Risk Parametreleri').locator('..').locator('button').first();
    if (await riskParamsButton.count() > 0) {
      await riskParamsButton.click();
      await page.waitForTimeout(300); // Expand animasyonu için bekle
    }

    // En alta scroll
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        const scrollContainer = main.querySelector('[style*="overflow-y: auto"]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/control-scroll-bottom-expanded.png`,
      fullPage: false
    });

    // Expanded content'in görünür olduğunu doğrula
    const maxDrawdownInput = page.locator('input[type="number"]').first();
    if (await maxDrawdownInput.count() > 0) {
      await expect(maxDrawdownInput).toBeVisible();
    }
  });

  test('Control - Overflow kesilmesi kontrolü (tüm tab\'lar)', async ({ page }) => {
    const tabs = ['risk', 'alerts', 'audit', 'canary'];

    for (const tab of tabs) {
      await page.goto(`${BASE_URL}/control?tab=${tab}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // En alta scroll
      await page.evaluate(() => {
        const main = document.querySelector('main');
        if (main) {
          const scrollContainer = main.querySelector('[style*="overflow-y: auto"]') || main.querySelector('[class*="overflow-y-auto"]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      });
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${OUTPUT_DIR}/control-${tab}-scroll-bottom.png`,
        fullPage: false
      });

      // PATCH CONTROL-OPT-3: En alttaki spacer/footer sentinel görünür olmalı
      const bottomSpacer = page.locator('[class*="h-4"][class*="shrink-0"]').last();
      if (await bottomSpacer.count() > 0) {
        const isVisible = await bottomSpacer.isVisible();
        expect(isVisible).toBe(true);
      }

      // Alerts empty state'te çan ikonu tam görünmeli
      if (tab === 'alerts') {
        const bellIcon = page.locator('text=🔔').first();
        if (await bellIcon.count() > 0) {
          const box = await bellIcon.boundingBox();
          expect(box).not.toBeNull();
          // İkon viewport içinde olmalı (y > 0 ve y < viewport height)
          if (box) {
            expect(box.y).toBeGreaterThan(0);
            expect(box.y + box.height).toBeLessThan(await page.viewportSize()?.height || 1000);
          }
        }
      }
    }
  });

  test('Density mode değişikliği - padding korunmalı', async ({ page }) => {
    // Normal density'de test
    await page.goto(`${BASE_URL}/control`);
    await page.waitForLoadState('networkidle');

    // Settings'e git ve density'yi değiştir
    await page.goto(`${BASE_URL}/settings?tab=app`);
    await page.waitForLoadState('networkidle');

    // Compact'a geç (eğer varsa)
    const compactButton = page.locator('text=Compact').first();
    if (await compactButton.count() > 0) {
      await compactButton.click();
      await page.waitForTimeout(500);
    }

    // Control'e geri dön ve scroll
    await page.goto(`${BASE_URL}/control`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        const scrollContainer = main.querySelector('[style*="overflow-y: auto"]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/control-compact-scroll-bottom.png`,
      fullPage: false
    });
  });
});

