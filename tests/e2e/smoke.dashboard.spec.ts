/**
 * Smoke Tests for Dashboard
 *
 * @smoke — Critical user flows that should never fail
 * Run time: < 15 seconds per test
 *
 * References:
 * - Playwright CI documentation: https://playwright.dev/docs/ci-intro
 */

import { test, expect } from '@playwright/test';

/** @smoke — Dashboard opens and shows KPI strip */
test('dashboard opens and shows KPI strip', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for KPI strip to be visible
  await expect(page.getByTestId('kpi-strip')).toBeVisible();

  // Verify P95 latency metric
  await expect(page.getByText(/P95.*ms/i)).toBeVisible();

  // Verify summary strip data
  await expect(page.getByText(/BAKİYE|Balance/i)).toBeVisible();
});

/** @smoke — Navigation works */
test('navigation sidebar works', async ({ page }) => {
  await page.goto('/dashboard');

  // Click on Market link
  await page.getByRole('link', { name: /Piyasa|Market/i }).click();

  // Verify we're on Market page
  await expect(page).toHaveURL(/.*\/market/);

  // Click on Strategies link
  await page.getByRole('link', { name: /Strateji|Strategies/i }).click();

  // Verify we're on Strategies page
  await expect(page).toHaveURL(/.*\/strategies/);
});

/** @smoke — Dashboard shows empty states correctly */
test('dashboard shows empty states for new user', async ({ page }) => {
  await page.goto('/dashboard');

  // Verify empty state messages
  const emptyStates = page.locator('[data-testid*="empty"]');
  await expect(emptyStates.first()).toBeVisible();

  // Should show helpful CTAs
  await expect(page.getByText(/Create|Create Alert|Oluştur/i)).toBeVisible();
});

