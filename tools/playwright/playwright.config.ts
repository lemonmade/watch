import {resolve} from 'node:path';
import {defineConfig, devices} from '@playwright/test';

const root = resolve(process.cwd());

// @see https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: resolve(root, 'tests/e2e'),
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: 'html',
  // Shared settings for all the projects below.
  // @see https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Collect trace when retrying the failed test.
    // @see https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
    ...(process.env.CI
      ? [
          {
            name: 'firefox',
            use: {...devices['Desktop Firefox']},
          },

          {
            name: 'webkit',
            use: {...devices['Desktop Safari']},
          },
        ]
      : []),
  ],

  // Test against mobile viewports.
  // {
  //   name: 'Mobile Chrome',
  //   use: { ...devices['Pixel 5'] },
  // },
  // {
  //   name: 'Mobile Safari',
  //   use: { ...devices['iPhone 12'] },
  // },

  // Test against branded browsers.
  // {
  //   name: 'Microsoft Edge',
  //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
  // },
  // {
  //   name: 'Google Chrome',
  //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
  // },

  // Run your local dev server before starting the tests
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
