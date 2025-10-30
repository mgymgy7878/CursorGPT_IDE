import { test, expect } from '@playwright/test';

test.describe('WS Badge', () => {
  test('DEV/MOCK: gri rozet ve Dev Mode metni', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('ws-badge')).toHaveAttribute('data-variant', 'unknown');
    await expect(page.getByText(/Dev Mode/i)).toBeVisible();
  });

  test('PROD: WS kapalıyken kırmızı rozet', async ({ page }) => {
    test.skip(process.env.NEXT_PUBLIC_ENV !== 'prod', 'Sadece prod env için');
    await page.goto('/dashboard');
    await expect(page.getByTestId('ws-badge')).toHaveAttribute('data-variant', 'error');
  });
});


