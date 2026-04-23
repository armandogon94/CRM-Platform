import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright config for the Slice 19.7 QA harness.
 * Invoked from the shell orchestrator (qa/run-industry-qa.sh):
 *   INDUSTRY=novapay npx playwright test --config=qa/playwright.qa.config.ts
 *
 * Independent of the Slice 19 functional e2e + Slice 19B visual configs so
 * it doesn't inherit globalSetup/auth-setup. The QA harness is self-
 * contained: it drives its own login flow fresh on each industry.
 */

export default defineConfig({
  testDir: '../qa/harness',
  testMatch: /qa\.spec\.ts$/,
  // Run the two serial describes in one worker — they share state.
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 180_000,
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
    ...devices['Desktop Chrome'],
  },
  outputDir: '../qa-results/.playwright-output',
});
