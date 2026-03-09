import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // CI では webServer を使わない (stub テストのため)
  // 実テスト時は有効化する
  ...(process.env.CI ? {} : {
    webServer: {
      command: 'npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
    },
  }),
});
