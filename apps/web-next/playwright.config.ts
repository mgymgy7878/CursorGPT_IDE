import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',
    trace: 'on', // Her test için trace (CI'da debug için)
    headless: true,
    // Deterministik test ortamı (Golden Master için)
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    // Deterministik render için
    deviceScaleFactor: 1,
  },
  reporter: 'list',
  // Golden Master screenshot testleri için
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  // Snapshot'lar test-results içinde saklanır (commit edilmeli)
  snapshotDir: './tests/visual/snapshots',
});

