import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './contracts',
  testMatch: '**/*.spec.mts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  outputDir: '../../dist/.playwright/auth-passkey-contracts',
  use: { ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
});
