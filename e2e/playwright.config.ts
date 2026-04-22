import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the CRM Platform E2E suite (Slice 19 C2).
 *
 * Three projects cover the test matrix defined in SPEC §Slice 19:
 *   - desktop-novapay        Chromium @ 1440x900, NovaPay frontend (port 13001)
 *   - desktop-branding-all   Chromium @ 1440x900, fans out across all 10
 *                            industry frontends (wired in D6)
 *   - mobile-novapay         iPhone 14 Pro emulation, NovaPay frontend
 *
 * Reporters: junit (results/junit.xml), html (playwright-report/), list.
 * Artifact policy: traces on-first-retry, videos retain-on-failure,
 * screenshots only-on-failure. Paths all resolve inside e2e/.gitignore.
 */

// NovaPay frontend baseURL (see frontends/_shared/src/theme.ts — port 13001).
const NOVAPAY_BASE_URL = 'http://localhost:13001';

export default defineConfig({
  testDir: './specs',

  // Parallelism — SPEC §Slice 19 Tooling: 4 workers, fully parallel.
  fullyParallel: true,
  workers: 4,

  // Retry flaky tests in CI only.
  retries: process.env.CI ? 2 : 0,

  // Fail the build on test.only leftovers in CI.
  forbidOnly: !!process.env.CI,

  // Reset the fixture workspace once before the whole suite runs.
  // globalTeardown is not wired yet — added in a later slice if needed;
  // individual specs are expected to clean up any rows they create.
  globalSetup: require.resolve('./globalSetup'),

  // Reporters: JUnit for CI ingestion, HTML for local triage, list for stdout.
  reporter: [
    ['junit', { outputFile: 'results/junit.xml' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Global `use` — artifact + timeout policy applied to every project.
  use: {
    baseURL: NOVAPAY_BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'desktop-novapay',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: NOVAPAY_BASE_URL,
      },
    },
    {
      // TODO(Slice 19 D6): parameterize over INDUSTRY_THEMES to fan out
      // across all 10 industry frontends (ports 13001-13010). For C2 this
      // project name simply needs to exist so --list reports it.
      name: 'desktop-branding-all',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: NOVAPAY_BASE_URL,
      },
    },
    {
      // Mobile-specific testMatch filtering will be tightened in Task F1;
      // for C2 the project runs every spec in ./specs.
      name: 'mobile-novapay',
      use: {
        ...devices['iPhone 14 Pro'],
        baseURL: NOVAPAY_BASE_URL,
      },
    },
  ],
});
