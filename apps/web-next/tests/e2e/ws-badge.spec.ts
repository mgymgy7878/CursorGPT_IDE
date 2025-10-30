import { test, expect } from '@playwright/test';

test.describe('WS badge', () => {
  test('Dev/Mock: gri rozet ve "Dev Mode" metni', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Debug: log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Status bar container'ı bekle (unique class combination)
    await page.locator('div.w-full.border-b.bg-zinc-950\\/40.backdrop-blur').waitFor({ state: 'visible', timeout: 15000 });
    
    // Debug: log what we find
    const env = await page.locator('body').getAttribute('data-env');
    console.log('Environment:', env);
    
    // Debug: check if environment variables are available in browser
    const envVars = await page.evaluate(() => ({
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
      NEXT_PUBLIC_MOCK: process.env.NEXT_PUBLIC_MOCK
    }));
    console.log('Browser env vars:', envVars);
    
    // Check if ws-badge exists
    const badgeCount = await page.getByTestId('ws-badge').count();
    console.log('WS badge count:', badgeCount);
    
    if (badgeCount === 0) {
      // Debug: log all testids on page
      const allTestIds = await page.locator('[data-testid]').all();
      console.log('All testids found:', await Promise.all(allTestIds.map(el => el.getAttribute('data-testid'))));
      
      // Debug: log the HTML content around the status bar
      const statusBarHtml = await page.locator('div.w-full.border-b.bg-zinc-950\\/40.backdrop-blur').innerHTML();
      console.log('Status bar HTML:', statusBarHtml);
    }
    
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
    await page.locator('div.w-full.border-b.bg-zinc-950\\/40.backdrop-blur').waitFor({ state: 'visible', timeout: 15000 });
    const badge = page.getByTestId('ws-badge').first();
    await expect(badge).toHaveAttribute('data-variant', 'error');
  });
});


