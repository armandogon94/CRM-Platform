import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

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

// Path where auth.setup.ts persists session state; consumed by the main
// projects via `use.storageState`. Lives outside git (see e2e/.gitignore).
const NOVAPAY_AUTH_STATE = path.resolve(__dirname, '.auth/novapay.json');

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
      // Slice 19 C4: runs auth.setup.ts once before any main project,
      // persisting storageState to `.auth/novapay.json`. testDir '.'
      // scopes the setup project to the repo-root-level setup file,
      // leaving testDir './specs' untouched for real specs.
      name: 'setup',
      testDir: '.',
      testMatch: /auth\.setup\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: NOVAPAY_BASE_URL,
      },
    },
    {
      name: 'desktop-novapay',
      dependencies: ['setup'],
      // Flow 6 is owned by `desktop-branding-all`, which runs pre-auth
      // across all 10 industries. Excluding it here avoids running it
      // twice (and under the wrong — authenticated — storageState).
      testIgnore: /06-branding-per-industry\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: NOVAPAY_BASE_URL,
        storageState: NOVAPAY_AUTH_STATE,
      },
    },
    {
      // Slice 19 D6: exclusively runs the per-industry branding smoke
      // spec. The spec itself parameterises over INDUSTRY_THEMES (one
      // test per industry, all parallel), so this project only needs
      // to match that single file.
      //
      // No auth required — the login page is already fully themed via
      // props, so we deliberately skip the `setup` dependency and
      // drop `storageState` entirely. See the spec's top-of-file note
      // for why Flow 6 runs pre-auth.
      name: 'desktop-branding-all',
      dependencies: [],
      testMatch: /06-branding-per-industry\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: NOVAPAY_BASE_URL,
      },
    },
    {
      // Mobile-specific testMatch filtering will be tightened in Task F1;
      // for C2 the project runs every spec in ./specs. Flow 6 is
      // desktop-only (branding assertions don't benefit from mobile
      // emulation), so it's excluded here as well.
      name: 'mobile-novapay',
      dependencies: ['setup'],
      testIgnore: /06-branding-per-industry\.spec\.ts$/,
      use: {
        ...devices['iPhone 14 Pro'],
        baseURL: NOVAPAY_BASE_URL,
        storageState: NOVAPAY_AUTH_STATE,
      },
    },
  ],
});
