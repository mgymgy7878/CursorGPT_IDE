import { test, expect } from '@playwright/test';

test.describe('WS badge deterministic', () => {
  test('Dev/Mock: gri rozet + Dev Mode metni', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Debug: log console errors and check what's rendered
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Wait for page to load and check what's available
    await page.waitForLoadState('networkidle');
    
    // Debug: check if status-bar exists
    const statusBarCount = await page.getByTestId('status-bar').count();
    console.log('Status bar count:', statusBarCount);
    
    if (statusBarCount === 0) {
      // Debug: check what testids are available
      const allTestIds = await page.locator('[data-testid]').all();
      console.log('All testids found:', await Promise.all(allTestIds.map(el => el.getAttribute('data-testid'))));
      
      // Debug: check if the status bar div exists without testid
      const statusBarDiv = await page.locator('div[role="status"][aria-live="polite"]').count();
      console.log('Status bar div count:', statusBarDiv);
    }
    
    // Use the first status div since testid is not working
    await page.locator('div[role="status"][aria-live="polite"]').first().waitFor({ state: 'visible', timeout: 15000 });
    
    // Debug: check what's in the first status div
    const firstStatusDiv = page.locator('div[role="status"][aria-live="polite"]').first();
    const statusDivHtml = await firstStatusDiv.innerHTML();
    console.log('First status div HTML:', statusDivHtml);
    
    const env = await page.locator('body').getAttribute('data-env');
    console.log('Body data-env:', env);
    
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
    await page.locator('div[role="status"][aria-live="polite"]').first().waitFor({ state: 'visible', timeout: 15000 });
    await expect(page.getByTestId('ws-badge').first()).toHaveAttribute('data-variant', 'error');
  });
});


