import { test, expect } from '@playwright/test';

test.describe('WS badge', () => {
  test('Dev/Mock: gri rozet ve "Dev Mode" metni', async ({ page }) => {
    await page.goto('/dashboard');
    // Hydration + status bar hazır olana kadar bekle
    await page.getByRole('status').waitFor({ state: 'visible', timeout: 15000 });
    const env = await page.locator('body').getAttribute('data-env');
    const badge = page.getByTestId('ws-badge').first();
    await expect(badge).toBeVisible();

    if (env !== 'prod') {
      await expect(badge).toHaveAttribute('data-variant', 'unknown');
      await expect(page.getByText(/Dev Mode/i)).toBeVisible();
    } else {
      test.skip(true, 'Bu test dev/mock için; prod davranışı ayrı testte doğrulanır');
    }
  });

  test('Prod: WS kapalıyken kırmızı', async ({ page }) => {
    test.skip(process.env.CI ? false : process.env.NEXT_PUBLIC_ENV !== 'prod', 'Sadece prod envde koşar');
    await page.goto('/dashboard');
    await page.getByRole('status').waitFor({ state: 'visible', timeout: 15000 });
    const badge = page.getByTestId('ws-badge').first();
    await expect(badge).toHaveAttribute('data-variant', 'error');
  });
});


