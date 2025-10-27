import path from "node:path"

export default {
  testDir: 'tests/e2e',
  use: { baseURL: 'http://127.0.0.1:3003' },
  reporter: 'list',
  webServer: {
    command: 'npm --prefix apps/web-next run dev',
    url: 'http://127.0.0.1:3003',
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      DEV_AUTH: '1',
      RL_ADMIN_LIMIT: '5',
      RL_ADMIN_WINDOW_MS: '1000',
      AUDIT_ENABLED: '1',
      STRICT_ADMIN_SCHEMA: '1',
      AUDIT_LOG_PATH: path.join(process.cwd(), 'apps/web-next/.data/test-audit.log'),
      PROM_ALLOWLIST: '127.0.0.1,::1'
    }
  }
}; 