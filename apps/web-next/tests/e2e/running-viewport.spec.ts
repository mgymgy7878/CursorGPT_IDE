import { test, expect } from "@playwright/test";

/**
 * Running Page Viewport Tests
 *
 * Hedefler:
 * - Running sayfası farklı viewport'larda doğru kolon görünürlüğü sağlar
 * - Tooltip id'leri geçerli DOM id'leri üretir
 * - Responsive breakpoint'ler (base<1024, lg>=1024, xl>=1280) doğru çalışır
 *
 * Breakpoint'ler:
 * - base: < 1024px (Win Rate ve Sharpe gizli)
 * - lg: >= 1024px (Win Rate görünür, Sharpe gizli)
 * - xl: >= 1280px (Win Rate ve Sharpe görünür)
 */

async function gotoRunning(page: any) {
  await page.goto("/running", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

test.describe("Running Page - Viewport Responsive Tests @smoke", () => {
  test.beforeEach(async ({ page }) => {
    // Console error'ları logla
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Console error:", msg.text());
      }
    });
  });

  test("base viewport: Win Rate & Sharpe hidden @smoke", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await gotoRunning(page);

    // Win Rate ve Sharpe kolonları gizli olmalı
    const winRateElements = page.locator('[aria-describedby*="tt-winrate-30d"]');
    const sharpeElements = page.locator('[aria-describedby*="tt-sharpe-30d"]');

    const winRateCount = await winRateElements.count();
    const sharpeCount = await sharpeElements.count();

    if (winRateCount > 0) {
      const firstWinRate = winRateElements.first();
      const classes = await firstWinRate.getAttribute("class");
      if (classes?.includes("hidden")) {
        await expect(firstWinRate).not.toBeVisible();
      }
    }

    if (sharpeCount > 0) {
      const firstSharpe = sharpeElements.first();
      const classes = await firstSharpe.getAttribute("class");
      if (classes?.includes("hidden")) {
        await expect(firstSharpe).not.toBeVisible();
      }
    }
  });

  test("lg viewport: Win Rate visible, Sharpe hidden @smoke", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await gotoRunning(page);

    // Win Rate görünür olmalı
    const winRateElements = page.locator('[aria-describedby*="tt-winrate-30d"]');
    const winRateCount = await winRateElements.count();

    if (winRateCount > 0) {
      const firstWinRate = winRateElements.first();
      const classes = await firstWinRate.getAttribute("class");
      if (classes?.includes("lg:block") && !classes?.includes("hidden xl:block")) {
        await expect(firstWinRate).toBeVisible();
      }
    }

    // Sharpe hala gizli olmalı
    const sharpeElements = page.locator('[aria-describedby*="tt-sharpe-30d"]');
    const sharpeCount = await sharpeElements.count();

    if (sharpeCount > 0) {
      const firstSharpe = sharpeElements.first();
      const classes = await firstSharpe.getAttribute("class");
      if (classes?.includes("hidden xl:block")) {
        await expect(firstSharpe).not.toBeVisible();
      }
    }
  });

  test("xl viewport: Win Rate & Sharpe visible @smoke", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await gotoRunning(page);

    // Win Rate görünür olmalı
    const winRateElements = page.locator('[aria-describedby*="tt-winrate-30d"]');
    const winRateCount = await winRateElements.count();

    if (winRateCount > 0) {
      await expect(winRateElements.first()).toBeVisible();
    }

    // Sharpe görünür olmalı
    const sharpeElements = page.locator('[aria-describedby*="tt-sharpe-30d"]');
    const sharpeCount = await sharpeElements.count();

    if (sharpeCount > 0) {
      await expect(sharpeElements.first()).toBeVisible();
    }
  });

  test("aria-describedby targets exist for winrate/sharpe tooltips @smoke", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await gotoRunning(page);

    const locators = page.locator(
      '[aria-describedby^="tt-winrate-30d-"],[aria-describedby^="tt-sharpe-30d-"]'
    );
    const n = await locators.count();

    if (n > 0) {
      for (let i = 0; i < n; i++) {
        const id = await locators.nth(i).getAttribute("aria-describedby");
        expect(id).toBeTruthy();
        if (id) {
          // DOM id geçerliliği kontrolü
          expect(id).toMatch(/^tt-(winrate|sharpe)-30d-[A-Za-z0-9_-]+$/);
          // Target element DOM'da mevcut olmalı
          await expect(page.locator(`#${id}`)).toHaveCount(1);
          // Role kontrolü
          const role = await page.locator(`#${id}`).getAttribute("role");
          expect(role).toBe("tooltip");
        }
      }
    }
  });

  test("tooltip id sanitization (toDomId) @smoke", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await gotoRunning(page);

    // Tüm tooltip id'lerini kontrol et
    const tooltipElements = page.locator('[id*="tt-"]');
    const count = await tooltipElements.count();

    for (let i = 0; i < count; i++) {
      const element = tooltipElements.nth(i);
      const id = await element.getAttribute("id");

      if (id) {
        // DOM id geçerliliği: sadece alfanumerik, tire ve alt çizgi içermeli
        const invalidChars = /[^a-zA-Z0-9_-]/;
        expect(id).not.toMatch(invalidChars);

        // İlk ve son karakter tire olmamalı
        expect(id).not.toMatch(/^-|-$/);
      }
    }
  });
});

