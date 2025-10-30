import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for PR-6 E2E Tests
 *
 * Features:
 * - Retries: 1 (flake reduction)
 * - Trace: on-first-retry (for debugging)
 * - Video: retain-on-failure (for visual debugging)
 * - Screenshots: only-on-failure
 * - Production build testing with webServer
 *
 * References:
 * - https://playwright.dev/docs/test-configuration
 * - https://playwright.dev/docs/test-webserver
 */
export default defineConfig({
  testDir: './tests/e2e',
  retries: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  reporter: [
    ['list'],
    ['junit', { outputFile: 'junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3003',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
  ],
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'pnpm --filter web-next start',
    url: 'http://127.0.0.1:3003',
    reuseExistingServer: true,
    timeout: 120000
  }
});
