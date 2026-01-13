import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    headless: true,
    // Flakiness azaltma: sabit viewport
    viewport: { width: 1920, height: 1080 },
    // Animasyonları kapat (daha stabil screenshot'lar)
    reducedMotion: 'reduce',
    // Screenshot'lar için sabit renk profili
    colorScheme: 'dark',
  },
  reporter: 'list',
  webServer: {
    command: 'pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003',
    url: 'http://127.0.0.1:3003',
    timeout: 90_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_E2E: '1',
    },
  },
  expect: {
    timeout: 30_000,
    // Screenshot karşılaştırması için threshold
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  // Flakiness azaltma: retry ve timeout ayarları
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
});

