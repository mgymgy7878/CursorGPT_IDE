import { test, expect } from '@playwright/test';

test.describe('WS badge deterministic', () => {
  test('Dev/Mock: gri rozet + Dev Mode metni', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('status-bar').waitFor({ state: 'visible', timeout: 15000 });
    const env = await page.locator('body').getAttribute('data-env');
    const badge = page.getByTestId('ws-badge').first();
    await expect(badge, 'ws-badge yok').toBeVisible();

    if (env !== 'prod') {
      await expect(badge).toHaveAttribute('data-variant', 'unknown');
      await expect(page.getByText(/Dev Mode/i)).toBeVisible();
    } else {
      test.skip(true, 'Bu case prod dışı içindir');
    }
  });

  test('Prod: WS down -> kırmızı', async ({ page }) => {
    test.skip(process.env.NEXT_PUBLIC_ENV !== 'prod', 'Sadece prod envde koşar');
    await page.goto('/dashboard');
    await page.getByTestId('status-bar').waitFor({ state: 'visible', timeout: 15000 });
    await expect(page.getByTestId('ws-badge').first()).toHaveAttribute('data-variant', 'error');
  });
});


