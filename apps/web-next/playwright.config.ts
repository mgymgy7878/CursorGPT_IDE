import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // CI retry stratejisi: flaky test'lerin retry'da geçip yeşil kalmasını engellemek için retries: 0
  // Trace garantisi için: trace: 'retain-on-failure' (fail'de trace var, retry yok)
  retries: process.env.CI ? 0 : 0, // Retry yok: "ya sağlam geçer, ya kanıt bırakıp patlar" mantığı
  
  // Playwright webServer: dev server'ı otomatik kaldır (ERR_CONNECTION_REFUSED sınıfını kapatır)
  // Monorepo pnpm --filter web-next dev -- --port 3003 komutunu otomatik çalıştırır
  webServer: {
    command: 'pnpm --filter web-next dev -- --port 3003 --hostname 127.0.0.1',
    port: 3003,
    reuseExistingServer: !process.env.CI, // CI'da her zaman yeni server, local'de mevcut varsa kullan
    timeout: 120 * 1000, // 120 saniye timeout (dev server başlatma süresi)
    stdout: 'ignore', // CI'da log gürültüsünü azalt
    stderr: 'pipe', // Hataları göster
  },
  
  use: {
    // baseURL: webServer ile hizalı (deterministiklik ve okunabilirlik için 127.0.0.1 kullanıyoruz)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3003',
    // Trace garantisi: retry olmadığı için 'retain-on-failure' kullanıyoruz (fail'de trace var)
    trace: process.env.PW_TRACE === '1' ? 'on' : 'retain-on-failure',
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

