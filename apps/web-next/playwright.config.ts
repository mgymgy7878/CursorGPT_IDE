import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',
    // Trace: env var ile kontrol edilebilir (default: on-first-retry, CI'da PW_TRACE=1 ile full trace)
    trace: process.env.PW_TRACE === '1' ? 'on' : 'on-first-retry',
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
  // Deterministiklik için: Windows runner'da render yarışlarını azalt
  workers: process.env.CI ? 1 : undefined,
  // CI'da retry=1: fail olduğunda trace kesin oluşsun (on-first-retry ile birlikte)
  retries: process.env.CI ? 1 : 0,
  // Deterministik renk profili (snap drift'ini azaltır)
  launchOptions: {
    args: ['--force-color-profile=srgb'],
  },
  // HTML reporter: trace/video/screenshot'ları playwright-report/data/ içine kopyalar (artifact olarak sadece playwright-report yeterli)
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
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

