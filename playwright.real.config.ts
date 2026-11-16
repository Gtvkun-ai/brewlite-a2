import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/real-browser',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: 0,
  outputDir: 'docs/evidence/demo-acceptance-2026-11-14/browser-artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'docs/evidence/demo-acceptance-2026-11-14/playwright-report', open: 'never' }],
    ['json', { outputFile: 'docs/evidence/demo-acceptance-2026-11-14/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3100',
    browserName: 'chromium',
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 1000 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    serviceWorkers: 'block',
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },
});
