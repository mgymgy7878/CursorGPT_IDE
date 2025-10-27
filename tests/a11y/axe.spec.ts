import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe Accessibility Test Suite
 * 
 * Core pages'lerde WCAG 2.1 AA uyumluluğunu test eder.
 * Critical violations bulunması durumunda test fail olur.
 */

const PAGES = [
  { path: "/", name: "Anasayfa" },
  { path: "/portfolio", name: "Portföy" },
  { path: "/strategies", name: "Stratejilerim" },
  { path: "/running", name: "Çalışan Stratejiler" },
  { path: "/strategy-lab", name: "Strategy Lab" },
  { path: "/settings", name: "Ayarlar" },
];

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3003";

for (const page of PAGES) {
  test(`Accessibility: ${page.name} (${page.path})`, async ({ page: browserPage }) => {
    // Navigate to page
    await browserPage.goto(`${BASE_URL}${page.path}`, {
      waitUntil: "networkidle",
      timeout: 10000,
    });

    // Wait for main content to load
    await browserPage.waitForSelector("main, [role='main']", { timeout: 5000 }).catch(() => {
      console.warn(`No main landmark found on ${page.path}`);
    });

    // Run Axe analysis
    const results = await new AxeBuilder({ page: browserPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Filter critical violations
    const criticalViolations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    // Log all violations for debugging
    if (results.violations.length > 0) {
      console.log(`\n⚠️  ${page.name} has ${results.violations.length} violation(s):`);
      results.violations.forEach((violation, idx) => {
        console.log(`\n${idx + 1}. [${violation.impact?.toUpperCase()}] ${violation.id}`);
        console.log(`   ${violation.description}`);
        console.log(`   Help: ${violation.helpUrl}`);
        console.log(`   Affected nodes: ${violation.nodes.length}`);
        violation.nodes.slice(0, 2).forEach((node) => {
          console.log(`   - ${node.html.substring(0, 100)}...`);
        });
      });
    }

    // Assert no critical/serious violations
    expect(
      criticalViolations,
      `Found ${criticalViolations.length} critical accessibility issue(s):\n` +
        JSON.stringify(criticalViolations, null, 2)
    ).toEqual([]);
  });
}

test.describe("Keyboard Navigation", () => {
  test("Tab order is logical on Anasayfa", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Get all focusable elements
    const focusableElements = await page.locator('a, button, input, [tabindex]:not([tabindex="-1"])').all();
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // First tab should focus on skip link or main nav
    await page.keyboard.press("Tab");
    const firstFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON", "INPUT"]).toContain(firstFocus || "");
  });
});

test.describe("Color Contrast", () => {
  test("Status pills have sufficient contrast", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .include('[data-testid*="pill-"]')
      .analyze();

    const contrastIssues = results.violations.filter((v) => v.id === "color-contrast");
    expect(contrastIssues).toEqual([]);
  });
});

