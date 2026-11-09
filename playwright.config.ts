import { defineConfig } from '@playwright/test';

const PORT = 3100; // tránh cổng 3000 (dev) và 3001 (API)

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
   expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    cwd: 'apps/web',
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: true,
    env: { NEXT_PUBLIC_USE_FIXTURES: 'true' },
  },
});