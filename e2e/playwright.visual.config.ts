import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Playwright configuration for the CRM Platform Visual Regression suite
 * (Slice 19B Task A2). Complements — does NOT replace — `playwright.config.ts`
 * which owns the functional E2E matrix from Slice 19.
 *
 * Two projects cover the visual matrix defined in SPEC §Slice 19B:
 *   - visual-desktop   Chromium @ 1440×900, NovaPay frontend (port 13001)
 *   - visual-mobile    iPhone 14 Pro emulation, NovaPay frontend
 *
 * Determinism strategy (SPEC §Slice 19B):
 *   All snapshots must be generated inside the pinned container
 *   `mcr.microsoft.com/playwright:v1.48.0-jammy` so macOS dev and Linux CI
 *   produce byte-identical output. This config refuses to load outside that
 *   container (see host-run blocker below) — the ONLY legitimate entry
 *   points are `make e2e-visual` (sets E2E_DOCKER=true inside the pinned
 *   image) or CI (CI=true).
 *
 * Reporters: junit (results/visual-junit.xml — separate from Slice 19's
 * results/junit.xml), html (playwright-report-visual/), list.
 *
 * Auth: reuses `.auth/novapay.json` persisted by Slice 19 C4
 * (`auth.setup.ts`). Visual runs do NOT re-run globalSetup — they rely on
 * the same storageState file already produced by the functional suite.
 * Run `npm test` once on the host before `make e2e-visual` to seed it.
 */

// Host-run blocker — enforces SPEC §Slice 19B determinism strategy.
// Must fire EAGERLY at config-load time (not lazily inside defineConfig)
// so `playwright test --list` on the host fails before any test discovery.
if (process.env.CI !== 'true' && process.env.E2E_DOCKER !== 'true') {
  throw new Error(
    'Refusing to run visual suite outside pinned Docker container. ' +
      'Use make e2e-visual or set E2E_DOCKER=true.',
  );
}

// NovaPay frontend baseURL (see frontends/_shared/src/theme.ts — port 13001).
// Kept as a local constant to mirror playwright.config.ts; if a third config
// ever needs this value, promote to a shared helper.
const NOVAPAY_BASE_URL = 'http://localhost:13001';

// Path to the storage state persisted by Slice 19 C4's auth.setup.ts.
// Lives outside git (see e2e/.gitignore — `.auth/` is ignored).
const NOVAPAY_AUTH_STATE = path.resolve(__dirname, '.auth/novapay.json');

export default defineConfig({
  // Separate spec directory from Slice 19's `./specs` so functional tests
  // and visual snapshots never interleave.
  testDir: './specs/visual',

  // Parallelism — SPEC §Slice 19 Tooling: 4 workers, fully parallel.
  fullyParallel: true,
  workers: 4,

  // Retry policy: in CI only, matching Slice 19. Visual runs should not
  // mask flake locally — a non-deterministic snapshot is a bug, not a retry.
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  // Reporters: JUnit for CI ingestion (distinct file so Slice 19's JUnit
  // is not overwritten), HTML for local triage of pixel diffs, list for
  // stdout.
  reporter: [
    ['junit', { outputFile: 'results/visual-junit.xml' }],
    ['html', { outputFolder: 'playwright-report-visual', open: 'never' }],
    ['list'],
  ],

  // Snapshot tolerance policy — SPEC §Slice 19B: `maxDiffPixelRatio = 0.01`
  // (1%) as the global default for every `expect(page).toHaveScreenshot()`
  // call. Individual snapshots may override only with an approved
  // justification comment. Lives under `expect.toHaveScreenshot` because
  // that's where Playwright reads the default from (see test.d.ts).
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  // Global `use` — artifact policy applied to every project.
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
      name: 'visual-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: NOVAPAY_BASE_URL,
        storageState: NOVAPAY_AUTH_STATE,
      },
    },
    {
      name: 'visual-mobile',
      use: {
        ...devices['iPhone 14 Pro'],
        baseURL: NOVAPAY_BASE_URL,
        storageState: NOVAPAY_AUTH_STATE,
      },
    },
  ],
});
