import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
    headless: true,
  },
  reporter: 'list',
});

