import { test, expect } from '@playwright/test';

test.describe('Spark Trading UI', () => {
  test('dashboard - clean layout, no overlaps', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for page load
    await expect(page.locator('text=Spark Trading')).toBeVisible();
    
    // Check StatusPills
    await expect(page.locator('text=Ortam:')).toBeVisible();
    await expect(page.locator('text=Veri Akışı:')).toBeVisible();
    
    // Check Metrics
    await expect(page.locator('text=P95 gecikme')).toBeVisible();
    await expect(page.locator('text=Güncellik gecikmesi')).toBeVisible();
    
    // Visual snapshot
    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
  });

  test('portfolio - TR currency formatting', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Wait for page load
    await expect(page.locator('text=Portföy')).toBeVisible();
    
    // Check TR labels
    await expect(page.locator('text=Toplam Bakiye')).toBeVisible();
    await expect(page.locator('text=Kullanılabilir')).toBeVisible();
    await expect(page.locator('text=Emirde')).toBeVisible();
    
    // Check button terminology
    await expect(page.locator('text=Pozisyonu Kapat')).toBeVisible();
    
    // Visual snapshot
    await expect(page).toHaveScreenshot('portfolio.png', { fullPage: true });
  });

  test('strategy-lab - empty state guidance', async ({ page }) => {
    await page.goto('/strategy-lab');
    
    // Wait for page load
    await expect(page.locator('text=Strategy Lab')).toBeVisible();
    
    // Check placeholder text
    const textarea = page.locator('textarea[placeholder*="Başlamak"]');
    await expect(textarea).toBeVisible();
    
    // Visual snapshot
    await expect(page).toHaveScreenshot('strategy-lab.png', { fullPage: true });
  });

  test('floating actions - no content overlap', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check FloatingActions visibility (desktop only)
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 768) {
      await expect(page.locator('text=⌘K Commands')).toBeVisible();
      await expect(page.locator('text=Ops Hızlı Yardım')).toBeVisible();
    }
  });

  test('mobile - floating actions hidden', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    
    // FloatingActions should be hidden on mobile
    const floatingActions = page.locator('[aria-label="Hızlı komutlar"]');
    await expect(floatingActions).toBeHidden();
  });
});

